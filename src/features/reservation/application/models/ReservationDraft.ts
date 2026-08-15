export interface ReservationDraft {
  id?: string;
  prospectName: string;
  mobileNumber: string;
  expectedJoiningDate: string;
  expectedMonthlyRent?: number;
  expectedSecurityDeposit?: number;
  accommodationPreference?: string;
  tokenAmount?: number;
  tokenReceivedOn?: string;
  tokenRemarks?: string;
  notes?: string;
}
