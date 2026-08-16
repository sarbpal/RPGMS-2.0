import { describe, it, expect } from 'vitest';
import { ReservationStatus } from '../../valueObjects/ReservationStatus';
import {
  formatReservationNumber,
  normalizeProspectName,
  validateReservationDraft,
  calculateOverdueDays,
  canTransitionStatus,
  canEditReservation,
  canCancelReservation,
  canConvertReservation,
  isReservationFollowUpRequired,
  validateReservationCancellation,
} from '../reservationRules';

describe('Reservation Domain Rules', () => {
  describe('formatReservationNumber', () => {
    it('formats numbers into RES-000001 format', () => {
      expect(formatReservationNumber(1)).toBe('RES-000001');
      expect(formatReservationNumber(42)).toBe('RES-000042');
      expect(formatReservationNumber(999999)).toBe('RES-999999');
    });
  });

  describe('normalizeProspectName', () => {
    it('1. converts lowercase name to title case', () => {
      expect(normalizeProspectName('harsh singh')).toBe('Harsh Singh');
    });

    it('2. converts uppercase name to title case', () => {
      expect(normalizeProspectName('HARSH SINGH')).toBe('Harsh Singh');
    });

    it('3. collapses repeated internal whitespace', () => {
      expect(normalizeProspectName('harsh    singh')).toBe('Harsh Singh');
    });

    it('4. removes leading and trailing whitespace', () => {
      expect(normalizeProspectName('   harsh singh   ')).toBe('Harsh Singh');
    });

    it('5. preserves sensible apostrophe handling', () => {
      expect(normalizeProspectName("o'connor")).toBe("O'Connor");
      expect(normalizeProspectName("O'CONNOR")).toBe("O'Connor");
      expect(normalizeProspectName("d'souza")).toBe("D'Souza");
    });

    it('6. preserves sensible hyphenated name handling', () => {
      expect(normalizeProspectName('singh-gill')).toBe('Singh-Gill');
      expect(normalizeProspectName('SINGH-GILL')).toBe('Singh-Gill');
    });

    it('7. uses conservative generic title casing without surname-specific Mc/Mac inference', () => {
      expect(normalizeProspectName('mcdonald')).toBe('Mcdonald');
      expect(normalizeProspectName('macdonald')).toBe('Macdonald');
      expect(normalizeProspectName('mcintosh')).toBe('Mcintosh');
    });

    it('handles empty and whitespace-only inputs gracefully', () => {
      expect(normalizeProspectName('')).toBe('');
      expect(normalizeProspectName('   ')).toBe('');
    });
  });

  describe('validateReservationDraft', () => {
    it('validates a valid reservation draft', () => {
      const result = validateReservationDraft('Rahul Sharma', '9876543210', '2026-08-15', '2026-08-01');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('rejects empty prospect name', () => {
      const result = validateReservationDraft('  ', '9876543210', '2026-08-15', '2026-08-01');
      expect(result.isValid).toBe(false);
      expect(result.errors.prospectName).toBe('Prospect name is required.');
    });

    it('8. rejects empty mobile', () => {
      const result = validateReservationDraft('Rahul', '', '2026-08-15', '2026-08-01');
      expect(result.isValid).toBe(false);
      expect(result.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('9. rejects fewer than 10 digits (9 digits)', () => {
      const result = validateReservationDraft('Rahul', '987654321', '2026-08-15', '2026-08-01');
      expect(result.isValid).toBe(false);
      expect(result.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('10. rejects more than 10 digits (11 digits)', () => {
      const result = validateReservationDraft('Rahul', '98765432101', '2026-08-15', '2026-08-01');
      expect(result.isValid).toBe(false);
      expect(result.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('11. rejects alphabetic mobile', () => {
      const result = validateReservationDraft('Rahul', 'abcdefghij', '2026-08-15', '2026-08-01');
      expect(result.isValid).toBe(false);
      expect(result.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('12. rejects alphanumeric mobile', () => {
      const result = validateReservationDraft('Rahul', '98765abcde', '2026-08-15', '2026-08-01');
      expect(result.isValid).toBe(false);
      expect(result.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('13. rejects non-numeric characters', () => {
      const result = validateReservationDraft('Rahul', '98765-43210', '2026-08-15', '2026-08-01');
      expect(result.isValid).toBe(false);
      expect(result.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('14. accepts valid 10-digit mobile', () => {
      const result = validateReservationDraft('Rahul', '9876543210', '2026-08-15', '2026-08-01');
      expect(result.isValid).toBe(true);
      expect(result.errors.mobileNumber).toBeUndefined();
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

  describe('isReservationFollowUpRequired', () => {
    it('returns false for ACTIVE reservation with future joining date', () => {
      expect(
        isReservationFollowUpRequired(
          { status: ReservationStatus.ACTIVE, expectedJoiningDate: '2026-08-20' },
          '2026-08-11'
        )
      ).toBe(false);
    });

    it('returns false for ACTIVE reservation with today as joining date', () => {
      expect(
        isReservationFollowUpRequired(
          { status: ReservationStatus.ACTIVE, expectedJoiningDate: '2026-08-11' },
          '2026-08-11'
        )
      ).toBe(false);
    });

    it('returns true for ACTIVE reservation with past joining date (overdue)', () => {
      expect(
        isReservationFollowUpRequired(
          { status: ReservationStatus.ACTIVE, expectedJoiningDate: '2026-08-01' },
          '2026-08-11'
        )
      ).toBe(true);
    });

    it('returns false for CONVERTED reservation even if joining date was in the past', () => {
      expect(
        isReservationFollowUpRequired(
          { status: ReservationStatus.CONVERTED, expectedJoiningDate: '2026-08-01' },
          '2026-08-11'
        )
      ).toBe(false);
    });

    it('returns false for CANCELLED reservation even if joining date was in the past', () => {
      expect(
        isReservationFollowUpRequired(
          { status: ReservationStatus.CANCELLED, expectedJoiningDate: '2026-08-01' },
          '2026-08-11'
        )
      ).toBe(false);
    });
  });

  describe('ReservationStatus Enum Integrity', () => {
    it('contains strictly 3 canonical lifecycle states (ACTIVE, CONVERTED, CANCELLED)', () => {
      expect(Object.keys(ReservationStatus)).toEqual(['ACTIVE', 'CONVERTED', 'CANCELLED']);
      expect(Object.values(ReservationStatus)).toEqual(['ACTIVE', 'CONVERTED', 'CANCELLED']);
    });
  });

  describe('validateReservationCancellation', () => {
    it('validates active reservation with token and REFUND disposition', () => {
      const result = validateReservationCancellation(
        { status: ReservationStatus.ACTIVE, tokenAmount: 1000 },
        'Found another accommodation',
        'REFUND'
      );
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('validates active reservation with token and FORFEIT disposition', () => {
      const result = validateReservationCancellation(
        { status: ReservationStatus.ACTIVE, tokenAmount: 1000 },
        'No show',
        'FORFEIT'
      );
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects cancellation of active reservation with token when disposition is missing', () => {
      const result = validateReservationCancellation(
        { status: ReservationStatus.ACTIVE, tokenAmount: 1000 },
        'Found another accommodation'
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe(
        'Token disposition choice (REFUND or FORFEIT) is required when cancelling a reservation with a token.'
      );
    });

    it('validates active reservation without token without requiring disposition', () => {
      const result = validateReservationCancellation(
        { status: ReservationStatus.ACTIVE, tokenAmount: undefined },
        'Found another PG'
      );
      expect(result.isValid).toBe(true);
    });

    it('rejects empty or whitespace-only cancellation reason', () => {
      const result = validateReservationCancellation(
        { status: ReservationStatus.ACTIVE, tokenAmount: 0 },
        '   '
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Cancellation reason is required.');
    });

    it('rejects cancellation for CONVERTED reservation', () => {
      const result = validateReservationCancellation(
        { status: ReservationStatus.CONVERTED, tokenAmount: 1000 },
        'Reason',
        'REFUND'
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Converted reservations cannot be cancelled.');
    });

    it('rejects cancellation for already CANCELLED reservation', () => {
      const result = validateReservationCancellation(
        { status: ReservationStatus.CANCELLED, tokenAmount: 1000 },
        'Reason',
        'REFUND'
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Reservation is already cancelled.');
    });
  });
});
