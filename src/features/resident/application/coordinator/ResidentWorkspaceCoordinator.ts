import type { Resident } from '../../domain/entities/Resident';
import type { ResidentRepository } from '../../domain/interfaces/ResidentRepository';
import { InMemoryResidentRepository } from '../../infrastructure/repositories/InMemoryResidentRepository';
import type { DocumentItemViewModel, ResidentWorkspaceViewModel } from '../models/ResidentWorkspaceViewModel';

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

    const formattedJoiningDate = this.formatDate(resident.createdAt);

    const documentsViewModel: DocumentItemViewModel[] =
      resident.documents && resident.documents.length > 0
        ? resident.documents.map((doc, idx) => ({
            id: `doc-${idx + 1}`,
            type: this.formatDocumentType(doc.type),
            number: doc.documentNumber,
            status: doc.verificationStatus,
            color: doc.verificationStatus === 'Verified' ? 'success' : 'primary',
          }))
        : [];

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
        joiningDate: formattedJoiningDate,
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
      documents: documentsViewModel,
      emergencyContact: {
        contactName: resident.emergencyContact?.name || 'N/A',
        relationship: resident.emergencyContact?.relationship || 'N/A',
        emergencyPhone: resident.emergencyContact?.phone || 'N/A',
        fatherOrGuardianName: resident.fatherOrGuardianName || 'N/A',
        motherName: resident.motherName || 'N/A',
      },
    };
  }

  private formatDocumentType(type: string): string {
    switch (type) {
      case 'AADHAAR':
        return 'Aadhaar Card';
      case 'PAN':
        return 'PAN Card';
      case 'PASSPORT':
        return 'Passport';
      case 'DRIVING_LICENCE':
        return 'Driving Licence';
      case 'VOTER_ID':
        return 'Voter ID';
      case 'GOVERNMENT_ID':
        return 'Government ID';
      default:
        return type;
    }
  }

  private formatDate(isoDateString: string): string {
    try {
      const d = new Date(isoDateString);
      if (isNaN(d.getTime())) return isoDateString;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoDateString;
    }
  }
}
