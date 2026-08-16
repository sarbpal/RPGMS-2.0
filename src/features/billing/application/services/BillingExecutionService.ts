import type { BillingRunRepository } from '../../domain/interfaces/BillingRunRepository';
import type { BillingClaimRepository } from '../../domain/interfaces/BillingClaimRepository';
import { BillingClaimService } from './BillingClaimService';
import { BillingDiscoveryService } from './BillingDiscoveryService';
import { BillingEligibilityService } from './BillingEligibilityService';
import { BillingRun } from '../../domain/entities/BillingRun';
import { BillingOperation } from '../../domain/entities/BillingOperation';
import type { BillingClaim } from '../../domain/entities/BillingClaim';
import { MaterialChangeRules } from '../../domain/rules/MaterialChangeRules';
import type { DiscoveredObligation } from '../../domain/valueObjects/DiscoveredObligation';
import { BillingApplicationService, billingService as defaultFinanceService } from '../../../finance/services/billingService';

export interface CreateDraftRunParams {
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly operatorId: string;
  readonly stayIds?: string[];
  readonly notes?: string;
}

export interface RevalidateAndConfirmResult {
  readonly success: boolean;
  readonly run: BillingRun;
  readonly hasMaterialChanges?: boolean;
  readonly deltaDetails?: string[];
}

/**
 * Application Service orchestrating BillingRun and BillingOperation execution,
 * claim lifecycle management, final pre-dispatch revalidation, consolidated Finance dispatch,
 * and deterministic run outcome resolution.
 */
export class BillingExecutionService {
  private readonly billingRunRepository: BillingRunRepository;
  private readonly claimRepository: BillingClaimRepository;
  private readonly claimService: BillingClaimService;
  private readonly discoveryService: BillingDiscoveryService;
  private readonly eligibilityService: BillingEligibilityService;
  private readonly financeService: BillingApplicationService;
  private readonly runPreviewObligations: Map<string, DiscoveredObligation[]> = new Map();

  constructor(
    billingRunRepository: BillingRunRepository,
    claimRepository: BillingClaimRepository,
    discoveryService: BillingDiscoveryService,
    eligibilityService: BillingEligibilityService,
    claimService?: BillingClaimService,
    financeService?: BillingApplicationService
  ) {
    this.billingRunRepository = billingRunRepository;
    this.claimRepository = claimRepository;
    this.discoveryService = discoveryService;
    this.eligibilityService = eligibilityService;
    this.claimService = claimService || new BillingClaimService(claimRepository);
    this.financeService = financeService || defaultFinanceService;
  }

  public getBillingRunRepository(): BillingRunRepository {
    return this.billingRunRepository;
  }

  public getClaimRepository(): BillingClaimRepository {
    return this.claimRepository;
  }

  public getDiscoveryService(): BillingDiscoveryService {
    return this.discoveryService;
  }

  public getEligibilityService(): BillingEligibilityService {
    return this.eligibilityService;
  }

  public getClaimService(): BillingClaimService {
    return this.claimService;
  }

  public getFinanceService(): BillingApplicationService {
    return this.financeService;
  }

  /**
   * Application Use Case: Create a new BillingRun in DRAFT_PREVIEW with discovered Stay operations.
   */
  async createDraftRun(params: CreateDraftRunParams): Promise<BillingRun> {
    if (!params.periodStart || !params.periodEnd) {
      throw new Error('Billing run requires valid periodStart and periodEnd dates.');
    }
    if (!params.operatorId || params.operatorId.trim() === '') {
      throw new Error('Billing run requires a valid operatorId.');
    }

    const runId = `RUN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const targetStayIds = params.stayIds && params.stayIds.length > 0 ? [...params.stayIds] : undefined;

    // Discover obligations for the target Stays (or property-wide if targetStayIds is undefined)
    const discovered = await this.discoveryService.discoverAll(
      targetStayIds,
      params.periodStart,
      params.periodEnd
    );

    // Identify unique Stays to instantiate operations for
    const stayIdSet = new Set<string>(targetStayIds || []);
    for (const ob of discovered) {
      stayIdSet.add(ob.stayId);
    }

    const operations: BillingOperation[] = [];
    for (const stayId of stayIdSet) {
      const stayObligations = discovered.filter((o) => o.stayId === stayId);
      const residentId = stayObligations[0]?.residentId || 'UNKNOWN_RESIDENT';
      const residentCode = stayObligations[0]?.residentCode || '';

      const opId = `OP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      operations.push(
        new BillingOperation({
          id: opId,
          billingRunId: runId,
          stayId,
          residentId,
          residentCode,
          status: 'PENDING',
        })
      );
    }

    this.runPreviewObligations.set(runId, discovered);

    const run = new BillingRun({
      id: runId,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      operatorId: params.operatorId,
      status: 'DRAFT_PREVIEW',
      operations,
      notes: params.notes,
    });

    await this.billingRunRepository.save(run);
    return run;
  }

  /**
   * Application Use Case: Revalidate live obligations at Eligibility Cutoff and confirm the BillingRun.
   */
  async revalidateAndConfirm(
    runId: string,
    cutoffTimestamp?: string,
    forceConfirm: boolean = false
  ): Promise<RevalidateAndConfirmResult> {
    const run = await this.billingRunRepository.getById(runId);
    if (!run) {
      throw new Error(`BillingRun '${runId}' not found.`);
    }
    if (run.status !== 'DRAFT_PREVIEW') {
      throw new Error(`Cannot confirm BillingRun '${runId}' in status '${run.status}'. Must be in DRAFT_PREVIEW.`);
    }

    const cutoff = cutoffTimestamp || new Date().toISOString();
    const stayIds = run.operations.map((op) => op.stayId);

    // Live revalidation discovery
    const liveObligations = await this.discoveryService.discoverAll(
      stayIds,
      run.periodStart,
      run.periodEnd,
      cutoff
    );

    if (!forceConfirm) {
      // Check for material changes against original preview discovery
      const initialDiscovery =
        this.runPreviewObligations.get(runId) ||
        (await this.discoveryService.discoverAll(stayIds, run.periodStart, run.periodEnd, run.createdAt));

      const changeCheck = MaterialChangeRules.detectMaterialChanges(initialDiscovery, liveObligations);
      if (changeCheck.hasMaterialChanges) {
        return {
          success: false,
          run,
          hasMaterialChanges: true,
          deltaDetails: changeCheck.deltaDetails,
        };
      }
    }

    run.confirm(cutoff);
    await this.billingRunRepository.save(run);

    return {
      success: true,
      run,
      hasMaterialChanges: false,
      deltaDetails: [],
    };
  }

  /**
   * Application Use Case: Execute a confirmed BillingRun.
   * Processes operations by Stay, manages claims, dispatches consolidated bills to Finance,
   * handles failure & recovery uncertainty, and aggregates final run outcome.
   */
  async executeRun(runId: string): Promise<BillingRun> {
    const run = await this.billingRunRepository.getById(runId);
    if (!run) {
      throw new Error(`BillingRun '${runId}' not found.`);
    }

    if (run.status !== 'CONFIRMED' && run.status !== 'PROCESSING' && run.status !== 'STOPPING') {
      throw new Error(`Cannot execute BillingRun '${runId}' in status '${run.status}'. Must be CONFIRMED or in-flight.`);
    }

    if (run.status === 'CONFIRMED') {
      run.startProcessing();
      await this.billingRunRepository.save(run);
    }

    const cutoff = run.eligibilityCutoff || new Date().toISOString();
    const stayIds = run.operations.map((op) => op.stayId);

    // Live discovery for all stays at the run's frozen eligibility cutoff
    const liveObligations = await this.discoveryService.discoverAll(
      stayIds,
      run.periodStart,
      run.periodEnd,
      cutoff
    );

    // Group obligations by Stay ID
    const obligationsByStay = new Map<string, DiscoveredObligation[]>();
    for (const ob of liveObligations) {
      const list = obligationsByStay.get(ob.stayId) || [];
      list.push(ob);
      obligationsByStay.set(ob.stayId, list);
    }

    // Process each operation independently
    for (const operation of run.operations) {
      if (operation.isTerminal()) {
        continue;
      }

      // Check Graceful Stop: If run is stopping, mark unstarted operations NOT_PROCESSED
      if (run.status === 'STOPPING') {
        operation.markNotProcessed('Billing run stopped gracefully by operator.');
        continue;
      }

      const stayObligations = obligationsByStay.get(operation.stayId) || [];

      // Exclude COMMITTED obligations (e.g. Confirmed Electricity allocations)
      // Billing strictly observes them and NEVER claims or dispatches them to Finance
      const unbilledObligations = stayObligations.filter((ob) => ob.commitmentStatus === 'UNCOMMITTED');

      // Zero unbilled obligations case
      if (unbilledObligations.length === 0) {
        operation.markNoCharges();
        continue;
      }

      // 1. Atomic Claim Acquisition (First Claim Wins)
      const acquiredClaims: BillingClaim[] = [];
      let claimConflict = false;
      let claimConflictReason = '';

      for (const obligation of unbilledObligations) {
        const claimResult = await this.claimService.acquireClaim(run.id, operation.id, obligation);
        if (claimResult.success && claimResult.claim) {
          acquiredClaims.push(claimResult.claim);
        } else {
          claimConflict = true;
          claimConflictReason = claimResult.reason || 'OBLIGATION_CLAIMED_BY_COMPETING_OPERATION';
          break;
        }
      }

      // If claim conflict occurred, rollback partial claims and mark CLAIM_FAILED
      if (claimConflict) {
        for (const c of acquiredClaims) {
          await this.claimService.releaseClaim(c.id, 'Rolling back partial claim due to competing conflict.');
        }
        operation.markClaimFailed(claimConflictReason);
        continue;
      }

      // 2. Mark Claimed and Start Processing
      const obligationKeys = unbilledObligations.map((o) => o.obligationKey);
      const totalAmount = Number(
        unbilledObligations.reduce((sum, o) => sum + o.amount, 0).toFixed(2)
      );

      operation.markClaimed(obligationKeys, totalAmount);
      operation.startProcessing();

      // 3. Final Pre-Dispatch Revalidation
      const hasInvalidAmount = unbilledObligations.some((o) => o.amount <= 0 || isNaN(o.amount));
      if (hasInvalidAmount) {
        const reason = 'Invalid obligation amount detected during final revalidation.';
        for (const c of acquiredClaims) {
          await this.claimService.releaseClaim(c.id, reason);
        }
        operation.markFailed(reason);
        continue;
      }

      // 4. Construct Consolidated Finance Bill Payload
      const lineItems = unbilledObligations.map((ob, idx) => ({
        id: `li_${operation.id}_${idx + 1}`,
        description: ob.description,
        amount: ob.amount,
        category: ob.category,
        obligationKey: ob.obligationKey,
      }));

      const periodTag = run.periodStart.slice(0, 7);
      const issueDate = run.periodStart;
      const dueDate = this.calculateDueDate(issueDate, periodTag);
      const hasRent = unbilledObligations.some((o) => o.chargeType === 'RENT');
      const billType = hasRent ? 'MONTHLY_RENT' : 'RECURRING_CHARGE';

      // 5. Finance Dispatch (Delegating to existing Finance Service)
      try {
        const financeResult = this.financeService.createBill({
          stayId: operation.stayId,
          billType,
          period: periodTag,
          issueDate,
          dueDate,
          lineItems,
          totalAmount: operation.totalAmount,
          status: 'UNPAID',
          remarks: `Billing Run ${run.id} - Stay ${operation.stayId}`,
        });

        if (financeResult.success && financeResult.bill?.id) {
          // SUCCESS PATH
          const billId = financeResult.bill.id;
          operation.markSuccess(billId);

          for (const c of acquiredClaims) {
            await this.claimService.commitClaim(c.id, billId);
          }
        } else {
          // CLEAN FINANCE FAILURE (Conclusive non-commitment)
          const failureReason =
            financeResult.errors && financeResult.errors.length > 0
              ? financeResult.errors.join('; ')
              : 'Finance rejected bill creation.';

          operation.markFailed(failureReason);

          for (const c of acquiredClaims) {
            await this.claimService.releaseClaim(c.id, failureReason);
          }
        }
      } catch (err: unknown) {
        // UNCERTAIN FINANCE OUTCOME (Timeout, exception, network error)
        // CRITICAL INVARIANT: DO NOT RELEASE CLAIMS. CLAIMS REMAIN HELD (CLAIM_ACQUIRED).
        const errorMsg = err instanceof Error ? err.message : String(err);
        operation.markRecoveryRequired(
          `Financial outcome uncertain due to dispatch exception: ${errorMsg}`,
          `createBill threw exception: ${errorMsg}`
        );
      }
    }

    // Finalize run outcome
    run.finalize();
    await this.billingRunRepository.save(run);
    return run;
  }

  /**
   * Application Use Case: Request graceful stop on a running BillingRun.
   */
  async requestStop(runId: string): Promise<BillingRun> {
    const run = await this.billingRunRepository.getById(runId);
    if (!run) {
      throw new Error(`BillingRun '${runId}' not found.`);
    }

    run.requestStop();
    await this.billingRunRepository.save(run);
    return run;
  }

  /**
   * Application Use Case: Create a new immutable BillingRun as a retry of a previous run.
   * Only retry-eligible operations (FAILED, CLAIM_FAILED, NOT_PROCESSED) are carried over.
   */
  async createRetryRun(originalRunId: string, operatorId: string, notes?: string): Promise<BillingRun> {
    const originalRun = await this.billingRunRepository.getById(originalRunId);
    if (!originalRun) {
      throw new Error(`BillingRun '${originalRunId}' not found.`);
    }

    if (
      originalRun.status !== 'COMPLETED' &&
      originalRun.status !== 'PARTIALLY_COMPLETED' &&
      originalRun.status !== 'FAILED'
    ) {
      throw new Error(`Cannot retry BillingRun '${originalRunId}' in non-terminal status '${originalRun.status}'.`);
    }

    const retryableOps = originalRun.operations.filter(
      (op) => op.status === 'FAILED' || op.status === 'CLAIM_FAILED' || op.status === 'NOT_PROCESSED'
    );

    if (retryableOps.length === 0) {
      throw new Error(`BillingRun '${originalRunId}' has no retry-eligible operations.`);
    }

    const newRunId = `RUN-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newOperations = retryableOps.map(
      (origOp) =>
        new BillingOperation({
          id: `OP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          billingRunId: newRunId,
          stayId: origOp.stayId,
          residentId: origOp.residentId,
          residentCode: origOp.residentCode,
          status: 'PENDING',
        })
    );

    const retryRun = new BillingRun({
      id: newRunId,
      periodStart: originalRun.periodStart,
      periodEnd: originalRun.periodEnd,
      operatorId,
      retryOfRunId: originalRun.id,
      status: 'DRAFT_PREVIEW',
      operations: newOperations,
      notes: notes || `Retry of run ${originalRun.id}`,
    });

    await this.billingRunRepository.save(retryRun);
    return retryRun;
  }

  private calculateDueDate(issueDate: string, periodTag: string): string {
    try {
      const d = new Date(issueDate);
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    } catch {
      return `${periodTag}-07`;
    }
  }
}
