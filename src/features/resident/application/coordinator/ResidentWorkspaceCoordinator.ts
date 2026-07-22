import type { ResidentWorkspaceViewModel } from '../models/ResidentWorkspaceViewModel';

export class ResidentWorkspaceCoordinator {
  public createViewModel(residentId: string): ResidentWorkspaceViewModel {
    const activeResidentId = residentId || '';

    return {
      header: {
        fullName: 'Rajesh Kumar',
        residentCode: 'R000124',
        residentId: activeResidentId,
        status: 'Active Resident',
        primaryMobile: '+91 98765 43210',
        email: 'rajesh.kumar@example.com',
      },
      summary: {
        residentCode: 'R000124',
        joiningDate: '12-Mar-2026',
        occupation: 'Working Professional',
        employerOrCollege: 'Tech Solutions Ltd.',
        bloodGroup: 'O+ Positive',
      },
      contactInformation: {
        primaryMobile: '+91 98765 43210',
        alternateMobile: '+91 98765 43211',
        email: 'rajesh.kumar@example.com',
        city: 'Bangalore',
        state: 'Karnataka',
        pinCode: '560038',
        permanentAddress: '#42, 2nd Main, Indiranagar, Bangalore - 560038',
        correspondenceAddress: 'Same as Permanent Address',
      },
      documents: [
        { id: 'doc-1', type: 'Aadhaar Card', number: 'XXXX-XXXX-1234', status: 'Verified', color: 'success' },
        { id: 'doc-2', type: 'PAN Card', number: 'ABCDE1234F', status: 'Verified', color: 'success' },
        { id: 'doc-3', type: 'Rental Agreement', number: 'AGR-2026-089', status: 'Signed', color: 'primary' },
      ],
      emergencyContact: {
        contactName: 'Ramesh Kumar',
        relationship: 'Father',
        emergencyPhone: '+91 98765 43210',
        fatherOrGuardianName: 'Ramesh Kumar',
        motherName: 'Sunita Kumar',
      },
    };
  }
}
