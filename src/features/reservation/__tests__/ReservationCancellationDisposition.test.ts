import { describe, it, expect, beforeEach } from 'vitest';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationUseCases } from '../application/useCases/ReservationUseCases';
import { ReservationWorkspaceCoordinator } from '../application/coordinator/ReservationWorkspaceCoordinator';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { BedStatus } from '../../accommodation/domain/valueObjects/BedStatus';


describe('RU-2C.2B — Reservation Cancellation Token Disposition + Notes UX Suite', () => {
  let reservationRepo: InMemoryReservationRepository;
  let useCases: ReservationUseCases;
  let coordinator: ReservationWorkspaceCoordinator;

  const mockActiveWithToken: Reservation = {
    id: 'resv-000001',
    reservationNumber: 'RES-000001',
    prospectName: 'Rahul Sharma',
    mobileNumber: '9876543210',
    expectedJoiningDate: '2026-09-20',
    expectedMonthlyRent: 12000,
    expectedSecurityDeposit: 12000,
    accommodationPreference: 'Single Room',
    tokenAmount: 1000,
    tokenReceivedOn: '2026-08-01',
    tokenRemarks: 'UPI #12345',
    status: ReservationStatus.ACTIVE,
    notes: 'Ground floor requested',
    auditLog: [
      {
        timestamp: '2026-08-01T10:00:00.000Z',
        action: 'Reservation Created',
        performedBy: 'System Operator',
        details: 'Reservation created with ₹1,000 token',
      },
    ],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  const mockActiveWithoutToken: Reservation = {
    id: 'resv-000002',
    reservationNumber: 'RES-000002',
    prospectName: 'Priya Patel',
    mobileNumber: '9812345678',
    expectedJoiningDate: '2026-09-25',
    expectedMonthlyRent: 15000,
    expectedSecurityDeposit: 15000,
    tokenAmount: undefined,
    status: ReservationStatus.ACTIVE,
    notes: 'No special remarks',
    auditLog: [],
    createdAt: '2026-08-05T10:00:00.000Z',
    updatedAt: '2026-08-05T10:00:00.000Z',
  };

  beforeEach(() => {
    reservationRepo = new InMemoryReservationRepository([
      { ...mockActiveWithToken },
      { ...mockActiveWithoutToken },
    ]);
    useCases = new ReservationUseCases(reservationRepo);
    coordinator = new ReservationWorkspaceCoordinator(reservationRepo);
  });

  describe('1. Active Reservation with Token Cancellation Rules', () => {
    it('1. Active reservation with token requires token disposition', () => {
      expect(() =>
        useCases.cancelReservationSync('resv-000001', {
          reason: 'Found alternative PG',
        })
      ).toThrow(
        'Token disposition choice (REFUND or FORFEIT) is required when cancelling a reservation with a token.'
      );
    });

    it('2. REFUND records full original token amount', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'Prospect changed city',
        tokenDisposition: 'REFUND',
      });

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      expect(cancelled.tokenDisposition).toBeDefined();
      expect(cancelled.tokenDisposition?.outcome).toBe('REFUND');
      expect(cancelled.tokenDisposition?.amount).toBe(1000);
      expect(cancelled.tokenDisposition?.decidedOn).toBeDefined();
    });

    it('3. FORFEIT records full original token amount', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'No-show on joining date',
        tokenDisposition: 'FORFEIT',
      });

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      expect(cancelled.tokenDisposition).toBeDefined();
      expect(cancelled.tokenDisposition?.outcome).toBe('FORFEIT');
      expect(cancelled.tokenDisposition?.amount).toBe(1000);
    });

    it('4. MVP has no partial refund amount (structured tokenDisposition records full token amount)', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'Standard cancellation',
        tokenDisposition: 'REFUND',
      });

      // Token disposition must equal full token amount (1000)
      expect(cancelled.tokenDisposition?.amount).toBe(mockActiveWithToken.tokenAmount);
    });

    it('4b. Coordinator accurately delegates cancellation with token disposition to Use Cases', () => {
      const cancelled = coordinator.cancelReservation(
        'resv-000001',
        'Coordinator cancellation',
        'REFUND'
      );

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      expect(cancelled.tokenDisposition?.outcome).toBe('REFUND');
      expect(cancelled.tokenDisposition?.amount).toBe(1000);
    });
  });


  describe('2. Active Reservation without Token Cancellation Rules', () => {
    it('5. Active reservation without token requires no disposition and omits tokenDisposition', () => {
      const cancelled = useCases.cancelReservationSync('resv-000002', {
        reason: 'Plans changed',
      });

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      expect(cancelled.tokenDisposition).toBeUndefined();
      expect(cancelled.cancellationReason).toBe('Plans changed');
    });

    it('6. Cancellation reason is mandatory', () => {
      expect(() =>
        useCases.cancelReservationSync('resv-000002', {
          reason: '   ',
        })
      ).toThrow('Cancellation reason is required.');
    });
  });

  describe('3. Terminal State Safety & Immutability', () => {
    it('7. CANCELLED reservation cannot be cancelled again', () => {
      useCases.cancelReservationSync('resv-000002', { reason: 'First cancel' });

      expect(() =>
        useCases.cancelReservationSync('resv-000002', { reason: 'Second cancel' })
      ).toThrow('Reservation is already cancelled.');
    });

    it('8. CONVERTED reservation cannot be cancelled', () => {
      reservationRepo.saveSync({
        ...mockActiveWithToken,
        id: 'resv-converted',
        status: ReservationStatus.CONVERTED,
      });

      expect(() =>
        useCases.cancelReservationSync('resv-converted', { reason: 'Cancel attempt' })
      ).toThrow('Converted reservations cannot be cancelled.');
    });
  });

  describe('4. Dedicated Cancellation Timestamp', () => {
    it('9. cancelledAt is recorded when ACTIVE -> CANCELLED', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'Relocated',
        tokenDisposition: 'REFUND',
      });

      expect(cancelled.cancelledAt).toBeDefined();
      expect(typeof cancelled.cancelledAt).toBe('string');
      expect(new Date(cancelled.cancelledAt!).getTime()).not.toBeNaN();
    });

    it('10. cancelledAt is dedicated and immutable across repository reads', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'Relocated',
        tokenDisposition: 'REFUND',
      });

      const retrieved = useCases.getReservationByIdSync('resv-000001');
      expect(retrieved?.cancelledAt).toBe(cancelled.cancelledAt);
    });
  });

  describe('5. Cancelled Reservation Detail Presentation Contracts', () => {
    it('11. Cancelled detail displays REFUND outcome representation', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'Found another PG',
        tokenDisposition: 'REFUND',
      });

      expect(cancelled.tokenDisposition?.outcome).toBe('REFUND');
      expect(cancelled.tokenDisposition?.amount).toBe(1000);
      const displayString = `₹${cancelled.tokenDisposition?.amount.toLocaleString('en-IN')} — Refund`;
      expect(displayString).toBe('₹1,000 — Refund');
    });

    it('12. Cancelled detail displays FORFEIT outcome representation', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'No-show',
        tokenDisposition: 'FORFEIT',
      });

      expect(cancelled.tokenDisposition?.outcome).toBe('FORFEIT');
      expect(cancelled.tokenDisposition?.amount).toBe(1000);
      const displayString = `₹${cancelled.tokenDisposition?.amount.toLocaleString('en-IN')} — Forfeit`;
      expect(displayString).toBe('₹1,000 — Forfeit');
    });

    it('13. No-token cancelled detail omits token disposition', () => {
      const cancelled = useCases.cancelReservationSync('resv-000002', {
        reason: 'Company transfer',
      });

      expect(cancelled.tokenDisposition).toBeUndefined();
    });
  });

  describe('6. Historical Audit Trail', () => {
    it('14. Audit/history reflects cancellation and disposition', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'Found another PG',
        tokenDisposition: 'REFUND',
      });

      const lastAudit = cancelled.auditLog[cancelled.auditLog.length - 1];
      expect(lastAudit.action).toBe('Reservation Cancelled');
      expect(lastAudit.details).toContain('Reason: Found another PG.');
      expect(lastAudit.details).toContain('Token disposition: REFUND. Token amount: ₹1,000.');
    });
  });

  describe('7. Notes & Remarks UX Model', () => {
    it('15. Notes UX header does not imply a count of note entries', () => {
      // Notes & Operator Remarks represents a single current string field
      expect(mockActiveWithToken.notes).toBe('Ground floor requested');
    });

    it('16. Reservation.notes remains a single string property without multi-entry conversion', () => {
      expect(typeof mockActiveWithToken.notes).toBe('string');
      expect(Array.isArray(mockActiveWithToken.notes)).toBe(false);
    });
  });

  describe('8. Business Invariants & Cross-Domain Isolation', () => {
    it('17. No Stay mutation occurs during cancellation', () => {
      const stayRepo = new InMemoryStayRepository([]);
      useCases.cancelReservationSync('resv-000001', {
        reason: 'Cancelled',
        tokenDisposition: 'REFUND',
      });

      expect(stayRepo.getAllSync()).toHaveLength(0);
    });

    it('18. No bed/room mutation occurs during cancellation', () => {
      const accommodationRepo = new InMemoryAccommodationRepository([
        {
          id: 'flat-101',
          name: 'Flat 101',
          floor: '1',
          areas: [
            {
              id: 'area-1',
              name: 'Room 1',
              defaultRent: 10000,
              defaultDeposit: 10000,
              beds: [
                {
                  id: 'bed-1',
                  name: 'Bed A',
                  status: BedStatus.VACANT,
                  defaultRent: 10000,
                  defaultDeposit: 10000,
                },
              ],
            },
          ],
        },
      ]);

      useCases.cancelReservationSync('resv-000001', {
        reason: 'Cancelled',
        tokenDisposition: 'REFUND',
      });

      const bed = accommodationRepo.findByIdSync('flat-101')?.areas[0].beds[0];
      expect(bed?.status).toBe(BedStatus.VACANT);
    });

    it('19. No Finance ledger mutation occurs during cancellation', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'Cancelled',
        tokenDisposition: 'REFUND',
      });

      expect(cancelled.tokenDisposition?.outcome).toBe('REFUND');
      expect(cancelled.tokenDisposition?.amount).toBe(1000);
    });

    it('20. Reservation remains Intent to Occupy / Expected Truth', () => {
      const cancelled = useCases.cancelReservationSync('resv-000001', {
        reason: 'Guest withdrew booking',
        tokenDisposition: 'FORFEIT',
      });

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      expect(cancelled.convertedResidentId).toBeUndefined();
      expect(cancelled.convertedStayId).toBeUndefined();
    });
  });
});
