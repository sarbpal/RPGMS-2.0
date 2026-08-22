import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { defaultStayRepository, InMemoryStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import type { AccommodationRepository } from '../../../accommodation/domain/interfaces/AccommodationRepository';
import { defaultAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { defaultResidentRepository, InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { BedStatus } from '../../../accommodation/domain/valueObjects/BedStatus';
import type { Flat } from '../../../accommodation/domain/entities/Flat';
import type { CurrentProjection } from '../../domain/valueObjects/CurrentProjection';
import { ResidentLifecycleService } from '../../../resident/services/ResidentLifecycleService';
import type { Resident } from '../../../resident/domain/entities/Resident';

export interface ProcessCheckoutInput {
  stayId: string;
  actualCheckoutDate: string;
  reason?: string;
}

export class StayCheckoutCoordinator {
  private stayRepo: StayRepository;
  private accommodationRepo: AccommodationRepository;
  private residentRepo: ResidentRepository;
  private residentLifecycleService: ResidentLifecycleService;

  private static activeStayLocks = new Set<string>();

  constructor(
    stayRepo: StayRepository = defaultStayRepository,
    accommodationRepo: AccommodationRepository = defaultAccommodationRepository,
    residentRepo: ResidentRepository = defaultResidentRepository,
    residentLifecycleService?: ResidentLifecycleService
  ) {
    this.stayRepo = stayRepo;
    this.accommodationRepo = accommodationRepo;
    this.residentRepo = residentRepo;
    this.residentLifecycleService =
      residentLifecycleService ?? new ResidentLifecycleService(residentRepo, stayRepo);
  }

  private findStay(id: string): Stay | null {
    const inMem = this.stayRepo as InMemoryStayRepository;
    if (inMem.findByIdSync) {
      return inMem.findByIdSync(id);
    }
    return null;
  }

  private findResident(id: string): Resident | null {
    const inMem = this.residentRepo as InMemoryResidentRepository;
    if (inMem.getByIdSync) {
      return inMem.getByIdSync(id);
    }
    return null;
  }

  private findFlat(flatId: string): Flat | null {
    let flat = this.accommodationRepo.findById(flatId);
    if (!flat && flatId.startsWith('FLAT-')) {
      flat = this.accommodationRepo.findById(flatId.replace('FLAT-', ''));
    }
    if (!flat && !flatId.startsWith('FLAT-')) {
      flat = this.accommodationRepo.findById(`FLAT-${flatId}`);
    }
    return flat;
  }

  private isBedMatch(bed: { id: string; name: string }, targetBedId: string): boolean {
    if (bed.id === targetBedId || bed.name === targetBedId) return true;
    const cleanTarget = targetBedId.replace('BED-', '');
    if (bed.id === cleanTarget || bed.name === cleanTarget) return true;
    if (bed.id.endsWith(`-${cleanTarget}`)) return true;
    if (targetBedId.endsWith(`-${bed.id}`)) return true;
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
   * Canonical Operational Checkout Implementation (FC-05, BR-460).
   *
   * Coordinates:
   * 1. Stay aggregate operational checkout (status -> CHECKED_OUT, bed allocations -> RELEASED, commercial -> HISTORICAL).
   * 2. Physical accommodation release across all active beds in AccommodationRepository (bed.status -> VACANT).
   * 3. Cross-domain Resident Lifecycle Evaluation (evaluates complete Alumni invariant).
   * 4. Multi-domain snapshot capture and compensating rollback boundary on failure.
   * 5. Per-stay in-memory concurrency locking.
   * 6. Does NOT post financial ledger entries or perform settlement.
   */
  public processCheckout(input: ProcessCheckoutInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    if (StayCheckoutCoordinator.activeStayLocks.has(input.stayId)) {
      throw new Error(`Operational checkout is currently in progress for stay ${input.stayId}.`);
    }

    StayCheckoutCoordinator.activeStayLocks.add(input.stayId);

    // Capture true pre-operation deep clone snapshots for compensating rollback
    const staySnapshot = new Stay(stay);
    const residentSnapshot = this.findResident(stay.residentId);
    const flatSnapshots = new Map<string, Flat>();

    const activeAllocations = [...stay.activeBedAllocations];
    activeAllocations.forEach((alloc) => {
      if (alloc.flatId && alloc.flatId !== 'Unassigned') {
        const flat = this.findFlat(alloc.flatId);
        if (flat && !flatSnapshots.has(flat.id)) {
          flatSnapshots.set(flat.id, JSON.parse(JSON.stringify(flat)) as Flat);
        }
      }
    });

    try {
      // 1. Perform domain operational checkout on Stay aggregate
      const projection = stay.processCheckout({
        actualCheckoutDate: input.actualCheckoutDate,
        reason: input.reason,
      });

      // 2. Persist Stay state
      this.persistStay(stay);

      // 3. Synchronize physical accommodation release across all active beds in AccommodationRepository
      if (activeAllocations.length > 0) {
        // Group allocations by flatId to support multi-bed/multi-flat stays
        const flatIds = Array.from(new Set(activeAllocations.map((ba) => ba.flatId)));

        flatIds.forEach((flatId) => {
          if (flatId === 'Unassigned') return;
          const flat = this.findFlat(flatId);
          if (flat) {
            const bedIdsForThisFlat = activeAllocations
              .filter((ba) => ba.flatId === flatId)
              .map((ba) => ba.bedId);

            const updatedAreas = flat.areas.map((area) => ({
              ...area,
              beds: area.beds.map((b) => {
                if (bedIdsForThisFlat.some((targetId) => this.isBedMatch(b, targetId))) {
                  return {
                    ...b,
                    status: BedStatus.VACANT,
                    residentName: undefined,
                    stayId: undefined,
                  };
                }
                return b;
              }),
            }));

            this.accommodationRepo.save({ ...flat, areas: updatedAreas });
          }
        });
      }

      // 4. Trigger Cross-Domain Resident Lifecycle Evaluation (AL-002, BR-461)
      this.residentLifecycleService.evaluateAndSyncResidentStatus(stay.residentId);

      return projection;
    } catch (err) {
      // Execute compensating rollback restoring pristine pre-operation state
      this.persistStay(staySnapshot);
      flatSnapshots.forEach((snap) => {
        try {
          this.accommodationRepo.save(snap);
        } catch {
          /* preserve original error */
        }
      });
      if (residentSnapshot) {
        try {
          const inMemRes = this.residentRepo as InMemoryResidentRepository;
          if (inMemRes.saveSync) {
            inMemRes.saveSync(residentSnapshot);
          } else {
            this.residentRepo.save(residentSnapshot);
          }
        } catch {
          /* preserve original error */
        }
      }
      throw err;
    } finally {
      StayCheckoutCoordinator.activeStayLocks.delete(input.stayId);
    }
  }

  /**
   * Alias method for completeCheckout.
   */
  public completeCheckout(input: ProcessCheckoutInput): CurrentProjection {
    return this.processCheckout(input);
  }
}

export const defaultStayCheckoutCoordinator = new StayCheckoutCoordinator();
