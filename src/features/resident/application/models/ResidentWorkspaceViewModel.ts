export interface ResidentHeaderViewModel {
  fullName: string;
  residentCode: string;
  residentId: string;
  status: string;
  avatarUrl?: string;
}

export interface CurrentStaySummaryViewModel {
  stayId: string;
  area: string;
  flat: string;
  bed: string;
  doorId: string;
  joiningDate: string;
  monthlyRent: number;
  securityDeposit: number;
  stayStatus: string;
  hasActiveStay: boolean;
}

export interface ProfileCompletionViewModel {
  percentage: number;
  missingItems: string[];
}

export interface ReadinessRequirementItem {
  label: string;
  isSatisfied: boolean;
}

export interface OperationalReadinessViewModel {
  isReady: boolean;
  statusLabel: string;
  requirements: ReadinessRequirementItem[];
  missingMandatoryItems: string[];
}

export interface PersonalInformationViewModel {
  fullName: string;
  residentCode: string;
  gender: string;
  dateOfBirth: string;
  occupation: string;
  organizationName: string;
  bloodGroup: string;
}

export interface ContactInformationViewModel {
  primaryMobile: string;
  alternateMobile: string;
  email: string;
}

export interface AddressViewModel {
  permanentAddress: string;
  correspondenceAddress: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface DocumentItemViewModel {
  id: string;
  type: string;
  number: string;
  status: string;
  color: 'success' | 'primary' | 'warning' | 'default';
}

export interface EmergencyContactViewModel {
  contactName: string;
  relationship: string;
  emergencyPhone: string;
  motherName: string;
}

export interface VehicleItemViewModel {
  id: string;
  vehicleType: string;
  registrationNumber: string;
}

export interface DeviceItemViewModel {
  id: string;
  deviceName: string;
  deviceType: string;
  macAddress: string;
}

export interface ResidentWorkspaceViewModel {
  header: ResidentHeaderViewModel;
  currentStay: CurrentStaySummaryViewModel;
  profileCompletion: ProfileCompletionViewModel;
  operationalReadiness: OperationalReadinessViewModel;
  personalInformation: PersonalInformationViewModel;
  contactInformation: ContactInformationViewModel;
  address: AddressViewModel;
  emergencyContact: EmergencyContactViewModel;
  documents: DocumentItemViewModel[];
  vehicles: VehicleItemViewModel[];
  devices: DeviceItemViewModel[];
}
