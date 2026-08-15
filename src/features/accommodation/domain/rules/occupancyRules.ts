import type { Area } from '../entities/Area';
import type { Bed } from '../entities/Bed';
import type { Flat } from '../entities/Flat';
import { BedStatus } from '../valueObjects/BedStatus';

export interface ResidentOccupancyInput {
  fullName: string;
  status: string;
  stayId?: string;
}

/**
 * Domain Rule: Determines whether a Bed is currently occupied by a resident
 * (either active, on notice, or assigned an occupying resident name).
 */
export function isBedOccupied(bed: Bed): boolean {
  return (
    bed.status === BedStatus.OCCUPIED ||
    bed.status === BedStatus.ON_NOTICE ||
    Boolean(bed.residentName && bed.residentName.trim() !== '')
  );
}

/**
 * Domain Rule: Determines whether an Area or Bed collection contains any occupied beds.
 */
export function hasOccupiedBeds(area: Area | { beds: Bed[] }): boolean {
  return area.beds.some(isBedOccupied);
}

/**
 * Domain Rule: Determines whether an Area can be deleted.
 * Returns decision and list of occupied beds if deletion is prevented.
 */
export function canDeleteArea(area: Area | { beds: Bed[] }): { canDelete: boolean; occupiedBeds: Bed[] } {
  const occupiedBeds = area.beds.filter(isBedOccupied);
  return { canDelete: occupiedBeds.length === 0, occupiedBeds };
}

/**
 * Domain Rule: Determines whether a Flat can be deleted.
 * Returns decision and list of occupied beds if deletion is prevented.
 */
export function canDeleteFlat(flat: Flat): { canDelete: boolean; occupiedBeds: Bed[] } {
  const occupiedBeds = flat.areas.flatMap((a) => a.beds).filter(isBedOccupied);
  return { canDelete: occupiedBeds.length === 0, occupiedBeds };
}

/**
 * Domain Rule: Determines the synchronized status, residentName, stayId and pricing state of a Bed
 * given the presence and status of an occupying resident stay.
 */
export function synchronizeBedOccupancy(
  bed: Bed,
  resident: ResidentOccupancyInput | undefined,
  areaDefaultRent: number,
  areaDefaultDeposit: number
): { synchronizedBed: Bed; isChanged: boolean } {
  let expectedStatus: BedStatus;
  let expectedResidentName: string | undefined;
  let expectedStayId: string | undefined;
  const expectedBedRent = bed.defaultRent !== undefined ? bed.defaultRent : areaDefaultRent;
  const expectedBedDeposit = bed.defaultDeposit !== undefined ? bed.defaultDeposit : areaDefaultDeposit;

  if (resident) {
    expectedStatus = resident.status === 'ON_NOTICE' ? BedStatus.ON_NOTICE : BedStatus.OCCUPIED;
    expectedResidentName = resident.fullName;
    expectedStayId = resident.stayId;
  } else {
    expectedResidentName = undefined;
    expectedStayId = undefined;
    if (bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.ON_NOTICE) {
      expectedStatus = BedStatus.VACANT;
    } else {
      expectedStatus = bed.status;
    }
  }

  const isChanged =
    bed.status !== expectedStatus ||
    bed.residentName !== expectedResidentName ||
    bed.stayId !== expectedStayId ||
    bed.defaultRent !== expectedBedRent ||
    bed.defaultDeposit !== expectedBedDeposit;

  const synchronizedBed: Bed = isChanged
    ? {
        ...bed,
        status: expectedStatus,
        residentName: expectedResidentName,
        stayId: expectedStayId,
        defaultRent: expectedBedRent,
        defaultDeposit: expectedBedDeposit,
      }
    : bed;

  return { synchronizedBed, isChanged };
}

