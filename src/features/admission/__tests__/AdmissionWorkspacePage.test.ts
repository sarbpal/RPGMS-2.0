import { describe, it, expect } from 'vitest';
import type { Reservation } from '../../reservation/domain/entities/Reservation';
import { ReservationStatus } from '../../reservation/domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../../reservation/infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { AdmissionCoordinator } from '../application/coordinator/AdmissionCoordinator';
import type { AdmissionDraft } from '../application/models/AdmissionDraft';
import { TokenDisposition } from '../domain/valueObjects/TokenDisposition';
import { toTitleCase, DOCUMENT_TYPE_OPTIONS } from '../components/ProspectDetailsCard';
import { financeStorage } from '../../finance/storage/financeStorage';

describe('Sprint RA-6 — Complete Admission Unit & Integration Suite', () => {
  const mockReservations: Reservation[] = [
    {
      id: 'resv-000001',
      reservationNumber: 'RES-000001',
      prospectName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      expectedJoiningDate: '2026-08-15',
      expectedMonthlyRent: 12000,
      expectedSecurityDeposit: 12000,
      accommodationPreference: 'Double Sharing, 1st Floor',
      tokenAmount: 2000,
      tokenReceivedOn: '2026-08-01',
      tokenRemarks: 'GPay payment received',
      status: ReservationStatus.ACTIVE,
      notes: 'Prefers quiet area away from elevator',
      auditLog: [],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
  ];

  it('pre-populates admission draft from source reservation for workspace review', () => {
    const resRepo = new InMemoryReservationRepository(mockReservations);
    const reservation = resRepo.findByIdSync('resv-000001');

    expect(reservation).not.toBeNull();
    expect(reservation?.prospectName).toBe('Rahul Sharma');
    expect(reservation?.mobileNumber).toBe('9876543210');
    expect(reservation?.expectedJoiningDate).toBe('2026-08-15');
    expect(reservation?.expectedMonthlyRent).toBe(12000);
    expect(reservation?.expectedSecurityDeposit).toBe(12000);
    expect(reservation?.tokenAmount).toBe(2000);
  });

  it('evaluates readiness checklist during admission preparation without DB mutation', () => {
    const resRepo = new InMemoryReservationRepository(mockReservations);
    const accomRepo = new InMemoryAccommodationRepository();
    const coordinator = new AdmissionCoordinator(resRepo, undefined, undefined, accomRepo);

    const reservation = resRepo.findByIdSync('resv-000001');
    const flats = accomRepo.findAll();
    expect(flats.length).toBeGreaterThan(0);

    const flat = flats[0];
    const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT');
    expect(vacantBed).toBeDefined();

    // 1. Incomplete Draft (missing accommodation and token choice)
    const incompleteDraft: AdmissionDraft = {
      reservationId: 'resv-000001',
      residentName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      checkInDate: '2026-08-15',
      agreedRent: 12000,
      agreedDeposit: 12000,
    };

    const initialReadiness = coordinator.evaluateReadiness(incompleteDraft, reservation);
    expect(initialReadiness.isReadyToConfirm).toBe(false);
    expect(initialReadiness.isAccommodationValid).toBe(false);
    expect(initialReadiness.isTokenDecisionValid).toBe(false);

    // 2. Fully Prepared Draft
    const preparedDraft: AdmissionDraft = {
      ...incompleteDraft,
      flatId: flat.id,
      bedIds: [vacantBed!.id],
      tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
    };

    const completeReadiness = coordinator.evaluateReadiness(preparedDraft, reservation);
    expect(completeReadiness.isReadyToConfirm).toBe(true);
    expect(completeReadiness.isReservationValid).toBe(true);
    expect(completeReadiness.isResidentDetailsValid).toBe(true);
    expect(completeReadiness.isCommercialTermsValid).toBe(true);
    expect(completeReadiness.isAccommodationValid).toBe(true);
    expect(completeReadiness.isTokenDecisionValid).toBe(true);

    // Verify ZERO database state mutation during preparation phase
    const bedAfterEval = accomRepo
      .findAll()
      .flatMap((f) => f.areas)
      .flatMap((a) => a.beds)
      .find((b) => b.id === vacantBed!.id);

    expect(bedAfterEval?.status).toBe('VACANT');
    expect(resRepo.findByIdSync('resv-000001')?.status).toBe(ReservationStatus.ACTIVE);
  });

  it('executes Complete Admission transaction, creating Resident, Stay, occupying Bed, and preserving traceability references', () => {
    const freshMock = JSON.parse(JSON.stringify(mockReservations));
    const resRepo = new InMemoryReservationRepository(freshMock);
    const residentRepo = new InMemoryResidentRepository();
    const stayRepo = new InMemoryStayRepository();
    const accomRepo = new InMemoryAccommodationRepository();

    const coordinator = new AdmissionCoordinator(resRepo, residentRepo, stayRepo, accomRepo);
    const reservation = resRepo.findByIdSync('resv-000001')!;

    const flat = accomRepo.findAll()[0];
    const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

    const validDraft: AdmissionDraft = {
      reservationId: 'resv-000001',
      residentName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      idProofType: 'AADHAAR',
      idProofNumber: '1234-5678-9012',
      checkInDate: '2026-08-15',
      agreedRent: 12000,
      agreedDeposit: 12000,
      flatId: flat.id,
      bedIds: [vacantBed.id],
      tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
    };

    const result = coordinator.confirmReservedAdmission(validDraft, reservation);

    expect(result.success).toBe(true);
    expect(result.residentCode).toMatch(/^RESID-/);
    expect(result.stayId).toBeDefined();

    // 1. Verify Resident created in ResidentRepository
    const createdResident = residentRepo.getByIdSync(result.residentId!);
    expect(createdResident).not.toBeNull();
    expect(createdResident?.fullName).toBe('Rahul Sharma');
    expect(createdResident?.mobileNumber).toBe('9876543210');

    // 2. Verify Stay created in StayRepository
    const createdStay = stayRepo.findByIdSync(result.stayId);
    expect(createdStay).not.toBeNull();
    expect(createdStay?.residentId).toBe(result.residentId);

    // 3. Verify Accommodation bed marked OCCUPIED
    const updatedFlat = accomRepo.findById(flat.id)!;
    const occupiedBed = updatedFlat.areas.flatMap((a) => a.beds).find((b) => b.id === vacantBed.id);
    expect(occupiedBed?.status).toBe('OCCUPIED');

    // 4. Verify Reservation status CONVERTED and traceability references set
    const updatedReservation = resRepo.findByIdSync('resv-000001')!;
    expect(updatedReservation.status).toBe(ReservationStatus.CONVERTED);
    expect(updatedReservation.convertedResidentId).toBe(result.residentId);
    expect(updatedReservation.convertedStayId).toBe(result.stayId);
  });

  describe('Sprint RA-6.1 — Converted Reservation Operational Guard', () => {
    it('evaluates isReservationValid: false and isReadyToConfirm: false when reservation status is CONVERTED', () => {
      const resRepo = new InMemoryReservationRepository(mockReservations);
      const coordinator = new AdmissionCoordinator(resRepo);

      const convertedRes: Reservation = {
        ...mockReservations[0],
        status: ReservationStatus.CONVERTED,
        convertedResidentId: 'res-000001',
        convertedStayId: 'stay-000001',
      };

      const draft: AdmissionDraft = {
        reservationId: convertedRes.id,
        residentName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        checkInDate: '2026-08-15',
        agreedRent: 12000,
        agreedDeposit: 12000,
        flatId: 'flat-101',
        bedIds: ['bed-101-a'],
        tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
      };

      const readiness = coordinator.evaluateReadiness(draft, convertedRes);
      expect(readiness.isReservationValid).toBe(false);
      expect(readiness.isReadyToConfirm).toBe(false);
      expect(readiness.validationMessages).toContain(
        `Reservation ${convertedRes.reservationNumber} must be ACTIVE or FOLLOW_UP_REQUIRED and editable.`
      );
    });

    it('rejects confirmReservedAdmission() when reservation status is CONVERTED', () => {
      const resRepo = new InMemoryReservationRepository(mockReservations);
      const coordinator = new AdmissionCoordinator(resRepo);

      const convertedRes: Reservation = {
        ...mockReservations[0],
        status: ReservationStatus.CONVERTED,
        convertedResidentId: 'res-000001',
        convertedStayId: 'stay-000001',
      };

      const draft: AdmissionDraft = {
        reservationId: convertedRes.id,
        residentName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        checkInDate: '2026-08-15',
        agreedRent: 12000,
        agreedDeposit: 12000,
      };

      expect(() => coordinator.confirmReservedAdmission(draft, convertedRes)).toThrow(
        'Admission validation failed'
      );
    });

    it('validates traceability path construction for valid convertedResidentId vs safely missing convertedResidentId', () => {
      const validConverted: Reservation = {
        ...mockReservations[0],
        status: ReservationStatus.CONVERTED,
        convertedResidentId: 'res-000001',
        convertedStayId: 'stay-000001',
      };

      const missingConvertedId: Reservation = {
        ...mockReservations[0],
        status: ReservationStatus.CONVERTED,
        convertedResidentId: undefined,
        convertedStayId: undefined,
      };

      // 1. Valid convertedResidentId produces correct path string
      const validNavPath = validConverted.convertedResidentId
        ? `/resident/${validConverted.convertedResidentId}`
        : null;
      expect(validNavPath).toBe('/resident/res-000001');

      // 2. Missing convertedResidentId produces null path without invalid /resident/undefined string
      const safeNavPath = missingConvertedId.convertedResidentId
        ? `/resident/${missingConvertedId.convertedResidentId}`
        : null;
      expect(safeNavPath).toBeNull();
    });
  });

  describe('Accommodation #6 — Admission Rent & Deposit Inheritance from Bed Context', () => {
    it('inherits monthly rent and security deposit when initiating direct admission from an accommodation bed', () => {
      const accomRepo = new InMemoryAccommodationRepository();
      const coordinator = new AdmissionCoordinator(undefined, undefined, undefined, accomRepo);

      const flat = accomRepo.findAll()[0];
      const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      // Simulate resolving commercial terms via coordinator helper (used by AdmissionWorkspacePage)
      const terms = coordinator.getBedCommercialTerms(flat.id, vacantBed.id);

      expect(terms).not.toBeNull();
      expect(terms?.defaultRent).toBe(vacantBed.defaultRent);
      expect(terms?.defaultDeposit).toBe(vacantBed.defaultDeposit);

      // Construct draft using prefilled flat, bed, rent, and deposit
      const walkInDraft: AdmissionDraft = {
        sourceType: 'WALK_IN',
        residentName: 'Vikas Gupta',
        mobileNumber: '9811223344',
        checkInDate: '2026-08-15',
        agreedRent: terms!.defaultRent,
        agreedDeposit: terms!.defaultDeposit,
        flatId: flat.id,
        bedIds: [vacantBed.id],
      };

      const readiness = coordinator.evaluateReadiness(walkInDraft, null, 'WALK_IN');
      expect(readiness.isAccommodationValid).toBe(true);
      expect(readiness.isCommercialTermsValid).toBe(true);
      expect(readiness.isReadyToConfirm).toBe(true);
    });

    it('inherits summed monthly rent and security deposit when initiating direct admission for multiple beds', () => {
      const accomRepo = new InMemoryAccommodationRepository();
      const coordinator = new AdmissionCoordinator(undefined, undefined, undefined, accomRepo);

      const flat = accomRepo.findAll()[0];
      const vacantBeds = flat.areas.flatMap((a) => a.beds).filter((b) => b.status === 'VACANT');
      expect(vacantBeds.length).toBeGreaterThanOrEqual(2);

      const selectedBeds = [vacantBeds[0], vacantBeds[1]];
      const expectedTotalRent = selectedBeds[0].defaultRent + selectedBeds[1].defaultRent;
      const expectedTotalDeposit = selectedBeds[0].defaultDeposit + selectedBeds[1].defaultDeposit;

      // Simulate resolving commercial terms for multiple beds
      const terms = coordinator.getBedCommercialTerms(flat.id, [selectedBeds[0].id, selectedBeds[1].id]);

      expect(terms).not.toBeNull();
      expect(terms?.defaultRent).toBe(expectedTotalRent);
      expect(terms?.defaultDeposit).toBe(expectedTotalDeposit);

      // Construct draft using prefilled flat, multiple beds, and summed rent/deposit
      const multiBedDraft: AdmissionDraft = {
        sourceType: 'WALK_IN',
        residentName: 'Sanjay Dutt',
        mobileNumber: '9822334455',
        checkInDate: '2026-08-15',
        agreedRent: terms!.defaultRent,
        agreedDeposit: terms!.defaultDeposit,
        flatId: flat.id,
        bedIds: [selectedBeds[0].id, selectedBeds[1].id],
      };

      const readiness = coordinator.evaluateReadiness(multiBedDraft, null, 'WALK_IN');
      expect(readiness.isAccommodationValid).toBe(true);
      expect(readiness.isCommercialTermsValid).toBe(true);
      expect(readiness.isReadyToConfirm).toBe(true);
    });

    it('dynamically recalculates rent and deposit when additional beds are toggled in walk-in mode', () => {
      const accomRepo = new InMemoryAccommodationRepository();
      const coordinator = new AdmissionCoordinator(undefined, undefined, undefined, accomRepo);

      const flat = accomRepo.findAll()[0];
      const vacantBeds = flat.areas.flatMap((a) => a.beds).filter((b) => b.status === 'VACANT');
      expect(vacantBeds.length).toBeGreaterThanOrEqual(2);

      const bed1 = vacantBeds[0];
      const bed2 = vacantBeds[1];

      // Step 1: Initial single bed selected (e.g. from Accommodation Bed click)
      let selectedBedIds = [bed1.id];
      let terms = coordinator.getBedCommercialTerms(flat.id, selectedBedIds);
      expect(terms?.defaultRent).toBe(bed1.defaultRent);
      expect(terms?.defaultDeposit).toBe(bed1.defaultDeposit);

      // Step 2: Operator selects second bed in AccommodationSelectionCard
      selectedBedIds = [...selectedBedIds, bed2.id];
      terms = coordinator.getBedCommercialTerms(flat.id, selectedBedIds);
      expect(terms?.defaultRent).toBe(bed1.defaultRent + bed2.defaultRent);
      expect(terms?.defaultDeposit).toBe(bed1.defaultDeposit + bed2.defaultDeposit);

      // Step 3: Operator deselects first bed
      selectedBedIds = selectedBedIds.filter((id) => id !== bed1.id);
      terms = coordinator.getBedCommercialTerms(flat.id, selectedBedIds);
      expect(terms?.defaultRent).toBe(bed2.defaultRent);
      expect(terms?.defaultDeposit).toBe(bed2.defaultDeposit);

      // Step 4: Operator deselects all beds
      selectedBedIds = [];
      terms = coordinator.getBedCommercialTerms(flat.id, selectedBedIds);
      expect(terms).toBeNull();
    });

    it('preserves reservation-defined commercial terms when admission is initiated from a reservation', () => {
      const resRepo = new InMemoryReservationRepository(mockReservations);
      const reservation = resRepo.findByIdSync('resv-000001')!;

      expect(reservation.expectedMonthlyRent).toBe(12000);
      expect(reservation.expectedSecurityDeposit).toBe(12000);

      // Draft initialized from reservation retains reservation commercial terms
      const reservationDraft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: reservation.id,
        residentName: reservation.prospectName,
        mobileNumber: reservation.mobileNumber,
        checkInDate: reservation.expectedJoiningDate,
        agreedRent: reservation.expectedMonthlyRent ?? 0,
        agreedDeposit: reservation.expectedSecurityDeposit ?? 0,
      };

      expect(reservationDraft.agreedRent).toBe(12000);
      expect(reservationDraft.agreedDeposit).toBe(12000);
    });
  });

  describe('Accommodation #7 — Admission Form Identity Fields', () => {
    it('normalizes resident and prospect names to Title Case by default', () => {
      expect(toTitleCase('arjun sharma')).toBe('Arjun Sharma');
      expect(toTitleCase('SANJAY DUTT')).toBe('SANJAY DUTT');
      expect(toTitleCase('priya')).toBe('Priya');
      expect(toTitleCase('')).toBe('');
      expect(toTitleCase('rajesh kumar verma')).toBe('Rajesh Kumar Verma');
    });

    it('exposes Document Type options matching domain IdentityDocumentType enums', () => {
      expect(DOCUMENT_TYPE_OPTIONS).toBeDefined();
      const optionValues = DOCUMENT_TYPE_OPTIONS.map((o) => o.value);
      expect(optionValues).toContain('AADHAAR');
      expect(optionValues).toContain('PAN');
      expect(optionValues).toContain('PASSPORT');
      expect(optionValues).toContain('DRIVING_LICENCE');
      expect(optionValues).toContain('VOTER_ID');
      expect(optionValues).toContain('GOVERNMENT_ID');
      expect(optionValues).toContain('OTHER');
    });

    it('persists Document Type and Document Number into the Resident entity during walk-in admission', () => {
      financeStorage.saveStoredLedgerEntries([]);
      financeStorage.saveStoredBills([]);
      financeStorage.saveStoredPayments([]);
      financeStorage.saveStoredSettlements([]);

      const resRepo = new InMemoryReservationRepository([]);
      const residentRepo = new InMemoryResidentRepository([]);
      const stayRepo = new InMemoryStayRepository([]);
      const accomRepo = new InMemoryAccommodationRepository();

      const coord = new AdmissionCoordinator(resRepo, residentRepo, stayRepo, accomRepo);
      const flat = accomRepo.findAll()[0];
      const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      const draft: AdmissionDraft = {
        sourceType: 'WALK_IN',
        residentName: 'Karan Mehra',
        mobileNumber: '9988776655',
        idProofType: 'AADHAAR',
        idProofNumber: '1234 5678 9012',
        checkInDate: '2026-08-15',
        agreedRent: 6500,
        agreedDeposit: 6500,
        flatId: flat.id,
        bedIds: [vacantBed.id],
      };

      const result = coord.confirmWalkInAdmission(draft);
      expect(result.success).toBe(true);
      expect(result.residentId).toBeDefined();

      const resident = residentRepo.getByIdSync(result.residentId!);
      expect(resident).toBeDefined();
      expect(resident!.fullName).toBe('Karan Mehra');
      expect(resident!.documents).toHaveLength(1);
      expect(resident!.documents![0].type).toBe('AADHAAR');
      expect(resident!.documents![0].documentNumber).toBe('1234 5678 9012');
      expect(resident!.documents![0].customType).toBeUndefined();
    });

    it('persists custom document type when Document Type is OTHER and customIdProofType is provided', () => {
      financeStorage.saveStoredLedgerEntries([]);
      financeStorage.saveStoredBills([]);
      financeStorage.saveStoredPayments([]);
      financeStorage.saveStoredSettlements([]);

      const resRepo = new InMemoryReservationRepository([]);
      const residentRepo = new InMemoryResidentRepository([]);
      const stayRepo = new InMemoryStayRepository([]);
      const accomRepo = new InMemoryAccommodationRepository();

      const coord = new AdmissionCoordinator(resRepo, residentRepo, stayRepo, accomRepo);
      const flat = accomRepo.findAll()[0];
      const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      const draft: AdmissionDraft = {
        sourceType: 'WALK_IN',
        residentName: 'Rohan Joshi',
        mobileNumber: '9876543219',
        idProofType: 'OTHER',
        customIdProofType: 'University Student ID',
        idProofNumber: 'STU-2026-99',
        checkInDate: '2026-08-15',
        agreedRent: 7000,
        agreedDeposit: 7000,
        flatId: flat.id,
        bedIds: [vacantBed.id],
      };

      const result = coord.confirmWalkInAdmission(draft);
      expect(result.success).toBe(true);
      expect(result.residentId).toBeDefined();

      const resident = residentRepo.getByIdSync(result.residentId!);
      expect(resident).toBeDefined();
      expect(resident!.documents).toHaveLength(1);
      expect(resident!.documents![0].type).toBe('OTHER');
      expect(resident!.documents![0].documentNumber).toBe('STU-2026-99');
      expect(resident!.documents![0].customType).toBe('University Student ID');
    });
  });
});
