import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { InMemoryStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import type { AccommodationRepository } from '../../../accommodation/domain/interfaces/AccommodationRepository';
import { InMemoryAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { BedStatus } from '../../../accommodation/domain/valueObjects/BedStatus';
import type { CurrentProjection } from '../../domain/valueObjects/CurrentProjection';

export interface ProcessCheckoutInput {
  stayId: string;
  actualCheckoutDate: string;
  reason?: string;
}

export class StayCheckoutCoordinator {
  private stayRepo: StayRepository;
  private accommodationRepo: AccommodationRepository;

  constructor(
    stayRepo: StayRepository = new InMemoryStayRepository(),
    accommodationRepo: AccommodationRepository = new InMemoryAccommodationRepository()
  ) {
    this.stayRepo = stayRepo;
    this.accommodationRepo = accommodationRepo;
  }

  private findStay(id: string): Stay | null {
    const inMem = this.stayRepo as InMemoryStayRepository;
    if (inMem.findByIdSync) {
      return inMem.findByIdSync(id);
    }
    return null;
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
   * Orchestrates Operational Checkout through the Stay aggregate,
   * releases physical beds in AccommodationRepository, and persists to StayRepository.
   */
  public processCheckout(input: ProcessCheckoutInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const staySnapshot = stay;
    const activeAllocations = [...stay.activeBedAllocations];

    try {
      const projection = stay.processCheckout({
        actualCheckoutDate: input.actualCheckoutDate,
        reason: input.reason,
      });

      this.persistStay(stay);

      // Synchronize physical accommodation release in AccommodationRepository
      if (activeAllocations.length > 0) {
        const flatId = activeAllocations[0].flatId;
        const flat = this.accommodationRepo.findById(flatId);
        if (flat) {
          const bedIdsToRelease = activeAllocations.map((ba) => ba.bedId);
          const updatedAreas = flat.areas.map((area) => ({
            ...area,
            beds: area.beds.map((b) => {
              if (bedIdsToRelease.includes(b.id)) {
                return { ...b, status: BedStatus.VACANT, residentName: undefined, stayId: undefined };
              }
              return b;
            }),
          }));
          this.accommodationRepo.save({ ...flat, areas: updatedAreas });
        }
      }

      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      throw err;
    }
  }

  /**
   * Alias method for completeCheckout.
   */
  public completeCheckout(input: ProcessCheckoutInput): CurrentProjection {
    return this.processCheckout(input);
  }
}
