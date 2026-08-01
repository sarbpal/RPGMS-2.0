import type { Reservation } from '../entities/Reservation';
import { ReservationStatus } from '../valueObjects/ReservationStatus';

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
 * Domain Rule: Validates lightweight reservation creation input.
 */
export function validateReservationDraft(
  prospectName: string,
  mobileNumber: string,
  expectedJoiningDate: string
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
  }

  return { isValid, errors };
}

/**
 * Domain Rule: Decision Support check for duplicate active reservations on same mobile number.
 * Returns warning prompt information without blocking operator judgement (BR-RESV-006).
 */
export function checkDuplicateMobile(
  existingActiveReservation: Reservation | null
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
 * Surfaces "Overdue by X days" for Decision Support.
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
 * Domain Rule: Validates permitted reservation status transitions.
 */
export function canTransitionStatus(
  currentStatus: ReservationStatus,
  targetStatus: ReservationStatus
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  if (currentStatus === ReservationStatus.CONVERTED) {
    return { allowed: false, reason: 'CONVERTED reservations are read-only and cannot be modified.' };
  }

  if (currentStatus === ReservationStatus.CANCELLED) {
    return { allowed: false, reason: 'CANCELLED reservations are read-only and cannot be modified.' };
  }

  if (
    targetStatus === ReservationStatus.ACTIVE ||
    targetStatus === ReservationStatus.FOLLOW_UP_REQUIRED ||
    targetStatus === ReservationStatus.CONVERTED ||
    targetStatus === ReservationStatus.CANCELLED
  ) {
    return { allowed: true };
  }

  return { allowed: false, reason: `Transition from ${currentStatus} to ${targetStatus} is forbidden.` };
}

/**
 * Domain Guard: Determines whether a reservation can be edited based on its status.
 * ACTIVE and FOLLOW_UP_REQUIRED are editable; CONVERTED and CANCELLED are read-only.
 */
export function canEditReservation(status: ReservationStatus): { allowed: boolean; reason?: string } {
  if (status === ReservationStatus.CONVERTED) {
    return { allowed: false, reason: 'Reservation is CONVERTED and is read-only.' };
  }
  if (status === ReservationStatus.CANCELLED) {
    return { allowed: false, reason: 'Reservation is CANCELLED and is read-only.' };
  }
  return { allowed: true };
}

/**
 * Domain Guard: Determines whether a reservation can be cancelled.
 * ACTIVE and FOLLOW_UP_REQUIRED can be cancelled; CONVERTED and CANCELLED cannot.
 */
export function canCancelReservation(status: ReservationStatus): { allowed: boolean; reason?: string } {
  if (status === ReservationStatus.CONVERTED) {
    return { allowed: false, reason: 'Converted reservations cannot be cancelled.' };
  }
  if (status === ReservationStatus.CANCELLED) {
    return { allowed: false, reason: 'Reservation is already cancelled.' };
  }
  return { allowed: true };
}

/**
 * Domain Rule: Determines automatic status recovery when updating joining date (BR-RESV-005).
 * If status is FOLLOW_UP_REQUIRED and newJoiningDate >= referenceDate, recovers status to ACTIVE.
 */
export function determineStatusRecovery(
  currentStatus: ReservationStatus,
  newJoiningDate: string,
  referenceDate: string = new Date().toISOString().split('T')[0]
): ReservationStatus {
  if (currentStatus === ReservationStatus.FOLLOW_UP_REQUIRED && newJoiningDate >= referenceDate) {
    return ReservationStatus.ACTIVE;
  }
  return currentStatus;
}
