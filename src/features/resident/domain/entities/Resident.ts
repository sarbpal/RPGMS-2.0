import type { Gender } from '../valueObjects/Gender';
import type { IdentityDocumentType } from '../valueObjects/IdentityDocumentType';
import type { ResidentStatus } from '../valueObjects/ResidentStatus';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IdentityDocument {
  type: IdentityDocumentType;
  documentNumber: string;
  verificationStatus: 'Verified' | 'Pending' | 'Signed';
}

export interface RegisteredVehicle {
  id: string;
  vehicleType: string;
  registrationNumber: string;
}

export interface RegisteredDevice {
  id: string;
  deviceName: string;
  deviceType: string;
  macAddress: string;
}

export interface Resident {
  id: string;
  residentCode: string;
  fullName: string;
  gender?: Gender;
  dateOfBirth?: string;
  status: ResidentStatus;
  mobileNumber: string;
  alternateMobileNumber?: string;
  email?: string;
  occupation?: string;
  organizationName?: string;
  bloodGroup?: string;
  motherName?: string;
  permanentAddress?: string;
  correspondenceAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  documents?: IdentityDocument[];
  emergencyContact?: EmergencyContact;
  vehicles?: RegisteredVehicle[];
  devices?: RegisteredDevice[];
  createdAt: string;
  updatedAt: string;
}
