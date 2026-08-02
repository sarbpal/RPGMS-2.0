import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { InMemoryStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import type { CurrentProjection } from '../../domain/valueObjects/CurrentProjection';

export interface GiveNoticeInput {
  stayId: string;
  noticeDate: string;
  expectedCheckoutDate: string;
  reason?: string;
}

export class StayNoticeCoordinator {
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
   * Orchestrates placing a Stay on Notice through the Stay aggregate and persists to StayRepository.
   */
  public giveNotice(input: GiveNoticeInput): CurrentProjection {
    const stay = this.findStay(input.stayId);
    if (!stay) {
      throw new Error(`Stay with ID ${input.stayId} not found.`);
    }

    const staySnapshot = stay;

    try {
      const projection = stay.giveNotice({
        noticeDate: input.noticeDate,
        expectedCheckoutDate: input.expectedCheckoutDate,
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
