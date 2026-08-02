import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { InMemoryStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import type { CurrentProjection } from '../../domain/valueObjects/CurrentProjection';

export interface ReviseRentInput {
  stayId: string;
  newRent: number;
  effectiveDate: string;
  reason: string;
}

export interface ReviseDepositInput {
  stayId: string;
  newDeposit: number;
  effectiveDate: string;
  reason: string;
}

export interface ReviseCommercialTermsInput {
  stayId: string;
  newRent: number;
  newDeposit: number;
  effectiveDate: string;
  reason: string;
}

export class StayCommercialCoordinator {
  private stayRepo: StayRepository;

  constructor(stayRepo: StayRepository = new InMemoryStayRepository()) {
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
   * Orchestrates rent revision through Stay aggregate and persists to StayRepository.
   */
  public reviseRent(input: ReviseRentInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const staySnapshot = stay;

    try {
      const projection = stay.reviseRent({
        newRent: input.newRent,
        effectiveDate: input.effectiveDate,
        reason: input.reason,
      });

      this.persistStay(stay);
      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      throw err;
    }
  }

  /**
   * Orchestrates deposit revision through Stay aggregate and persists to StayRepository.
   */
  public reviseDeposit(input: ReviseDepositInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const staySnapshot = stay;

    try {
      const projection = stay.reviseDeposit({
        newDeposit: input.newDeposit,
        effectiveDate: input.effectiveDate,
        reason: input.reason,
      });

      this.persistStay(stay);
      return projection;
    } catch (err) {
      this.persistStay(staySnapshot);
      throw err;
    }
  }

  /**
   * Orchestrates simultaneous rent and deposit revision through Stay aggregate and persists to StayRepository.
   */
  public reviseCommercialTerms(input: ReviseCommercialTermsInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const staySnapshot = stay;

    try {
      const projection = stay.reviseCommercialTerms({
        newRent: input.newRent,
        newDeposit: input.newDeposit,
        effectiveDate: input.effectiveDate,
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
