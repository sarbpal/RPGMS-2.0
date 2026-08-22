export interface StayHeaderViewModel {
  residentName: string;
  residentId: string;
  stayId: string;
  status: string;
  checkInDate: string;
  allocation: string;
}

export interface StaySummaryViewModel {
  status: string;
  occupancyDuration: string;
  noticeStatus: string;
  rentPlan: string;
  securityDeposit: string;
  bedAllocation: string;
}

export interface FinancialSummaryViewModel {
  outstandingBalance: number;
  currentMonthRent: number;
  pendingElectricity: number;
  pendingLaundry: number;
  securityDepositHeld: number;
  lastPaymentReceived: string;
  nextBillingDate: string;
  currentMonthCharges?: number;
  advanceCredit?: number;
  netBalance?: number;
}

export interface TimelineEventViewModel {
  id: string;
  title: string;
  description: string;
  date: string;
  type: string;
  color: 'success' | 'error' | 'warning' | 'info' | 'default';
}

export interface VerificationDocumentViewModel {
  name: string;
  status: string;
  statusColor: 'success' | 'primary' | 'warning' | 'default';
}

export interface EmergencyContactViewModel {
  name: string;
  relationship: string;
  phone: string;
}

export interface SupportingInformationViewModel {
  documents: VerificationDocumentViewModel[];
  emergencyContact: EmergencyContactViewModel;
  notes: string;
}

export interface StayWorkspaceViewModel {
  header: StayHeaderViewModel;
  summary: StaySummaryViewModel;
  financialSummary: FinancialSummaryViewModel;
  timeline: TimelineEventViewModel[];
  supportingInformation: SupportingInformationViewModel;
}
