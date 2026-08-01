import { describe, it, expect } from 'vitest';
import {
  formatReservationNumber,
  validateReservationDraft,
  checkDuplicateMobile,
  calculateOverdueDays,
  canTransitionStatus,
  canEditReservation,
  canCancelReservation,
  determineStatusRecovery,
} from '../reservationRules';
import { ReservationStatus } from '../../valueObjects/ReservationStatus';
import type { Reservation } from '../../entities/Reservation';

describe('reservationRules Domain Module', () => {
  describe('formatReservationNumber', () => {
    it('formats sequence numbers into RES-000001 format', () => {
      expect(formatReservationNumber(1)).toBe('RES-000001');
      expect(formatReservationNumber(42)).toBe('RES-000042');
      expect(formatReservationNumber(1234)).toBe('RES-001234');
    });
  });

  describe('validateReservationDraft', () => {
    it('returns isValid: true for valid creation input', () => {
      const result = validateReservationDraft('Rahul Sharma', '9876543210', '2026-08-10');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns error when prospectName is empty', () => {
      const result = validateReservationDraft('   ', '9876543210', '2026-08-10');
      expect(result.isValid).toBe(false);
      expect(result.errors.prospectName).toBe('Prospect name is required.');
    });

    it('returns error when mobileNumber is invalid', () => {
      const result = validateReservationDraft('Rahul', '123', '2026-08-10');
      expect(result.isValid).toBe(false);
      expect(result.errors.mobileNumber).toContain('valid 10-digit number');
    });

    it('returns error when expectedJoiningDate is invalid', () => {
      const result = validateReservationDraft('Rahul', '9876543210', 'invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.errors.expectedJoiningDate).toContain('Valid expected joining date');
    });
  });

  describe('checkDuplicateMobile', () => {
    it('returns warning when an active reservation exists for the mobile number', () => {
      const existing: Reservation = {
        id: 'resv-1',
        reservationNumber: 'RES-000001',
        prospectName: 'John Doe',
        mobileNumber: '9876543210',
        expectedJoiningDate: '2026-08-05',
        status: ReservationStatus.ACTIVE,
        auditLog: [],
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      };

      const result = checkDuplicateMobile(existing);
      expect(result.hasDuplicate).toBe(true);
      expect(result.existingReservationNumber).toBe('RES-000001');
      expect(result.warning).toContain('ACTIVE reservation (RES-000001 for John Doe)');
    });

    it('returns hasDuplicate: false when no existing reservation is provided', () => {
      const result = checkDuplicateMobile(null);
      expect(result.hasDuplicate).toBe(false);
      expect(result.warning).toBeUndefined();
    });
  });

  describe('calculateOverdueDays', () => {
    it('returns isOverdue: true and correct overdueDays when joining date is in the past', () => {
      const result = calculateOverdueDays('2026-07-28', '2026-08-01');
      expect(result.isOverdue).toBe(true);
      expect(result.overdueDays).toBe(4);
    });

    it('returns isOverdue: false when joining date is today or in the future', () => {
      const todayResult = calculateOverdueDays('2026-08-01', '2026-08-01');
      expect(todayResult.isOverdue).toBe(false);
      expect(todayResult.overdueDays).toBe(0);

      const futureResult = calculateOverdueDays('2026-08-05', '2026-08-01');
      expect(futureResult.isOverdue).toBe(false);
      expect(futureResult.overdueDays).toBe(0);
    });
  });

  describe('canTransitionStatus', () => {
    it('allows valid status transitions from ACTIVE', () => {
      expect(canTransitionStatus(ReservationStatus.ACTIVE, ReservationStatus.FOLLOW_UP_REQUIRED).allowed).toBe(true);
      expect(canTransitionStatus(ReservationStatus.ACTIVE, ReservationStatus.CONVERTED).allowed).toBe(true);
      expect(canTransitionStatus(ReservationStatus.ACTIVE, ReservationStatus.CANCELLED).allowed).toBe(true);
    });

    it('prevents modifying a CONVERTED or CANCELLED reservation', () => {
      const convertedCheck = canTransitionStatus(ReservationStatus.CONVERTED, ReservationStatus.ACTIVE);
      expect(convertedCheck.allowed).toBe(false);
      expect(convertedCheck.reason).toContain('read-only and cannot be modified');

      const cancelledCheck = canTransitionStatus(ReservationStatus.CANCELLED, ReservationStatus.ACTIVE);
      expect(cancelledCheck.allowed).toBe(false);
      expect(cancelledCheck.reason).toContain('read-only and cannot be modified');
    });
  });

  describe('canEditReservation and canCancelReservation', () => {
    it('allows editing and cancelling ACTIVE and FOLLOW_UP_REQUIRED reservations', () => {
      expect(canEditReservation(ReservationStatus.ACTIVE).allowed).toBe(true);
      expect(canEditReservation(ReservationStatus.FOLLOW_UP_REQUIRED).allowed).toBe(true);

      expect(canCancelReservation(ReservationStatus.ACTIVE).allowed).toBe(true);
      expect(canCancelReservation(ReservationStatus.FOLLOW_UP_REQUIRED).allowed).toBe(true);
    });

    it('prevents editing and cancelling CONVERTED and CANCELLED reservations (Read-Only Enforcement)', () => {
      expect(canEditReservation(ReservationStatus.CONVERTED).allowed).toBe(false);
      expect(canEditReservation(ReservationStatus.CANCELLED).allowed).toBe(false);

      expect(canCancelReservation(ReservationStatus.CONVERTED).allowed).toBe(false);
      expect(canCancelReservation(ReservationStatus.CANCELLED).allowed).toBe(false);
    });
  });

  describe('determineStatusRecovery', () => {
    it('automatically recovers status to ACTIVE when updating joining date of FOLLOW_UP_REQUIRED to today or future', () => {
      const recovered = determineStatusRecovery(
        ReservationStatus.FOLLOW_UP_REQUIRED,
        '2026-08-10',
        '2026-08-01'
      );
      expect(recovered).toBe(ReservationStatus.ACTIVE);
    });

    it('does not recover status if new joining date remains in the past', () => {
      const result = determineStatusRecovery(
        ReservationStatus.FOLLOW_UP_REQUIRED,
        '2026-07-25',
        '2026-08-01'
      );
      expect(result).toBe(ReservationStatus.FOLLOW_UP_REQUIRED);
    });

    it('preserves existing ACTIVE, CONVERTED, or CANCELLED statuses', () => {
      expect(determineStatusRecovery(ReservationStatus.ACTIVE, '2026-08-10', '2026-08-01')).toBe(ReservationStatus.ACTIVE);
      expect(determineStatusRecovery(ReservationStatus.CONVERTED, '2026-08-10', '2026-08-01')).toBe(ReservationStatus.CONVERTED);
    });
  });
});
