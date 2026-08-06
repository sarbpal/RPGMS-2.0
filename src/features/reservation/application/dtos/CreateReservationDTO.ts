export interface CreateReservationDTO {
  prospectName: string;
  mobileNumber: string;
  expectedJoiningDate: string; // ISO format: YYYY-MM-DD
  expectedMonthlyRent?: number;
  expectedSecurityDeposit?: number;
  accommodationPreference?: string;
  tokenAmount?: number;
  tokenReceivedOn?: string;
  tokenRemarks?: string;
  notes?: string;
}
