export * from '../domain';

export interface FinanceTimelineEvent {
  id: string;
  stayId: string;
  date: Date;
  type: 'BILL' | 'PAYMENT' | 'LEDGER' | 'SETTLEMENT';
  title: string;
  description: string;
  amount: number;
  referenceId: string;
  metadata?: Record<string, unknown>;
}

export interface TimelineSummary {
  totalBillsCount: number;
  totalPaymentsCount: number;
  outstandingBalance: number;
  advanceCredit: number;
  securityDepositHeld: number;
  settlementStatus: 'NONE' | 'SETTLED';
}

export interface FinanceDashboardMetrics {
  outstandingReceivables: number;
  advanceCredits: number;
  securityDepositLiability: number;
  totalMonthlyBilling: number;
  totalCollections: number;
  pendingSettlementsCount: number;
  activeResidentsCount: number;
  closedSettlementsCount: number;
}

export interface ResidentFinancialSummaryReport {
  stayId: string;
  residentName: string;
  currentBalance: number;
  totalBillsAmount: number;
  totalPaymentsAmount: number;
  advanceCredit: number;
  securityDeposit: number;
  settlementStatus: string;
  timelineSummary: TimelineSummary;
}

export interface MonthlyCollectionsReport {
  month: number;
  year: number;
  cashCollections: number;
  bankCollections: number;
  totalCollections: number;
  paymentCount: number;
}

export interface OutstandingResidentReportItem {
  stayId: string;
  residentId: string;
  residentName: string;
  phone?: string;
  roomBedLabel?: string;
  outstandingAmount: number;
}

export interface SettlementReportItem {
  settlementId: string;
  settlementNumber: string;
  stayId: string;
  residentName: string;
  settlementDate: string;
  netRefundAmount: number;
  residentPaymentAmount: number;
  damageRecovery: number;
  outcome: import('../domain').SettlementOutcome;
}
