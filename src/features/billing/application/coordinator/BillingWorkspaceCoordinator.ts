import type { BillingRunRepository } from '../../domain/interfaces/BillingRunRepository';
import type { BillingClaimRepository } from '../../domain/interfaces/BillingClaimRepository';
import { defaultBillingRunRepository } from '../../infrastructure/repositories/InMemoryBillingRunRepository';
import { defaultBillingClaimRepository } from '../../infrastructure/repositories/InMemoryBillingClaimRepository';
import { BillingExecutionService } from '../services/BillingExecutionService';
import { BillingDiscoveryService } from '../services/BillingDiscoveryService';
import { BillingEligibilityService } from '../services/BillingEligibilityService';
import { BillingClaimService } from '../services/BillingClaimService';
import { RentDiscoveryAdapter } from '../../infrastructure/adapters/RentDiscoveryAdapter';
import { ElectricityDiscoveryAdapter } from '../../infrastructure/adapters/ElectricityDiscoveryAdapter';
import { defaultStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { defaultElectricityRepository } from '../../../electricity/infrastructure/repositories/InMemoryElectricityRepository';
import { defaultFinanceRepository } from '../../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { BillingApplicationService } from '../../../finance/services/billingService';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import type { BillingRun } from '../../domain/entities/BillingRun';
import type {
  BillingWorkspaceSummaryViewModel,
  BillingPreviewViewModel,
  StayBillingPreviewSummary,
  DiscoveredChargeDetail,
  BillingRunSummaryViewModel,
  BillingRunDetailViewModel,
  BillingOperationDetailViewModel,
} from '../models/BillingWorkspaceViewModel';

export interface CreatePreviewInput {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly operatorId: string;
  readonly stayIds?: string[];
  readonly notes?: string;
}

/**
 * Application Coordinator for the Billing Workspace.
 * Orchestrates operator workflows (preview, confirmation, execution, graceful stop, history, details)
 * and projects domain state into presentation-ready ViewModels.
 */
export class BillingWorkspaceCoordinator {
  private readonly executionService: BillingExecutionService;
  private readonly discoveryService: BillingDiscoveryService;
  private readonly eligibilityService: BillingEligibilityService;
  private readonly claimService: BillingClaimService;
  private readonly billingRunRepository: BillingRunRepository;
  private readonly stayRepository: StayRepository;
  private readonly residentRepository: ResidentRepository;

  constructor(
    billingRunRepository: BillingRunRepository = defaultBillingRunRepository,
    claimRepository: BillingClaimRepository = defaultBillingClaimRepository,
    stayRepository: StayRepository = defaultStayRepository,
    residentRepository: ResidentRepository = new InMemoryResidentRepository(),
    electricityRepository = defaultElectricityRepository,
    financeRepository = defaultFinanceRepository,
    executionService?: BillingExecutionService
  ) {
    this.billingRunRepository = billingRunRepository;
    this.stayRepository = stayRepository;
    this.residentRepository = residentRepository;

    const rentAdapter = new RentDiscoveryAdapter(this.stayRepository, this.residentRepository);
    const elecAdapter = new ElectricityDiscoveryAdapter(electricityRepository);
    this.discoveryService = new BillingDiscoveryService([rentAdapter, elecAdapter]);
    this.eligibilityService = new BillingEligibilityService(claimRepository);
    this.claimService = new BillingClaimService(claimRepository);

    const financeService = new BillingApplicationService(financeRepository, this.stayRepository);

    this.executionService =
      executionService ||
      new BillingExecutionService(
        this.billingRunRepository,
        claimRepository,
        this.discoveryService,
        this.eligibilityService,
        this.claimService,
        financeService
      );
  }

  /**
   * Retrieves summary metrics and active/recent runs for the Billing Workspace dashboard.
   */
  async getWorkspaceSummary(): Promise<BillingWorkspaceSummaryViewModel> {
    const allRuns = await this.billingRunRepository.list();
    const sortedRuns = [...allRuns].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const activeRunEntity = await this.billingRunRepository.getActiveRun();
    const activeRun = activeRunEntity ? this.toRunSummaryViewModel(activeRunEntity) : null;

    let completedRunsCount = 0;
    let partiallyCompletedRunsCount = 0;
    let failedRunsCount = 0;
    let recoveryRequiredCount = 0;
    let totalAmountBilledAllTime = 0;

    for (const run of sortedRuns) {
      if (run.status === 'COMPLETED') completedRunsCount++;
      if (run.status === 'PARTIALLY_COMPLETED') partiallyCompletedRunsCount++;
      if (run.status === 'FAILED') failedRunsCount++;
      recoveryRequiredCount += run.recoveryRequiredCount;
      totalAmountBilledAllTime += run.totalAmountBilled;
    }

    const recentRuns = sortedRuns.slice(0, 10).map((r) => this.toRunSummaryViewModel(r));

    return {
      activeRun,
      totalRunsCount: sortedRuns.length,
      completedRunsCount,
      partiallyCompletedRunsCount,
      failedRunsCount,
      recoveryRequiredCount,
      totalAmountBilledAllTime: Number(totalAmountBilledAllTime.toFixed(2)),
      recentRuns,
    };
  }

  /**
   * Generates a new Billing Preview and instantiates a draft BillingRun.
   */
  async generatePreview(input: CreatePreviewInput): Promise<BillingPreviewViewModel> {
    const draftRun = await this.executionService.createDraftRun({
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      operatorId: input.operatorId,
      stayIds: input.stayIds,
      notes: input.notes,
    });

    return this.buildPreviewViewModel(draftRun, false, []);
  }

  /**
   * Revalidates live obligations for a draft preview run against material changes.
   */
  async revalidatePreview(runId: string): Promise<BillingPreviewViewModel> {
    const run = await this.billingRunRepository.getById(runId);
    if (!run) {
      throw new Error(`BillingRun '${runId}' not found.`);
    }

    const revalResult = await this.executionService.revalidateAndConfirm(runId, undefined, false);

    return this.buildPreviewViewModel(
      run,
      revalResult.hasMaterialChanges ?? false,
      revalResult.deltaDetails ?? []
    );
  }

  /**
   * Confirms and starts execution of a BillingRun.
   */
  async confirmAndStartRun(runId: string, forceConfirm: boolean = false): Promise<BillingRunSummaryViewModel> {
    const run = await this.billingRunRepository.getById(runId);
    if (!run) {
      throw new Error(`BillingRun '${runId}' not found.`);
    }

    if (run.status === 'DRAFT_PREVIEW') {
      const confirmResult = await this.executionService.revalidateAndConfirm(runId, undefined, forceConfirm);
      if (confirmResult.hasMaterialChanges && !forceConfirm) {
        throw new Error('Material changes detected since preview. Please review and acknowledge changes before starting.');
      }
    }

    const executedRun = await this.executionService.executeRun(runId);
    return this.toRunSummaryViewModel(executedRun);
  }

  /**
   * Requests graceful stop on an active BillingRun.
   */
  async requestStop(runId: string): Promise<BillingRunSummaryViewModel> {
    const stoppedRun = await this.executionService.requestStop(runId);
    return this.toRunSummaryViewModel(stoppedRun);
  }

  /**
   * Retrieves full details for a specific BillingRun.
   */
  async getRunDetails(runId: string): Promise<BillingRunDetailViewModel | null> {
    const run = await this.billingRunRepository.getById(runId);
    if (!run) return null;

    const operations: BillingOperationDetailViewModel[] = [];
    for (const op of run.operations) {
      const resident = await this.residentRepository.getById(op.residentId);
      operations.push({
        id: op.id,
        billingRunId: op.billingRunId,
        stayId: op.stayId,
        residentId: op.residentId,
        residentCode: op.residentCode,
        residentName: resident?.fullName || 'Resident',
        status: op.status,
        totalAmount: op.totalAmount,
        financialBillId: op.financialBillId,
        failureReason: op.failureReason,
        recoveryNotes: op.recoveryNotes,
        obligationKeys: op.obligationKeys,
        createdAt: op.createdAt,
        updatedAt: op.updatedAt,
      });
    }

    const summary = this.toRunSummaryViewModel(run);
    return {
      ...summary,
      operations,
    };
  }

  /**
   * Retrieves historical runs list.
   */
  async getRunHistory(limit = 50): Promise<BillingRunSummaryViewModel[]> {
    const allRuns = await this.billingRunRepository.list();
    return allRuns
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((r) => this.toRunSummaryViewModel(r));
  }

  private async buildPreviewViewModel(
    run: BillingRun,
    hasMaterialChanges: boolean,
    deltaDetails: readonly string[]
  ): Promise<BillingPreviewViewModel> {
    const stayIds = run.operations.map((op) => op.stayId);
    const discovered = await this.discoveryService.discoverAll(stayIds, run.periodStart, run.periodEnd);

    const stays: StayBillingPreviewSummary[] = [];
    let totalDiscoveredAmount = 0;
    let totalEligibleAmount = 0;
    let totalCommittedAmount = 0;

    for (const op of run.operations) {
      const stayObligations = discovered.filter((o) => o.stayId === op.stayId);
      const resident = await this.residentRepository.getById(op.residentId);

      const charges: DiscoveredChargeDetail[] = [];
      let stayEligibleAmount = 0;
      let stayCommittedAmount = 0;

      for (const ob of stayObligations) {
        const elig = await this.eligibilityService.evaluateObligation(ob);
        const isEligible = elig.isClaimable;
        const isCommitted = ob.isCommitted();

        if (isEligible) {
          stayEligibleAmount += ob.amount;
        }
        if (isCommitted) {
          stayCommittedAmount += ob.amount;
        }

        charges.push({
          obligationKey: ob.obligationKey,
          chargeType: ob.chargeType,
          description: ob.description,
          amount: ob.amount,
          businessDate: ob.businessDate,
          category: ob.category,
          commitmentStatus: ob.commitmentStatus,
          isEligible,
          eligibilityReason: elig.reason,
          financialReferenceId: ob.financialReferenceId,
        });
      }

      totalDiscoveredAmount += stayEligibleAmount + stayCommittedAmount;
      totalEligibleAmount += stayEligibleAmount;
      totalCommittedAmount += stayCommittedAmount;

      let status: 'BILLABLE' | 'NO_CHARGES' | 'ALREADY_COMMITTED' = 'NO_CHARGES';
      if (stayEligibleAmount > 0) {
        status = 'BILLABLE';
      } else if (stayCommittedAmount > 0) {
        status = 'ALREADY_COMMITTED';
      }

      stays.push({
        stayId: op.stayId,
        residentId: op.residentId,
        residentCode: op.residentCode,
        residentName: resident?.fullName || `Resident ${op.residentCode || op.residentId}`,
        totalDiscoveredAmount: Number((stayEligibleAmount + stayCommittedAmount).toFixed(2)),
        eligibleAmount: Number(stayEligibleAmount.toFixed(2)),
        committedAmount: Number(stayCommittedAmount.toFixed(2)),
        charges,
        status,
      });
    }

    const eligibleStaysCount = stays.filter((s) => s.status === 'BILLABLE').length;

    return {
      runId: run.id,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      operatorId: run.operatorId,
      totalDiscoveredAmount: Number(totalDiscoveredAmount.toFixed(2)),
      totalEligibleAmount: Number(totalEligibleAmount.toFixed(2)),
      totalCommittedAmount: Number(totalCommittedAmount.toFixed(2)),
      affectedStaysCount: stays.length,
      eligibleStaysCount,
      stays,
      hasMaterialChanges,
      deltaDetails,
      canConfirm: !hasMaterialChanges && eligibleStaysCount > 0,
    };
  }

  private toRunSummaryViewModel(run: BillingRun): BillingRunSummaryViewModel {
    return {
      id: run.id,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      status: run.status,
      operatorId: run.operatorId,
      affectedStaysCount: run.operations.length,
      totalAmount: run.totalAmountBilled,
      successfulOperationsCount: run.successfulOperationsCount,
      failedOperationsCount: run.failedOperationsCount,
      recoveryRequiredOperationsCount: run.recoveryRequiredCount,
      notProcessedOperationsCount: run.operations.filter((op) => op.status === 'NOT_PROCESSED').length,
      createdAt: run.createdAt,
      confirmedAt: run.confirmedAt,
      completedAt: run.completedAt,
      stoppedAt: run.stoppedAt,
      retryOfRunId: run.retryOfRunId,
      notes: run.notes,
    };
  }
}

export const billingWorkspaceCoordinator = new BillingWorkspaceCoordinator();
