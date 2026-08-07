export interface AdmissionResult {
  success: boolean;
  residentCode: string; // RESID-000001
  residentName: string;
  residentId?: string;
  stayId: string;
  reservationNumber: string;
  allocatedFlatNumber: string;
  allocatedBedNumbers: string[];
  agreedRent: number;
  agreedDeposit: number;
  appliedTokenDisposition: string;
  tokenAmount: number;
  adjustedDepositBalance?: number;
  adjustedRentBalance?: number;
  timestamp: string;
}
