import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionCoordinator } from '../../coordinator/AdmissionCoordinator';
import { AdmissionFinanceService } from '../admissionFinanceService';
import { defaultFinanceRepository } from '../../../../finance/infrastructure';
import { financeStorage } from '../../../../finance/storage/financeStorage';
import { TokenDisposition } from '../../../domain/valueObjects/TokenDisposition';
import type { AdmissionDraft } from '../../models/AdmissionDraft';
import type { Reservation } from '../../../../reservation/domain/entities/Reservation';
import { ReservationStatus } from '../../../../reservation/domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../../../../reservation/infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { AccountType } from '../../../../finance/domain';
import { BedStatus } from '../../../../accommodation/domain/valueObjects/BedStatus';
import type { Flat } from '../../../../accommodation/domain/entities/Flat';

describe('Sprint FR-2 — Admission & Rent Billing Integration Test Suite', () => {
  let reservationRepo: InMemoryReservationRepository;
  let residentRepo: InMemoryResidentRepository;
  let stayRepo: InMemoryStayRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let coordinator: AdmissionCoordinator;
  let financeService: AdmissionFinanceService;

  const sampleDate = '2026-08-01';

  const sampleFlat: Flat = {
    id: 'flat-101',
    name: '101',
    floor: '1',
    description: 'Double Sharing 1st Floor',
    areas: [
      {
        id: 'area-101-bedroom',
        name: 'Bedroom',
        defaultRent: 12000,
        defaultDeposit: 10000,
        beds: [
          { id: 'bed-101-a', name: '101-A', status: BedStatus.VACANT, defaultRent: 12000, defaultDeposit: 10000 },
          { id: 'bed-101-b', name: '101-B', status: BedStatus.VACANT, defaultRent: 12000, defaultDeposit: 10000 },
        ],
      },
    ],
  };

  const createActiveReservation = (id = 'resv-101', tokenAmount = 2000): Reservation => ({
    id,
    reservationNumber: 'RES-000101',
    prospectName: 'Rahul Sharma',
    mobileNumber: '9876543210',
    expectedJoiningDate: sampleDate,
    expectedMonthlyRent: 12000,
    expectedSecurityDeposit: 10000,
    tokenAmount,
    status: ReservationStatus.ACTIVE,
    auditLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const createAdmissionDraft = (
    tokenDisposition: TokenDisposition = TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT
  ): AdmissionDraft => ({
    sourceType: 'RESERVATION',
    residentName: 'Rahul Sharma',
    mobileNumber: '9876543210',
    idProofType: 'AADHAAR',
    idProofNumber: '1234-5678-9012',
    checkInDate: sampleDate,
    agreedRent: 12000,
    agreedDeposit: 10000,
    flatId: 'flat-101',
    bedIds: ['bed-101-a'],
    tokenDisposition,
  });

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rpgms_flats');
    }
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);

    reservationRepo = new InMemoryReservationRepository([]);
    residentRepo = new InMemoryResidentRepository([]);
    stayRepo = new InMemoryStayRepository([]);
    accommodationRepo = new InMemoryAccommodationRepository([sampleFlat]);
    accommodationRepo.save(sampleFlat);

    financeService = new AdmissionFinanceService(defaultFinanceRepository, stayRepo);
    coordinator = new AdmissionCoordinator(
      reservationRepo,
      residentRepo,
      stayRepo,
      accommodationRepo,
      financeService
    );
  });

  it('TC-AF-01: Reserved admission creates Security Deposit Liability and Rent Bill', () => {
    const reservation = createActiveReservation();
    reservationRepo.saveSync(reservation);

    const draft = createAdmissionDraft(TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT);
    const result = coordinator.confirmReservedAdmission(draft, reservation);

    expect(result.success).toBe(true);
    expect(result.stayId).toBeDefined();

    // Check Rent Bill created
    const bills = defaultFinanceRepository.getBillsByStayId(result.stayId);
    expect(bills.length).toBe(1);
    expect(bills[0].billType).toBe('MONTHLY_RENT');
    expect(bills[0].totalAmount).toBe(12000); // agreed rent unchanged
    expect(bills[0].period).toBe('2026-08');

    // Check Security Deposit Liability ledger entries created
    const ledgerEntries = defaultFinanceRepository.getLedgerEntriesByStayId(result.stayId);
    expect(ledgerEntries.length).toBeGreaterThan(0);

    const depClear = ledgerEntries.find((e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY);
    expect(depClear).toBeDefined();
    expect(depClear?.credit).toBe(8000); // 10000 - 2000 token
  });

  it('TC-AF-02: Reserved admission with ADJUST_TO_SECURITY_DEPOSIT reduces deposit posting by token amount', () => {
    const reservation = createActiveReservation('resv-102', 3000);
    reservationRepo.saveSync(reservation);

    const draft = createAdmissionDraft(TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT);
    const result = coordinator.confirmReservedAdmission(draft, reservation);

    expect(result.success).toBe(true);
    expect(result.adjustedDepositBalance).toBe(7000); // 10000 - 3000

    const ledgerEntries = defaultFinanceRepository.getLedgerEntriesByStayId(result.stayId);
    const depEntry = ledgerEntries.find((e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY);
    expect(depEntry?.credit).toBe(7000);
  });

  it('TC-AF-03: Reserved admission with ADJUST_TO_FIRST_RENT reduces first rent bill by token amount', () => {
    const reservation = createActiveReservation('resv-103', 2500);
    reservationRepo.saveSync(reservation);

    const draft = createAdmissionDraft(TokenDisposition.ADJUST_TO_FIRST_RENT);
    const result = coordinator.confirmReservedAdmission(draft, reservation);

    expect(result.success).toBe(true);
    expect(result.adjustedRentBalance).toBe(9500); // 12000 - 2500

    const bills = defaultFinanceRepository.getBillsByStayId(result.stayId);
    expect(bills[0].totalAmount).toBe(9500);

    const ledgerEntries = defaultFinanceRepository.getLedgerEntriesByStayId(result.stayId);
    const depEntry = ledgerEntries.find((e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY);
    expect(depEntry?.credit).toBe(10000); // Full deposit
  });

  it('TC-AF-04: Reserved admission with LEAVE_PENDING posts token as ADVANCE_CREDIT', () => {
    const reservation = createActiveReservation('resv-104', 2000);
    reservationRepo.saveSync(reservation);

    const draft = createAdmissionDraft(TokenDisposition.LEAVE_PENDING);
    const result = coordinator.confirmReservedAdmission(draft, reservation);

    expect(result.success).toBe(true);

    const ledgerEntries = defaultFinanceRepository.getLedgerEntriesByStayId(result.stayId);
    const advEntry = ledgerEntries.find((e) => e.account === AccountType.ADVANCE_CREDIT);
    expect(advEntry).toBeDefined();
    expect(advEntry?.credit).toBe(2000);
  });

  it('TC-AF-05: Walk-in admission creates full Security Deposit Liability and Rent Bill without token', () => {
    const draft: AdmissionDraft = {
      sourceType: 'WALK_IN',
      residentName: 'Priya Verma',
      mobileNumber: '9123456789',
      idProofType: 'AADHAAR',
      idProofNumber: '1234-5678-9012',
      checkInDate: sampleDate,
      agreedRent: 15000,
      agreedDeposit: 15000,
      flatId: 'flat-101',
      bedIds: ['bed-101-b'],
    };

    const result = coordinator.confirmWalkInAdmission(draft);

    expect(result.success).toBe(true);
    expect(result.reservationNumber).toBe('N/A (Walk-in)');
    expect(result.tokenAmount).toBe(0);

    const bills = defaultFinanceRepository.getBillsByStayId(result.stayId);
    expect(bills.length).toBe(1);
    expect(bills[0].totalAmount).toBe(15000);

    const ledgerEntries = defaultFinanceRepository.getLedgerEntriesByStayId(result.stayId);
    const depEntry = ledgerEntries.find((e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY);
    expect(depEntry?.credit).toBe(15000);
  });

  it('TC-AF-06: Verifies double-entry debit-credit equality for admission postings', () => {
    const reservation = createActiveReservation('resv-106', 2000);
    reservationRepo.saveSync(reservation);

    const draft = createAdmissionDraft(TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT);
    const result = coordinator.confirmReservedAdmission(draft, reservation);

    const ledgerEntries = defaultFinanceRepository.getLedgerEntriesByStayId(result.stayId);
    const totalDebits = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredits = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);

    expect(totalDebits).toBe(totalCredits);
    expect(totalDebits).toBeGreaterThan(0);
  });

  it('TC-AF-07: Finance posting failure triggers compensating rollback of Stay, Resident, and Beds', () => {
    const reservation = createActiveReservation('resv-107', 2000);
    reservationRepo.saveSync(reservation);

    // Mock finance service to force a failure
    const failingFinanceService = new AdmissionFinanceService(defaultFinanceRepository);
    failingFinanceService.initializeAdmissionFinance = () => ({
      success: false,
      depositLedgerEntries: [],
      rentBill: null,
      advanceCreditEntries: [],
      errors: ['Simulated repository failure'],
    });

    const failingCoordinator = new AdmissionCoordinator(
      reservationRepo,
      residentRepo,
      stayRepo,
      accommodationRepo,
      failingFinanceService
    );

    const draft = createAdmissionDraft(TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT);

    expect(() => failingCoordinator.confirmReservedAdmission(draft, reservation)).toThrow(
      'Admission financial initialization failed'
    );

    // Verify compensating rollback
    expect(stayRepo.getAllSync().length).toBe(0);
    expect(residentRepo.getAllSync().length).toBe(0);
    expect(reservationRepo.findByIdSync('resv-107')?.status).toBe(ReservationStatus.ACTIVE);
  });

  it('TC-AF-08: Duplicate admission finance posting is prevented if financial records already exist for stayId', () => {
    const reservation = createActiveReservation('resv-108', 2000);
    reservationRepo.saveSync(reservation);

    const draft = createAdmissionDraft(TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT);
    const result = coordinator.confirmReservedAdmission(draft, reservation);

    // Re-triggering finance initialization on same stayId fails gracefully
    const secondInit = financeService.initializeAdmissionFinance(result, draft);
    expect(secondInit.success).toBe(false);
    expect(secondInit.errors[0]).toContain('Financial billing already initialized');
  });

  it('TC-AF-09: Admission Rent Bill attaches canonical obligationKey and integrates with generic uniqueness (DEF-FIN-005)', () => {
    const reservation = createActiveReservation('resv-109', 2000);
    reservationRepo.saveSync(reservation);

    const draft = createAdmissionDraft(TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT);
    const result = coordinator.confirmReservedAdmission(draft, reservation);

    expect(result.success).toBe(true);

    const bills = defaultFinanceRepository.getBillsByStayId(result.stayId);
    expect(bills.length).toBe(1);
    const rentBill = bills[0];

    // Assert canonical obligationKey format: RENT:<stayId>:<anniversaryDate>
    const stay = stayRepo.findByIdSync(result.stayId);
    const anchorDay = stay?.billingAnchorDay || 1;
    const expectedAnniversary = `2026-08-${String(anchorDay).padStart(2, '0')}`;

    expect(rentBill.lineItems.length).toBe(1);
    const lineItem = rentBill.lineItems[0];
    expect(lineItem.obligationKey).toBe(`RENT:${result.stayId}:${expectedAnniversary}`);

    // Verify that attempting to create a second bill with the same obligationKey is rejected by generic uniqueness
    const duplicateAttempt = (financeService as any).billingService.createBill({
      stayId: result.stayId,
      billType: 'MONTHLY_RENT',
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      lineItems: [
        {
          id: 'li_duplicate_attempt',
          description: 'Duplicate Rent Attempt',
          amount: 12000,
          category: 'RENT',
          obligationKey: `RENT:${result.stayId}:${expectedAnniversary}`,
        },
      ],
      totalAmount: 12000,
      status: 'UNPAID',
      remarks: 'Duplicate Rent Attempt',
    });

    expect(duplicateAttempt.success).toBe(false);
    expect(duplicateAttempt.errors.some((e: string) => e.includes('already financially realized'))).toBe(true);
  });
});
