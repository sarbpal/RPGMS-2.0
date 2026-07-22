import type { Resident } from '../../domain/entities/Resident';
import { Gender } from '../../domain/valueObjects/Gender';
import { IdentityDocumentType } from '../../domain/valueObjects/IdentityDocumentType';
import { ResidentStatus } from '../../domain/valueObjects/ResidentStatus';
import type { ResidentWorkspaceViewModel } from '../models/ResidentWorkspaceViewModel';

export class ResidentWorkspaceCoordinator {
  public createViewModel(residentId: string): ResidentWorkspaceViewModel {
    const activeResidentId = residentId || '';

    // Placeholder domain entity representation
    const dummyResident: Resident = {
      id: activeResidentId || 'RES-00124',
      residentCode: 'R000124',
      fullName: 'Rajesh Kumar',
      gender: Gender.MALE,
      dateOfBirth: '1998-05-15',
      status: ResidentStatus.ACTIVE,
      mobileNumber: '+91 98765 43210',
      alternateMobileNumber: '+91 98765 43211',
      email: 'rajesh.kumar@example.com',
      occupation: 'Working Professional',
      organizationName: 'Tech Solutions Ltd.',
      bloodGroup: 'O+ Positive',
      fatherOrGuardianName: 'Ramesh Kumar',
      motherName: 'Sunita Kumar',
      permanentAddress: '#42, 2nd Main, Indiranagar, Bangalore - 560038',
      correspondenceAddress: 'Same as Permanent Address',
      city: 'Bangalore',
      state: 'Karnataka',
      pinCode: '560038',
      documents: [
        { type: IdentityDocumentType.AADHAAR, documentNumber: 'XXXX-XXXX-1234', verificationStatus: 'Verified' },
        { type: IdentityDocumentType.PAN, documentNumber: 'ABCDE1234F', verificationStatus: 'Verified' },
      ],
      emergencyContact: {
        name: 'Ramesh Kumar',
        relationship: 'Father',
        phone: '+91 98765 43210',
      },
      createdAt: '2026-03-12T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    };

    return {
      header: {
        fullName: dummyResident.fullName,
        residentCode: dummyResident.residentCode,
        residentId: dummyResident.id,
        status: dummyResident.status === ResidentStatus.ACTIVE ? 'Active Resident' : dummyResident.status,
        primaryMobile: dummyResident.mobileNumber,
        email: dummyResident.email || '',
      },
      summary: {
        residentCode: dummyResident.residentCode,
        joiningDate: '12-Mar-2026',
        occupation: dummyResident.occupation || 'N/A',
        employerOrCollege: dummyResident.organizationName || 'N/A',
        bloodGroup: dummyResident.bloodGroup || 'N/A',
      },
      contactInformation: {
        primaryMobile: dummyResident.mobileNumber,
        alternateMobile: dummyResident.alternateMobileNumber || 'N/A',
        email: dummyResident.email || 'N/A',
        city: dummyResident.city || 'N/A',
        state: dummyResident.state || 'N/A',
        pinCode: dummyResident.pinCode || 'N/A',
        permanentAddress: dummyResident.permanentAddress || 'N/A',
        correspondenceAddress: dummyResident.correspondenceAddress || 'N/A',
      },
      documents: [
        { id: 'doc-1', type: 'Aadhaar Card', number: 'XXXX-XXXX-1234', status: 'Verified', color: 'success' },
        { id: 'doc-2', type: 'PAN Card', number: 'ABCDE1234F', status: 'Verified', color: 'success' },
        { id: 'doc-3', type: 'Rental Agreement', number: 'AGR-2026-089', status: 'Signed', color: 'primary' },
      ],
      emergencyContact: {
        contactName: dummyResident.emergencyContact?.name || 'Ramesh Kumar',
        relationship: dummyResident.emergencyContact?.relationship || 'Father',
        emergencyPhone: dummyResident.emergencyContact?.phone || '+91 98765 43210',
        fatherOrGuardianName: dummyResident.fatherOrGuardianName || 'Ramesh Kumar',
        motherName: dummyResident.motherName || 'Sunita Kumar',
      },
    };
  }
}
