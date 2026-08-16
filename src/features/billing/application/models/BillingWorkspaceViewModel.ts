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
