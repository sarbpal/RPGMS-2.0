import type { BillingRunRepository } from '../../domain/interfaces/BillingRunRepository';
import type { BillingClaimRepository } from '../../domain/interfaces/BillingClaimRepository';
import type { BillingClaimService } from './BillingClaimService';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import type { FinanceRepository } from '../../../finance/domain/interfaces/FinanceRepository';
import { BillingRun } from '../../domain/entities/BillingRun';
import { BillingOperation } from '../../domain/entities/BillingOperation';
import { AccountType } from '../../../finance/domain/valueObjects/AccountType';
import type {
  RecoveryEvidenceViewModel,
  MatchedFinanceBillViewModel,
  MatchedLedgerEntryViewModel,
  RetryRunScopeViewModel,
  RetryStayScopeItem,
  BillingOperationDetailViewModel,
} from '../models/BillingWorkspaceViewModel';

export interface BillingRecoveryServiceDeps {
  readonly billingRunRepository: BillingRunRepository;
  readonly claimRepository: BillingClaimRepository;
  readonly claimService: BillingClaimService;
  readonly stayRepository: StayRepository;
  readonly residentRepository: ResidentRepository;
  readonly financeRepository: FinanceRepository;
}

/**
 * Application service managing recovery investigation, financial evidence correlation,
 * conclusive recovery resolutions, and immutable retry run lifecycle.
 */
export class BillingRecoveryService {
  private readonly billingRunRepository: BillingRunRepository;
  private readonly claimRepository: BillingClaimRepository;
  private readonly claimService: BillingClaimService;
  private readonly residentRepository: ResidentRepository;
  private readonly financeRepository: FinanceRepository;

  constructor(deps: BillingRecoveryServiceDeps) {
    this.billingRunRepository = deps.billingRunRepository;
    this.claimRepository = deps.claimRepository;
    this.claimService = deps.claimService;
    this.residentRepository = deps.residentRepository;
    this.financeRepository = deps.financeRepository;
  }

  /**
   * Finds all operations in RECOVERY_REQUIRED status across all historical runs.
   */
  async getUnresolvedRecoveryOperations(): Promise<
    { operation: BillingOperation; run: BillingRun; residentName: string }[]
  > {
    const allRuns = await this.billingRunRepository.list();
    const results: { operation: BillingOperation; run: BillingRun; residentName: string }[] = [];

    for (const run of allRuns) {
      for (const op of run.operations) {
        if (op.status === 'RECOVERY_REQUIRED') {
          let residentName = `Resident ${op.residentCode || op.residentId}`;
          try {
            const res = await this.residentRepository.getById(op.residentId);
            if (res) residentName = res.fullName;
          } catch {
            // fallback
          }
          results.push({ operation: op, run, residentName });
        }
      }
    }

    return results;
  }

  /**
   * Inspects authoritative Finance evidence for a specific RECOVERY_REQUIRED operation.
   * Correlates Bills and balanced double-entry ledger postings by stayId, obligationKeys,
   * runId, period, and amounts.
   */
  async inspectRecoveryEvidence(operationId: string): Promise<RecoveryEvidenceViewModel> {
    const allRuns = await this.billingRunRepository.list();
    let targetOp: BillingOperation | undefined;
    let targetRun: BillingRun | undefined;

    for (const run of allRuns) {
      const op = run.getOperation(operationId);
      if (op) {
        targetOp = op;
        targetRun = run;
        break;
      }
    }

    if (!targetOp || !targetRun) {
      throw new Error(`BillingOperation '${operationId}' not found.`);
    }

    // Resident metadata
    let residentName = `Resident ${targetOp.residentCode || targetOp.residentId}`;
    try {
      const res = await this.residentRepository.getById(targetOp.residentId);
      if (res) residentName = res.fullName;
    } catch {
      // fallback
    }

    // Query Finance evidence
    const stayBills = this.financeRepository.getBillsByStayId(targetOp.stayId);
    const stayLedgerEntries = this.financeRepository.getLedgerEntriesByStayId(targetOp.stayId);

    const opObligationKeys = new Set(targetOp.obligationKeys);
    const matchedBills: MatchedFinanceBillViewModel[] = [];
    const matchedLedgerEntries: MatchedLedgerEntryViewModel[] = [];

    for (const bill of stayBills) {
      // Check correlation via obligation keys or remarks
      const hasMatchingObligationKey = bill.lineItems.some(
        (li) => li.obligationKey && opObligationKeys.has(li.obligationKey)
      );
      const hasMatchingRemarks =
        bill.remarks?.includes(`Billing Run ${targetRun.id}`) &&
        bill.remarks?.includes(`Stay ${targetOp.stayId}`);
      const hasMatchingPeriodAndAmount =
        bill.period === targetRun.periodStart.slice(0, 7) &&
        Math.abs(bill.totalAmount - targetOp.totalAmount) < 0.01;

      if (hasMatchingObligationKey || (hasMatchingRemarks && hasMatchingPeriodAndAmount)) {
        matchedBills.push({
          id: bill.id,
          billNumber: bill.billNumber,
          stayId: bill.stayId,
          period: bill.period,
          totalAmount: bill.totalAmount,
          status: bill.status,
          issueDate: bill.issueDate,
          dueDate: bill.dueDate,
          lineItems: bill.lineItems.map((li) => ({
            id: li.id,
            description: li.description,
            amount: li.amount,
            category: li.category,
            obligationKey: li.obligationKey,
          })),
          remarks: bill.remarks,
        });

        // Find associated ledger entries
        const relatedLedgers = stayLedgerEntries.filter((le) => le.referenceId === bill.id);
        for (const le of relatedLedgers) {
          matchedLedgerEntries.push({
            id: le.id,
            stayId: le.stayId,
            postingDate: le.postingDate,
            effectiveDate: le.effectiveDate,
            referenceType: le.referenceType,
            referenceId: le.referenceId,
            account: le.account,
            debit: le.debit,
            credit: le.credit,
            remarks: le.remarks,
          });
        }
      }
    }

    // Determine evidence assessment
    let assessment: 'COMMITTED' | 'NOT_COMMITTED' | 'UNKNOWN' = 'UNKNOWN';
    let assessmentExplanation = '';
    let recommendedAction:
      | 'RESOLVE_COMMITTED'
      | 'RESOLVE_NOT_COMMITTED'
      | 'MANUAL_INVESTIGATION_REQUIRED' = 'MANUAL_INVESTIGATION_REQUIRED';
    let recommendedBillId: string | undefined;

    // Check if active, balanced bill exists
    const activeMatchedBill = matchedBills.find(
      (b) => b.status !== 'CANCELLED' && Math.abs(b.totalAmount - targetOp!.totalAmount) < 0.01
    );

    if (activeMatchedBill) {
      // Check balanced ledger
      const billLedgers = matchedLedgerEntries.filter((le) => le.referenceId === activeMatchedBill.id);
      const totalDebit = billLedgers.reduce((sum, le) => sum + le.debit, 0);
      const totalCredit = billLedgers.reduce((sum, le) => sum + le.credit, 0);
      const hasDebitAR = billLedgers.some(
        (le) => le.account === AccountType.ACCOUNTS_RECEIVABLE && Math.abs(le.debit - activeMatchedBill.totalAmount) < 0.01
      );
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && hasDebitAR;

      if (isBalanced) {
        assessment = 'COMMITTED';
        assessmentExplanation = `Authoritative active Finance Bill (${activeMatchedBill.billNumber}) exists with verified, balanced double-entry ledger postings.`;
        recommendedAction = 'RESOLVE_COMMITTED';
        recommendedBillId = activeMatchedBill.id;
      } else {
        assessment = 'UNKNOWN';
        assessmentExplanation = `Finance Bill (${activeMatchedBill.billNumber}) found, but ledger entries are missing or unbalanced. Manual audit required.`;
        recommendedAction = 'MANUAL_INVESTIGATION_REQUIRED';
      }
    } else if (matchedBills.length === 0 && matchedLedgerEntries.length === 0) {
      // Conclusive absence of Finance postings
      assessment = 'NOT_COMMITTED';
      assessmentExplanation =
        'Conclusively no Finance Bill or ledger entries exist in Finance for these obligations.';
      recommendedAction = 'RESOLVE_NOT_COMMITTED';
    } else {
      // Inconclusive (e.g. cancelled bills or mismatched amounts)
      assessment = 'UNKNOWN';
      assessmentExplanation =
        'Finance evidence is inconclusive (e.g. cancelled bill or amount mismatch). Manual investigation required.';
      recommendedAction = 'MANUAL_INVESTIGATION_REQUIRED';
    }

    const opDetail: BillingOperationDetailViewModel = {
      id: targetOp.id,
      billingRunId: targetOp.billingRunId,
      stayId: targetOp.stayId,
      residentId: targetOp.residentId,
      residentCode: targetOp.residentCode,
      residentName,
      status: targetOp.status,
      totalAmount: targetOp.totalAmount,
      financialBillId: targetOp.financialBillId,
      failureReason: targetOp.failureReason,
      recoveryNotes: targetOp.recoveryNotes,
      obligationKeys: targetOp.obligationKeys,
      createdAt: targetOp.createdAt,
      updatedAt: targetOp.updatedAt,
    };

    return {
      operation: opDetail,
      stayId: targetOp.stayId,
      residentId: targetOp.residentId,
      residentCode: targetOp.residentCode,
      residentName,
      matchedBills,
      matchedLedgerEntries,
      assessment,
      assessmentExplanation,
      recommendedAction,
      recommendedBillId,
    };
  }

  /**
   * Conclusively resolves an uncertain operation as COMMITTED after verifying Finance evidence.
   * Attaches financialBillId, sets operation to SUCCESS, commits claims, and permanently prevents retry.
   */
  async resolveAsCommitted(
    operationId: string,
    financialBillId: string,
    operatorId: string,
    notes: string
  ): Promise<BillingOperation> {
    if (!financialBillId || financialBillId.trim() === '') {
      throw new Error('resolveAsCommitted requires a valid financialBillId.');
    }
    if (!operatorId || operatorId.trim() === '') {
      throw new Error('resolveAsCommitted requires an operatorId.');
    }

    const evidence = await this.inspectRecoveryEvidence(operationId);

    if (evidence.assessment !== 'COMMITTED') {
      throw new Error(
        `Cannot resolve operation '${operationId}' as COMMITTED: Evidence assessment is '${evidence.assessment}' (${evidence.assessmentExplanation}).`
      );
    }

    const matchedBill = evidence.matchedBills.find((b) => b.id === financialBillId.trim());
    if (!matchedBill) {
      throw new Error(
        `Supplied financialBillId '${financialBillId}' does not match verified Finance evidence for operation '${operationId}'.`
      );
    }

    // Retrieve run and operation
    const run = await this.billingRunRepository.getById(evidence.operation.billingRunId);
    if (!run) {
      throw new Error(`BillingRun '${evidence.operation.billingRunId}' not found.`);
    }

    const operation = run.getOperation(operationId);
    if (!operation) {
      throw new Error(`BillingOperation '${operationId}' not found in run '${run.id}'.`);
    }

    // Transition operation
    const auditNotes = `Operator ${operatorId.trim()}: Verified Finance Bill ${matchedBill.billNumber}${
      notes ? ' - ' + notes.trim() : ''
    }`;
    operation.resolveCommitted(matchedBill.id, auditNotes);

    // Commit all claims for this operation
    const claims = await this.claimRepository.getClaimsByOperationId(operation.id);
    for (const claim of claims) {
      await this.claimService.commitClaim(claim.id, matchedBill.id);
    }

    // Recalculate run status if all operations are now terminal
    try {
      run.finalize();
    } catch {
      // Run might have other non-terminal states if stopping
    }

    await this.billingRunRepository.save(run);
    return operation;
  }

  /**
   * Conclusively resolves an uncertain operation as NOT_COMMITTED after verifying absence of Finance postings.
   * Sets operation to FAILED, releases claims, and returns obligations to future retry eligibility pools.
   */
  async resolveAsNotCommitted(
    operationId: string,
    operatorId: string,
    reason: string,
    notes?: string
  ): Promise<BillingOperation> {
    if (!operatorId || operatorId.trim() === '') {
      throw new Error('resolveAsNotCommitted requires an operatorId.');
    }
    if (!reason || reason.trim() === '') {
      throw new Error('resolveAsNotCommitted requires a non-empty operator reason.');
    }

    const evidence = await this.inspectRecoveryEvidence(operationId);

    if (evidence.assessment !== 'NOT_COMMITTED') {
      throw new Error(
        `Cannot resolve operation '${operationId}' as NOT_COMMITTED: Evidence assessment is '${evidence.assessment}' (${evidence.assessmentExplanation}). Force-resolving uncertain or committed outcomes is prohibited.`
      );
    }

    // Retrieve run and operation
    const run = await this.billingRunRepository.getById(evidence.operation.billingRunId);
    if (!run) {
      throw new Error(`BillingRun '${evidence.operation.billingRunId}' not found.`);
    }

    const operation = run.getOperation(operationId);
    if (!operation) {
      throw new Error(`BillingOperation '${operationId}' not found in run '${run.id}'.`);
    }

    // Transition operation
    const auditNotes = `Operator ${operatorId.trim()}: ${reason.trim()}${notes ? ' (' + notes.trim() + ')' : ''}`;
    operation.resolveNotCommitted(reason.trim(), auditNotes);

    // Release all claims for this operation
    const claims = await this.claimRepository.getClaimsByOperationId(operation.id);
    for (const claim of claims) {
      await this.claimService.releaseClaim(claim.id, `Recovery resolved NOT_COMMITTED by ${operatorId.trim()}: ${reason.trim()}`);
    }

    // Recalculate run status if all operations are now terminal
    try {
      run.finalize();
    } catch {
      // Ignore if in-flight
    }

    await this.billingRunRepository.save(run);
    return operation;
  }

  /**
   * Evaluates the retry scope for an existing historical BillingRun.
   * Identifies retry-eligible failed operations vs excluded successful/unresolved operations.
   */
  async getRetryScope(originalRunId: string): Promise<RetryRunScopeViewModel> {
    const run = await this.billingRunRepository.getById(originalRunId);
    if (!run) {
      throw new Error(`Original BillingRun '${originalRunId}' not found.`);
    }

    const stays: RetryStayScopeItem[] = [];
    let unresolvedRecoveryCount = 0;

    for (const op of run.operations) {
      let residentName = `Resident ${op.residentCode || op.residentId}`;
      try {
        const res = await this.residentRepository.getById(op.residentId);
        if (res) residentName = res.fullName;
      } catch {
        // fallback
      }

      if (op.status === 'RECOVERY_REQUIRED') {
        unresolvedRecoveryCount++;
        stays.push({
          stayId: op.stayId,
          residentId: op.residentId,
          residentCode: op.residentCode,
          residentName,
          originalOperationId: op.id,
          originalStatus: op.status,
          isEligible: false,
          exclusionReason: 'Unresolved recovery exception (must resolve in Recovery Workbench before retry)',
        });
      } else if (op.status === 'SUCCESS') {
        stays.push({
          stayId: op.stayId,
          residentId: op.residentId,
          residentCode: op.residentCode,
          residentName,
          originalOperationId: op.id,
          originalStatus: op.status,
          isEligible: false,
          exclusionReason: `Already billed successfully (${op.financialBillId || 'Committed'})`,
        });
      } else if (op.status === 'NO_CHARGES') {
        stays.push({
          stayId: op.stayId,
          residentId: op.residentId,
          residentCode: op.residentCode,
          residentName,
          originalOperationId: op.id,
          originalStatus: op.status,
          isEligible: false,
          exclusionReason: 'No billable charges in original run period',
        });
      } else if (op.status === 'FAILED' || op.status === 'CLAIM_FAILED' || op.status === 'NOT_PROCESSED') {
        stays.push({
          stayId: op.stayId,
          residentId: op.residentId,
          residentCode: op.residentCode,
          residentName,
          originalOperationId: op.id,
          originalStatus: op.status,
          isEligible: true,
        });
      } else {
        stays.push({
          stayId: op.stayId,
          residentId: op.residentId,
          residentCode: op.residentCode,
          residentName,
          originalOperationId: op.id,
          originalStatus: op.status,
          isEligible: false,
          exclusionReason: `Status ${op.status} is non-terminal`,
        });
      }
    }

    const eligibleStaysCount = stays.filter((s) => s.isEligible).length;
    const excludedStaysCount = stays.filter((s) => !s.isEligible).length;
    const hasUnresolvedRecovery = unresolvedRecoveryCount > 0;

    let blockingReason: string | undefined;
    if (hasUnresolvedRecovery) {
      blockingReason = `Cannot create retry run: ${unresolvedRecoveryCount} operation(s) remain in RECOVERY_REQUIRED status. Resolve them in Recovery Workbench first.`;
    } else if (eligibleStaysCount === 0) {
      blockingReason = 'No eligible failed or uncommitted stays found for retry in this run.';
    }

    return {
      originalRunId: run.id,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      totalStaysInOriginalRun: run.totalOperations,
      eligibleStaysCount,
      excludedStaysCount,
      hasUnresolvedRecovery,
      unresolvedRecoveryCount,
      canCreateRetry: !hasUnresolvedRecovery && eligibleStaysCount > 0,
      blockingReason,
      stays,
    };
  }

  /**
   * Creates an immutable Retry BillingRun linked to originalRunId.
   * Scopes strictly to eligible failed/uncommitted Stays and enters DRAFT_PREVIEW.
   */
  async createRetryRun(
    originalRunId: string,
    operatorId: string,
    notes?: string
  ): Promise<BillingRun> {
    if (!operatorId || operatorId.trim() === '') {
      throw new Error('createRetryRun requires an operatorId.');
    }

    const scope = await this.getRetryScope(originalRunId);

    if (!scope.canCreateRetry) {
      throw new Error(scope.blockingReason || `Cannot create retry run for '${originalRunId}'.`);
    }

    const originalRun = await this.billingRunRepository.getById(originalRunId);
    if (!originalRun) {
      throw new Error(`Original BillingRun '${originalRunId}' not found.`);
    }

    const eligibleStayIds = scope.stays.filter((s) => s.isEligible).map((s) => s.stayId);
    const retryRunId = `RUN-RETRY-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const retryNotes = notes?.trim()
      ? `Retry of ${originalRun.id} | ${notes.trim()}`
      : `Retry of run ${originalRun.id}`;

    // Create operations for eligible stays
    const operations = eligibleStayIds.map((stayId) => {
      const originalOp = originalRun.getOperationByStayId(stayId);
      return new BillingOperation({
        id: `op_${retryRunId}_${stayId}`,
        billingRunId: retryRunId,
        stayId,
        residentId: originalOp?.residentId || '',
        residentCode: originalOp?.residentCode || '',
        status: 'PENDING',
      });
    });

    const retryRun = new BillingRun({
      id: retryRunId,
      periodStart: originalRun.periodStart,
      periodEnd: originalRun.periodEnd,
      operatorId: operatorId.trim(),
      retryOfRunId: originalRun.id,
      notes: retryNotes,
      status: 'DRAFT_PREVIEW',
      operations,
    });

    await this.billingRunRepository.save(retryRun);
    return retryRun;
  }
}
