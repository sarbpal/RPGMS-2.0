export const ResidentStatus = {
  ACTIVE: 'ACTIVE',
  ON_NOTICE: 'ON_NOTICE',
  CHECKED_OUT: 'CHECKED_OUT',
  ALUMNI: 'ALUMNI',
} as const;

export type ResidentStatus = typeof ResidentStatus[keyof typeof ResidentStatus];

export const DocumentType = {
  AADHAAR: 'AADHAAR',
  PASSPORT: 'PASSPORT',
  DRIVING_LICENSE: 'DRIVING_LICENSE',
  PAN: 'PAN',
  VOTER_ID: 'VOTER_ID',
  GOVERNMENT_ID: 'GOVERNMENT_ID',
  OTHER: 'OTHER',
} as const;

export type DocumentType = typeof DocumentType[keyof typeof DocumentType];

export interface Resident {
  id: string;
  residentCode: string;
  fullName: string;
  mobileNumber: string;
  documentType: DocumentType;
  documentNumber: string;
  joiningDate: string;
  flatId: string;
  allocatedBedIds: string[];
  agreedRent: number;
  agreedDeposit: number;
  status: ResidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ResidentDraft {
  fullName: string;
  mobileNumber: string;
  documentType: DocumentType;
  documentNumber: string;
  joiningDate: string;
  flatId: string;
  allocatedBedIds: string[];
  agreedRent: number;
  agreedDeposit: number;
}
