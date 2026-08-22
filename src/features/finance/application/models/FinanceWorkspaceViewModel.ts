import type {
  FinanceDashboardMetrics,
  OutstandingResidentReportItem,
  SettlementReportItem,
  FinanceTimelineEvent,
  FinanceSummary,
  StayBalance,
  TimelineSummary,
} from '../../types';

export interface PaymentHistoryItem {
  id: string;
  paymentNumber: string;
  stayId: string;
  residentId: string;
  residentName: string;
  residentCode: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  status: string;
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
  remarks?: string;
  createdAt: string;
}

export interface FinanceWorkspaceViewModel {
  metrics: FinanceDashboardMetrics;
  outstandingResidents: OutstandingResidentReportItem[];
  settlementsReport: SettlementReportItem[];
  paymentHistory: PaymentHistoryItem[];
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
