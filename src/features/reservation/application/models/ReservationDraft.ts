export interface ReservationDraft {
  id?: string;
  prospectName: string;
  mobileNumber: string;
  expectedJoiningDate: string;
  accommodationPreference?: string;
  tokenAmount?: number;
  tokenReceivedOn?: string;
  tokenRemarks?: string;
  notes?: string;
}
