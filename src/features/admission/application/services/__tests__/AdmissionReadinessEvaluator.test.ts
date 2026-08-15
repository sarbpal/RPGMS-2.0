import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionReadinessEvaluator } from '../AdmissionReadinessEvaluator';
import type { AdmissionDraft } from '../../models/AdmissionDraft';
import type { Reservation } from '../../../../reservation/domain/entities/Reservation';
import { ReservationStatus } from '../../../../reservation/domain/valueObjects/ReservationStatus';
import type { Resident } from '../../../../resident/domain/entities/Resident';
import { ResidentStatus } from '../../../../resident/domain/valueObjects/ResidentStatus';
import type { Flat } from '../../../../accommodation/domain/entities/Flat';
import { BedStatus } from '../../../../accommodation/domain/valueObjects/BedStatus';
import { TokenDisposition } from '../../../domain/valueObjects/TokenDisposition';

describe('AdmissionReadinessEvaluator Unit & Domain Rules Suite (Sprint RA-8)', () => {
  let evaluator: AdmissionReadinessEvaluator;

  const sampleFlat: Flat = {
    id: 'flat-101',
    name: '101',
    floor: '1st Floor',
    description: 'Double Sharing 1st Floor',
    areas: [
      {
        id: 'area-101-bedroom',
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
    prospectName: 'Vikram Singh',
    mobileNumber: '9876543210',
    expectedJoiningDate: '2026-08-20',
    expectedMonthlyRent: 8000,
    expectedSecurityDeposit: 6500,
    accommodationPreference: 'Master Bedroom 1st Floor',
    tokenAmount: 2000,
    tokenReceivedOn: '2026-08-01',
    tokenRemarks: 'UPI',
    status: ReservationStatus.ACTIVE,
    auditLog: [],
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-01T10:00:00Z',
  };

  const fullyPreparedDraft: AdmissionDraft = {
    sourceType: 'RESERVATION',
    reservationId: 'resv-000001',
    residentName: 'Vikram Singh',
    mobileNumber: '9876543210',
    emergencyContactName: 'Rajesh Singh',
    emergencyContactRelationship: 'Father',
    emergencyContactPhone: '9111111111',
    idProofType: 'AADHAAR',
    idProofNumber: '1234-5678-9012',
    permanentAddress: '123 Main St, New Delhi',
    checkInDate: '2026-08-20',
    agreedRent: 8000,
    agreedDeposit: 6500,
    flatId: 'flat-101',
    bedIds: ['bed-101-a'],
    tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
  };

  beforeEach(() => {
    evaluator = new AdmissionReadinessEvaluator();
  });

  // ===========================================================================
  // CATEGORY DERIVATION TESTS (1 to 4)
  // ===========================================================================
  describe('Readiness Category Derivation', () => {
    it('1. returns READY_FOR_APPROVAL when all criteria are complete and matching', () => {
      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [sampleFlat], []);

      expect(assessment.category).toBe('READY_FOR_APPROVAL');
      expect(assessment.sectionAssessments.SOURCE.isComplete).toBe(true);
      expect(assessment.sectionAssessments.IDENTITY.isComplete).toBe(true);
      expect(assessment.sectionAssessments.COMMERCIAL.isComplete).toBe(true);
      expect(assessment.sectionAssessments.ACCOMMODATION.isComplete).toBe(true);
      expect(assessment.sectionAssessments.TOKEN.isComplete).toBe(true);
      expect(assessment.summary).toContain('ready for approval');
    });

    it('2. returns REQUIRES_REVIEW when soft review warnings exist (e.g. rent deviation)', () => {
      const draftWithConcession: AdmissionDraft = {
        ...fullyPreparedDraft,
        agreedRent: 7500, // standard is 8000
      };

      const assessment = evaluator.evaluateReadiness(draftWithConcession, sampleReservation, [sampleFlat], []);

      expect(assessment.category).toBe('REQUIRES_REVIEW');
      const warningObs = assessment.observations.find((o) => o.code === 'ADM_OBS_COMMERCIAL_RENT_DEVIATION');
      expect(warningObs).toBeDefined();
      expect(warningObs?.severity).toBe('REVIEW_WARNING');
    });

    it('3. returns AWAITING_INFORMATION when mandatory fields are missing', () => {
      const draftMissingName: AdmissionDraft = {
        ...fullyPreparedDraft,
        residentName: '',
      };

      const assessment = evaluator.evaluateReadiness(draftMissingName, sampleReservation, [sampleFlat], []);

      expect(assessment.category).toBe('AWAITING_INFORMATION');
      const incompleteObs = assessment.observations.find((o) => o.code === 'ADM_OBS_IDENTITY_NAME_REQUIRED');
      expect(incompleteObs).toBeDefined();
      expect(incompleteObs?.severity).toBe('INCOMPLETE_DATA');
      expect(assessment.sectionAssessments.IDENTITY.isComplete).toBe(false);
    });

    it('4. returns PENDING_OPERATOR_DECISION when token disposition is required but unselected', () => {
      const draftMissingTokenChoice: AdmissionDraft = {
        ...fullyPreparedDraft,
        tokenDisposition: undefined, // token is ₹2,000
      };

      const assessment = evaluator.evaluateReadiness(draftMissingTokenChoice, sampleReservation, [sampleFlat], []);

      expect(assessment.category).toBe('PENDING_OPERATOR_DECISION');
      const decisionObs = assessment.observations.find((o) => o.code === 'ADM_OBS_TOKEN_DISPOSITION_REQUIRED');
      expect(decisionObs).toBeDefined();
      expect(decisionObs?.severity).toBe('DECISION_REQUIRED');
      expect(assessment.sectionAssessments.TOKEN.isComplete).toBe(false);
    });
  });

  // ===========================================================================
  // IDENTITY SECTION TESTS (5 to 12)
  // ===========================================================================
  describe('Identity Assessment & Minimal Admission', () => {
    it('5. assesses valid identity successfully', () => {
      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [sampleFlat], []);
      expect(assessment.sectionAssessments.IDENTITY.isComplete).toBe(true);
      expect(assessment.observations.some((o) => o.section === 'IDENTITY' && o.severity === 'INCOMPLETE_DATA')).toBe(false);
    });

    it('6. generates INCOMPLETE_DATA when resident full name is empty', () => {
      const draft = { ...fullyPreparedDraft, residentName: '   ' };
      const assessment = evaluator.evaluateReadiness(draft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_NAME_REQUIRED',
          severity: 'INCOMPLETE_DATA',
          section: 'IDENTITY',
        })
      );
    });

    it('7. generates INCOMPLETE_DATA when mobile number is not 10 digits', () => {
      const draft = { ...fullyPreparedDraft, mobileNumber: '98765' };
      const assessment = evaluator.evaluateReadiness(draft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_MOBILE_INVALID',
          severity: 'INCOMPLETE_DATA',
          section: 'IDENTITY',
        })
      );
    });

    it('8. generates INCOMPLETE_DATA when mobile belongs to an existing ACTIVE resident', () => {
      const activeResident: Resident = {
        id: 'res-0001',
        residentCode: 'RESID-000001',
        fullName: 'Vikram Singh',
        status: ResidentStatus.ACTIVE,
        mobileNumber: '9876543210',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [sampleFlat], [activeResident]);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_DUPLICATE_ACTIVE',
          severity: 'INCOMPLETE_DATA',
        })
      );
    });

    it('9. generates INCOMPLETE_DATA when mobile belongs to an ON_NOTICE resident', () => {
      const onNoticeResident: Resident = {
        id: 'res-0002',
        residentCode: 'RESID-000002',
        fullName: 'Vikram Singh',
        status: ResidentStatus.ON_NOTICE,
        mobileNumber: '9876543210',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };

      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [sampleFlat], [onNoticeResident]);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_DUPLICATE_ON_NOTICE',
          severity: 'INCOMPLETE_DATA',
        })
      );
    });

    it('10. generates REVIEW_WARNING (soft review) when mobile belongs to a CHECKED_OUT / ALUMNI resident', () => {
      const alumniResident: Resident = {
        id: 'res-0003',
        residentCode: 'RESID-000003',
        fullName: 'Vikram Singh',
        status: ResidentStatus.CHECKED_OUT,
        mobileNumber: '9876543210',
        createdAt: '2025-01-01',
        updatedAt: '2025-12-31',
      };

      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [sampleFlat], [alumniResident]);
      expect(assessment.category).toBe('REQUIRES_REVIEW');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_ALUMNI_REUSE',
          severity: 'REVIEW_WARNING',
        })
      );
    });

    it('11. generates INFO only when emergency contact or address is omitted, category remains READY_FOR_APPROVAL', () => {
      const minimalDraft: AdmissionDraft = {
        ...fullyPreparedDraft,
        emergencyContactName: undefined,
        emergencyContactPhone: undefined,
        emergencyContactRelationship: undefined,
        permanentAddress: undefined,
      };

      const assessment = evaluator.evaluateReadiness(minimalDraft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('READY_FOR_APPROVAL');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_EMERGENCY_CONTACT_MISSING',
          severity: 'INFO',
        })
      );
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_ADDRESS_MISSING',
          severity: 'INFO',
        })
      );
    });

    it('12. generates INCOMPLETE_DATA when required identity document fields are missing', () => {
      // 12a. Missing Document Type
      const draftMissingDocType: AdmissionDraft = {
        ...fullyPreparedDraft,
        idProofType: undefined,
        idProofNumber: undefined,
      };
      const assessmentA = evaluator.evaluateReadiness(draftMissingDocType, sampleReservation, [sampleFlat], []);
      expect(assessmentA.category).toBe('AWAITING_INFORMATION');
      expect(assessmentA.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_DOC_TYPE_REQUIRED',
          severity: 'INCOMPLETE_DATA',
        })
      );

      // 12b. Document Type = OTHER without customIdProofType
      const draftOtherMissingCustom: AdmissionDraft = {
        ...fullyPreparedDraft,
        idProofType: 'OTHER',
        customIdProofType: '',
        idProofNumber: 'STU-123',
      };
      const assessmentB = evaluator.evaluateReadiness(draftOtherMissingCustom, sampleReservation, [sampleFlat], []);
      expect(assessmentB.category).toBe('AWAITING_INFORMATION');
      expect(assessmentB.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_CUSTOM_DOC_TYPE_REQUIRED',
          severity: 'INCOMPLETE_DATA',
        })
      );

      // 12c. Document Type = AADHAAR with missing document number
      const draftAadhaarMissingNumber: AdmissionDraft = {
        ...fullyPreparedDraft,
        idProofType: 'AADHAAR',
        idProofNumber: '   ',
      };
      const assessmentC = evaluator.evaluateReadiness(draftAadhaarMissingNumber, sampleReservation, [sampleFlat], []);
      expect(assessmentC.category).toBe('AWAITING_INFORMATION');
      expect(assessmentC.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_DOC_NUMBER_REQUIRED',
          severity: 'INCOMPLETE_DATA',
        })
      );

      // 12d. Document Type = OTHER with valid customIdProofType but no document number -> Optional INFO -> READY_FOR_APPROVAL
      const draftOtherOptionalNumber: AdmissionDraft = {
        ...fullyPreparedDraft,
        idProofType: 'OTHER',
        customIdProofType: 'College Bonafide Certificate',
        idProofNumber: undefined,
      };
      const assessmentD = evaluator.evaluateReadiness(draftOtherOptionalNumber, sampleReservation, [sampleFlat], []);
      expect(assessmentD.category).toBe('READY_FOR_APPROVAL');
      expect(assessmentD.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_IDENTITY_DOC_NUMBER_OPTIONAL',
          severity: 'INFO',
        })
      );
    });
  });

  // ===========================================================================
  // COMMERCIAL SECTION TESTS (13 to 17)
  // ===========================================================================
  describe('Commercial Assessment', () => {
    it('13. assesses valid rent and deposit matching inventory defaults without warnings', () => {
      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [sampleFlat], []);
      expect(assessment.sectionAssessments.COMMERCIAL.isComplete).toBe(true);
      expect(assessment.observations.some((o) => o.section === 'COMMERCIAL' && o.severity === 'REVIEW_WARNING')).toBe(false);
    });

    it('14. generates INCOMPLETE_DATA when agreed rent is <= 0 or invalid', () => {
      const draft = { ...fullyPreparedDraft, agreedRent: 0 };
      const assessment = evaluator.evaluateReadiness(draft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_COMMERCIAL_RENT_INVALID',
          severity: 'INCOMPLETE_DATA',
        })
      );
    });

    it('15. generates INCOMPLETE_DATA when agreed deposit is negative or invalid', () => {
      const draft = { ...fullyPreparedDraft, agreedDeposit: -500 as any };
      const assessment = evaluator.evaluateReadiness(draft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_COMMERCIAL_DEPOSIT_INVALID',
          severity: 'INCOMPLETE_DATA',
        })
      );
    });

    it('16. generates REVIEW_WARNING when agreed rent differs from standard room rate', () => {
      const draft = { ...fullyPreparedDraft, agreedRent: 7000 }; // default is 8000
      const assessment = evaluator.evaluateReadiness(draft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('REQUIRES_REVIEW');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_COMMERCIAL_RENT_DEVIATION',
          severity: 'REVIEW_WARNING',
        })
      );
    });

    it('17. generates REVIEW_WARNING when agreed deposit differs from standard deposit', () => {
      const draft = { ...fullyPreparedDraft, agreedDeposit: 10000 }; // default is 6500
      const assessment = evaluator.evaluateReadiness(draft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('REQUIRES_REVIEW');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_COMMERCIAL_DEPOSIT_DEVIATION',
          severity: 'REVIEW_WARNING',
        })
      );
    });
  });

  // ===========================================================================
  // ACCOMMODATION SECTION TESTS (18 to 22)
  // ===========================================================================
  describe('Accommodation Assessment', () => {
    it('18. assesses valid selected vacant bed successfully', () => {
      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [sampleFlat], []);
      expect(assessment.sectionAssessments.ACCOMMODATION.isComplete).toBe(true);
    });

    it('19. generates INCOMPLETE_DATA when no bed is selected', () => {
      const draft = { ...fullyPreparedDraft, bedIds: [] };
      const assessment = evaluator.evaluateReadiness(draft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_ACCOM_BED_REQUIRED',
          severity: 'INCOMPLETE_DATA',
        })
      );
    });

    it('20. generates INCOMPLETE_DATA observation when selected bed is currently OCCUPIED', () => {
      const flatWithOccupiedBed: Flat = {
        ...sampleFlat,
        areas: [
          {
            ...sampleFlat.areas[0],
            beds: [
              { ...sampleFlat.areas[0].beds[0], status: BedStatus.OCCUPIED, residentName: 'Rahul Kumar' },
            ],
          },
        ],
      };

      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [flatWithOccupiedBed], []);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_ACCOM_BED_UNAVAILABLE',
          severity: 'INCOMPLETE_DATA',
        })
      );
    });

    it('21. generates REVIEW_WARNING when selected bed differs from stated accommodation preference', () => {
      const reservationWithDivergentPref: Reservation = {
        ...sampleReservation,
        accommodationPreference: '3rd Floor Premium Penthouse',
      };

      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, reservationWithDivergentPref, [sampleFlat], []);
      expect(assessment.category).toBe('REQUIRES_REVIEW');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_ACCOM_PREFERENCE_MISMATCH',
          severity: 'REVIEW_WARNING',
        })
      );
    });

    it('22. evaluates preference match without warning when accommodation matches preference tokens', () => {
      const reservationWithMatchingPref: Reservation = {
        ...sampleReservation,
        accommodationPreference: 'Master Bedroom 1st Floor',
      };

      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, reservationWithMatchingPref, [sampleFlat], []);
      expect(assessment.observations.some((o) => o.code === 'ADM_OBS_ACCOM_PREFERENCE_MISMATCH')).toBe(false);
    });
  });

  // ===========================================================================
  // RESERVATION / SOURCE SECTION TESTS (23 to 25)
  // ===========================================================================
  describe('Reservation Source Assessment', () => {
    it('23. assesses valid active reservation source without errors', () => {
      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [sampleFlat], []);
      expect(assessment.sectionAssessments.SOURCE.isComplete).toBe(true);
    });

    it('24. generates INCOMPLETE_DATA when reservation status is CONVERTED or CANCELLED', () => {
      const convertedReservation: Reservation = {
        ...sampleReservation,
        status: ReservationStatus.CONVERTED,
      };

      const assessment = evaluator.evaluateReadiness(fullyPreparedDraft, convertedReservation, [sampleFlat], []);
      expect(assessment.category).toBe('AWAITING_INFORMATION');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_SOURCE_RESERVATION_CONVERTED',
          severity: 'INCOMPLETE_DATA',
        })
      );
    });

    it('25. generates REVIEW_WARNING when proposed check-in date differs from reservation expected joining date', () => {
      const draftWithNewDate: AdmissionDraft = {
        ...fullyPreparedDraft,
        checkInDate: '2026-08-25', // reservation says 2026-08-20
      };

      const assessment = evaluator.evaluateReadiness(draftWithNewDate, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('REQUIRES_REVIEW');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_SOURCE_JOINING_DATE_REVISED',
          severity: 'REVIEW_WARNING',
        })
      );
    });
  });

  // ===========================================================================
  // WALK-IN ADMISSION TESTS (26 to 28)
  // ===========================================================================
  describe('Direct Walk-in Admission Assessment', () => {
    const walkInDraft: AdmissionDraft = {
      sourceType: 'WALK_IN',
      residentName: 'Anand Kumar',
      mobileNumber: '9811223344',
      idProofType: 'AADHAAR',
      idProofNumber: '1234-5678-9012',
      checkInDate: '2026-08-20',
      agreedRent: 8000,
      agreedDeposit: 6500,
      flatId: 'flat-101',
      bedIds: ['bed-101-a'],
    };

    it('26. assesses walk-in admission without reservation as READY_FOR_APPROVAL', () => {
      const assessment = evaluator.evaluateReadiness(walkInDraft, null, [sampleFlat], []);
      expect(assessment.category).toBe('READY_FOR_APPROVAL');
      expect(assessment.sectionAssessments.SOURCE.isComplete).toBe(true);
      expect(assessment.sectionAssessments.TOKEN.isComplete).toBe(true);
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_SOURCE_WALK_IN',
          severity: 'INFO',
        })
      );
    });

    it('27. does not fabricate or require a reservation object for walk-in', () => {
      const assessment = evaluator.evaluateReadiness(walkInDraft, undefined, [sampleFlat], []);
      expect(assessment.observations.some((o) => o.code.startsWith('ADM_OBS_SOURCE_RESERVATION'))).toBe(false);
    });

    it('28. does not apply reservation-only rules (e.g. token disposition requirement) to walk-in', () => {
      const assessment = evaluator.evaluateReadiness(walkInDraft, null, [sampleFlat], []);
      expect(assessment.observations.some((o) => o.code === 'ADM_OBS_TOKEN_DISPOSITION_REQUIRED')).toBe(false);
      expect(assessment.sectionAssessments.TOKEN.isComplete).toBe(true);
    });
  });

  // ===========================================================================
  // TOKEN ASSESSMENT TESTS (29 to 31)
  // ===========================================================================
  describe('Token Disposition Assessment', () => {
    it('29. generates DECISION_REQUIRED when reservation token > 0 but disposition is unselected', () => {
      const draft = { ...fullyPreparedDraft, tokenDisposition: undefined };
      const assessment = evaluator.evaluateReadiness(draft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('PENDING_OPERATOR_DECISION');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_TOKEN_DISPOSITION_REQUIRED',
          severity: 'DECISION_REQUIRED',
        })
      );
    });

    it('30. generates INFO when token disposition is set to LEAVE_PENDING', () => {
      const draft = { ...fullyPreparedDraft, tokenDisposition: TokenDisposition.LEAVE_PENDING };
      const assessment = evaluator.evaluateReadiness(draft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('READY_FOR_APPROVAL');
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_TOKEN_HELD_PENDING',
          severity: 'INFO',
        })
      );
    });

    it('31. walk-in admission has no token requirement and produces INFO observation', () => {
      const walkInDraft: AdmissionDraft = {
        sourceType: 'WALK_IN',
        residentName: 'Anand Kumar',
        mobileNumber: '9811223344',
        idProofType: 'AADHAAR',
        idProofNumber: '1234-5678-9012',
        checkInDate: '2026-08-20',
        agreedRent: 8000,
        agreedDeposit: 6500,
        flatId: 'flat-101',
        bedIds: ['bed-101-a'],
      };
      const assessment = evaluator.evaluateReadiness(walkInDraft, null, [sampleFlat], []);
      expect(assessment.observations).toContainEqual(
        expect.objectContaining({
          code: 'ADM_OBS_TOKEN_NOT_APPLICABLE',
          severity: 'INFO',
        })
      );
    });
  });

  // ===========================================================================
  // OBSERVATION PRESERVATION & COEXISTENCE (32 to 33)
  // ===========================================================================
  describe('Observation Preservation & Aggregation Integrity', () => {
    it('32. preserves all coexisting observations across different severities', () => {
      // Draft with incomplete mobile (INCOMPLETE_DATA) + rent deviation (REVIEW_WARNING) + missing emergency contact (INFO)
      const complexDraft: AdmissionDraft = {
        ...fullyPreparedDraft,
        mobileNumber: '123', // INCOMPLETE_DATA
        agreedRent: 7000, // REVIEW_WARNING
        emergencyContactName: '', // INFO
      };

      const assessment = evaluator.evaluateReadiness(complexDraft, sampleReservation, [sampleFlat], []);

      // Top category must be AWAITING_INFORMATION because of INCOMPLETE_DATA
      expect(assessment.category).toBe('AWAITING_INFORMATION');

      // But all individual observations MUST be preserved
      const severities = assessment.observations.map((o) => o.severity);
      expect(severities).toContain('INCOMPLETE_DATA');
      expect(severities).toContain('REVIEW_WARNING');
      expect(severities).toContain('INFO');
    });

    it('33. category aggregation prioritizes INCOMPLETE_DATA over DECISION_REQUIRED and REVIEW_WARNING', () => {
      const mixedDraft: AdmissionDraft = {
        ...fullyPreparedDraft,
        residentName: '', // INCOMPLETE_DATA
        tokenDisposition: undefined, // DECISION_REQUIRED
        agreedRent: 7000, // REVIEW_WARNING
      };

      const assessment = evaluator.evaluateReadiness(mixedDraft, sampleReservation, [sampleFlat], []);
      expect(assessment.category).toBe('AWAITING_INFORMATION');

      expect(assessment.observations.some((o) => o.code === 'ADM_OBS_IDENTITY_NAME_REQUIRED')).toBe(true);
      expect(assessment.observations.some((o) => o.code === 'ADM_OBS_TOKEN_DISPOSITION_REQUIRED')).toBe(true);
      expect(assessment.observations.some((o) => o.code === 'ADM_OBS_COMMERCIAL_RENT_DEVIATION')).toBe(true);
    });
  });

  // ===========================================================================
  // READINESS / VALIDATION SEPARATION (34 to 36)
  // ===========================================================================
  describe('Architectural Boundary & Invariant Protection', () => {
    it('34. readiness evaluator is completely pure and never mutates repository input state', () => {
      const flatSnapshotBefore = JSON.stringify(sampleFlat);
      const resSnapshotBefore = JSON.stringify(sampleReservation);

      evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [sampleFlat], []);

      expect(JSON.stringify(sampleFlat)).toBe(flatSnapshotBefore);
      expect(JSON.stringify(sampleReservation)).toBe(resSnapshotBefore);
    });

    it('35. readiness evaluator never throws exceptions for invalid draft data', () => {
      const invalidDraft: AdmissionDraft = {
        residentName: '',
        mobileNumber: '',
        checkInDate: 'invalid-date',
        agreedRent: -100 as any,
        agreedDeposit: -200 as any,
      };

      expect(() => evaluator.evaluateReadiness(invalidDraft, null, [], [])).not.toThrow();
    });

    it('36. readiness assessment contains no transaction-authority fields (canCommit, canAttemptCommit, isValid)', () => {
      const assessment: any = evaluator.evaluateReadiness(fullyPreparedDraft, sampleReservation, [sampleFlat], []);

      expect(assessment.canCommit).toBeUndefined();
      expect(assessment.canAttemptCommit).toBeUndefined();
      expect(assessment.isValid).toBeUndefined();
      expect(assessment.isTransactionValid).toBeUndefined();
      expect(assessment.category).toBe('READY_FOR_APPROVAL');
    });
  });
});
