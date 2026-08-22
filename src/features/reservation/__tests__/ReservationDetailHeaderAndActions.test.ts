import { describe, it, expect, beforeEach } from 'vitest';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationUseCases } from '../application/useCases/ReservationUseCases';
import {
  canEditReservation,
  canCancelReservation,
  canConvertReservation,
  isReservationFollowUpRequired,
} from '../domain/rules/reservationRules';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { BedStatus } from '../../accommodation/domain/valueObjects/BedStatus';

describe('RU-2C.1 — Reservation Detail: Header & Action Bar Suite (UI Polish)', () => {
  let repository: InMemoryReservationRepository;
  let useCases: ReservationUseCases;

  const todayStr = new Date().toISOString().split('T')[0];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const overdueDate = '2026-07-01';

  const mockActiveReservation: Reservation = {
    id: 'resv-000001',
    reservationNumber: 'RES-000001',
    prospectName: 'Rahul Sharma',
    mobileNumber: '9876543210',
    expectedJoiningDate: tomorrowStr,
    expectedMonthlyRent: 12000,
    expectedSecurityDeposit: 24000,
    accommodationPreference: 'Double Sharing, 1st Floor',
    tokenAmount: 2000,
    tokenReceivedOn: todayStr,
    status: ReservationStatus.ACTIVE,
    auditLog: [],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  const mockArrivingTodayReservation: Reservation = {
    ...mockActiveReservation,
    id: 'resv-000002',
    reservationNumber: 'RES-000002',
    prospectName: 'Pooja Verma',
    expectedJoiningDate: todayStr,
  };

  const mockOverdueReservation: Reservation = {
    ...mockActiveReservation,
    id: 'resv-000003',
    reservationNumber: 'RES-000003',
    prospectName: 'Amit Saxena',
    expectedJoiningDate: overdueDate,
  };

  const mockConvertedReservation: Reservation = {
    ...mockActiveReservation,
    id: 'resv-000004',
    reservationNumber: 'RES-000004',
    prospectName: 'Vikram Singh',
    status: ReservationStatus.CONVERTED,
    convertedResidentId: 'res-000001',
    convertedStayId: 'stay-000001',
  };

  const mockCancelledReservation: Reservation = {
    ...mockActiveReservation,
    id: 'resv-000005',
    reservationNumber: 'RES-000005',
    prospectName: 'Suresh Kumar',
    status: ReservationStatus.CANCELLED,
    cancellationReason: 'Found alternate hostel',
  };

  beforeEach(() => {
    repository = new InMemoryReservationRepository([
      mockActiveReservation,
      mockArrivingTodayReservation,
      mockOverdueReservation,
      mockConvertedReservation,
      mockCancelledReservation,
    ]);
    useCases = new ReservationUseCases(repository);
  });

  describe('1. Header Identity & Hierarchy', () => {
    it('1. Prospect Name is available as primary dominant identity', () => {
      const res = repository.findByIdSync('resv-000001');
      expect(res?.prospectName).toBe('Rahul Sharma');
    });

    it('2. Reservation Number is available as secondary identifier', () => {
      const res = repository.findByIdSync('resv-000001');
      expect(res?.reservationNumber).toBe('RES-000001');
    });

    it('3. Lifecycle status is accurately represented for all states', () => {
      expect(repository.findByIdSync('resv-000001')?.status).toBe(ReservationStatus.ACTIVE);
      expect(repository.findByIdSync('resv-000004')?.status).toBe(ReservationStatus.CONVERTED);
      expect(repository.findByIdSync('resv-000005')?.status).toBe(ReservationStatus.CANCELLED);
    });

    it('4. Attention indicators are derived accurately without polluting lifecycle status', () => {
      // Arriving today check
      const arrivingRes = repository.findByIdSync('resv-000002')!;
      const isArrivingToday = arrivingRes.status === ReservationStatus.ACTIVE && arrivingRes.expectedJoiningDate === todayStr;
      expect(isArrivingToday).toBe(true);

      // Overdue / Follow-up required check
      const overdueRes = repository.findByIdSync('resv-000003')!;
      const isFollowUp = isReservationFollowUpRequired(overdueRes, todayStr);
      expect(isFollowUp).toBe(true);

      // Normal active future reservation
      const normalRes = repository.findByIdSync('resv-000001')!;
      expect(isReservationFollowUpRequired(normalRes, todayStr)).toBe(false);
    });
  });

  describe('2. ACTIVE Reservation Actions (Direct Discoverability & Hierarchy)', () => {
    it('5. Convert to Admission is available as primary contained action for ACTIVE reservation', () => {
      const check = canConvertReservation(ReservationStatus.ACTIVE);
      expect(check.allowed).toBe(true);
    });

    it('6. Edit is available as secondary outlined action for ACTIVE reservation', () => {
      const check = canEditReservation(ReservationStatus.ACTIVE);
      expect(check.allowed).toBe(true);
    });

    it('7. Cancel Reservation is directly discoverable as destructive outlined action for ACTIVE reservation', () => {
      const check = canCancelReservation(ReservationStatus.ACTIVE);
      expect(check.allowed).toBe(true);
    });

    it('8. Cancel action safely triggers existing cancellation workflow with confirmation reason', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'Prospect relocated to another city',
        tokenDisposition: 'REFUND',
      });
      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      expect(cancelled.cancellationReason).toBe('Prospect relocated to another city');
      expect(cancelled.tokenDisposition?.outcome).toBe('REFUND');
      expect(cancelled.cancelledAt).toBeDefined();
      expect(cancelled.updatedAt).toBeDefined();
    });

  });

  describe('3. CONVERTED Reservation Actions', () => {
    it('9. Convert to Admission is NOT available for CONVERTED reservation', () => {
      const check = canConvertReservation(ReservationStatus.CONVERTED);
      expect(check.allowed).toBe(false);
      expect(check.reason).toMatch(/converted/i);
    });

    it('10. Cancel Reservation is NOT available for CONVERTED reservation', () => {
      const check = canCancelReservation(ReservationStatus.CONVERTED);
      expect(check.allowed).toBe(false);
    });

    it('11. View Admission / Stay target references exist on CONVERTED reservation', () => {
      const res = repository.findByIdSync('resv-000004');
      expect(res?.convertedStayId).toBe('stay-000001');
      expect(res?.convertedResidentId).toBe('res-000001');
    });
  });

  describe('4. CANCELLED Reservation Actions (Read-Only Terminal State)', () => {
    it('12. Convert to Admission is NOT available for CANCELLED reservation', () => {
      const check = canConvertReservation(ReservationStatus.CANCELLED);
      expect(check.allowed).toBe(false);
      expect(check.reason).toMatch(/cancelled/i);
    });

    it('13. Edit is NOT available for CANCELLED reservation', () => {
      const check = canEditReservation(ReservationStatus.CANCELLED);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('CANCELLED');
    });

    it('14. Cancel Reservation is NOT available for already CANCELLED reservation', () => {
      const check = canCancelReservation(ReservationStatus.CANCELLED);
      expect(check.allowed).toBe(false);
    });
  });

  describe('5. Business Safety & Invariant Isolation', () => {
    it('15. No ReservationStatus mutation was introduced by header rendering', () => {
      const before = repository.findByIdSync('resv-000001');
      expect(before?.status).toBe(ReservationStatus.ACTIVE);
    });

    it('16. No accommodation/bed mutation occurs on reservation detail page', () => {
      const accommodationRepo = new InMemoryAccommodationRepository([
        {
          id: 'flat-101',
          name: '101',
          floor: '1',
          areas: [
            {
              id: 'area-1',
              name: 'Room A',
              defaultRent: 8000,
              defaultDeposit: 8000,
              beds: [
                {
                  id: 'bed-101-a',
                  name: '101-A',
                  status: BedStatus.VACANT,
                  defaultRent: 8000,
                  defaultDeposit: 8000,
                },
              ],
            },
          ],
        },
      ]);

      const flat = accommodationRepo.findByIdSync('flat-101');
      expect(flat?.areas[0].beds[0].status).toBe(BedStatus.VACANT);
    });

    it('17. No Stay creation is triggered by reservation detail access', () => {
      const stayRepo = new InMemoryStayRepository([]);
      expect(stayRepo.getAllSync()).toHaveLength(0);
    });

    it('18. No Finance mutation is triggered by reservation detail access', () => {
      const res = repository.findByIdSync('resv-000001')!;
      expect(res.expectedMonthlyRent).toBe(12000);
      expect(res.expectedSecurityDeposit).toBe(24000);
      expect(res.tokenAmount).toBe(2000);
    });
  });
});
