import { describe, it, expect, beforeEach } from 'vitest';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { canEditReservation, canCancelReservation } from '../domain/rules/reservationRules';
import { AdmissionCoordinator } from '../../admission/application/coordinator/AdmissionCoordinator';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import type { Reservation } from '../domain/entities/Reservation';
import type { AdmissionDraft } from '../../admission/application/models/AdmissionDraft';
import { BedStatus } from '../../accommodation/domain/valueObjects/BedStatus';

describe('REF-003 Reservation Workspace UX Consistency Verification Suite', () => {
  let reservationRepo: InMemoryReservationRepository;
  let residentRepo: InMemoryResidentRepository;
  let stayRepo: InMemoryStayRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let admissionCoordinator: AdmissionCoordinator;

  const todayStr = new Date().toISOString().split('T')[0];

  const createDummyReservation = (id: string, resNumber: string, status: ReservationStatus): Reservation => ({
    id,
    reservationNumber: resNumber,
    prospectName: 'Test Prospect',
    mobileNumber: '9876543210',
    expectedJoiningDate: todayStr,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    auditLog: [
      {
        timestamp: new Date().toISOString(),
        action: 'Reservation Created',
        details: 'Created for testing',
      },
    ],
  });

  beforeEach(() => {
    reservationRepo = new InMemoryReservationRepository([]);
    residentRepo = new InMemoryResidentRepository([]);
    stayRepo = new InMemoryStayRepository([]);
    accommodationRepo = new InMemoryAccommodationRepository([
      {
        id: 'flat-101',
        name: '101',
        floor: '1',
        areas: [
          {
            id: 'area-1',
            name: 'Bedroom',
            defaultRent: 8000,
            defaultDeposit: 6000,
            beds: [{ id: 'bed-1', name: '101-A', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6000 }],
          },
        ],
      },
    ]);

    admissionCoordinator = new AdmissionCoordinator(reservationRepo, residentRepo, stayRepo, accommodationRepo);
  });

  describe('1. Convert to Admission Availability', () => {
    it('allows Convert to Admission for ACTIVE reservations', () => {
      const activeRes = createDummyReservation('res-1', 'RES-000001', ReservationStatus.ACTIVE);
      const draft: AdmissionDraft = {
        reservationId: activeRes.id,
        residentName: activeRes.prospectName,
        mobileNumber: activeRes.mobileNumber,
        emergencyContactName: 'Father',
        emergencyContactRelationship: 'Father',
        emergencyContactPhone: '9111111111',
        idProofType: 'Aadhaar',
        idProofNumber: '1234-5678-9012',
        checkInDate: todayStr,
        agreedRent: 8000,
        agreedDeposit: 6000,
        flatId: 'flat-101',
        bedIds: ['bed-1'],
      };

      const readiness = admissionCoordinator.evaluateReadiness(draft, activeRes);
      expect(readiness.isReadyToConfirm).toBe(true);
    });

    it('allows Convert to Admission for FOLLOW_UP_REQUIRED reservations (REF-003 Requirement 1)', () => {
      const followUpRes = createDummyReservation('res-2', 'RES-000002', ReservationStatus.FOLLOW_UP_REQUIRED);
      const draft: AdmissionDraft = {
        reservationId: followUpRes.id,
        residentName: followUpRes.prospectName,
        mobileNumber: followUpRes.mobileNumber,
        emergencyContactName: 'Father',
        emergencyContactRelationship: 'Father',
        emergencyContactPhone: '9111111111',
        idProofType: 'Aadhaar',
        idProofNumber: '1234-5678-9012',
        checkInDate: todayStr,
        agreedRent: 8000,
        agreedDeposit: 6000,
        flatId: 'flat-101',
        bedIds: ['bed-1'],
      };

      const readiness = admissionCoordinator.evaluateReadiness(draft, followUpRes);
      expect(readiness.isReadyToConfirm).toBe(true);
    });

    it('disallows Convert to Admission for CONVERTED reservations', () => {
      const convertedRes = createDummyReservation('res-3', 'RES-000003', ReservationStatus.CONVERTED);
      const draft: AdmissionDraft = {
        reservationId: convertedRes.id,
        residentName: convertedRes.prospectName,
        mobileNumber: convertedRes.mobileNumber,
        emergencyContactName: 'Father',
        emergencyContactRelationship: 'Father',
        emergencyContactPhone: '9111111111',
        checkInDate: todayStr,
        agreedRent: 8000,
        agreedDeposit: 6000,
        flatId: 'flat-101',
        bedIds: ['bed-1'],
      };

      const readiness = admissionCoordinator.evaluateReadiness(draft, convertedRes);
      expect(readiness.isReadyToConfirm).toBe(false);
      expect(readiness.validationMessages.some((msg) => msg.includes('must be ACTIVE or FOLLOW_UP_REQUIRED'))).toBe(true);
    });

    it('disallows Convert to Admission for CANCELLED reservations', () => {
      const cancelledRes = createDummyReservation('res-4', 'RES-000004', ReservationStatus.CANCELLED);
      const draft: AdmissionDraft = {
        reservationId: cancelledRes.id,
        residentName: cancelledRes.prospectName,
        mobileNumber: cancelledRes.mobileNumber,
        emergencyContactName: 'Father',
        emergencyContactRelationship: 'Father',
        emergencyContactPhone: '9111111111',
        checkInDate: todayStr,
        agreedRent: 8000,
        agreedDeposit: 6000,
        flatId: 'flat-101',
        bedIds: ['bed-1'],
      };

      const readiness = admissionCoordinator.evaluateReadiness(draft, cancelledRes);
      expect(readiness.isReadyToConfirm).toBe(false);
      expect(readiness.validationMessages.some((msg) => msg.includes('must be ACTIVE or FOLLOW_UP_REQUIRED'))).toBe(true);
    });
  });

  describe('2. Edit Action Consistency & Read-Only Guards', () => {
    it('returns allowed: true for ACTIVE reservations edit guard', () => {
      expect(canEditReservation(ReservationStatus.ACTIVE).allowed).toBe(true);
    });

    it('returns allowed: true for FOLLOW_UP_REQUIRED reservations edit guard', () => {
      expect(canEditReservation(ReservationStatus.FOLLOW_UP_REQUIRED).allowed).toBe(true);
    });

    it('enforces read-only immutability for CONVERTED reservations', () => {
      expect(canEditReservation(ReservationStatus.CONVERTED).allowed).toBe(false);
      expect(canCancelReservation(ReservationStatus.CONVERTED).allowed).toBe(false);
    });

    it('enforces read-only immutability for CANCELLED reservations', () => {
      expect(canEditReservation(ReservationStatus.CANCELLED).allowed).toBe(false);
      expect(canCancelReservation(ReservationStatus.CANCELLED).allowed).toBe(false);
    });
  });
});
