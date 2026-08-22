import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { InMemoryStayRepository, defaultStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import type { AccommodationRepository } from '../../../accommodation/domain/interfaces/AccommodationRepository';
import { defaultAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { defaultResidentRepository, InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { BedStatus } from '../../../accommodation/domain/valueObjects/BedStatus';
import type { CurrentProjection } from '../../domain/valueObjects/CurrentProjection';
import type { Flat } from '../../../accommodation/domain/entities/Flat';

import { StayCheckoutCoordinator } from './StayCheckoutCoordinator';

export interface ActivateStayInput {
  stayId: string;
  effectiveDate?: string;
  reason?: string;
}

export interface CancelPlannedStayInput {
  stayId: string;
  cancellationDate: string;
  reason: string;
}

export interface GiveNoticeInput {
  stayId: string;
  noticeDate: string;
  expectedCheckoutDate: string;
  reason?: string;
}

export interface ProcessCheckoutInput {
  stayId: string;
  actualCheckoutDate: string;
  reason?: string;
}

export interface CloseStayInput {
  stayId: string;
  closedDate: string;
  reason?: string;
}

export class StayLifecycleCoordinator {
  private stayRepo: StayRepository;
  private accommodationRepo: AccommodationRepository;
  private residentRepo: ResidentRepository;
  private checkoutCoordinator: StayCheckoutCoordinator;

  constructor(
    stayRepo: StayRepository = defaultStayRepository,
    accommodationRepo: AccommodationRepository = defaultAccommodationRepository,
    residentRepo: ResidentRepository = defaultResidentRepository,
    checkoutCoordinator?: StayCheckoutCoordinator
  ) {
    this.stayRepo = stayRepo;
    this.accommodationRepo = accommodationRepo;
    this.residentRepo = residentRepo;
    this.checkoutCoordinator =
      checkoutCoordinator || new StayCheckoutCoordinator(stayRepo, accommodationRepo, residentRepo);
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

  private findFlat(flatId: string): Flat | null {
    let flat = this.getFlat(flatId);
    if (!flat && flatId.startsWith('FLAT-')) {
      flat = this.getFlat(flatId.replace('FLAT-', ''));
    }
    if (!flat) {
      flat = this.getFlat(`FLAT-${flatId}`);
    }
    return flat;
  }

  private isBedMatch(bed: { id: string; name: string }, targetBedId: string): boolean {
    if (bed.id === targetBedId || bed.name === targetBedId) return true;
    const cleanTarget = targetBedId.replace('BED-', '');
    if (bed.id === cleanTarget || bed.name === cleanTarget) return true;
    if (bed.id.endsWith(`-${cleanTarget}`)) return true;
    return false;
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
   * Activates a PLANNED Stay upon physical check-in and projects bed occupancy to AccommodationRepository.
   */
  public activateStay(input: ActivateStayInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const resident = this.findResident(stay.residentId);
    const residentName = resident ? resident.fullName : 'Occupant';
    const staySnapshot = new Stay(stay);
    let flatSnapshot: Flat | null = null;

    try {
      const projection = stay.activateStay({
        effectiveDate: input.effectiveDate,
        reason: input.reason,
      });

      this.persistStay(stay);

      // Synchronize bed projection in AccommodationRepository
      const activeAllocations = stay.activeBedAllocations;
      if (activeAllocations.length > 0) {
        const flatId = activeAllocations[0].flatId;
        const flat = this.findFlat(flatId);
        if (flat) {
          flatSnapshot = JSON.parse(JSON.stringify(flat)) as Flat;
          const bedIdsToOccupy = activeAllocations.map((ba) => ba.bedId);
          const updatedAreas = flat.areas.map((area) => ({
            ...area,
            beds: area.beds.map((b) => {
              if (bedIdsToOccupy.some((targetId) => this.isBedMatch(b, targetId))) {
                return {
                  ...b,
                  status: BedStatus.OCCUPIED,
                  residentName,
                  stayId: stay.id,
                };
              }
              return b;
            }),
          }));
          this.saveFlat({ ...flat, areas: updatedAreas });
        }
      }

      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      if (flatSnapshot) {
        try { this.saveFlat(flatSnapshot); } catch { /* retain original failure */ }
      }
      throw err;
    }
  }

  /**
   * Cancels a PLANNED Stay prior to occupancy and clears any bed projection.
   */
  public cancelPlannedStay(input: CancelPlannedStayInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const activeAllocations = [...stay.activeBedAllocations];
    const staySnapshot = new Stay(stay);

    try {
      const projection = stay.cancelPlannedStay({
        cancellationDate: input.cancellationDate,
        reason: input.reason,
      });

      this.persistStay(stay);

      // Clear any bed allocations in AccommodationRepository
      if (activeAllocations.length > 0) {
        const flatId = activeAllocations[0].flatId;
        const flat = this.findFlat(flatId);
        if (flat) {
          const bedIdsToClear = activeAllocations.map((ba) => ba.bedId);
          const updatedAreas = flat.areas.map((area) => ({
            ...area,
            beds: area.beds.map((b) => {
              if (bedIdsToClear.some((targetId) => this.isBedMatch(b, targetId))) {
                const { stayId: _s, residentName: _r, ...clearedBed } = b;
                return {
                  ...clearedBed,
                  status: BedStatus.VACANT,
                };
              }
              return b;
            }),
          }));
          this.saveFlat({ ...flat, areas: updatedAreas });
        }
      }

      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      throw err;
    }
  }

  /**
   * Places an ACTIVE Stay on Notice. Bed remains occupied (ON_NOTICE) and occupied by Stay ID.
   */
  public giveNotice(input: GiveNoticeInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const resident = this.findResident(stay.residentId);
    const residentName = resident ? resident.fullName : 'Occupant';
    const staySnapshot = new Stay(stay);

    try {
      const projection = stay.giveNotice({
        noticeDate: input.noticeDate,
        expectedCheckoutDate: input.expectedCheckoutDate,
        reason: input.reason,
      });

      this.persistStay(stay);

      // Bed status updated to ON_NOTICE while retaining stayId projection
      const activeAllocations = stay.activeBedAllocations;
      if (activeAllocations.length > 0) {
        const flatId = activeAllocations[0].flatId;
        const flat = this.findFlat(flatId);
        if (flat) {
          const bedIdsToNotice = activeAllocations.map((ba) => ba.bedId);
          const updatedAreas = flat.areas.map((area) => ({
            ...area,
            beds: area.beds.map((b) => {
              if (bedIdsToNotice.some((targetId) => this.isBedMatch(b, targetId))) {
                return {
                  ...b,
                  status: BedStatus.ON_NOTICE,
                  residentName,
                  stayId: stay.id,
                };
              }
              return b;
            }),
          }));
          this.saveFlat({ ...flat, areas: updatedAreas });
        }
      }

      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      throw err;
    }
  }

  /**
   * Performs Operational Checkout on an ACTIVE or ON_NOTICE Stay by delegating to canonical StayCheckoutCoordinator.
   */
  public processCheckout(input: ProcessCheckoutInput): CurrentProjection {
    return this.checkoutCoordinator.processCheckout(input);
  }

  /**
   * Closes a CHECKED_OUT Stay (CHECKED_OUT -> CLOSED). Bed projection remains cleared.
   */
  public closeStay(input: CloseStayInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const staySnapshot = new Stay(stay);

    try {
      const projection = stay.closeStay({
        closedDate: input.closedDate,
        reason: input.reason,
      });

      this.persistStay(stay);
      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      throw err;
    }
  }
}
