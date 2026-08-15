import type { ReservationStatus } from '../valueObjects/ReservationStatus';
import { ReservationStatus as StatusEnum } from '../valueObjects/ReservationStatus';

export interface ReservationValidationResult {
  isValid: boolean;
  errors: {
    prospectName?: string;
    mobileNumber?: string;
    expectedJoiningDate?: string;
  };
}

/**
 * Domain Rule: Formats sequence number into canonical Reservation Number (RES-000001).
 */
export function formatReservationNumber(sequenceNumber: number): string {
  const paddedNumber = String(sequenceNumber).padStart(6, '0');
  return `RES-${paddedNumber}`;
}

/**
 * Domain Rule: Validates lightweight reservation creation/update input.
 */
export function validateReservationDraft(
  prospectName: string,
  mobileNumber: string,
  expectedJoiningDate: string,
  referenceDate: string = new Date().toISOString().split('T')[0]
): ReservationValidationResult {
  const errors: { prospectName?: string; mobileNumber?: string; expectedJoiningDate?: string } = {};
  let isValid = true;

  if (!prospectName || prospectName.trim().length === 0) {
    errors.prospectName = 'Prospect name is required.';
    isValid = false;
  }

  const cleanedMobile = mobileNumber.trim().replace(/\D/g, '');
  if (!cleanedMobile || cleanedMobile.length !== 10) {
    errors.mobileNumber = 'Mobile number must be a valid 10-digit number.';
    isValid = false;
  }

  if (!expectedJoiningDate || isNaN(Date.parse(expectedJoiningDate))) {
    errors.expectedJoiningDate = 'Valid expected joining date is required.';
    isValid = false;
  } else if (expectedJoiningDate < referenceDate) {
    errors.expectedJoiningDate = 'Expected joining date cannot be earlier than today.';
    isValid = false;
  }

  return { isValid, errors };
}

/**
 * Domain Rule: Decision Support check for duplicate active reservation format.
 */
export function checkDuplicateMobile(
  existingActiveReservation: { reservationNumber: string; prospectName: string; mobileNumber: string } | null
): { hasDuplicate: boolean; warning?: string; existingReservationNumber?: string } {
  if (existingActiveReservation) {
    return {
      hasDuplicate: true,
      existingReservationNumber: existingActiveReservation.reservationNumber,
      warning: `An ACTIVE reservation (${existingActiveReservation.reservationNumber} for ${existingActiveReservation.prospectName}) already exists for mobile number ${existingActiveReservation.mobileNumber}.`,
    };
  }
  return { hasDuplicate: false };
}

/**
 * Domain Rule: Calculates whether a reservation is overdue and by how many days.
 */
export function calculateOverdueDays(
  expectedJoiningDate: string,
  referenceDate: string = new Date().toISOString().split('T')[0]
): { isOverdue: boolean; overdueDays: number } {
  const joining = new Date(expectedJoiningDate);
  const ref = new Date(referenceDate);

  joining.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);

  const diffTime = ref.getTime() - joining.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return { isOverdue: true, overdueDays: diffDays };
  }
  return { isOverdue: false, overdueDays: 0 };
}

/**
 * Domain Rule: Determines whether an active reservation requires operational follow-up due to an overdue expected joining date.
 * Operational Attention Condition: Must be ACTIVE and expected joining date is before reference date (today).
 */
export function isReservationFollowUpRequired(
  reservation: { status: ReservationStatus; expectedJoiningDate: string },
  referenceDate: string = new Date().toISOString().split('T')[0]
): boolean {
  if (reservation.status !== StatusEnum.ACTIVE) {
    return false;
  }
  const { isOverdue } = calculateOverdueDays(reservation.expectedJoiningDate, referenceDate);
  return isOverdue;
}

/**
 * Domain Rule: Validates permitted reservation status state transitions.
 * States: ACTIVE -> CONVERTED, ACTIVE -> CANCELLED.
 * CONVERTED and CANCELLED are permanent terminal states.
 */
export function canTransitionStatus(
  currentStatus: ReservationStatus,
  targetStatus: ReservationStatus
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  if (currentStatus === StatusEnum.CONVERTED) {
    return { allowed: false, reason: 'CONVERTED reservations are permanent read-only records and cannot be modified.' };
  }

  if (currentStatus === StatusEnum.CANCELLED) {
    return { allowed: false, reason: 'CANCELLED reservations are permanent read-only records and cannot be modified.' };
  }

  if (currentStatus === StatusEnum.ACTIVE) {
    if (targetStatus === StatusEnum.CONVERTED || targetStatus === StatusEnum.CANCELLED) {
      return { allowed: true };
    }
  }

  return { allowed: false, reason: `Transition from ${currentStatus} to ${targetStatus} is forbidden.` };
}

/**
 * Domain Guard: Determines whether a reservation can be edited based on its status.
 * ACTIVE is editable; CONVERTED and CANCELLED are immutable read-only records.
 */
export function canEditReservation(status: ReservationStatus): { allowed: boolean; reason?: string } {
  if (status === StatusEnum.CONVERTED) {
    return { allowed: false, reason: 'Reservation is CONVERTED and is read-only.' };
  }
  if (status === StatusEnum.CANCELLED) {
    return { allowed: false, reason: 'Reservation is CANCELLED and is read-only.' };
  }
  return { allowed: status === StatusEnum.ACTIVE };
}

/**
 * Domain Guard: Determines whether a reservation can be cancelled.
 */
export function canCancelReservation(status: ReservationStatus): { allowed: boolean; reason?: string } {
  if (status === StatusEnum.CONVERTED) {
    return { allowed: false, reason: 'Converted reservations cannot be cancelled.' };
  }
  if (status === StatusEnum.CANCELLED) {
    return { allowed: false, reason: 'Reservation is already cancelled.' };
  }
  return { allowed: status === StatusEnum.ACTIVE };
}

/**
 * Domain Guard: Determines whether a reservation can be converted upon admission.
 */
export function canConvertReservation(status: ReservationStatus): { allowed: boolean; reason?: string } {
  if (status === StatusEnum.CONVERTED) {
    return { allowed: false, reason: 'Reservation is already converted.' };
  }
  if (status === StatusEnum.CANCELLED) {
    return { allowed: false, reason: 'Cancelled reservations cannot be converted.' };
  }
  return { allowed: status === StatusEnum.ACTIVE };
}
