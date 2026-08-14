import { describe, it, expect } from 'vitest';
import { ReservationStatus } from '../../valueObjects/ReservationStatus';
import {
  formatReservationNumber,
  validateReservationDraft,
  calculateOverdueDays,
  canTransitionStatus,
  canEditReservation,
  canCancelReservation,
  canConvertReservation,
} from '../reservationRules';

describe('Reservation Domain Rules', () => {
  describe('formatReservationNumber', () => {
    it('formats numbers into RES-000001 format', () => {
      expect(formatReservationNumber(1)).toBe('RES-000001');
      expect(formatReservationNumber(42)).toBe('RES-000042');
      expect(formatReservationNumber(999999)).toBe('RES-999999');
    });
  });

  describe('validateReservationDraft', () => {
    it('validates a valid reservation draft', () => {
      const result = validateReservationDraft('Rahul Sharma', '9876543210', '2026-08-15');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('rejects empty prospect name', () => {
      const result = validateReservationDraft('  ', '9876543210', '2026-08-15');
      expect(result.isValid).toBe(false);
      expect(result.errors.prospectName).toBe('Prospect name is required.');
    });

    it('rejects invalid mobile numbers', () => {
      const resultShort = validateReservationDraft('Rahul', '123', '2026-08-15');
      expect(resultShort.isValid).toBe(false);
      expect(resultShort.errors.mobileNumber).toBe('Mobile number must be a valid 10-digit number.');
    });

    it('rejects invalid expected joining date', () => {
      const result = validateReservationDraft('Rahul', '9876543210', 'invalid-date');
      expect(result.isValid).toBe(false);
      expect(result.errors.expectedJoiningDate).toBe('Valid expected joining date is required.');
    });

    it('accepts today as a valid expected joining date', () => {
      const result = validateReservationDraft('Rahul', '9876543210', '2026-08-11', '2026-08-11');
      expect(result.isValid).toBe(true);
      expect(result.errors.expectedJoiningDate).toBeUndefined();
    });

    it('accepts a future date as a valid expected joining date', () => {
      const result = validateReservationDraft('Rahul', '9876543210', '2026-08-20', '2026-08-11');
      expect(result.isValid).toBe(true);
      expect(result.errors.expectedJoiningDate).toBeUndefined();
    });

    it('rejects a past date as expected joining date', () => {
      const result = validateReservationDraft('Rahul', '9876543210', '2026-08-10', '2026-08-11');
      expect(result.isValid).toBe(false);
      expect(result.errors.expectedJoiningDate).toBe('Expected joining date cannot be earlier than today.');
    });
  });

  describe('calculateOverdueDays', () => {
    it('calculates positive overdue days for past joining dates', () => {
      const result = calculateOverdueDays('2026-08-01', '2026-08-05');
      expect(result.isOverdue).toBe(true);
      expect(result.overdueDays).toBe(4);
    });

    it('returns false for today or future dates', () => {
      const today = calculateOverdueDays('2026-08-05', '2026-08-05');
      expect(today.isOverdue).toBe(false);
      expect(today.overdueDays).toBe(0);

      const future = calculateOverdueDays('2026-08-10', '2026-08-05');
      expect(future.isOverdue).toBe(false);
      expect(future.overdueDays).toBe(0);
    });
  });

  describe('canTransitionStatus', () => {
    it('allows ACTIVE -> CONVERTED transition', () => {
      const result = canTransitionStatus(ReservationStatus.ACTIVE, ReservationStatus.CONVERTED);
      expect(result.allowed).toBe(true);
    });

    it('allows ACTIVE -> CANCELLED transition', () => {
      const result = canTransitionStatus(ReservationStatus.ACTIVE, ReservationStatus.CANCELLED);
      expect(result.allowed).toBe(true);
    });

    it('forbids transition out of CONVERTED', () => {
      const result = canTransitionStatus(ReservationStatus.CONVERTED, ReservationStatus.ACTIVE);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('CONVERTED');
    });

    it('forbids transition out of CANCELLED', () => {
      const result = canTransitionStatus(ReservationStatus.CANCELLED, ReservationStatus.ACTIVE);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('CANCELLED');
    });
  });

  describe('State Transition & Operation Guards', () => {
    it('guards edit operations correctly', () => {
      expect(canEditReservation(ReservationStatus.ACTIVE).allowed).toBe(true);
      expect(canEditReservation(ReservationStatus.CONVERTED).allowed).toBe(false);
      expect(canEditReservation(ReservationStatus.CANCELLED).allowed).toBe(false);
    });

    it('guards cancel operations correctly', () => {
      expect(canCancelReservation(ReservationStatus.ACTIVE).allowed).toBe(true);
      expect(canCancelReservation(ReservationStatus.CONVERTED).allowed).toBe(false);
      expect(canCancelReservation(ReservationStatus.CANCELLED).allowed).toBe(false);
    });

    it('guards convert operations correctly', () => {
      expect(canConvertReservation(ReservationStatus.ACTIVE).allowed).toBe(true);
      expect(canConvertReservation(ReservationStatus.CONVERTED).allowed).toBe(false);
      expect(canConvertReservation(ReservationStatus.CANCELLED).allowed).toBe(false);
    });
  });
});
