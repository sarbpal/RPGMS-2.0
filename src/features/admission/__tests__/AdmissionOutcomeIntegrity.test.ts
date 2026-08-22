import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionCoordinator } from '../application/coordinator/AdmissionCoordinator';
import { InMemoryReservationRepository } from '../../reservation/infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { AdmissionFinanceService } from '../application/services/admissionFinanceService';
import { defaultFinanceRepository } from '../../finance/infrastructure';
import { financeStorage } from '../../finance/storage/financeStorage';
import { ReservationStatus } from '../../reservation/domain/valueObjects/ReservationStatus';
import { ResidentStatus } from '../../resident/domain/valueObjects/ResidentStatus';
import { BedStatus } from '../../accommodation/domain/valueObjects/BedStatus';
import { TokenDisposition } from '../domain/valueObjects/TokenDisposition';
import type { Reservation } from '../../reservation/domain/entities/Reservation';
import type { Resident } from '../../resident/domain/entities/Resident';
import type { Flat } from '../../accommodation/domain/entities/Flat';
import type { AdmissionDraft } from '../application/models/AdmissionDraft';
import { AccountType } from '../../finance/domain';

describe('Admission Outcome Integrity Architectural Suite (Sprint RA-8 Slice 5)', () => {
  let reservationRepo: InMemoryReservationRepository;
  let residentRepo: InMemoryResidentRepository;
  let stayRepo: InMemoryStayRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let financeService: AdmissionFinanceService;
  let coordinator: AdmissionCoordinator;

  const todayStr = '2026-08-20';

  const sampleFlat: Flat = {
    id: 'flat-101',
    name: '101',
    floor: '1st Floor',
    description: 'Double Sharing Flat',
    areas: [
      {
        id: 'area-101-main',
        name: 'Master Bedroom',
        bedPrefix: 'B',
        defaultRent: 8000,
        defaultDeposit: 6500,
        beds: [
          { id: 'bed-101-a', name: '101-A', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
          { id: 'bed-101-b', name: '101-B', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
        ],
      },
    ],
  };

  const sampleActiveReservation: Reservation = {
    id: 'resv-000001',
    reservationNumber: 'RES-000001',
    prospectName: 'Rohit Verma',
    mobileNumber: '9876543210',
    expectedJoiningDate: todayStr,
    expectedMonthlyRent: 8000,
    expectedSecurityDeposit: 6500,
    accommodationPreference: 'Master Bedroom',
    tokenAmount: 2000,
    tokenReceivedOn: '2026-08-01',
    tokenRemarks: 'Advance UPI Payment',
    status: ReservationStatus.ACTIVE,
    auditLog: [
      {
        timestamp: '2026-08-01T10:00:00Z',
        action: 'Reservation Created',
        performedBy: 'System Operator',
        details: 'Initial prospect booking with ₹2,000 token',
      },
    ],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  };

  const validReservationDraft: AdmissionDraft = {
    sourceType: 'RESERVATION',
    reservationId: 'resv-000001',
    residentName: 'Rohit Verma',
    mobileNumber: '9876543210',
    emergencyContactName: 'Ramesh Verma',
    emergencyContactRelationship: 'Father',
    emergencyContactPhone: '9876500000',
    idProofType: 'AADHAAR',
    idProofNumber: '1234-5678-9012',
    permanentAddress: '123 Park Avenue, New Delhi',
    checkInDate: todayStr,
    agreedRent: 8000,
    agreedDeposit: 6500,
    flatId: 'flat-101',
    bedIds: ['bed-101-a'],
    tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
  };

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rpgms_flats');
    }
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);

    reservationRepo = new InMemoryReservationRepository([JSON.parse(JSON.stringify(sampleActiveReservation))]);
    residentRepo = new InMemoryResidentRepository([]);
    stayRepo = new InMemoryStayRepository([]);
    accommodationRepo = new InMemoryAccommodationRepository([JSON.parse(JSON.stringify(sampleFlat))]);
    financeService = new AdmissionFinanceService(defaultFinanceRepository, stayRepo);
    coordinator = new AdmissionCoordinator(
      reservationRepo,
      residentRepo,
      stayRepo,
      accommodationRepo,
      financeService
    );
  });

  // ===========================================================================
  // SCENARIO A: RESERVATION ADMISSION SUCCESS
  // ===========================================================================
  it('Scenario A: verifies complete multi-aggregate graph and cross-linkage upon successful Reservation Admission', () => {
    const reservation = reservationRepo.findByIdSync('resv-000001')!;
    expect(reservation.status).toBe(ReservationStatus.ACTIVE);

    // Operator executes Approve & Admit -> Pre-Commit Validation passes -> Atomic Admission commits
    const result = coordinator.confirmReservedAdmission(validReservationDraft, reservation);

    expect(result.success).toBe(true);
    expect(result.residentId).toBeDefined();
    expect(result.stayId).toBeDefined();
    expect(result.residentCode).toMatch(/^RESID-/);

    // 1. Resident Aggregate Assertion
    const resident = residentRepo.getByIdSync(result.residentId!);
    expect(resident).toBeDefined();
    expect(resident?.id).toBe(result.residentId);
    expect(resident?.residentCode).toBe(result.residentCode);
    expect(resident?.fullName).toBe('Rohit Verma');
    expect(resident?.mobileNumber).toBe('9876543210');
    expect(resident?.status).toBe(ResidentStatus.ACTIVE);
    expect(resident?.documents).toHaveLength(1);
    expect(resident?.documents![0].type).toBe('AADHAAR');
    expect(resident?.documents![0].documentNumber).toBe('1234-5678-9012');

    // 2. Stay Aggregate Assertion & Invariant Linkage
    const stay = stayRepo.findByIdSync(result.stayId);
    expect(stay).toBeDefined();
    expect(stay?.id).toBe(result.stayId);
    expect(stay?.residentId).toBe(resident!.id); // Stay -> Resident
    expect(stay?.status).toBe('ACTIVE');
    expect(stay?.checkInDate).toBe(todayStr);

    // Commercial Agreement Child Assertion
    expect(stay?.commercialAgreements).toHaveLength(1);
    const ca = stay?.commercialAgreements[0];
    expect(ca?.stayId).toBe(stay!.id);
    expect(ca?.rent).toBe(8000);
    expect(ca?.securityDeposit).toBe(4500); // 6500 - 2000 token adjustment
    expect(ca?.status).toBe('ACTIVE');

    // Bed Allocation Child Assertion
    expect(stay?.bedAllocations).toHaveLength(1);
    const ba = stay?.bedAllocations[0];
    expect(ba?.stayId).toBe(stay!.id); // BedAllocation -> Stay
    expect(ba?.flatId).toBe('flat-101');
    expect(ba?.bedId).toBe('bed-101-a');
    expect(ba?.status).toBe('ACTIVE');

    // Business Event Child Assertion
    expect(stay?.businessEvents).toHaveLength(1);
    const be = stay?.businessEvents[0];
    expect(be?.eventType).toBe('ADMISSION');
    expect(be?.metadata?.reservationId).toBe('resv-000001');

    // 3. Reservation Aggregate Conversion & Traceability Assertion
    const updatedReservation = reservationRepo.findByIdSync('resv-000001')!;
    expect(updatedReservation.status).toBe(ReservationStatus.CONVERTED);
    expect(updatedReservation.convertedResidentId).toBe(resident!.id); // Reservation -> Resident
    expect(updatedReservation.convertedStayId).toBe(stay!.id); // Reservation -> Stay
    expect(updatedReservation.auditLog.some((l) => l.details?.includes('Converted to Admission'))).toBe(true);

    // 4. Accommodation Operational Occupancy Assertion
    const flat = accommodationRepo.findByIdSync('flat-101')!;
    const bed = flat.areas.flatMap((a) => a.beds).find((b) => b.id === 'bed-101-a')!;
    expect(bed.status).toBe(BedStatus.OCCUPIED);
    expect(bed.residentName).toBe('Rohit Verma'); // Bed -> Resident
    expect(bed.stayId).toBe(stay!.id); // Bed -> Stay

    // 5. Finance Persisted Billing & Ledger Assertion
    const bills = defaultFinanceRepository.getBillsByStayId(stay!.id);
    expect(bills).toHaveLength(1);
    expect(bills[0].stayId).toBe(stay!.id);
    expect(bills[0].billType).toBe('MONTHLY_RENT');
    expect(bills[0].totalAmount).toBe(8000);
    expect(bills[0].status).toBe('UNPAID');

    const ledgerEntries = defaultFinanceRepository.getLedgerEntriesByStayId(stay!.id);
    expect(ledgerEntries.length).toBeGreaterThanOrEqual(2);
    const depositLiabilityEntry = ledgerEntries.find((e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY);
    expect(depositLiabilityEntry).toBeDefined();
    expect(depositLiabilityEntry?.credit).toBe(4500); // adjusted deposit obligation

    // Cross-aggregate coherence validation
    expect(updatedReservation.convertedResidentId).toBe(resident?.id);
    expect(updatedReservation.convertedStayId).toBe(stay?.id);
    expect(stay?.residentId).toBe(resident?.id);
    expect(ba?.bedId).toBe(bed.id);
    expect(bed.stayId).toBe(stay?.id);
    expect(bills[0].stayId).toBe(stay?.id);
  });

  // ===========================================================================
  // SCENARIO B: RESERVATION PRE-COMMIT VALIDATION FAILURE
  // ===========================================================================
  it('Scenario B: verifies zero business mutations and preparation retention on Reservation Pre-Commit Validation failure', () => {
    const reservation = reservationRepo.findByIdSync('resv-000001')!;

    // Draft with missing mandatory document number
    const invalidDraft: AdmissionDraft = {
      ...validReservationDraft,
      idProofNumber: '', // Mandatory invariant violation
    };

    // Pre-Commit Validation halts transaction before start
    expect(() => coordinator.confirmReservedAdmission(invalidDraft, reservation)).toThrow(
      /Admission validation failed: Document Number is required for AADHAAR/
    );

    // 1. Reservation remains strictly ACTIVE without converted linkage
    const resAfter = reservationRepo.findByIdSync('resv-000001')!;
    expect(resAfter.status).toBe(ReservationStatus.ACTIVE);
    expect(resAfter.convertedResidentId).toBeUndefined();
    expect(resAfter.convertedStayId).toBeUndefined();

    // 2. Zero Resident records created
    expect(residentRepo.getAllSync()).toHaveLength(0);

    // 3. Zero Stay records created
    expect(stayRepo.getAllSync()).toHaveLength(0);

    // 4. Accommodation bed remains VACANT with no occupant linkage
    const flat = accommodationRepo.findByIdSync('flat-101')!;
    const bed = flat.areas.flatMap((a) => a.beds).find((b) => b.id === 'bed-101-a')!;
    expect(bed.status).toBe(BedStatus.VACANT);
    expect(bed.residentName).toBeUndefined();
    expect(bed.stayId).toBeUndefined();

    // 5. Zero Finance bills or ledger entries created
    expect(defaultFinanceRepository.getBills()).toHaveLength(0);
    expect(defaultFinanceRepository.getLedgerEntries()).toHaveLength(0);
  });

  // ===========================================================================
  // SCENARIO C: WALK-IN ADMISSION SUCCESS
  // ===========================================================================
  it('Scenario C: verifies complete Walk-in Admission outcome with zero reservation involvement', () => {
    const walkInDraft: AdmissionDraft = {
      sourceType: 'WALK_IN',
      residentName: 'Priya Sharma',
      mobileNumber: '9123456789',
      idProofType: 'AADHAAR',
      idProofNumber: '9876-5432-1098',
      checkInDate: todayStr,
      agreedRent: 8000,
      agreedDeposit: 6500,
      flatId: 'flat-101',
      bedIds: ['bed-101-b'],
      notes: 'Direct Walk-in',
    };

    const result = coordinator.confirmWalkInAdmission(walkInDraft);
    expect(result.success).toBe(true);
    expect(result.reservationNumber).toBe('N/A (Walk-in)');
    expect(result.tokenAmount).toBe(0);

    // 1. Resident Created & ACTIVE
    const resident = residentRepo.getByIdSync(result.residentId!);
    expect(resident).toBeDefined();
    expect(resident?.fullName).toBe('Priya Sharma');
    expect(resident?.status).toBe(ResidentStatus.ACTIVE);

    // 2. Stay Created with WALK_IN Metadata
    const stay = stayRepo.findByIdSync(result.stayId);
    expect(stay).toBeDefined();
    expect(stay?.residentId).toBe(resident!.id);
    expect(stay?.status).toBe('ACTIVE');
    expect(stay?.businessEvents[0].metadata?.admissionSource).toBe('WALK_IN');

    // 3. BedAllocation Created
    expect(stay?.bedAllocations).toHaveLength(1);
    expect(stay?.bedAllocations[0].bedId).toBe('bed-101-b');
    expect(stay?.bedAllocations[0].status).toBe('ACTIVE');

    // 4. Accommodation Updated
    const flat = accommodationRepo.findByIdSync('flat-101')!;
    const bed = flat.areas.flatMap((a) => a.beds).find((b) => b.id === 'bed-101-b')!;
    expect(bed.status).toBe(BedStatus.OCCUPIED);
    expect(bed.residentName).toBe('Priya Sharma');
    expect(bed.stayId).toBe(stay!.id);

    // 5. Finance Initialized (Full Deposit, No Token Adjustment)
    const bills = defaultFinanceRepository.getBillsByStayId(stay!.id);
    expect(bills).toHaveLength(1);
    expect(bills[0].totalAmount).toBe(8000);

    const ledgerEntries = defaultFinanceRepository.getLedgerEntriesByStayId(stay!.id);
    const depEntry = ledgerEntries.find((e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY);
    expect(depEntry?.credit).toBe(6500);

    // 6. Reservation Repository completely untouched
    const allReservations = reservationRepo.findAllSync();
    expect(allReservations).toHaveLength(1); // Only the initial unadmitted reservation
    expect(allReservations[0].status).toBe(ReservationStatus.ACTIVE); // Untouched
  });

  // ===========================================================================
  // SCENARIO D: WALK-IN PRE-COMMIT VALIDATION FAILURE
  // ===========================================================================
  it('Scenario D: verifies zero mutations on Walk-in Pre-Commit Validation failure', () => {
    // Seed an ACTIVE resident with phone 9876543210
    const existingActiveResident: Resident = {
      id: 'res-existing-1',
      residentCode: 'RESID-000099',
      fullName: 'Existing Resident',
      status: ResidentStatus.ACTIVE,
      mobileNumber: '9876543210',
      createdAt: todayStr,
      updatedAt: todayStr,
    };
    residentRepo.saveSync(existingActiveResident);

    // Walk-in draft with conflicting duplicate active mobile
    const invalidWalkInDraft: AdmissionDraft = {
      sourceType: 'WALK_IN',
      residentName: 'Duplicate Prospect',
      mobileNumber: '9876543210', // Conflict!
      idProofType: 'AADHAAR',
      idProofNumber: '1111-2222-3333',
      checkInDate: todayStr,
      agreedRent: 8000,
      agreedDeposit: 6500,
      flatId: 'flat-101',
      bedIds: ['bed-101-a'],
    };

    expect(() => coordinator.confirmWalkInAdmission(invalidWalkInDraft)).toThrow(
      /Walk-in admission validation failed: Resident Existing Resident.*already has an active stay/
    );

    // 1. Resident repository remains with only the 1 existing resident (no new records)
    expect(residentRepo.getAllSync()).toHaveLength(1);

    // 2. Zero Stays created
    expect(stayRepo.getAllSync()).toHaveLength(0);

    // 3. Accommodation Bed remains VACANT
    const flat = accommodationRepo.findByIdSync('flat-101')!;
    const bed = flat.areas.flatMap((a) => a.beds).find((b) => b.id === 'bed-101-a')!;
    expect(bed.status).toBe(BedStatus.VACANT);

    // 4. Zero Finance entries
    expect(defaultFinanceRepository.getBills()).toHaveLength(0);
    expect(defaultFinanceRepository.getLedgerEntries()).toHaveLength(0);

    // 5. Reservation repository untouched
    expect(reservationRepo.findAllSync()[0].status).toBe(ReservationStatus.ACTIVE);
  });

  // ===========================================================================
  // SCENARIO E: WALK-IN RESIDENT REUSE
  // ===========================================================================
  it('Scenario E: verifies existing CHECKED_OUT / ALUMNI Resident record reuse without duplicate entity creation', () => {
    // Seed a CHECKED_OUT resident
    const checkedOutResident: Resident = {
      id: 'res-alumni-001',
      residentCode: 'RESID-000042',
      fullName: 'Anand Kumar (Past Resident)',
      status: ResidentStatus.CHECKED_OUT,
      mobileNumber: '9888877777',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-06-01T00:00:00Z',
    };
    residentRepo.saveSync(checkedOutResident);
    expect(residentRepo.getAllSync()).toHaveLength(1);

    const reuseDraft: AdmissionDraft = {
      sourceType: 'WALK_IN',
      residentName: 'Anand Kumar',
      mobileNumber: '9888877777',
      idProofType: 'AADHAAR',
      idProofNumber: '5555-6666-7777',
      checkInDate: todayStr,
      agreedRent: 8000,
      agreedDeposit: 6500,
      flatId: 'flat-101',
      bedIds: ['bed-101-a'],
    };

    const result = coordinator.confirmWalkInAdmission(reuseDraft);
    expect(result.success).toBe(true);
    expect(result.residentId).toBe('res-alumni-001'); // Exact same resident ID
    expect(result.residentCode).toBe('RESID-000042'); // Preserved resident code

    // 1. Resident entity reused and status transitioned to ACTIVE
    expect(residentRepo.getAllSync()).toHaveLength(1); // ZERO duplicate resident records
    const updatedResident = residentRepo.getByIdSync('res-alumni-001')!;
    expect(updatedResident.status).toBe(ResidentStatus.ACTIVE);
    expect(updatedResident.fullName).toBe('Anand Kumar');

    // 2. New Stay created referencing the reused Resident
    const stay = stayRepo.findByIdSync(result.stayId)!;
    expect(stay.residentId).toBe('res-alumni-001');
    expect(stay.status).toBe('ACTIVE');

    // 3. Bed Allocated to reused resident
    const flat = accommodationRepo.findByIdSync('flat-101')!;
    const bed = flat.areas.flatMap((a) => a.beds).find((b) => b.id === 'bed-101-a')!;
    expect(bed.status).toBe(BedStatus.OCCUPIED);
    expect(bed.residentName).toBe('Anand Kumar');
    expect(bed.stayId).toBe(stay.id);

    // 4. Finance Initialized for new stay
    const bills = defaultFinanceRepository.getBillsByStayId(stay.id);
    expect(bills).toHaveLength(1);
    expect(bills[0].stayId).toBe(stay.id);
  });

  // ===========================================================================
  // SCENARIO F: MID-TRANSACTION ROLLBACK
  // ===========================================================================
  it('Scenario F: verifies compensating rollback completely restores pre-admission snapshots if mid-transaction failure occurs', () => {
    const reservation = reservationRepo.findByIdSync('resv-000001')!;

    // Create a coordinator with a finance service that fails during initializeAdmissionFinance (Step 5)
    const failingFinanceService = {
      initializeAdmissionFinance: () => ({
        success: false,
        depositLedgerEntries: [],
        rentBill: null,
        advanceCreditEntries: [],
        errors: ['Simulated unexpected payment gateway or database timeout in Step 5'],
      }),
      rollbackAdmissionFinance: (stayId: string) => {
        defaultFinanceRepository.saveBills(defaultFinanceRepository.getBills().filter((b) => b.stayId !== stayId));
        defaultFinanceRepository.saveLedgerEntries(defaultFinanceRepository.getLedgerEntries().filter((e) => e.stayId !== stayId));
      },
    } as any;

    const failingCoordinator = new AdmissionCoordinator(
      reservationRepo,
      residentRepo,
      stayRepo,
      accommodationRepo,
      failingFinanceService
    );

    expect(() => failingCoordinator.confirmReservedAdmission(validReservationDraft, reservation)).toThrow(
      /Admission financial initialization failed: Simulated unexpected payment gateway or database timeout/
    );

    // 1. Reservation restored to pre-admission snapshot (ACTIVE, no converted links)
    const resAfter = reservationRepo.findByIdSync('resv-000001')!;
    expect(resAfter.status).toBe(ReservationStatus.ACTIVE);
    expect(resAfter.convertedResidentId).toBeUndefined();
    expect(resAfter.convertedStayId).toBeUndefined();

    // 2. Created Resident rolled back (purged from repo)
    expect(residentRepo.getAllSync()).toHaveLength(0);

    // 3. Created Stay rolled back (purged from repo)
    expect(stayRepo.getAllSync()).toHaveLength(0);

    // 4. Accommodation Flat restored to pre-admission snapshot (Bed VACANT, no residentName/stayId)
    const flat = accommodationRepo.findByIdSync('flat-101')!;
    const bed = flat.areas.flatMap((a) => a.beds).find((b) => b.id === 'bed-101-a')!;
    expect(bed.status).toBe(BedStatus.VACANT);
    expect(bed.residentName).toBeUndefined();
    expect(bed.stayId).toBeUndefined();

    // 5. Finance entries cleaned up
    expect(defaultFinanceRepository.getBills()).toHaveLength(0);
    expect(defaultFinanceRepository.getLedgerEntries()).toHaveLength(0);
  });
});
