import { describe, it, expect } from 'vitest';
import type { Reservation } from '../../reservation/domain/entities/Reservation';
import { ReservationStatus } from '../../reservation/domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../../reservation/infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { BedStatus } from '../../accommodation/domain/valueObjects/BedStatus';
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

  describe('Sprint RA-8 Slice 4 — Admission Readiness & Operator Approval UI Flow', () => {
    it('1. evaluates READY_FOR_APPROVAL posture when draft is complete and consistent', () => {
      const resRepo = new InMemoryReservationRepository(mockReservations);
      const accomRepo = new InMemoryAccommodationRepository();
      const coord = new AdmissionCoordinator(resRepo, undefined, undefined, accomRepo);

      const flat = accomRepo.findAll()[0];
      const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      // Clean reservation matching bed terms
      const cleanReservation: Reservation = {
        ...mockReservations[0],
        expectedMonthlyRent: vacantBed.defaultRent,
        expectedSecurityDeposit: vacantBed.defaultDeposit,
        accommodationPreference: undefined,
      };

      const draft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: cleanReservation.id,
        residentName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        idProofType: 'AADHAAR',
        idProofNumber: '1234-5678-9012',
        checkInDate: '2026-08-15',
        agreedRent: vacantBed.defaultRent ?? 12000,
        agreedDeposit: vacantBed.defaultDeposit ?? 12000,
        flatId: flat.id,
        bedIds: [vacantBed.id],
        tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
      };

      const assessment = coord.evaluateReadinessAssessment(draft, cleanReservation);
      expect(assessment.category).toBe('READY_FOR_APPROVAL');
      expect(assessment.sectionAssessments.SOURCE.isComplete).toBe(true);
      expect(assessment.sectionAssessments.IDENTITY.isComplete).toBe(true);
      expect(assessment.sectionAssessments.COMMERCIAL.isComplete).toBe(true);
      expect(assessment.sectionAssessments.ACCOMMODATION.isComplete).toBe(true);
      expect(assessment.sectionAssessments.TOKEN.isComplete).toBe(true);
    });

    it('2. evaluates REQUIRES_REVIEW posture when commercial terms deviate but does not block operator decision', () => {
      const resRepo = new InMemoryReservationRepository(mockReservations);
      const accomRepo = new InMemoryAccommodationRepository();
      const coord = new AdmissionCoordinator(resRepo, undefined, undefined, accomRepo);

      const flat = accomRepo.findAll()[0];
      const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      const cleanReservation: Reservation = {
        ...mockReservations[0],
        expectedMonthlyRent: vacantBed.defaultRent,
        expectedSecurityDeposit: vacantBed.defaultDeposit,
        accommodationPreference: undefined,
      };

      const draft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: cleanReservation.id,
        residentName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        idProofType: 'AADHAAR',
        idProofNumber: '1234-5678-9012',
        checkInDate: '2026-08-15',
        agreedRent: (vacantBed.defaultRent ?? 10000) + 2000, // Diverges from default
        agreedDeposit: vacantBed.defaultDeposit ?? 10000,
        flatId: flat.id,
        bedIds: [vacantBed.id],
        tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
      };

      const assessment = coord.evaluateReadinessAssessment(draft, cleanReservation);
      expect(assessment.category).toBe('REQUIRES_REVIEW');
      const commercialWarning = assessment.observations.find((o) => o.code === 'ADM_OBS_COMMERCIAL_RENT_DEVIATION');
      expect(commercialWarning).toBeDefined();
      expect(commercialWarning?.severity).toBe('REVIEW_WARNING');
      expect(commercialWarning?.guidance).toBeDefined();
    });

    it('3. evaluates AWAITING_INFORMATION posture when mandatory operational fields are missing', () => {
      const resRepo = new InMemoryReservationRepository(mockReservations);
      const coord = new AdmissionCoordinator(resRepo);

      const reservation = resRepo.findByIdSync('resv-000001')!;

      // Incomplete draft missing ID document and accommodation
      const draft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: reservation.id,
        residentName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        checkInDate: '2026-08-15',
        agreedRent: 12000,
        agreedDeposit: 12000,
      };

      const assessment = coord.evaluateReadinessAssessment(draft, reservation);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.sectionAssessments.IDENTITY.isComplete).toBe(false);
      expect(assessment.sectionAssessments.ACCOMMODATION.isComplete).toBe(false);
    });

    it('4. evaluates PENDING_OPERATOR_DECISION posture when token disposition is unselected', () => {
      const resRepo = new InMemoryReservationRepository(mockReservations);
      const accomRepo = new InMemoryAccommodationRepository();
      const coord = new AdmissionCoordinator(resRepo, undefined, undefined, accomRepo);

      const flat = accomRepo.findAll()[0];
      const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      const cleanReservation: Reservation = {
        ...mockReservations[0],
        expectedMonthlyRent: vacantBed.defaultRent,
        expectedSecurityDeposit: vacantBed.defaultDeposit,
        accommodationPreference: undefined,
      };

      const draft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: cleanReservation.id,
        residentName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        idProofType: 'AADHAAR',
        idProofNumber: '1234-5678-9012',
        checkInDate: '2026-08-15',
        agreedRent: vacantBed.defaultRent ?? 12000,
        agreedDeposit: vacantBed.defaultDeposit ?? 12000,
        flatId: flat.id,
        bedIds: [vacantBed.id],
        // tokenDisposition omitted
      };

      const assessment = coord.evaluateReadinessAssessment(draft, cleanReservation);
      expect(assessment.category).toBe('PENDING_OPERATOR_DECISION');
      const tokenObs = assessment.observations.find((o) => o.code === 'ADM_OBS_TOKEN_DISPOSITION_REQUIRED');
      expect(tokenObs).toBeDefined();
      expect(tokenObs?.severity).toBe('DECISION_REQUIRED');
    });

    it('5. surfaces progressive resident profile observations as non-blocking INFO observations', () => {
      const resRepo = new InMemoryReservationRepository(mockReservations);
      const accomRepo = new InMemoryAccommodationRepository();
      const coord = new AdmissionCoordinator(resRepo, undefined, undefined, accomRepo);

      const reservation = resRepo.findByIdSync('resv-000001')!;
      const flat = accomRepo.findAll()[0];
      const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      const draft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: reservation.id,
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

      const assessment = coord.evaluateReadinessAssessment(draft, reservation);
      const progressiveObs = assessment.observations.filter((o) => o.severity === 'INFO' && o.section === 'IDENTITY');
      expect(progressiveObs.length).toBeGreaterThan(0);
      expect(progressiveObs.some((o) => o.message.toLowerCase().includes('emergency contact'))).toBe(true);
      expect(progressiveObs.some((o) => o.message.toLowerCase().includes('permanent address'))).toBe(true);
    });

    it('6. executes Approve & Admit via AdmissionCoordinator, invoking authoritative Pre-Commit Validation', () => {
      financeStorage.saveStoredLedgerEntries([]);
      financeStorage.saveStoredBills([]);
      financeStorage.saveStoredPayments([]);
      financeStorage.saveStoredSettlements([]);

      const resRepo = new InMemoryReservationRepository(mockReservations);
      const residentRepo = new InMemoryResidentRepository();
      const stayRepo = new InMemoryStayRepository();
      const accomRepo = new InMemoryAccommodationRepository();

      const coord = new AdmissionCoordinator(resRepo, residentRepo, stayRepo, accomRepo);
      const reservation = resRepo.findByIdSync('resv-000001')!;
      const flat = accomRepo.findAll()[0];
      const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      const validDraft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: reservation.id,
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

      const result = coord.confirmReservedAdmission(validDraft, reservation);
      expect(result.success).toBe(true);
      expect(result.residentId).toBeDefined();
      expect(result.stayId).toBeDefined();
      expect(result.residentCode).toMatch(/^RESID-/);

      // Verify Reservation converted atomically
      const updatedRes = resRepo.findByIdSync('resv-000001');
      expect(updatedRes?.status).toBe(ReservationStatus.CONVERTED);
    });

    it('7. halts transaction and throws on Pre-Commit Validation failure (leaving state in Preparation with 0 mutations)', () => {
      financeStorage.saveStoredLedgerEntries([]);
      financeStorage.saveStoredBills([]);
      financeStorage.saveStoredPayments([]);
      financeStorage.saveStoredSettlements([]);

      const resRepo = new InMemoryReservationRepository(mockReservations);
      const residentRepo = new InMemoryResidentRepository([]);
      const stayRepo = new InMemoryStayRepository([]);
      const accomRepo = new InMemoryAccommodationRepository();

      const coord = new AdmissionCoordinator(resRepo, residentRepo, stayRepo, accomRepo);
      const reservation = resRepo.findByIdSync('resv-000001')!;

      // Invalid draft missing mandatory document number
      const invalidDraft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: reservation.id,
        residentName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        idProofType: 'AADHAAR',
        idProofNumber: '', // Missing
        checkInDate: '2026-08-15',
        agreedRent: 12000,
        agreedDeposit: 12000,
        flatId: 'flat-101',
        bedIds: ['bed-101-a'],
        tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
      };

      expect(() => coord.confirmReservedAdmission(invalidDraft, reservation)).toThrow(
        /Admission validation failed/
      );

      // Verify ZERO business mutations occurred
      expect(residentRepo.getAllSync()).toHaveLength(0);
      expect(stayRepo.getAllSync()).toHaveLength(0);
      expect(resRepo.findByIdSync('resv-000001')?.status).toBe(ReservationStatus.ACTIVE);
    });

    it('8. protects against stale Bed state when a bed is occupied during operator preparation', () => {
      financeStorage.saveStoredLedgerEntries([]);
      financeStorage.saveStoredBills([]);
      financeStorage.saveStoredPayments([]);
      financeStorage.saveStoredSettlements([]);

      const resRepo = new InMemoryReservationRepository(mockReservations);
      const residentRepo = new InMemoryResidentRepository([]);
      const stayRepo = new InMemoryStayRepository([]);
      const accomRepo = new InMemoryAccommodationRepository();

      const coord = new AdmissionCoordinator(resRepo, residentRepo, stayRepo, accomRepo);
      const reservation = resRepo.findByIdSync('resv-000001')!;
      const flat = accomRepo.findAll()[0];
      const targetBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      const draft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: reservation.id,
        residentName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        idProofType: 'AADHAAR',
        idProofNumber: '1234-5678-9012',
        checkInDate: '2026-08-15',
        agreedRent: 12000,
        agreedDeposit: 12000,
        flatId: flat.id,
        bedIds: [targetBed.id],
        tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
      };

      // Simulate external concurrent transaction marking the bed OCCUPIED in repository
      targetBed.status = BedStatus.OCCUPIED;
      targetBed.residentName = 'Concurrent Resident';
      accomRepo.save(flat);

      expect(() => coord.confirmReservedAdmission(draft, reservation)).toThrow(
        /Bed.*is already OCCUPIED/
      );

      // Confirm reservation remains active
      expect(resRepo.findByIdSync('resv-000001')?.status).toBe(ReservationStatus.ACTIVE);
    });

    it('9. supports direct Walk-in Admission with Approve & Admit flow', () => {
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

      const walkInDraft: AdmissionDraft = {
        sourceType: 'WALK_IN',
        residentName: 'Anita Roy',
        mobileNumber: '9123456780',
        idProofType: 'AADHAAR',
        idProofNumber: '9876-5432-1098',
        checkInDate: '2026-08-20',
        agreedRent: vacantBed.defaultRent ?? 8000,
        agreedDeposit: vacantBed.defaultDeposit ?? 8000,
        flatId: flat.id,
        bedIds: [vacantBed.id],
      };

      const assessment = coord.evaluateReadinessAssessment(walkInDraft, null);
      expect(assessment.category).toBe('READY_FOR_APPROVAL');
      expect(assessment.sectionAssessments.SOURCE.isComplete).toBe(true);

      const result = coord.confirmWalkInAdmission(walkInDraft);
      expect(result.success).toBe(true);
      expect(result.residentId).toBeDefined();
      expect(result.stayId).toBeDefined();
    });

    it('10. demonstrates AWAITING_INFORMATION posture allows Approve & Admit to execute, with Pre-Commit Validation authoritatively rejecting missing invariants without state mutation', () => {
      financeStorage.saveStoredLedgerEntries([]);
      financeStorage.saveStoredBills([]);
      financeStorage.saveStoredPayments([]);
      financeStorage.saveStoredSettlements([]);

      const resRepo = new InMemoryReservationRepository(mockReservations);
      const residentRepo = new InMemoryResidentRepository([]);
      const stayRepo = new InMemoryStayRepository([]);
      const accomRepo = new InMemoryAccommodationRepository();

      const coord = new AdmissionCoordinator(resRepo, residentRepo, stayRepo, accomRepo);
      const reservation = resRepo.findByIdSync('resv-000001')!;
      const flat = accomRepo.findAll()[0];
      const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      // Draft with missing document number -> AWAITING_INFORMATION
      const awaitingInfoDraft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: reservation.id,
        residentName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        idProofType: 'AADHAAR',
        idProofNumber: '', // Missing
        checkInDate: '2026-08-15',
        agreedRent: 12000,
        agreedDeposit: 12000,
        flatId: flat.id,
        bedIds: [vacantBed.id],
        tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
      };

      // 1. Advisory assessment reports AWAITING_INFORMATION
      const assessment = coord.evaluateReadinessAssessment(awaitingInfoDraft, reservation);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.sectionAssessments.IDENTITY.isComplete).toBe(false);

      // 2. Operator attempts Approve & Admit
      let caughtError: Error | null = null;
      try {
        coord.confirmReservedAdmission(awaitingInfoDraft, reservation);
      } catch (err) {
        caughtError = err as Error;
      }

      // 3. Pre-Commit Validation authoritatively rejected the hard invariant
      expect(caughtError).not.toBeNull();
      expect(caughtError?.message).toContain('Admission validation failed');
      expect(caughtError?.message).toContain('Document Number is required for AADHAAR');

      // 4. Preparation remains intact with zero business mutations
      expect(residentRepo.getAllSync()).toHaveLength(0);
      expect(stayRepo.getAllSync()).toHaveLength(0);
      expect(resRepo.findByIdSync('resv-000001')?.status).toBe(ReservationStatus.ACTIVE);
    });

    it('11. demonstrates REQUIRES_REVIEW posture allows operator Approve & Admit, with Pre-Commit Validation passing and completing atomic admission', () => {
      financeStorage.saveStoredLedgerEntries([]);
      financeStorage.saveStoredBills([]);
      financeStorage.saveStoredPayments([]);
      financeStorage.saveStoredSettlements([]);

      const resRepo = new InMemoryReservationRepository(mockReservations);
      const residentRepo = new InMemoryResidentRepository([]);
      const stayRepo = new InMemoryStayRepository([]);
      const accomRepo = new InMemoryAccommodationRepository();

      const coord = new AdmissionCoordinator(resRepo, residentRepo, stayRepo, accomRepo);
      const flat = accomRepo.findAll()[0];
      const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

      const cleanReservation: Reservation = {
        ...mockReservations[0],
        expectedMonthlyRent: vacantBed.defaultRent,
        expectedSecurityDeposit: vacantBed.defaultDeposit,
        accommodationPreference: undefined,
      };

      // Draft with commercial deviation -> REQUIRES_REVIEW
      const requiresReviewDraft: AdmissionDraft = {
        sourceType: 'RESERVATION',
        reservationId: cleanReservation.id,
        residentName: 'Rahul Sharma',
        mobileNumber: '9876543210',
        idProofType: 'AADHAAR',
        idProofNumber: '1234-5678-9012',
        checkInDate: '2026-08-15',
        agreedRent: (vacantBed.defaultRent ?? 10000) + 2500, // Commercial divergence
        agreedDeposit: vacantBed.defaultDeposit ?? 10000,
        flatId: flat.id,
        bedIds: [vacantBed.id],
        tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
      };

      // 1. Advisory assessment reports REQUIRES_REVIEW
      const assessment = coord.evaluateReadinessAssessment(requiresReviewDraft, cleanReservation);
      expect(assessment.category).toBe('REQUIRES_REVIEW');

      // 2. Operator proceeds to Approve & Admit
      const result = coord.confirmReservedAdmission(requiresReviewDraft, cleanReservation);

      // 3. Pre-Commit Validation passes and atomic transaction commits
      expect(result.success).toBe(true);
      expect(result.residentId).toBeDefined();
      expect(result.stayId).toBeDefined();
      expect(residentRepo.getAllSync()).toHaveLength(1);
      expect(stayRepo.getAllSync()).toHaveLength(1);
      expect(resRepo.findByIdSync('resv-000001')?.status).toBe(ReservationStatus.CONVERTED);
    });
  });
});
