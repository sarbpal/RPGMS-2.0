import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { InMemoryStayRepository, defaultStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import type { CurrentProjection } from '../../domain/valueObjects/CurrentProjection';

export interface ChangeBillingCycleInput {
  stayId: string;
  requestedBillingAnchor: number;
  effectiveFrom: string;
  reason: string;
  financialAdjustmentReference?: string;
}

export class StayBillingCycleCoordinator {
  private stayRepo: StayRepository;

  constructor(stayRepo: StayRepository = defaultStayRepository) {
    this.stayRepo = stayRepo;
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
   * Application use case for requesting/executing a billing cycle anchor change.
   * Preserves immutable checkInDate and maintains strict financial separation:
   * does NOT calculate prorata amounts, post ledger entries, or process payments.
   */
  public changeBillingCycle(input: ChangeBillingCycleInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const staySnapshot = new Stay(stay);

    try {
      const projection = stay.changeBillingCycle({
        requestedBillingAnchor: input.requestedBillingAnchor,
        effectiveFrom: input.effectiveFrom,
        reason: input.reason,
        financialAdjustmentReference: input.financialAdjustmentReference,
      });

      this.persistStay(stay);
      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      throw err;
    }
  }
}
