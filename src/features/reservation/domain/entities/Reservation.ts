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
  accommodationPreference?: string; // Free-text preference (e.g. 'Double Sharing, 1st Floor')
  tokenAmount?: number; // Simplified token amount
  tokenReceivedOn?: string; // YYYY-MM-DD
  tokenRemarks?: string; // Remarks for token
  status: ReservationStatus;
  notes?: string;
  auditLog: ReservationAuditEntry[];
  createdAt: string;
  updatedAt: string;
}
