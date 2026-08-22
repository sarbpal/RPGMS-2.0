import type { Resident } from '../domain/entities/Resident';
import { ResidentStatus } from '../domain/valueObjects/ResidentStatus';
import type { ResidentRepository } from '../domain/interfaces/ResidentRepository';
import { defaultResidentRepository, InMemoryResidentRepository } from '../infrastructure/repositories/InMemoryResidentRepository';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import { defaultStayRepository, InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { StayStatus } from '../../stay/domain/valueObjects/StayStatus';
import type { FinanceRepository } from '../../finance/domain/interfaces/FinanceRepository';
import { defaultFinanceRepository } from '../../finance/infrastructure/repositories/InMemoryFinanceRepository';

export class ResidentLifecycleService {
  private residentRepo: ResidentRepository;
  private stayRepo: StayRepository;
  private financeRepo: FinanceRepository;

  constructor(
    residentRepo: ResidentRepository = defaultResidentRepository,
    stayRepo: StayRepository = defaultStayRepository,
    financeRepo: FinanceRepository = defaultFinanceRepository
  ) {
    this.residentRepo = residentRepo;
    this.stayRepo = stayRepo;
    this.financeRepo = financeRepo;
  }

  private findResident(residentId: string): Resident | null {
    const inMem = this.residentRepo as InMemoryResidentRepository;
    if (inMem.getByIdSync) {
      return inMem.getByIdSync(residentId);
    }
    return null;
  }

  private saveResident(resident: Resident): void {
    this.residentRepo.save(resident);
  }

  private getStaysForResident(residentId: string) {
    const inMem = this.stayRepo as InMemoryStayRepository;
    if (inMem.getAllSync) {
      return inMem.getAllSync().filter((s) => s.residentId === residentId);
    }
    return [];
  }

  /**
   * Canonical Cross-Domain Resident Lifecycle Evaluation (BR-461, AL-002).
   *
   * A Resident transitions to ALUMNI if and only if:
   * 1. The resident has at least one stay record.
   * 2. ALL non-cancelled stays for the resident are operationally closed (CHECKED_OUT or CLOSED).
   *    (Zero ACTIVE, ON_NOTICE, or PLANNED stays exist).
   * 3. ALL relevant CHECKED_OUT / CLOSED stays have completed Financial Settlement.
   *
   * If any of these conditions is not satisfied, the Resident remains ACTIVE.
   */
  public evaluateAndSyncResidentStatus(residentId: string): Resident | null {
    const resident = this.findResident(residentId);
    if (!resident) {
      return null;
    }

    const residentStays = this.getStaysForResident(residentId);
    if (residentStays.length === 0) {
      return resident;
    }

    // 1. Check for any active, on-notice, or planned occupancy
    const hasUnclosedStays = residentStays.some(
      (s) =>
        s.status === StayStatus.ACTIVE ||
        s.status === StayStatus.ON_NOTICE ||
        s.status === StayStatus.PLANNED
    );

    if (hasUnclosedStays) {
      if (resident.status === ResidentStatus.ALUMNI) {
        const updated: Resident = {
          ...resident,
          status: ResidentStatus.ACTIVE,
          updatedAt: new Date().toISOString(),
        };
        this.saveResident(updated);
        return updated;
      }
      return resident;
    }

    // 2. Filter non-cancelled historical stays (CHECKED_OUT or CLOSED)
    const operationalClosedStays = residentStays.filter(
      (s) => s.status === StayStatus.CHECKED_OUT || s.status === StayStatus.CLOSED
    );

    if (operationalClosedStays.length === 0) {
      return resident;
    }

    // 3. Verify Financial Settlement is complete for all operationally closed stays
    const allStaysSettled = operationalClosedStays.every((stay) => {
      const settlement = this.financeRepo.getSettlementByStayId(stay.id);
      return settlement !== null;
    });

    const now = new Date().toISOString();

    if (allStaysSettled) {
      if (resident.status !== ResidentStatus.ALUMNI) {
        const updated: Resident = {
          ...resident,
          status: ResidentStatus.ALUMNI,
          updatedAt: now,
        };
        this.saveResident(updated);
        return updated;
      }
    } else {
      if (resident.status === ResidentStatus.ALUMNI) {
        const updated: Resident = {
          ...resident,
          status: ResidentStatus.ACTIVE,
          updatedAt: now,
        };
        this.saveResident(updated);
        return updated;
      }
    }

    return resident;
  }
}

export const defaultResidentLifecycleService = new ResidentLifecycleService();
