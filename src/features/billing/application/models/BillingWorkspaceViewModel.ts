import type { BillingRunStatus, BillingOperationOutcome } from '../../domain/valueObjects/BillingTypes';

export interface DiscoveredChargeDetail {
  readonly obligationKey: string;
  readonly chargeType: string;
  readonly description: string;
  readonly amount: number;
  readonly businessDate: string;
  readonly category: string;
  readonly commitmentStatus: 'UNCOMMITTED' | 'COMMITTED';
  readonly isEligible: boolean;
  readonly eligibilityReason?: string;
  readonly financialReferenceId?: string;
}

export interface StayBillingPreviewSummary {
  readonly stayId: string;
  readonly residentId: string;
  readonly residentCode: string;
  readonly residentName: string;
  readonly flatCode?: string;
  readonly bedNumber?: string;
  readonly totalDiscoveredAmount: number;
  readonly eligibleAmount: number;
  readonly committedAmount: number;
  readonly charges: readonly DiscoveredChargeDetail[];
  readonly status: 'BILLABLE' | 'NO_CHARGES' | 'ALREADY_COMMITTED';
}

export interface BillingPreviewViewModel {
  readonly runId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly operatorId: string;
  readonly totalDiscoveredAmount: number;
  readonly totalEligibleAmount: number;
  readonly totalCommittedAmount: number;
  readonly affectedStaysCount: number;
  readonly eligibleStaysCount: number;
  readonly stays: readonly StayBillingPreviewSummary[];
  readonly hasMaterialChanges: boolean;
  readonly deltaDetails: readonly string[];
  readonly canConfirm: boolean;
}

export interface BillingOperationDetailViewModel {
  readonly id: string;
  readonly billingRunId: string;
  readonly stayId: string;
  readonly residentId: string;
  readonly residentCode: string;
  readonly residentName?: string;
  readonly status: BillingOperationOutcome;
  readonly totalAmount: number;
  readonly financialBillId?: string;
  readonly failureReason?: string;
  readonly recoveryNotes?: string;
  readonly obligationKeys: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BillingRunSummaryViewModel {
  readonly id: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly status: BillingRunStatus;
  readonly operatorId: string;
  readonly affectedStaysCount: number;
  readonly totalAmount: number;
  readonly successfulOperationsCount: number;
  readonly failedOperationsCount: number;
  readonly recoveryRequiredOperationsCount: number;
  readonly notProcessedOperationsCount: number;
  readonly createdAt: string;
  readonly confirmedAt?: string;
  readonly completedAt?: string;
  readonly stoppedAt?: string;
  readonly retryOfRunId?: string;
  readonly notes?: string;
}

export interface BillingRunDetailViewModel extends BillingRunSummaryViewModel {
  readonly operations: readonly BillingOperationDetailViewModel[];
}

export interface BillingWorkspaceSummaryViewModel {
  readonly activeRun: BillingRunSummaryViewModel | null;
  readonly totalRunsCount: number;
  readonly completedRunsCount: number;
  readonly partiallyCompletedRunsCount: number;
  readonly failedRunsCount: number;
  readonly recoveryRequiredCount: number;
  readonly totalAmountBilledAllTime: number;
  readonly recentRuns: readonly BillingRunSummaryViewModel[];
}

export type RecoveryAssessment = 'COMMITTED' | 'NOT_COMMITTED' | 'UNKNOWN';

export type RecoveryRecommendedAction =
  | 'RESOLVE_COMMITTED'
  | 'RESOLVE_NOT_COMMITTED'
  | 'MANUAL_INVESTIGATION_REQUIRED';

export interface MatchedFinanceBillViewModel {
  readonly id: string;
  readonly billNumber: string;
  readonly stayId: string;
  readonly period: string;
  readonly totalAmount: number;
  readonly status: string;
  readonly issueDate: string;
  readonly dueDate: string;
  readonly lineItems: readonly {
    readonly id: string;
    readonly description: string;
    readonly amount: number;
    readonly category: string;
    readonly obligationKey?: string;
  }[];
  readonly remarks?: string;
}

export interface MatchedLedgerEntryViewModel {
  readonly id: string;
  readonly stayId: string;
  readonly postingDate: string;
  readonly effectiveDate: string;
  readonly referenceType: string;
  readonly referenceId: string;
  readonly account: string;
  readonly debit: number;
  readonly credit: number;
  readonly remarks: string;
}

export interface RecoveryEvidenceViewModel {
  readonly operation: BillingOperationDetailViewModel;
  readonly stayId: string;
  readonly residentId: string;
  readonly residentCode: string;
  readonly residentName: string;
  readonly matchedBills: readonly MatchedFinanceBillViewModel[];
  readonly matchedLedgerEntries: readonly MatchedLedgerEntryViewModel[];
  readonly assessment: RecoveryAssessment;
  readonly assessmentExplanation: string;
  readonly recommendedAction: RecoveryRecommendedAction;
  readonly recommendedBillId?: string;
}

export interface RetryStayScopeItem {
  readonly stayId: string;
  readonly residentId: string;
  readonly residentCode: string;
  readonly residentName: string;
  readonly originalOperationId: string;
  readonly originalStatus: BillingOperationOutcome;
  readonly isEligible: boolean;
  readonly exclusionReason?: string;
}

export interface RetryRunScopeViewModel {
  readonly originalRunId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly totalStaysInOriginalRun: number;
  readonly eligibleStaysCount: number;
  readonly excludedStaysCount: number;
  readonly hasUnresolvedRecovery: boolean;
  readonly unresolvedRecoveryCount: number;
  readonly canCreateRetry: boolean;
  readonly blockingReason?: string;
  readonly stays: readonly RetryStayScopeItem[];
}
