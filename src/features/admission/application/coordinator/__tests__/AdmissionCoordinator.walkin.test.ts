import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionCoordinator } from '../AdmissionCoordinator';
import { InMemoryReservationRepository } from '../../../../reservation/infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { BedStatus } from '../../../../accommodation/domain/valueObjects/BedStatus';
import { ResidentStatus } from '../../../../resident/domain/valueObjects/ResidentStatus';
import type { AdmissionDraft } from '../../models/AdmissionDraft';
import type { Flat } from '../../../../accommodation/domain/entities/Flat';
import type { Resident } from '../../../../resident/domain/entities/Resident';
import { financeStorage } from '../../../../finance/storage/financeStorage';

describe('AdmissionCoordinator Walk-in Admission Suite (Sprint RA-7)', () => {
  let reservationRepo: InMemoryReservationRepository;
  let residentRepo: InMemoryResidentRepository;
  let stayRepo: InMemoryStayRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let coordinator: AdmissionCoordinator;

  const todayStr = new Date().toISOString().split('T')[0];

  const sampleFlat: Flat = {
    id: 'flat-201',
    name: '201',
    floor: '2',
    description: 'Double Sharing 2nd Floor',
    areas: [
      {
        id: 'area-201-bedroom',
        name: 'Bedroom',
        defaultRent: 9000,
        defaultDeposit: 7500,
        beds: [
          { id: 'bed-201-a', name: '201-A', status: BedStatus.VACANT, defaultRent: 9000, defaultDeposit: 7500 },
          { id: 'bed-201-b', name: '201-B', status: BedStatus.VACANT, defaultRent: 9000, defaultDeposit: 7500 },
        ],
      },
    ],
  };

  const validWalkInDraft: AdmissionDraft = {
    sourceType: 'WALK_IN',
    residentName: 'Anand Kumar',
    mobileNumber: '9876500001',
    emergencyContactName: 'Ramesh Kumar',
    emergencyContactRelationship: 'Father',
    emergencyContactPhone: '9876500002',
    idProofType: 'Aadhaar',
    idProofNumber: '9999-8888-7777',
    checkInDate: todayStr,
    agreedRent: 9000,
    agreedDeposit: 7500,
    flatId: 'flat-201',
    bedIds: ['bed-201-a'],
    notes: 'Walk-in arrival on Monday morning',
  };

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);

    reservationRepo = new InMemoryReservationRepository([]);
    residentRepo = new InMemoryResidentRepository([]);
    stayRepo = new InMemoryStayRepository([]);
    accommodationRepo = new InMemoryAccommodationRepository([sampleFlat]);
    coordinator = new AdmissionCoordinator(reservationRepo, residentRepo, stayRepo, accommodationRepo);
  });

  describe('evaluateReadiness for Walk-in Admission', () => {
    it('returns isReadyToConfirm: true when all walk-in criteria are satisfied without reservation', () => {
      const readiness = coordinator.evaluateReadiness(validWalkInDraft, null, 'WALK_IN');
      expect(readiness.isReservationValid).toBe(true); // Direct walk-in is valid
      expect(readiness.isResidentDetailsValid).toBe(true);
      expect(readiness.isCommercialTermsValid).toBe(true);
      expect(readiness.isAccommodationValid).toBe(true);
      expect(readiness.isTokenDecisionValid).toBe(true); // 0 token = N/A
      expect(readiness.isReadyToConfirm).toBe(true);
      expect(readiness.validationMessages).toHaveLength(0);
    });

    it('rejects readiness if resident full name is missing', () => {
      const invalidDraft: AdmissionDraft = {
        ...validWalkInDraft,
        residentName: '',
      };
      const readiness = coordinator.evaluateReadiness(invalidDraft, null, 'WALK_IN');
      expect(readiness.isResidentDetailsValid).toBe(false);
      expect(readiness.isReadyToConfirm).toBe(false);
      expect(readiness.validationMessages).toContain('Resident full name is required.');
    });

    it('rejects readiness if mobile number is not 10 digits', () => {
      const invalidDraft: AdmissionDraft = {
        ...validWalkInDraft,
        mobileNumber: '12345',
      };
      const readiness = coordinator.evaluateReadiness(invalidDraft, null, 'WALK_IN');
      expect(readiness.isResidentDetailsValid).toBe(false);
      expect(readiness.isReadyToConfirm).toBe(false);
      expect(readiness.validationMessages).toContain('Valid 10-digit mobile number is required.');
    });

    it('rejects readiness if agreed rent is 0 or negative', () => {
      const invalidDraft: AdmissionDraft = {
        ...validWalkInDraft,
        agreedRent: 0,
      };
      const readiness = coordinator.evaluateReadiness(invalidDraft, null, 'WALK_IN');
      expect(readiness.isCommercialTermsValid).toBe(false);
      expect(readiness.isReadyToConfirm).toBe(false);
      expect(readiness.validationMessages).toContain('Agreed monthly rent must be greater than 0.');
    });

    it('rejects readiness if selected bed is already OCCUPIED', () => {
      const occupiedFlat: Flat = {
        ...sampleFlat,
        areas: [
          {
            ...sampleFlat.areas[0],
            beds: [
              { ...sampleFlat.areas[0].beds[0], status: BedStatus.OCCUPIED },
              { ...sampleFlat.areas[0].beds[1] },
            ],
          },
        ],
      };
      accommodationRepo.save(occupiedFlat);

      const readiness = coordinator.evaluateReadiness(validWalkInDraft, null, 'WALK_IN');
      expect(readiness.isAccommodationValid).toBe(false);
      expect(readiness.isReadyToConfirm).toBe(false);
      expect(readiness.validationMessages).toContain('Bed 201-A is already OCCUPIED.');
    });
  });

  describe('Duplicate Mobile Governance Rules (Mandatory Policy)', () => {
    it('BLOCKS walk-in admission if an ACTIVE resident exists with the same mobile', () => {
      const existingActiveResident: Resident = {
        id: 'res-active-1',
        residentCode: 'RESID-000099',
        fullName: 'Existing Resident',
        status: ResidentStatus.ACTIVE,
        mobileNumber: '9876500001',
        createdAt: todayStr,
        updatedAt: todayStr,
      };
      residentRepo.save(existingActiveResident);

      const dupCheck = coordinator.checkDuplicateResidentMobile('9876500001');
      expect(dupCheck.status).toBe('ACTIVE_BLOCK');
      expect(dupCheck.message).toContain('already has an active stay');

      const readiness = coordinator.evaluateReadiness(validWalkInDraft, null, 'WALK_IN');
      expect(readiness.isResidentDetailsValid).toBe(false);
      expect(readiness.isReadyToConfirm).toBe(false);
      expect(readiness.validationMessages).toContain(dupCheck.message!);
    });

    it('BLOCKS walk-in admission if an ON_NOTICE resident exists with an ongoing stay', () => {
      const existingNoticeResident: Resident = {
        id: 'res-notice-1',
        residentCode: 'RESID-000098',
        fullName: 'Notice Resident',
        status: ResidentStatus.ON_NOTICE,
        mobileNumber: '9876500001',
        createdAt: todayStr,
        updatedAt: todayStr,
      };
      residentRepo.save(existingNoticeResident);

      const dupCheck = coordinator.checkDuplicateResidentMobile('9876500001');
      expect(dupCheck.status).toBe('ON_NOTICE_BLOCK');
      expect(dupCheck.message).toContain('has an active stay on notice');

      const readiness = coordinator.evaluateReadiness(validWalkInDraft, null, 'WALK_IN');
      expect(readiness.isResidentDetailsValid).toBe(false);
      expect(readiness.isReadyToConfirm).toBe(false);
    });

    it('REUSES existing Resident record when prospect is CHECKED_OUT or ALUMNI', () => {
      const checkedOutResident: Resident = {
        id: 'res-old-1',
        residentCode: 'RESID-000042',
        fullName: 'Anand Kumar Old',
        status: ResidentStatus.CHECKED_OUT,
        mobileNumber: '9876500001',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-06-01T00:00:00.000Z',
      };
      residentRepo.save(checkedOutResident);

      const dupCheck = coordinator.checkDuplicateResidentMobile('9876500001');
      expect(dupCheck.status).toBe('REUSE_ALLOW');

      const readiness = coordinator.evaluateReadiness(validWalkInDraft, null, 'WALK_IN');
      expect(readiness.isReadyToConfirm).toBe(true);

      const result = coordinator.confirmWalkInAdmission(validWalkInDraft);
      expect(result.success).toBe(true);
      expect(result.residentId).toBe('res-old-1');
      expect(result.residentCode).toBe('RESID-000042');

      // Verify resident status transitioned back to ACTIVE
      const updatedResident = residentRepo.getByIdSync('res-old-1');
      expect(updatedResident?.status).toBe(ResidentStatus.ACTIVE);
      expect(updatedResident?.fullName).toBe('Anand Kumar');

      // Verify zero duplicate resident entities created (only 1 resident in repo)
      expect(residentRepo.getAllSync()).toHaveLength(1);
    });
  });

  describe('Happy Path Walk-in Admission Execution', () => {
    it('creates brand new Resident, Stay, updates Bed status to OCCUPIED, and records WALK_IN business event', () => {
      const result = coordinator.confirmWalkInAdmission(validWalkInDraft);

      expect(result.success).toBe(true);
      expect(result.residentCode).toBe('RESID-000001');
      expect(result.stayId).toBe('stay-000001');
      expect(result.reservationNumber).toBe('N/A (Walk-in)');
      expect(result.appliedTokenDisposition).toBe('None (Walk-in)');
      expect(result.tokenAmount).toBe(0);

      // Verify Resident saved
      expect(result.residentId).toBeDefined();
      const createdResident = residentRepo.getByIdSync(result.residentId!);
      expect(createdResident).toBeDefined();
      expect(createdResident?.fullName).toBe('Anand Kumar');
      expect(createdResident?.mobileNumber).toBe('9876500001');
      expect(createdResident?.status).toBe(ResidentStatus.ACTIVE);

      // Verify Stay saved with WALK_IN metadata
      const createdStay = stayRepo.findByIdSync('stay-000001');
      expect(createdStay).toBeDefined();
      expect(createdStay?.residentId).toBe(result.residentId);
      expect(createdStay?.businessEvents).toHaveLength(1);
      expect(createdStay?.businessEvents[0].eventType).toBe('ADMISSION');
      expect(createdStay?.businessEvents[0].metadata).toEqual({ admissionSource: 'WALK_IN' });

      // Verify Bed status updated to OCCUPIED
      const updatedFlat = accommodationRepo.findById('flat-201');
      const allocatedBed = updatedFlat?.areas.flatMap((a) => a.beds).find((b) => b.id === 'bed-201-a');
      expect(allocatedBed?.status).toBe(BedStatus.OCCUPIED);

      // Verify Reservation repo was never modified
      expect(reservationRepo.findAllSync()).toHaveLength(0);
    });
  });

  describe('Compensating Rollback Strategy Verification', () => {
    it('rolls back all changes completely if an exception occurs mid-transaction', () => {
      // Create invalid draft that fails during stay creation (e.g. invalid date or flat)
      const failingDraft: AdmissionDraft = {
        ...validWalkInDraft,
        flatId: 'flat-non-existent',
      };

      expect(() => coordinator.confirmWalkInAdmission(failingDraft)).toThrow();

      // Verify zero orphan resident or stay entities
      expect(residentRepo.getAllSync()).toHaveLength(0);
      expect(stayRepo.getAllSync()).toHaveLength(0);

      // Verify Bed status remains VACANT
      const flat = accommodationRepo.findById('flat-201');
      const bed = flat?.areas.flatMap((a) => a.beds).find((b) => b.id === 'bed-201-a');
      expect(bed?.status).toBe(BedStatus.VACANT);
    });
  });
});
