import { describe, it, expect, beforeEach } from 'vitest';
import { ReservationUseCases } from '../useCases/ReservationUseCases';
import { InMemoryReservationRepository } from '../../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationStatus } from '../../domain/valueObjects/ReservationStatus';
import type { Reservation } from '../../domain/entities/Reservation';

describe('ReservationUseCases Application Service', () => {
  let repository: InMemoryReservationRepository;
  let useCases: ReservationUseCases;

  const initialReservations: Reservation[] = [
    {
      id: 'resv-000001',
      reservationNumber: 'RES-000001',
      prospectName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      expectedJoiningDate: '2026-08-15',
      status: ReservationStatus.ACTIVE,
      auditLog: [],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'resv-000002',
      reservationNumber: 'RES-000002',
      prospectName: 'Priya Patel',
      mobileNumber: '9988776655',
      expectedJoiningDate: '2026-07-25',
      status: ReservationStatus.CONVERTED,
      auditLog: [],
      createdAt: '2026-07-15T09:00:00.000Z',
      updatedAt: '2026-07-25T10:00:00.000Z',
    },
    {
      id: 'resv-000003',
      reservationNumber: 'RES-000003',
      prospectName: 'Suresh Kumar',
      mobileNumber: '9123456789',
      expectedJoiningDate: '2026-07-20',
      status: ReservationStatus.CANCELLED,
      cancellationReason: 'Plan changed',
      auditLog: [],
      createdAt: '2026-07-10T14:00:00.000Z',
      updatedAt: '2026-07-18T16:00:00.000Z',
    },
  ];

  beforeEach(() => {
    repository = new InMemoryReservationRepository(initialReservations);
    useCases = new ReservationUseCases(repository);
  });

  describe('createReservation', () => {
    it('creates a new active reservation with canonical reservation number', async () => {
      const reservation = await useCases.createReservation({
        prospectName: 'Vikram Singh',
        mobileNumber: '9811122233',
        expectedJoiningDate: '2026-09-01',
        expectedMonthlyRent: 14000,
        expectedSecurityDeposit: 14000,
        accommodationPreference: 'Single Room',
        tokenAmount: 3000,
        tokenReceivedOn: '2026-08-05',
        notes: 'Requested high floor',
      });

      expect(reservation.id).toBe('resv-000004');
      expect(reservation.reservationNumber).toBe('RES-000004');
      expect(reservation.prospectName).toBe('Vikram Singh');
      expect(reservation.mobileNumber).toBe('9811122233');
      expect(reservation.status).toBe(ReservationStatus.ACTIVE);
      expect(reservation.expectedMonthlyRent).toBe(14000);
      expect(reservation.tokenAmount).toBe(3000);

      const found = await repository.findById('resv-000004');
      expect(found).not.toBeNull();
    });

    it('rejects invalid reservation creation inputs', async () => {
      await expect(
        useCases.createReservation({
          prospectName: '',
          mobileNumber: '9876543210',
          expectedJoiningDate: '2026-09-01',
        })
      ).rejects.toThrow('Prospect name is required.');
    });
  });

  describe('checkDuplicateMobile', () => {
    it('detects duplicate active reservation by mobile number', async () => {
      const result = await useCases.checkDuplicateMobile('9876543210');
      expect(result.hasDuplicate).toBe(true);
      expect(result.existingReservation?.id).toBe('resv-000001');
      expect(result.warning).toContain('RES-000001');
    });

    it('returns false for mobile numbers without active reservations', async () => {
      const result = await useCases.checkDuplicateMobile('9999999999');
      expect(result.hasDuplicate).toBe(false);
    });

    it('does not flag converted or cancelled reservations as active duplicates', async () => {
      const result = await useCases.checkDuplicateMobile('9988776655'); // Converted
      expect(result.hasDuplicate).toBe(false);
    });
  });

  describe('cancelReservation', () => {
    it('cancels an active reservation without token and sets cancellation reason and cancelledAt', async () => {
      const cancelled = await useCases.cancelReservation('resv-000001', {
        reason: 'Guest relocated to another city',
      });

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      expect(cancelled.cancellationReason).toBe('Guest relocated to another city');
      expect(cancelled.cancelledAt).toBeDefined();
      expect(cancelled.tokenDisposition).toBeUndefined();

      const found = await repository.findById('resv-000001');
      expect(found?.status).toBe(ReservationStatus.CANCELLED);
      expect(found?.cancelledAt).toBe(cancelled.cancelledAt);
    });

    it('requires token disposition when cancelling an active reservation with token', async () => {
      const resWithToken = await useCases.createReservation({
        prospectName: 'Token Guest',
        mobileNumber: '9888877777',
        expectedJoiningDate: '2026-09-01',
        tokenAmount: 2000,
      });

      await expect(
        useCases.cancelReservation(resWithToken.id, {
          reason: 'No longer interested',
        })
      ).rejects.toThrow(
        'Token disposition choice (REFUND or FORFEIT) is required when cancelling a reservation with a token.'
      );
    });

    it('records full token amount with REFUND disposition upon cancellation', async () => {
      const resWithToken = await useCases.createReservation({
        prospectName: 'Refund Guest',
        mobileNumber: '9888866666',
        expectedJoiningDate: '2026-09-01',
        tokenAmount: 3000,
      });

      const cancelled = await useCases.cancelReservation(resWithToken.id, {
        reason: 'Requested refund due to cancellation',
        tokenDisposition: 'REFUND',
      });

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      expect(cancelled.tokenDisposition).toEqual({
        outcome: 'REFUND',
        amount: 3000,
        decidedOn: expect.any(String),
      });
      expect(cancelled.cancelledAt).toBeDefined();

      const lastAudit = cancelled.auditLog[cancelled.auditLog.length - 1];
      expect(lastAudit.action).toBe('Reservation Cancelled');
      expect(lastAudit.details).toContain('Token disposition: REFUND. Token amount: ₹3,000.');
    });

    it('records full token amount with FORFEIT disposition upon cancellation', async () => {
      const resWithToken = await useCases.createReservation({
        prospectName: 'Forfeit Guest',
        mobileNumber: '9888855555',
        expectedJoiningDate: '2026-09-01',
        tokenAmount: 1500,
      });

      const cancelled = await useCases.cancelReservation(resWithToken.id, {
        reason: 'No-show on joining date',
        tokenDisposition: 'FORFEIT',
      });

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      expect(cancelled.tokenDisposition).toEqual({
        outcome: 'FORFEIT',
        amount: 1500,
        decidedOn: expect.any(String),
      });


      const lastAudit = cancelled.auditLog[cancelled.auditLog.length - 1];
      expect(lastAudit.action).toBe('Reservation Cancelled');
      expect(lastAudit.details).toContain('Token disposition: FORFEIT. Token amount: ₹1,500.');
    });

    it('rejects cancellation without reason', async () => {
      await expect(
        useCases.cancelReservation('resv-000001', {
          reason: '  ',
        })
      ).rejects.toThrow('Cancellation reason is required.');
    });

    it('rejects cancelling an already converted or cancelled reservation', async () => {
      await expect(
        useCases.cancelReservation('resv-000002', { reason: 'Test' })
      ).rejects.toThrow('Converted reservations cannot be cancelled.');

      await expect(
        useCases.cancelReservation('resv-000003', { reason: 'Test' })
      ).rejects.toThrow('Reservation is already cancelled.');
    });
  });

  describe('convertReservation', () => {
    it('converts an active reservation to CONVERTED status', async () => {
      const converted = await useCases.convertReservation('resv-000001');
      expect(converted.status).toBe(ReservationStatus.CONVERTED);

      const found = await repository.findById('resv-000001');
      expect(found?.status).toBe(ReservationStatus.CONVERTED);
    });

    it('rejects converting an already converted or cancelled reservation', async () => {
      await expect(useCases.convertReservation('resv-000002')).rejects.toThrow(
        'Reservation is already converted.'
      );

      await expect(useCases.convertReservation('resv-000003')).rejects.toThrow(
        'Cancelled reservations cannot be converted.'
      );
    });
  });

  describe('updateReservation and read-only invariants', () => {
    it('updates an active reservation', async () => {
      const updated = await useCases.updateReservation('resv-000001', {
        prospectName: 'Rahul K. Sharma',
        expectedJoiningDate: '2026-08-20',
      });

      expect(updated.prospectName).toBe('Rahul K. Sharma');
      expect(updated.expectedJoiningDate).toBe('2026-08-20');
    });

    it('rejects updating CONVERTED or CANCELLED reservations', async () => {
      await expect(
        useCases.updateReservation('resv-000002', { prospectName: 'New Name' })
      ).rejects.toThrow('Reservation is CONVERTED and is read-only.');

      await expect(
        useCases.updateReservation('resv-000003', { prospectName: 'New Name' })
      ).rejects.toThrow('Reservation is CANCELLED and is read-only.');
    });
  });

  describe('listReservations and getReservationById', () => {
    it('lists all reservations', async () => {
      const list = await useCases.listReservations();
      expect(list).toHaveLength(3);
    });

    it('retrieves reservation by ID', async () => {
      const reservation = await useCases.getReservationById('resv-000001');
      expect(reservation?.prospectName).toBe('Rahul Sharma');
    });
  });
});
