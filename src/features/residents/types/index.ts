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
  alternateMobile?: string;
  email?: string;
  documentType: DocumentType;
  documentNumber: string;

  // Family
  fatherOrGuardianName?: string;
  motherName?: string;

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;

  // Address
  permanentAddress?: string;
  correspondenceAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;

  // Occupation / Education
  occupation?: string;
  employerOrCollege?: string;

  // Medical
  bloodGroup?: string;
  medicalNotes?: string;

  // Operational Stay Attributes
  joiningDate: string;
  flatId: string;
  allocatedBedIds: string[];
  agreedRent: number;
  agreedDeposit: number;
  status: ResidentStatus;

  // System Metadata
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
