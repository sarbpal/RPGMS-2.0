import type { ReservationStatus } from '../valueObjects/ReservationStatus';

export interface ReservationAuditEntry {
  timestamp: string;
  action: string;
  performedBy?: string;
  details?: string;
}

export interface Reservation {
  id: string;
  reservationNumber: string; // Format: RES-000001
  prospectName: string;
  mobileNumber: string;
  expectedJoiningDate: string; // ISO format: YYYY-MM-DD
  expectedMonthlyRent?: number;
  expectedSecurityDeposit?: number;
  accommodationPreference?: string;
  tokenAmount?: number;
  tokenReceivedOn?: string; // YYYY-MM-DD
  tokenRemarks?: string;
  status: ReservationStatus;
  notes?: string;
  cancellationReason?: string;
  convertedResidentId?: string;
  convertedStayId?: string;
  auditLog: ReservationAuditEntry[];
  createdAt: string;
  updatedAt: string;
}
