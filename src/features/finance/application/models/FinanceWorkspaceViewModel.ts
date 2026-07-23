import type {
  FinanceDashboardMetrics,
  OutstandingResidentReportItem,
  SettlementReportItem,
  FinanceTimelineEvent,
  FinanceSummary,
  StayBalance,
  TimelineSummary,
} from '../../types';

export interface FinanceWorkspaceViewModel {
  metrics: FinanceDashboardMetrics;
  outstandingResidents: OutstandingResidentReportItem[];
  settlementsReport: SettlementReportItem[];
  activity: FinanceTimelineEvent[];
}

export interface StayFinanceViewModel {
  stayId: string;
  balances: StayBalance;
  timeline: FinanceTimelineEvent[];
  summary: TimelineSummary;
}

export interface PropertyFinanceSummaryViewModel {
  summary: FinanceSummary;
}
