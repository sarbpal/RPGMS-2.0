import type { Bed } from '../entities/Bed';
import { BedStatus } from '../valueObjects/BedStatus';

export interface BedOperationResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Domain Rule: Determines whether a bed can be administratively blocked.
 * Allowed from VACANT or MAINTENANCE. Forbidden if OCCUPIED, ON_NOTICE, or RESERVED.
 */
export function canBlockBed(bed: Bed): BedOperationResult {
  if (bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.ON_NOTICE) {
    return { allowed: false, reason: `Bed ${bed.name} is currently occupied by a resident and cannot be blocked.` };
  }
  if (bed.status === BedStatus.RESERVED) {
    return { allowed: false, reason: `Bed ${bed.name} is reserved and cannot be blocked.` };
  }
  if (bed.status === BedStatus.BLOCKED) {
    return { allowed: false, reason: `Bed ${bed.name} is already blocked.` };
  }
  return { allowed: true };
}

/**
 * Domain Rule: Executes the Block Bed operation.
 */
export function executeBlockBed(bed: Bed): Bed {
  const check = canBlockBed(bed);
  if (!check.allowed) {
    throw new Error(check.reason);
  }
  return { ...bed, status: BedStatus.BLOCKED };
}

/**
 * Domain Rule: Determines whether a blocked bed can be unblocked.
 * Allowed only when bed is currently BLOCKED.
 */
export function canUnblockBed(bed: Bed): BedOperationResult {
  if (bed.status !== BedStatus.BLOCKED) {
    return { allowed: false, reason: `Bed ${bed.name} is not currently blocked.` };
  }
  return { allowed: true };
}

/**
 * Domain Rule: Executes the Unblock Bed operation.
 */
export function executeUnblockBed(bed: Bed): Bed {
  const check = canUnblockBed(bed);
  if (!check.allowed) {
    throw new Error(check.reason);
  }
  return { ...bed, status: BedStatus.VACANT };
}

/**
 * Domain Rule: Determines whether a bed can be placed into maintenance hold.
 * Allowed from VACANT or BLOCKED. Forbidden if OCCUPIED, ON_NOTICE, or RESERVED.
 */
export function canStartMaintenance(bed: Bed): BedOperationResult {
  if (bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.ON_NOTICE) {
    return { allowed: false, reason: `Bed ${bed.name} is currently occupied by a resident and cannot be put into maintenance.` };
  }
  if (bed.status === BedStatus.RESERVED) {
    return { allowed: false, reason: `Bed ${bed.name} is reserved and cannot be put into maintenance.` };
  }
  if (bed.status === BedStatus.MAINTENANCE) {
    return { allowed: false, reason: `Bed ${bed.name} is already under maintenance.` };
  }
  return { allowed: true };
}

/**
 * Domain Rule: Executes the Start Bed Maintenance operation.
 */
export function executeStartMaintenance(bed: Bed): Bed {
  const check = canStartMaintenance(bed);
  if (!check.allowed) {
    throw new Error(check.reason);
  }
  return { ...bed, status: BedStatus.MAINTENANCE };
}

/**
 * Domain Rule: Determines whether maintenance on a bed can be completed.
 * Allowed only when bed is currently under MAINTENANCE.
 */
export function canCompleteMaintenance(bed: Bed): BedOperationResult {
  if (bed.status !== BedStatus.MAINTENANCE) {
    return { allowed: false, reason: `Bed ${bed.name} is not currently under maintenance.` };
  }
  return { allowed: true };
}

/**
 * Domain Rule: Executes the Complete Bed Maintenance operation.
 */
export function executeCompleteMaintenance(bed: Bed): Bed {
  const check = canCompleteMaintenance(bed);
  if (!check.allowed) {
    throw new Error(check.reason);
  }
  return { ...bed, status: BedStatus.VACANT };
}
