import type { Resident } from '../../domain/entities/Resident';
import type { ResidentRepository } from '../../domain/interfaces/ResidentRepository';
import { InMemoryResidentRepository } from '../../infrastructure/repositories/InMemoryResidentRepository';
import type { ResidentWorkspaceViewModel } from '../models/ResidentWorkspaceViewModel';

export class ResidentWorkspaceCoordinator {
  private repository: ResidentRepository;

  constructor(repository: ResidentRepository = new InMemoryResidentRepository()) {
    this.repository = repository;
  }

  public createViewModel(residentId: string): ResidentWorkspaceViewModel {
    const activeResidentId = residentId || '';

    // Retrieve Resident entity using ResidentRepository contract
    let resident: Resident | null = null;
    if (
      'getByIdSync' in this.repository &&
      typeof (this.repository as { getByIdSync?: (id: string) => Resident | null }).getByIdSync === 'function'
    ) {
      resident = (this.repository as { getByIdSync: (id: string) => Resident | null }).getByIdSync(activeResidentId);
      if (!resident && !activeResidentId) {
        resident = (this.repository as { getByIdSync: (id: string) => Resident | null }).getByIdSync('RES-00124');
      }
    }

    if (!resident) {
      return this.mapResidentToViewModel({
        id: activeResidentId || 'NOT_FOUND',
        residentCode: 'R000000',
        fullName: 'Unknown Resident',
        status: 'CHECKED_OUT',
        mobileNumber: 'N/A',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return this.mapResidentToViewModel(resident);
  }

  private mapResidentToViewModel(resident: Resident): ResidentWorkspaceViewModel {
    const statusLabel =
      resident.status === 'ACTIVE'
        ? 'Active Resident'
        : resident.status === 'ON_NOTICE'
        ? 'On Notice'
        : resident.status === 'CHECKED_OUT'
        ? 'Checked Out'
        : 'Alumni';

    return {
      header: {
        fullName: resident.fullName,
        residentCode: resident.residentCode,
        residentId: resident.id,
        status: statusLabel,
        primaryMobile: resident.mobileNumber,
        email: resident.email || 'N/A',
      },
      summary: {
        residentCode: resident.residentCode,
        joiningDate: '12-Mar-2026',
        occupation: resident.occupation || 'N/A',
        employerOrCollege: resident.organizationName || 'N/A',
        bloodGroup: resident.bloodGroup || 'N/A',
      },
      contactInformation: {
        primaryMobile: resident.mobileNumber,
        alternateMobile: resident.alternateMobileNumber || 'N/A',
        email: resident.email || 'N/A',
        city: resident.city || 'N/A',
        state: resident.state || 'N/A',
        pinCode: resident.pinCode || 'N/A',
        permanentAddress: resident.permanentAddress || 'N/A',
        correspondenceAddress: resident.correspondenceAddress || 'N/A',
      },
      documents: resident.documents && resident.documents.length > 0
        ? resident.documents.map((doc, idx) => ({
            id: `doc-${idx + 1}`,
            type: doc.type === 'AADHAAR' ? 'Aadhaar Card' : doc.type === 'PAN' ? 'PAN Card' : doc.type,
            number: doc.documentNumber,
            status: doc.verificationStatus,
            color: doc.verificationStatus === 'Verified' ? 'success' : 'primary',
          }))
        : [
            { id: 'doc-1', type: 'Aadhaar Card', number: 'XXXX-XXXX-1234', status: 'Verified', color: 'success' },
            { id: 'doc-2', type: 'PAN Card', number: 'ABCDE1234F', status: 'Verified', color: 'success' },
          ],
      emergencyContact: {
        contactName: resident.emergencyContact?.name || 'Ramesh Kumar',
        relationship: resident.emergencyContact?.relationship || 'Father',
        emergencyPhone: resident.emergencyContact?.phone || '+91 98765 43210',
        fatherOrGuardianName: resident.fatherOrGuardianName || 'Ramesh Kumar',
        motherName: resident.motherName || 'Sunita Kumar',
      },
    };
  }
}
