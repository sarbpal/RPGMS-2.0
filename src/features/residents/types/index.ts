export const ResidentStatus = {
  ACTIVE: 'Active',
  ON_NOTICE: 'On Notice',
  CHECKED_OUT: 'Checked Out',
  ALUMNI: 'Alumni',
} as const;

export type ResidentStatus = typeof ResidentStatus[keyof typeof ResidentStatus];

export interface PersonalInfo {
  residentId: string;
  fullName: string;
  mobileNumber: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  mobileNumber: string;
}

export interface Resident {
  id: string; // Matches personalInfo.residentId
  personalInfo: PersonalInfo;
  emergencyContact: EmergencyContact;
  flatId: string;
  assignedBedIds: string[];
  joiningDate: string;
  status: ResidentStatus;
}
