import type { TokenDisposition } from '../../domain/valueObjects/TokenDisposition';

export interface AdmissionDraft {
  sourceType?: 'RESERVATION' | 'WALK_IN';
  reservationId?: string;
  // Section 2: Resident Identity Details
  residentName: string;
  mobileNumber: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  idProofType?: string;
  idProofNumber?: string;
  permanentAddress?: string;

  // Section 3: Commercial Terms
  checkInDate: string;
  agreedRent: number | '';
  agreedDeposit: number | '';
  lockInPeriodMonths?: number;
  noticePeriodDays?: number;

  // Section 4: Accommodation Selection
  flatId?: string;
  bedIds?: string[];

  // Section 5: Token Decision
  tokenDisposition?: TokenDisposition;
  notes?: string;
}
