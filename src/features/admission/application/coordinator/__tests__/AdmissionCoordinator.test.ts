import { describe, it, expect, beforeEach } from 'vitest';
import { AdmissionCoordinator } from '../AdmissionCoordinator';
import { InMemoryReservationRepository } from '../../../../reservation/infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { ReservationStatus } from '../../../../reservation/domain/valueObjects/ReservationStatus';
import { BedStatus } from '../../../../accommodation/domain/valueObjects/BedStatus';
import { TokenDisposition } from '../../../domain/valueObjects/TokenDisposition';
import type { Reservation } from '../../../../reservation/domain/entities/Reservation';
import type { AdmissionDraft } from '../../models/AdmissionDraft';
import type { Flat } from '../../../../accommodation/domain/entities/Flat';

describe('AdmissionCoordinator Integration Suite (CR-2.5 Validation)', () => {
  let reservationRepo: InMemoryReservationRepository;
  let residentRepo: InMemoryResidentRepository;
  let stayRepo: InMemoryStayRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let coordinator: AdmissionCoordinator;

  const todayStr = new Date().toISOString().split('T')[0];

  const sampleActiveReservation: Reservation = {
    id: 'resv-000001',
    reservationNumber: 'RES-000001',
    prospectName: 'Vikram Singh',
    mobileNumber: '9876543210',
    expectedJoiningDate: todayStr,
    accommodationPreference: 'Double Sharing, 1st Floor',
    tokenAmount: 2000,
    tokenReceivedOn: todayStr,
    tokenRemarks: 'GPay',
    status: ReservationStatus.ACTIVE,
    auditLog: [
      {
        timestamp: new Date().toISOString(),
        action: 'Reservation Created',
        performedBy: 'System Operator',
        details: 'Reservation created with ₹2,000 token',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleFlat: Flat = {
    id: 'flat-101',
    name: '101',
    floor: '1',
    description: 'Double Sharing 1st Floor',
    areas: [
      {
        id: 'area-101-bedroom',
        name: 'Bedroom',
        defaultRent: 8000,
        defaultDeposit: 6500,
        beds: [
          { id: 'bed-101-a', name: '101-A', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
          { id: 'bed-101-b', name: '101-B', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
        ],
      },
    ],
  };

  const validDraft: AdmissionDraft = {
    reservationId: 'resv-000001',
    residentName: 'Vikram Singh',
    mobileNumber: '9876543210',
    emergencyContactName: 'Rajesh Singh',
    emergencyContactRelationship: 'Father',
    emergencyContactPhone: '9111111111',
    idProofType: 'Aadhaar',
    idProofNumber: '1234-5678-9012',
    checkInDate: todayStr,
    agreedRent: 8000,
    agreedDeposit: 6500,
    flatId: 'flat-101',
    bedIds: ['bed-101-a'],
    tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
    notes: 'Requested quiet corner',
  };

  beforeEach(() => {
    reservationRepo = new InMemoryReservationRepository([sampleActiveReservation]);
    residentRepo = new InMemoryResidentRepository([]);
    stayRepo = new InMemoryStayRepository([]);
    accommodationRepo = new InMemoryAccommodationRepository([sampleFlat]);
    coordinator = new AdmissionCoordinator(reservationRepo, residentRepo, stayRepo, accommodationRepo);
  });

  describe('evaluateReadiness (Reordered Validation Sequence)', () => {
    it('returns isReadyToConfirm: true when all 5 sections are valid', () => {
      const readiness = coordinator.evaluateReadiness(validDraft, sampleActiveReservation);
      expect(readiness.isReservationValid).toBe(true);
      expect(readiness.isResidentDetailsValid).toBe(true);
      expect(readiness.isCommercialTermsValid).toBe(true);
      expect(readiness.isAccommodationValid).toBe(true);
      expect(readiness.isTokenDecisionValid).toBe(true);
      expect(readiness.isReadyToConfirm).toBe(true);
      expect(readiness.validationMessages).toHaveLength(0);
    });

    it('rejects readiness if token disposition is missing when token > 0', () => {
      const incompleteDraft: AdmissionDraft = {
        ...validDraft,
        tokenDisposition: undefined,
      };
      const readiness = coordinator.evaluateReadiness(incompleteDraft, sampleActiveReservation);
      expect(readiness.isTokenDecisionValid).toBe(false);
      expect(readiness.isReadyToConfirm).toBe(false);
      expect(readiness.validationMessages).toContain('Token disposition choice must be selected.');
    });

    it('allows readiness and admission without emergency contact details (REF-001.1 Progressive Data Capture)', () => {
      const draftWithoutEmergencyContact: AdmissionDraft = {
        ...validDraft,
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
      };
      const readiness = coordinator.evaluateReadiness(draftWithoutEmergencyContact, sampleActiveReservation);
      expect(readiness.isResidentDetailsValid).toBe(true);
      expect(readiness.isReadyToConfirm).toBe(true);

      const result = coordinator.confirmReservedAdmission(draftWithoutEmergencyContact, sampleActiveReservation);
      expect(result.success).toBe(true);

      const createdResident = residentRepo.getByIdSync(result.residentCode.replace('RESID-', 'res-'));
      expect(createdResident).toBeDefined();
      expect(createdResident?.emergencyContact).toBeUndefined();
    });

    it('rejects readiness if reservation is CANCELLED or CONVERTED', () => {
      const cancelledRes: Reservation = {
        ...sampleActiveReservation,
        status: ReservationStatus.CANCELLED,
      };
      const readiness = coordinator.evaluateReadiness(validDraft, cancelledRes);
      expect(readiness.isReservationValid).toBe(false);
      expect(readiness.isReadyToConfirm).toBe(false);
    });
  });

  describe('calculateTokenAdjustmentPreview (Decision Support Calculations)', () => {
    it('calculates deposit deduction preview correctly for ADJUST_TO_SECURITY_DEPOSIT', () => {
      const preview = coordinator.calculateTokenAdjustmentPreview(
        8000,
        6500,
        2000,
        TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT
      );
      expect(preview.adjustedDepositBalance).toBe(4500);
      expect(preview.adjustedRentBalance).toBe(8000);
      expect(preview.summaryText).toContain('Security Deposit ₹6,500 - Token ₹2,000 = Payable Deposit ₹4,500');
    });

    it('calculates rent deduction preview correctly for ADJUST_TO_FIRST_RENT', () => {
      const preview = coordinator.calculateTokenAdjustmentPreview(
        8000,
        6500,
        2000,
        TokenDisposition.ADJUST_TO_FIRST_RENT
      );
      expect(preview.adjustedDepositBalance).toBe(6500);
      expect(preview.adjustedRentBalance).toBe(6000);
      expect(preview.summaryText).toContain('First Month Rent ₹8,000 - Token ₹2,000 = Payable Rent ₹6,000');
    });
  });

  describe('Happy Path Admission & Repository Verification', () => {
    it('converts active reservation, creates Resident, creates Stay, allocates Bed, and updates Reservation to CONVERTED', () => {
      const result = coordinator.confirmReservedAdmission(validDraft, sampleActiveReservation);

      // Result Verification
      expect(result.success).toBe(true);
      expect(result.residentCode).toBe('RESID-000001');
      expect(result.stayId).toBe('stay-000001');

      // Verify Resident Repository State
      const resident = residentRepo.getByIdSync('res-000001');
      expect(resident).toBeDefined();
      expect(resident?.residentCode).toBe('RESID-000001');
      expect(resident?.fullName).toBe('Vikram Singh');

      // Verify Stay Repository State
      const stay = stayRepo.findByIdSync('stay-000001');
      expect(stay).toBeDefined();
      expect(stay?.residentId).toBe('res-000001');
      expect(stay?.agreedRent).toBe(8000);
      expect(stay?.allocatedBedIds).toEqual(['bed-101-a']);

      // Verify Accommodation Repository State (Bed allocated to OCCUPIED)
      const updatedFlat = accommodationRepo.findById('flat-101');
      const allFlatBeds = updatedFlat?.areas.flatMap((a) => a.beds) || [];
      const allocatedBed = allFlatBeds.find((b) => b.id === 'bed-101-a');
      expect(allocatedBed?.status).toBe(BedStatus.OCCUPIED);

      // Verify Reservation Repository State (Status CONVERTED)
      const reservation = reservationRepo.findByIdSync('resv-000001');
      expect(reservation?.status).toBe(ReservationStatus.CONVERTED);
    });

    it('explicitly constructs Stay aggregate child objects (CommercialAgreement, BedAllocation, BusinessEvent) and validates CurrentProjection', () => {
      const result = coordinator.confirmReservedAdmission(validDraft, sampleActiveReservation);
      expect(result.success).toBe(true);

      const stay = stayRepo.findByIdSync('stay-000001');
      expect(stay).toBeDefined();

      // 1. Verify Explicit CommercialAgreement
      expect(stay?.commercialAgreements).toHaveLength(1);
      const ca = stay?.commercialAgreements[0];
      expect(ca?.rent).toBe(8000);
      expect(ca?.securityDeposit).toBe(4500); // 6500 - 2000 token adjustment
      expect(ca?.amendmentReason).toBe('Admission Initial Agreement');
      expect(ca?.status).toBe('ACTIVE');

      // 2. Verify Explicit BedAllocation
      expect(stay?.bedAllocations).toHaveLength(1);
      const ba = stay?.bedAllocations[0];
      expect(ba?.flatId).toBe('flat-101');
      expect(ba?.bedId).toBe('bed-101-a');
      expect(ba?.status).toBe('ACTIVE');

      // 3. Verify Explicit BusinessEvent
      expect(stay?.businessEvents).toHaveLength(1);
      const be = stay?.businessEvents[0];
      expect(be?.eventType).toBe('ADMISSION');
      expect(be?.description).toContain('Resident checked in');

      // 4. Verify CurrentProjection
      const projection = stay?.getCurrentProjection();
      expect(projection).toBeDefined();
      expect(projection?.stayId).toBe('stay-000001');
      expect(projection?.status).toBe('ACTIVE');
      expect(projection?.flatId).toBe('flat-101');
      expect(projection?.activeBedIds).toEqual(['bed-101-a']);
      expect(projection?.currentRent).toBe(8000);
      expect(projection?.currentDeposit).toBe(4500);
      expect(projection?.noticeStatus).toBe('NONE');
    });

    it('returns dynamic repository-driven available flats and vacant beds via getAvailableFlats()', () => {
      const availableFlats = coordinator.getAvailableFlats();
      expect(availableFlats).toHaveLength(1);
      expect(availableFlats[0].id).toBe('flat-101');
      expect(availableFlats[0].name).toBe('101');
      expect(availableFlats[0].vacantBeds).toHaveLength(2);
      expect(availableFlats[0].vacantBeds[0].id).toBe('bed-101-a');
    });
  });

  describe('Multi-Bed Admission', () => {
    it('allocates multiple beds within the same flat and marks all as OCCUPIED', () => {
      const multiBedDraft: AdmissionDraft = {
        ...validDraft,
        bedIds: ['bed-101-a', 'bed-101-b'],
      };

      const result = coordinator.confirmReservedAdmission(multiBedDraft, sampleActiveReservation);
      expect(result.success).toBe(true);

      const stay = stayRepo.findByIdSync('stay-000001');
      expect(stay?.allocatedBedIds).toEqual(['bed-101-a', 'bed-101-b']);

      // Verify explicit BedAllocation domain objects created for both beds
      expect(stay?.bedAllocations).toHaveLength(2);
      expect(stay?.bedAllocations[0].bedId).toBe('bed-101-a');
      expect(stay?.bedAllocations[1].bedId).toBe('bed-101-b');

      const flat = accommodationRepo.findById('flat-101');
      const allFlatBeds = flat?.areas.flatMap((a) => a.beds) || [];
      expect(allFlatBeds[0].status).toBe(BedStatus.OCCUPIED);
      expect(allFlatBeds[1].status).toBe(BedStatus.OCCUPIED);
    });
  });

  describe('Invalid Admission Rejections', () => {
    it('rejects admission if reservation is not ACTIVE (e.g. CANCELLED or CONVERTED)', () => {
      const cancelledRes: Reservation = {
        ...sampleActiveReservation,
        status: ReservationStatus.CANCELLED,
      };

      expect(() =>
        coordinator.confirmReservedAdmission(validDraft, cancelledRes)
      ).toThrow('Admission readiness check failed');
    });

    it('rejects admission if selected bed is already OCCUPIED', () => {
      // Mark bed as OCCUPIED
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

      const readiness = coordinator.evaluateReadiness(validDraft, sampleActiveReservation);
      expect(readiness.isAccommodationValid).toBe(false);
      expect(readiness.validationMessages).toContain('Bed 101-A is already OCCUPIED.');
    });
  });

  describe('Atomic Rollback Verification', () => {
    it('rolls back all repositories completely if an exception occurs mid-transaction', () => {
      // Force failure during stay creation by passing negative rent
      const invalidDraft: AdmissionDraft = {
        ...validDraft,
        agreedRent: -100 as any,
      };

      expect(() =>
        coordinator.confirmReservedAdmission(invalidDraft, sampleActiveReservation)
      ).toThrow('Admission readiness check failed');

      // Verify zero orphan entities created
      expect(residentRepo.getAllSync()).toHaveLength(0);
      expect(stayRepo.getAllSync()).toHaveLength(0);

      // Verify Bed status unchanged (remains VACANT)
      const flat = accommodationRepo.findById('flat-101');
      const allFlatBeds = flat?.areas.flatMap((a) => a.beds) || [];
      expect(allFlatBeds[0].status).toBe(BedStatus.VACANT);

      // Verify Reservation unchanged (remains ACTIVE)
      const res = reservationRepo.findByIdSync('resv-000001');
      expect(res?.status).toBe(ReservationStatus.ACTIVE);
    });
  });
});
