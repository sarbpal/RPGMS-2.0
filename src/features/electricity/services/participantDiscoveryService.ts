import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../resident/domain/interfaces/ResidentRepository';
import type { Stay } from '../../stay/domain/entities/Stay';

export interface DiscoveredCandidateParticipant {
  stayId: string;
  residentId: string;
  residentCode?: string;
  residentNameSnapshot?: string;
  flatId: string;
  potentialShares: number;
  selectedShares: number;
}

export interface DataQualityIssue {
  stayId: string;
  residentId: string;
  issueType: 'MISSING_RESIDENT_RECORD' | 'ORPHANED_STAY' | 'INVALID_BED_ALLOCATION';
  message: string;
}

export interface ParticipantDiscoveryResult {
  flatId: string;
  periodStart: string;
  periodEnd: string;
  discoveredStaysCount: number;
  totalPotentialShares: number;
  candidateParticipants: DiscoveredCandidateParticipant[];
  dataQualityIssues: DataQualityIssue[];
}

export class ParticipantDiscoveryService {
  private stayRepository: StayRepository;
  private residentRepository?: ResidentRepository;

  constructor(
    stayRepository: StayRepository,
    residentRepository?: ResidentRepository
  ) {
    this.stayRepository = stayRepository;
    this.residentRepository = residentRepository;
  }

  /**
   * Application Service Use Case: Discovers historical Stays and BedAllocations
   * overlapping [periodStart, periodEnd] for a Flat, computes maximum concurrent
   * potential shares per Stay, resolves resident metadata, and flags data-quality issues.
   */
  public discoverParticipantsForFlatPeriod(
    flatId: string,
    periodStart: string,
    periodEnd: string
  ): ParticipantDiscoveryResult {
    if (!flatId || flatId.trim() === '') {
      throw new Error('ParticipantDiscoveryService requires a valid flatId.');
    }
    if (!periodStart || !periodEnd || periodEnd < periodStart) {
      throw new Error(`Invalid billing period date range: [${periodStart}, ${periodEnd}].`);
    }

    // Query historical stays overlapping flat and billing period
    const overlappingStays: Stay[] = this.stayRepository.findStaysByFlatAndPeriodOverlapSync(
      flatId,
      periodStart,
      periodEnd
    );

    const candidateParticipants: DiscoveredCandidateParticipant[] = [];
    const dataQualityIssues: DataQualityIssue[] = [];
    let totalPotentialShares = 0;

    for (const stay of overlappingStays) {
      // Filter bed allocations matching flatId and overlapping date range
      const matchingAllocations = stay.bedAllocations.filter((ba) => {
        if (ba.flatId !== flatId) return false;
        if (ba.allocatedFrom > periodEnd) return false;
        if (ba.allocatedUntil && ba.allocatedUntil < periodStart) return false;
        return true;
      });

      if (matchingAllocations.length === 0) {
        continue;
      }

      // Compute maximum concurrent beds occupied on any single calendar day within [periodStart, periodEnd]
      const potentialShares = this.calculateMaxConcurrentBeds(
        matchingAllocations,
        periodStart,
        periodEnd
      );

      if (potentialShares <= 0) {
        continue;
      }

      // Resolve Resident master record data
      let residentCode: string | undefined;
      let residentNameSnapshot: string | undefined;

      if (this.residentRepository) {
        const resident = this.residentRepository.getByIdSync(stay.residentId);
        if (resident) {
          residentCode = resident.residentCode;
          residentNameSnapshot = resident.fullName;
        } else {
          // Explicit Data Quality Failure: Do NOT fabricate fake identities
          dataQualityIssues.push({
            stayId: stay.id,
            residentId: stay.residentId,
            issueType: 'MISSING_RESIDENT_RECORD',
            message: `Resident master record for residentId '${stay.residentId}' (Stay '${stay.id}') was not found in ResidentRepository.`,
          });
        }
      }

      candidateParticipants.push({
        stayId: stay.id,
        residentId: stay.residentId,
        residentCode,
        residentNameSnapshot,
        flatId,
        potentialShares,
        selectedShares: potentialShares, // Default suggestion for operator draft review
      });

      totalPotentialShares += potentialShares;
    }

    // Sort candidate participants deterministically: 1. residentCode ASC (fallbacks last), 2. stayId ASC
    candidateParticipants.sort((a, b) => {
      const codeA = a.residentCode || 'ZZZ_MISSING';
      const codeB = b.residentCode || 'ZZZ_MISSING';
      const codeCmp = codeA.localeCompare(codeB);
      if (codeCmp !== 0) return codeCmp;
      return a.stayId.localeCompare(b.stayId);
    });

    return {
      flatId,
      periodStart,
      periodEnd,
      discoveredStaysCount: candidateParticipants.length,
      totalPotentialShares,
      candidateParticipants,
      dataQualityIssues,
    };
  }

  /**
   * Pure Helper: Calculates the maximum number of distinct beds simultaneously occupied
   * by a Stay on any calendar day within [periodStart, periodEnd].
   * Accurately handles Case A (simultaneous -> 2), Case B (sequential move -> 1), and Case C (handover overlap -> max concurrent).
   */
  private calculateMaxConcurrentBeds(
    allocations: Array<{ bedId: string; allocatedFrom: string; allocatedUntil?: string }>,
    periodStart: string,
    periodEnd: string
  ): number {
    if (allocations.length === 0) return 0;
    if (allocations.length === 1) return 1;

    // Deduplicate identical bedId allocations for the same interval
    const uniqueAllocations: Array<{ bedId: string; allocatedFrom: string; allocatedUntil?: string }> = [];
    const seenKeys = new Set<string>();

    for (const alloc of allocations) {
      const key = `${alloc.bedId}_${alloc.allocatedFrom}_${alloc.allocatedUntil || 'OPEN'}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueAllocations.push(alloc);
      }
    }

    // Collect all significant boundary dates to evaluate concurrency
    const evaluationDates = new Set<string>();
    evaluationDates.add(periodStart);
    evaluationDates.add(periodEnd);

    for (const alloc of uniqueAllocations) {
      if (alloc.allocatedFrom >= periodStart && alloc.allocatedFrom <= periodEnd) {
        evaluationDates.add(alloc.allocatedFrom);
      }
      if (alloc.allocatedUntil && alloc.allocatedUntil >= periodStart && alloc.allocatedUntil <= periodEnd) {
        evaluationDates.add(alloc.allocatedUntil);
      }
    }

    let maxConcurrent = 0;

    // Evaluate distinct beds occupied on each boundary date
    for (const dateStr of evaluationDates) {
      const activeBedsOnDate = new Set<string>();
      for (const alloc of uniqueAllocations) {
        const fromOk = alloc.allocatedFrom <= dateStr;
        const untilOk = !alloc.allocatedUntil || alloc.allocatedUntil >= dateStr;
        if (fromOk && untilOk) {
          activeBedsOnDate.add(alloc.bedId);
        }
      }
      if (activeBedsOnDate.size > maxConcurrent) {
        maxConcurrent = activeBedsOnDate.size;
      }
    }

    return Math.max(1, maxConcurrent);
  }
}
