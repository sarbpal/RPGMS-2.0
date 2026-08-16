import type { ReservationStatus } from '../valueObjects/ReservationStatus';

export interface ReservationAuditEntry {
  timestamp: string;
  action: string;
  performedBy?: string;
  details?: string;
}

export type TokenCancellationDisposition = 'REFUND' | 'FORFEIT';

export interface ReservationTokenDisposition {
  outcome: TokenCancellationDisposition;
  amount: number;
  decidedOn: string;
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
  tokenReceivedOn?: string;
  tokenRemarks?: string;
  status: ReservationStatus;
  notes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  tokenDisposition?: ReservationTokenDisposition;
  convertedResidentId?: string;
  convertedStayId?: string;
  auditLog: ReservationAuditEntry[];
  createdAt: string;
  updatedAt: string;
}
