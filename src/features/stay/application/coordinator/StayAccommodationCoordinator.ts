import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import type { AccommodationRepository } from '../../../accommodation/domain/interfaces/AccommodationRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { defaultStayRepository, InMemoryStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import { defaultAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { defaultResidentRepository, InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import type { CurrentProjection } from '../../domain/valueObjects/CurrentProjection';
import { BedStatus } from '../../../accommodation/domain/valueObjects/BedStatus';
import type { Flat } from '../../../accommodation/domain/entities/Flat';

import type { BedAllocation } from '../../domain/valueObjects/BedAllocation';

export interface AllocateAdditionalBedInput {
  stayId: string;
  flatId: string;
  bedId: string;
  effectiveFrom: string;
  reason?: string;
}

export interface ReleaseBedInput {
  stayId: string;
  bedId: string;
  effectiveUntil: string;
  reason?: string;
}

export interface TransferBedInput {
  stayId: string;
  fromBedId: string;
  toBedId: string;
  effectiveDate: string;
  reason?: string;
}

export interface TransferFlatInput {
  stayId: string;
  newFlatId: string;
  newBedIds: string[];
  effectiveDate: string;
  reason?: string;
}

export class StayAccommodationCoordinator {
  private stayRepo: StayRepository;
  private accommodationRepo: AccommodationRepository;
  private residentRepo: ResidentRepository;

  constructor(
    stayRepo: StayRepository = defaultStayRepository,
    accommodationRepo: AccommodationRepository = defaultAccommodationRepository,
    residentRepo: ResidentRepository = defaultResidentRepository
  ) {
    this.stayRepo = stayRepo;
    this.accommodationRepo = accommodationRepo;
    this.residentRepo = residentRepo;
  }

  private findStay(id: string): Stay | null {
    const inMem = this.stayRepo as InMemoryStayRepository;
    if (inMem.findByIdSync) {
      return inMem.findByIdSync(id);
    }
    return null;
  }

  private findResident(id: string) {
    const inMem = this.residentRepo as InMemoryResidentRepository;
    if (inMem.getByIdSync) {
      return inMem.getByIdSync(id);
    }
    return null;
  }

  private getFlat(id: string): Flat | null {
    const inMem = this.accommodationRepo as any;
    if (inMem && typeof inMem.findByIdSync === 'function') {
      return inMem.findByIdSync(id);
    }
    return null;
  }

  private saveFlat(flat: Flat): void {
    const inMem = this.accommodationRepo as any;
    if (inMem && typeof inMem.saveSync === 'function') {
      inMem.saveSync(flat);
    } else {
      this.accommodationRepo.save(flat);
    }
  }

  private persistStay(stay: Stay): void {
    const inMem = this.stayRepo as InMemoryStayRepository;
    if (inMem.saveSync) {
      inMem.saveSync(stay);
    } else {
      this.stayRepo.save(stay);
    }
  }

  /**
   * Executes Additional Bed Allocation through Stay aggregate and synchronizes AccommodationRepository.
   */
  public allocateAdditionalBed(input: AllocateAdditionalBedInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const flat = this.getFlat(input.flatId);
    if (!flat) {
      throw new Error(`Flat with ID ${input.flatId} not found.`);
    }

    const allBeds = flat.areas.flatMap((a) => a.beds);
    const targetBed = allBeds.find((b) => b.id === input.bedId);
    if (!targetBed) {
      throw new Error(`Bed ${input.bedId} not found in Flat ${input.flatId}.`);
    }

    if (targetBed.status !== BedStatus.VACANT) {
      throw new Error(`Bed ${input.bedId} in Flat ${input.flatId} is currently ${targetBed.status} and cannot be allocated.`);
    }

    const resident = this.findResident(stay.residentId);
    const residentName = resident ? resident.fullName : 'Occupant';

    // Snapshot pre-execution states for rollback
    const staySnapshot = stay;
    const flatSnapshot = JSON.parse(JSON.stringify(flat)) as Flat;

    try {
      // Step 1: Execute aggregate operation
      const projection = stay.allocateAdditionalBed({
        flatId: input.flatId,
        bedId: input.bedId,
        effectiveFrom: input.effectiveFrom,
        reason: input.reason,
      });

      // Step 2: Persist updated Stay aggregate
      this.persistStay(stay);

      // Step 3: Update physical bed status in AccommodationRepository
      const updatedAreas = flat.areas.map((area) => ({
        ...area,
        beds: area.beds.map((b) => {
          if (b.id === input.bedId) {
            return { ...b, status: BedStatus.OCCUPIED, residentName, stayId: stay.id };
          }
          return b;
        }),
      }));
      this.saveFlat({ ...flat, areas: updatedAreas });

      return projection;
    } catch (err) {
      // Rollback on failure
      this.persistStay(staySnapshot);
      this.saveFlat(flatSnapshot);
      throw err;
    }
  }

  /**
   * Executes Bed Release through Stay aggregate and synchronizes AccommodationRepository.
   */
  public releaseBed(input: ReleaseBedInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const activeAlloc = stay.activeBedAllocations.find((ba: BedAllocation) => ba.bedId === input.bedId);
    if (!activeAlloc) {
      throw new Error(`Active bed allocation for bed ${input.bedId} not found on Stay ${input.stayId}.`);
    }

    const flat = this.getFlat(activeAlloc.flatId);
    const staySnapshot = stay;
    const flatSnapshot = flat ? (JSON.parse(JSON.stringify(flat)) as Flat) : null;

    try {
      // Step 1: Execute aggregate operation
      const projection = stay.releaseBed({
        bedId: input.bedId,
        effectiveUntil: input.effectiveUntil,
        reason: input.reason,
      });

      // Step 2: Persist updated Stay aggregate
      this.persistStay(stay);

      // Step 3: Update physical bed status in AccommodationRepository to VACANT
      if (flat) {
        const updatedAreas = flat.areas.map((area) => ({
          ...area,
          beds: area.beds.map((b) => {
            if (b.id === input.bedId) {
              return { ...b, status: BedStatus.VACANT, residentName: undefined, stayId: undefined };
            }
            return b;
          }),
        }));
        this.saveFlat({ ...flat, areas: updatedAreas });
      }

      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      if (flatSnapshot) {
        this.saveFlat(flatSnapshot);
      }
      throw err;
    }
  }

  /**
   * Executes Bed Transfer through Stay aggregate and synchronizes AccommodationRepository.
   */
  public transferBed(input: TransferBedInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const fromAlloc = stay.activeBedAllocations.find((ba: BedAllocation) => ba.bedId === input.fromBedId);
    if (!fromAlloc) {
      throw new Error(`Active bed allocation for bed ${input.fromBedId} not found on Stay ${input.stayId}.`);
    }

    const flat = this.getFlat(fromAlloc.flatId);
    if (!flat) {
      throw new Error(`Flat with ID ${fromAlloc.flatId} not found.`);
    }

    const allBeds = flat.areas.flatMap((a) => a.beds);
    const toBed = allBeds.find((b) => b.id === input.toBedId);
    if (!toBed) {
      throw new Error(`Target bed ${input.toBedId} not found in Flat ${fromAlloc.flatId}.`);
    }

    if (toBed.status !== BedStatus.VACANT) {
      throw new Error(`Target bed ${input.toBedId} in Flat ${fromAlloc.flatId} is currently ${toBed.status} and cannot receive transfer.`);
    }

    const resident = this.findResident(stay.residentId);
    const residentName = resident ? resident.fullName : 'Occupant';

    const staySnapshot = stay;
    const flatSnapshot = JSON.parse(JSON.stringify(flat)) as Flat;

    try {
      // Step 1: Execute aggregate operation
      const projection = stay.transferBed({
        fromBedId: input.fromBedId,
        toBedId: input.toBedId,
        effectiveDate: input.effectiveDate,
        reason: input.reason,
      });

      // Step 2: Persist updated Stay aggregate
      this.persistStay(stay);

      // Step 3: Update physical bed statuses in AccommodationRepository
      const updatedAreas = flat.areas.map((area) => ({
        ...area,
        beds: area.beds.map((b) => {
          if (b.id === input.fromBedId) {
            return { ...b, status: BedStatus.VACANT, residentName: undefined, stayId: undefined };
          }
          if (b.id === input.toBedId) {
            return { ...b, status: BedStatus.OCCUPIED, residentName, stayId: stay.id };
          }
          return b;
        }),
      }));
      this.saveFlat({ ...flat, areas: updatedAreas });

      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      this.saveFlat(flatSnapshot);
      throw err;
    }
  }

  /**
   * Executes Flat Transfer through Stay aggregate and synchronizes AccommodationRepository across both flats.
   */
  public transferFlat(input: TransferFlatInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const previousFlatId = stay.flatId;
    const previousActiveBedIds = stay.allocatedBedIds;

    const previousFlat = this.getFlat(previousFlatId);
    const newFlat = this.getFlat(input.newFlatId);
    if (!newFlat) {
      throw new Error(`Destination Flat with ID ${input.newFlatId} not found.`);
    }

    const newFlatBeds = newFlat.areas.flatMap((a) => a.beds);
    for (const bedId of input.newBedIds) {
      const targetBed = newFlatBeds.find((b) => b.id === bedId);
      if (!targetBed) {
        throw new Error(`Destination bed ${bedId} not found in Flat ${input.newFlatId}.`);
      }
      if (targetBed.status !== BedStatus.VACANT) {
        throw new Error(`Destination bed ${bedId} in Flat ${input.newFlatId} is currently ${targetBed.status} and cannot receive transfer.`);
      }
    }

    const resident = this.findResident(stay.residentId);
    const residentName = resident ? resident.fullName : 'Occupant';

    const staySnapshot = stay;
    const previousFlatSnapshot = previousFlat ? (JSON.parse(JSON.stringify(previousFlat)) as Flat) : null;
    const newFlatSnapshot = JSON.parse(JSON.stringify(newFlat)) as Flat;

    try {
      // Step 1: Execute aggregate operation
      const projection = stay.transferFlat({
        newFlatId: input.newFlatId,
        newBedIds: input.newBedIds,
        effectiveDate: input.effectiveDate,
        reason: input.reason,
      });

      // Step 2: Persist updated Stay aggregate
      this.persistStay(stay);

      // Step 3: Vacate previous flat beds in AccommodationRepository
      if (previousFlat) {
        const updatedPrevAreas = previousFlat.areas.map((area) => ({
          ...area,
          beds: area.beds.map((b) => {
            if (previousActiveBedIds.includes(b.id)) {
              return { ...b, status: BedStatus.VACANT, residentName: undefined, stayId: undefined };
            }
            return b;
          }),
        }));
        this.saveFlat({ ...previousFlat, areas: updatedPrevAreas });
      }

      // Step 4: Occupy new flat beds in AccommodationRepository
      const updatedNewAreas = newFlat.areas.map((area) => ({
        ...area,
        beds: area.beds.map((b) => {
          if (input.newBedIds.includes(b.id)) {
            return { ...b, status: BedStatus.OCCUPIED, residentName, stayId: stay.id };
          }
          return b;
        }),
      }));
      this.saveFlat({ ...newFlat, areas: updatedNewAreas });

      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      if (previousFlatSnapshot) {
        this.saveFlat(previousFlatSnapshot);
      }
      this.saveFlat(newFlatSnapshot);
      throw err;
    }
  }
}
