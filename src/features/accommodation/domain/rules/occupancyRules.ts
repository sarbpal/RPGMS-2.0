import type { Bed } from '../entities/Bed';
import { BedStatus } from '../valueObjects/BedStatus';

export interface ResidentOccupancyInput {
  fullName: string;
  status: string;
}

/**
 * Domain Rule: Determines the synchronized status and pricing state of a Bed 
 * given the presence and status of an occupying resident.
 */
export function synchronizeBedOccupancy(
  bed: Bed,
  resident: ResidentOccupancyInput | undefined,
  areaDefaultRent: number,
  areaDefaultDeposit: number
): { synchronizedBed: Bed; isChanged: boolean } {
  let expectedStatus: BedStatus;
  let expectedResidentName: string | undefined;
  const expectedBedRent = bed.defaultRent !== undefined ? bed.defaultRent : areaDefaultRent;
  const expectedBedDeposit = bed.defaultDeposit !== undefined ? bed.defaultDeposit : areaDefaultDeposit;

  if (resident) {
    expectedStatus = resident.status === 'ON_NOTICE' ? BedStatus.ON_NOTICE : BedStatus.OCCUPIED;
    expectedResidentName = resident.fullName;
  } else {
    expectedResidentName = undefined;
    if (bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.ON_NOTICE) {
      expectedStatus = BedStatus.VACANT;
    } else {
      expectedStatus = bed.status;
    }
  }

  const isChanged =
    bed.status !== expectedStatus ||
    bed.residentName !== expectedResidentName ||
    bed.defaultRent !== expectedBedRent ||
    bed.defaultDeposit !== expectedBedDeposit;

  const synchronizedBed: Bed = isChanged
    ? {
        ...bed,
        status: expectedStatus,
        residentName: expectedResidentName,
        defaultRent: expectedBedRent,
        defaultDeposit: expectedBedDeposit,
      }
    : bed;

  return { synchronizedBed, isChanged };
}
