import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionValidationService } from '../AdmissionValidationService';
import { AdmissionCoordinator } from '../../coordinator/AdmissionCoordinator';
import type { AdmissionDraft } from '../../models/AdmissionDraft';
import type { Reservation } from '../../../../reservation/domain/entities/Reservation';
import { ReservationStatus } from '../../../../reservation/domain/valueObjects/ReservationStatus';
import type { Resident } from '../../../../resident/domain/entities/Resident';
import { ResidentStatus } from '../../../../resident/domain/valueObjects/ResidentStatus';
import type { Flat } from '../../../../accommodation/domain/entities/Flat';
import { BedStatus } from '../../../../accommodation/domain/valueObjects/BedStatus';
import { TokenDisposition } from '../../../domain/valueObjects/TokenDisposition';
import { InMemoryAccommodationRepository } from '../../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryReservationRepository } from '../../../../reservation/infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryStayRepository } from '../../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { financeStorage } from '../../../../finance/storage/financeStorage';

describe('AdmissionValidationService Pre-Commit Validation Gate (Sprint RA-8 Slice 3)', () => {
  let validationService: AdmissionValidationService;
  let accommodationRepo: InMemoryAccommodationRepository;
  let residentRepo: InMemoryResidentRepository;
  let reservationRepo: InMemoryReservationRepository;
  let stayRepo: InMemoryStayRepository;

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
          { id: 'bed-101-a', name: 'B1', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
          { id: 'bed-101-b', name: 'B2', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
        ],
      },
    ],
  };

  const sampleReservation: Reservation = {
    id: 'resv-000001',
    reservationNumber: 'RES-000001',
    prospectName: 'Rohit Verma',
    mobileNumber: '9876543210',
    expectedJoiningDate: '2026-08-20',
    expectedMonthlyRent: 8000,
    expectedSecurityDeposit: 6500,
    accommodationPreference: 'Master Bedroom',
    tokenAmount: 2000,
    tokenReceivedOn: '2026-08-01',
    tokenRemarks: 'Advance UPI',
    status: ReservationStatus.ACTIVE,
    auditLog: [],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  };

  const validReservationDraft: AdmissionDraft = {
    sourceType: 'RESERVATION',
    reservationId: 'resv-000001',
    residentName: 'Rohit Verma',
    mobileNumber: '9876543210',
    idProofType: 'AADHAAR',
    idProofNumber: '1234-5678-9012',
    checkInDate: '2026-08-20',
    agreedRent: 8000,
    agreedDeposit: 6500,
    flatId: 'flat-101',
    bedIds: ['bed-101-a'],
    tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
  };

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);

    validationService = new AdmissionValidationService();
    accommodationRepo = new InMemoryAccommodationRepository([JSON.parse(JSON.stringify(sampleFlat))]);
    residentRepo = new InMemoryResidentRepository([]);
    reservationRepo = new InMemoryReservationRepository([JSON.parse(JSON.stringify(sampleReservation))]);
    stayRepo = new InMemoryStayRepository([]);
  });

  // ===========================================================================
  // 1. VALIDATION SUCCESS (1 & 2)
  // ===========================================================================
  describe('Validation Success', () => {
    it('1. valid Reservation Admission passes pre-commit validation', () => {
      const result = validationService.validate(
        validReservationDraft,
        sampleReservation,
        'RESERVATION',
        accommodationRepo,
        residentRepo
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('2. valid Walk-in Admission passes pre-commit validation', () => {
      const walkInDraft: AdmissionDraft = {
        sourceType: 'WALK_IN',
        residentName: 'Karan Mehra',
        mobileNumber: '9811223344',
        idProofType: 'AADHAAR',
        idProofNumber: '1234-5678-9012',
        checkInDate: '2026-08-20',
        agreedRent: 8000,
        agreedDeposit: 6500,
        flatId: 'flat-101',
        bedIds: ['bed-101-a'],
      };

      const result = validationService.validate(
        walkInDraft,
        null,
        'WALK_IN',
        accommodationRepo,
        residentRepo
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 2. IDENTITY VALIDATION (3 to 7)
  // ===========================================================================
  describe('Identity Validation', () => {
    it('3. fails validation when resident name is missing or empty', () => {
      const draft = { ...validReservationDraft, residentName: '   ' };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_NAME_REQUIRED' })
      );
    });

    it('4. fails validation when mobile number is not 10 digits', () => {
      const draft = { ...validReservationDraft, mobileNumber: '12345' };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_MOBILE_INVALID' })
      );
    });

    it('5. fails validation when mobile belongs to an ACTIVE resident with concurrent stay', () => {
      const activeResident: Resident = {
        id: 'res-active-01',
        residentCode: 'RESID-000001',
        fullName: 'Rohit Verma',
        status: ResidentStatus.ACTIVE,
        mobileNumber: '9876543210',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };
      residentRepo.saveSync(activeResident);

      const result = validationService.validate(validReservationDraft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_DUPLICATE_ACTIVE_RESIDENT' })
      );
    });

    it('6. fails validation when mobile belongs to an ON_NOTICE resident', () => {
      const onNoticeResident: Resident = {
        id: 'res-notice-01',
        residentCode: 'RESID-000002',
        fullName: 'Rohit Verma',
        status: ResidentStatus.ON_NOTICE,
        mobileNumber: '9876543210',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };
      residentRepo.saveSync(onNoticeResident);

      const result = validationService.validate(validReservationDraft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_DUPLICATE_ON_NOTICE_RESIDENT' })
      );
    });

    it('7. checked-out / alumni resident reuse does NOT fail validation', () => {
      const alumniResident: Resident = {
        id: 'res-alumni-01',
        residentCode: 'RESID-000003',
        fullName: 'Rohit Verma',
        status: ResidentStatus.CHECKED_OUT,
        mobileNumber: '9876543210',
        createdAt: '2025-01-01',
        updatedAt: '2025-12-31',
      };
      residentRepo.saveSync(alumniResident);

      const result = validationService.validate(validReservationDraft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    // Identity Document Validation Rules (Spec Section 7.5 Minimum Operational Dataset)
    it('7a. fails validation when Document Type is missing or empty', () => {
      const draft = { ...validReservationDraft, idProofType: undefined };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_DOC_TYPE_REQUIRED' })
      );
    });

    it('7b. fails validation when Document Type is OTHER and Custom Document Type is missing', () => {
      const draft = {
        ...validReservationDraft,
        idProofType: 'OTHER',
        customIdProofType: undefined,
        idProofNumber: 'STU-123',
      };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_CUSTOM_DOC_TYPE_REQUIRED' })
      );
    });

    it('7c. passes validation when Document Type is OTHER and Custom Document Type is valid', () => {
      const draft = {
        ...validReservationDraft,
        idProofType: 'OTHER',
        customIdProofType: 'College Identity Card',
        idProofNumber: 'STU-2026-99',
      };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('7d. fails validation when required-number Document Type has missing Document Number', () => {
      const draft = {
        ...validReservationDraft,
        idProofType: 'AADHAAR',
        idProofNumber: undefined,
      };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_DOC_NUMBER_REQUIRED' })
      );
    });

    it('7e. passes validation when required-number Document Types have valid Document Numbers', () => {
      const requiredTypes = ['AADHAAR', 'PAN', 'PASSPORT', 'DRIVING_LICENCE', 'VOTER_ID', 'GOVERNMENT_ID'];
      for (const type of requiredTypes) {
        const draft = {
          ...validReservationDraft,
          idProofType: type,
          idProofNumber: 'DOC-12345678',
        };
        const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);
        expect(result.isValid).toBe(true);
      }
    });

    it('7f. passes validation when optional-number Document Type (OTHER) has no Document Number', () => {
      const draft = {
        ...validReservationDraft,
        idProofType: 'OTHER',
        customIdProofType: 'College Bonafide Certificate',
        idProofNumber: undefined,
      };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('7g. passes validation when optional-number Document Type (OTHER) has valid Document Number', () => {
      const draft = {
        ...validReservationDraft,
        idProofType: 'OTHER',
        customIdProofType: 'Company Identity Card',
        idProofNumber: 'EMP-9988',
      };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('7h. fails validation when Document Number contains only whitespace for required document type', () => {
      const draft = {
        ...validReservationDraft,
        idProofType: 'PAN',
        idProofNumber: '   ',
      };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_DOC_NUMBER_REQUIRED' })
      );
    });

    it('7i. fails validation when Custom Document Type for OTHER contains only whitespace', () => {
      const draft = {
        ...validReservationDraft,
        idProofType: 'OTHER',
        customIdProofType: '   ',
        idProofNumber: 'DOC-123',
      };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_CUSTOM_DOC_TYPE_REQUIRED' })
      );
    });

    it('7j. missing Emergency Contact does NOT fail validation (Progressive Profile Non-blocking)', () => {
      const draft = {
        ...validReservationDraft,
        emergencyContactName: undefined,
        emergencyContactPhone: undefined,
        emergencyContactRelationship: undefined,
      };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
    });

    it('7k. missing Permanent Address does NOT fail validation (Progressive Profile Non-blocking)', () => {
      const draft = {
        ...validReservationDraft,
        permanentAddress: undefined,
      };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
    });
  });

  // ===========================================================================
  // 3. COMMERCIAL VALIDATION (8 & 9)
  // ===========================================================================
  describe('Commercial Validation', () => {
    it('8. fails validation when agreed monthly rent is <= 0 or invalid', () => {
      const draft = { ...validReservationDraft, agreedRent: 0 };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_RENT_INVALID' })
      );
    });

    it('9. fails validation when agreed security deposit is negative or invalid', () => {
      const draft = { ...validReservationDraft, agreedDeposit: -100 as any };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_DEPOSIT_INVALID' })
      );
    });
  });

  // ===========================================================================
  // 4. ACCOMMODATION VALIDATION (10 to 17)
  // ===========================================================================
  describe('Accommodation Validation & Live State', () => {
    it('10. fails validation when flat is not selected', () => {
      const draft = { ...validReservationDraft, flatId: '' };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_FLAT_REQUIRED' })
      );
    });

    it('11. fails validation when no bed is selected', () => {
      const draft = { ...validReservationDraft, bedIds: [] };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_BED_REQUIRED' })
      );
    });

    it('12. fails validation when specified flat does not exist in repository', () => {
      const draft = { ...validReservationDraft, flatId: 'non-existent-flat' };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_FLAT_NOT_FOUND' })
      );
    });

    it('13. fails validation when bed ID does not belong to the selected flat', () => {
      const draft = { ...validReservationDraft, bedIds: ['bed-999-unknown'] };
      const result = validationService.validate(draft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_BED_NOT_FOUND' })
      );
    });

    it('14. fails validation when selected bed is currently OCCUPIED', () => {
      const flat = accommodationRepo.findById('flat-101')!;
      flat.areas[0].beds[0].status = BedStatus.OCCUPIED;
      accommodationRepo.save(flat);

      const result = validationService.validate(validReservationDraft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_BED_OCCUPIED' })
      );
    });

    it('15. fails validation when selected bed is BLOCKED', () => {
      const flat = accommodationRepo.findById('flat-101')!;
      flat.areas[0].beds[0].status = BedStatus.BLOCKED;
      accommodationRepo.save(flat);

      const result = validationService.validate(validReservationDraft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_BED_UNAVAILABLE' })
      );
    });

    it('16. fails validation when selected bed is in MAINTENANCE', () => {
      const flat = accommodationRepo.findById('flat-101')!;
      flat.areas[0].beds[0].status = BedStatus.MAINTENANCE;
      accommodationRepo.save(flat);

      const result = validationService.validate(validReservationDraft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_BED_UNAVAILABLE' })
      );
    });

    it('17. re-checks live Accommodation state immediately at invocation time', () => {
      // Step A: Initially bed is VACANT -> valid
      const initialCheck = validationService.validate(validReservationDraft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);
      expect(initialCheck.isValid).toBe(true);

      // Step B: Another process marks bed OCCUPIED in repository
      const flat = accommodationRepo.findById('flat-101')!;
      flat.areas[0].beds[0].status = BedStatus.OCCUPIED;
      accommodationRepo.save(flat);

      // Step C: Validation re-reads live repository state and detects change
      const liveCheck = validationService.validate(validReservationDraft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);
      expect(liveCheck.isValid).toBe(false);
      expect(liveCheck.errors).toContainEqual(expect.objectContaining({ code: 'ADM_VAL_BED_OCCUPIED' }));
    });
  });

  // ===========================================================================
  // 5. RESERVATION VALIDATION (18 to 21)
  // ===========================================================================
  describe('Reservation Source Validation', () => {
    it('18. fails validation when reservation is missing for Reservation Admission', () => {
      const result = validationService.validate(validReservationDraft, null, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_RESERVATION_REQUIRED' })
      );
    });

    it('19. fails validation when reservation has already been CONVERTED', () => {
      const convertedRes: Reservation = {
        ...sampleReservation,
        status: ReservationStatus.CONVERTED,
        convertedResidentId: 'res-0001',
      };

      const result = validationService.validate(validReservationDraft, convertedRes, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_RESERVATION_ALREADY_CONVERTED' })
      );
    });

    it('20. fails validation when reservation is CANCELLED', () => {
      const cancelledRes: Reservation = {
        ...sampleReservation,
        status: ReservationStatus.CANCELLED,
      };

      const result = validationService.validate(validReservationDraft, cancelledRes, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_RESERVATION_CANCELLED' })
      );
    });

    it('21. valid ACTIVE reservation (including overdue follow-up) passes validation', () => {
      const overdueActiveRes: Reservation = {
        ...sampleReservation,
        expectedJoiningDate: '2026-08-01', // Overdue relative to current date
        status: ReservationStatus.ACTIVE,
      };

      const result = validationService.validate(validReservationDraft, overdueActiveRes, 'RESERVATION', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
    });
  });

  // ===========================================================================
  // 6. TOKEN VALIDATION (22 & 23)
  // ===========================================================================
  describe('Token Disposition Validation', () => {
    it('22. fails validation when reservation has token > 0 but disposition choice is missing', () => {
      const draftMissingToken: AdmissionDraft = {
        ...validReservationDraft,
        tokenDisposition: undefined,
      };

      const result = validationService.validate(draftMissingToken, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: 'ADM_VAL_TOKEN_DISPOSITION_REQUIRED' })
      );
    });

    it('23. passes validation when token disposition is selected (e.g. ADJUST_TO_FIRST_RENT or LEAVE_PENDING)', () => {
      const draftPending: AdmissionDraft = {
        ...validReservationDraft,
        tokenDisposition: TokenDisposition.LEAVE_PENDING,
      };

      const result = validationService.validate(draftPending, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
    });
  });

  // ===========================================================================
  // 7. WALK-IN ADMISSION VALIDATION (24 & 25)
  // ===========================================================================
  describe('Walk-in Admission Isolation', () => {
    const walkInDraft: AdmissionDraft = {
      sourceType: 'WALK_IN',
      residentName: 'Karan Mehra',
      mobileNumber: '9811223344',
      idProofType: 'AADHAAR',
      idProofNumber: '1234-5678-9012',
      checkInDate: '2026-08-20',
      agreedRent: 8000,
      agreedDeposit: 6500,
      flatId: 'flat-101',
      bedIds: ['bed-101-a'],
    };

    it('24. walk-in admission succeeds without reservation', () => {
      const result = validationService.validate(walkInDraft, null, 'WALK_IN', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('25. walk-in admission does not require token disposition', () => {
      const draftWithoutToken: AdmissionDraft = {
        ...walkInDraft,
        tokenDisposition: undefined,
      };

      const result = validationService.validate(draftWithoutToken, null, 'WALK_IN', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
      expect(result.errors.some((e) => e.code.startsWith('ADM_VAL_TOKEN'))).toBe(false);
    });
  });

  // ===========================================================================
  // 8. SOFT-READINESS SEPARATION (26 to 30)
  // ===========================================================================
  describe('Soft-Readiness Separation (Advisory Conditions Do Not Block Validation)', () => {
    it('26. rent concession deviation from default does NOT fail validation', () => {
      const draftWithConcession: AdmissionDraft = {
        ...validReservationDraft,
        agreedRent: 6000, // standard default is 8000
      };

      const result = validationService.validate(draftWithConcession, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
    });

    it('27. deposit deviation from default does NOT fail validation', () => {
      const draftWithDepositAdjustment: AdmissionDraft = {
        ...validReservationDraft,
        agreedDeposit: 10000, // standard default is 6500
      };

      const result = validationService.validate(draftWithDepositAdjustment, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
    });

    it('28. accommodation preference mismatch does NOT fail validation', () => {
      const reservationWithDivergentPref: Reservation = {
        ...sampleReservation,
        accommodationPreference: '3rd Floor Penthouse Single Room',
      };

      const result = validationService.validate(validReservationDraft, reservationWithDivergentPref, 'RESERVATION', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
    });

    it('29. joining-date change does NOT fail validation', () => {
      const draftWithRevisedDate: AdmissionDraft = {
        ...validReservationDraft,
        checkInDate: '2026-08-28', // reservation expectedJoiningDate is 2026-08-20
      };

      const result = validationService.validate(draftWithRevisedDate, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
    });

    it('30. alumni / returning resident reuse does NOT fail validation', () => {
      const returningResident: Resident = {
        id: 'res-alumni-02',
        residentCode: 'RESID-000088',
        fullName: 'Rohit Verma',
        status: ResidentStatus.ALUMNI,
        mobileNumber: '9876543210',
        createdAt: '2024-01-01',
        updatedAt: '2025-01-01',
      };
      residentRepo.saveSync(returningResident);

      const result = validationService.validate(validReservationDraft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);
      expect(result.isValid).toBe(true);
    });
  });

  // ===========================================================================
  // 9. AUTHORITY SEPARATION (31 to 34)
  // ===========================================================================
  describe('Authority Separation in Coordinator Confirmation Flow', () => {
    it('31. confirmation flow executes when Pre-Commit Validation passes even if Readiness has soft warnings (REQUIRES_REVIEW)', () => {
      const coordinator = new AdmissionCoordinator(reservationRepo, residentRepo, stayRepo, accommodationRepo);

      // Draft with soft rent concession (₹7000 vs ₹8000)
      const draftWithSoftWarning: AdmissionDraft = {
        ...validReservationDraft,
        agreedRent: 7000,
      };

      // Execution must succeed because soft warnings are advisory
      const result = coordinator.confirmReservedAdmission(draftWithSoftWarning, sampleReservation);
      expect(result.success).toBe(true);
      expect(result.residentId).toBeDefined();
      expect(result.stayId).toBeDefined();
    });

    it('32. readiness assessment category cannot cause transaction rejection', () => {
      const coordinator = new AdmissionCoordinator(reservationRepo, residentRepo, stayRepo, accommodationRepo);

      // Admission with revised joining date and deposit deviation
      const draftWithMultipleSoftWarnings: AdmissionDraft = {
        ...validReservationDraft,
        checkInDate: '2026-08-25',
        agreedDeposit: 5000,
      };

      const result = coordinator.confirmReservedAdmission(draftWithMultipleSoftWarnings, sampleReservation);
      expect(result.success).toBe(true);
    });

    it('33. validation failure aborts transaction before any mutations occur', () => {
      const coordinator = new AdmissionCoordinator(reservationRepo, residentRepo, stayRepo, accommodationRepo);

      const invalidDraft: AdmissionDraft = {
        ...validReservationDraft,
        residentName: '', // Invalid!
      };

      expect(() => coordinator.confirmReservedAdmission(invalidDraft, sampleReservation)).toThrow(
        'Admission validation failed: Resident full name is required.'
      );

      // Verify zero records were created in any repository
      expect(residentRepo.getAllSync()).toHaveLength(0);
      expect(stayRepo.getAllSync()).toHaveLength(0);
      expect(reservationRepo.findByIdSync('resv-000001')?.status).toBe(ReservationStatus.ACTIVE);
    });

    it('34. validation service is strictly read-only and never mutates repository state', () => {
      const flatSnapshot = JSON.stringify(accommodationRepo.findAll());
      const residentSnapshot = JSON.stringify(residentRepo.getAllSync());
      const resSnapshot = JSON.stringify(reservationRepo.findAllSync());

      validationService.validate(validReservationDraft, sampleReservation, 'RESERVATION', accommodationRepo, residentRepo);

      expect(JSON.stringify(accommodationRepo.findAll())).toBe(flatSnapshot);
      expect(JSON.stringify(residentRepo.getAllSync())).toBe(residentSnapshot);
      expect(JSON.stringify(reservationRepo.findAllSync())).toBe(resSnapshot);
    });
  });

  // ===========================================================================
  // 10. CRITICAL CONCURRENCY REGRESSION TEST (Section 17)
  // ===========================================================================
  describe('Stale-Bed Concurrency Regression Protection (Section 17)', () => {
    it('aborts transaction without mutations when bed is occupied between preparation and operator approval', () => {
      const coordinator = new AdmissionCoordinator(reservationRepo, residentRepo, stayRepo, accommodationRepo);

      // Phase 1: Workspace preparation opens when Bed 101-B1 is VACANT
      const draft: AdmissionDraft = {
        ...validReservationDraft,
        flatId: 'flat-101',
        bedIds: ['bed-101-a'],
      };

      // Phase 2: Another operation marks Bed 101-B1 as OCCUPIED in repository
      const flat = accommodationRepo.findById('flat-101')!;
      flat.areas[0].beds[0].status = BedStatus.OCCUPIED;
      flat.areas[0].beds[0].residentName = 'Existing Occupant';
      accommodationRepo.save(flat);

      // Phase 3: Operator clicks Approve & Admit -> Pre-Commit Validation re-reads Accommodation and fails
      expect(() => coordinator.confirmReservedAdmission(draft, sampleReservation)).toThrow(
        'Admission validation failed: Bed B1 is already OCCUPIED.'
      );

      // Phase 4: Verify Admission transaction NEVER started and ZERO mutations occurred
      expect(residentRepo.getAllSync()).toHaveLength(0);
      expect(stayRepo.getAllSync()).toHaveLength(0);

      // Reservation remains ACTIVE and un-converted
      const reservationAfter = reservationRepo.findByIdSync('resv-000001')!;
      expect(reservationAfter.status).toBe(ReservationStatus.ACTIVE);
      expect(reservationAfter.convertedResidentId).toBeUndefined();
      expect(reservationAfter.convertedStayId).toBeUndefined();

      // Bed remains untouched with existing occupant
      const flatAfter = accommodationRepo.findById('flat-101')!;
      expect(flatAfter.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);
      expect(flatAfter.areas[0].beds[0].residentName).toBe('Existing Occupant');
    });
  });
});
