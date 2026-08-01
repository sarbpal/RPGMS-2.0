export interface ResidentHeaderViewModel {
  fullName: string;
  residentCode: string;
  residentId: string;
  status: string;
  primaryMobile: string;
  email: string;
}

export interface ResidentSummaryViewModel {
  residentCode: string;
  joiningDate: string;
  occupation: string;
  employerOrCollege: string;
  bloodGroup: string;
}

export interface ContactInformationViewModel {
  primaryMobile: string;
  alternateMobile: string;
  email: string;
  city: string;
  state: string;
  pinCode: string;
  permanentAddress: string;
  correspondenceAddress: string;
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

export interface ResidentWorkspaceViewModel {
  header: ResidentHeaderViewModel;
  summary: ResidentSummaryViewModel;
  contactInformation: ContactInformationViewModel;
  documents: DocumentItemViewModel[];
  emergencyContact: EmergencyContactViewModel;
}
