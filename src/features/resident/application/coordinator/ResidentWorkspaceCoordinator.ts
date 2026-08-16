import type { Resident } from '../../domain/entities/Resident';
import type { ResidentRepository } from '../../domain/interfaces/ResidentRepository';
import { defaultResidentRepository } from '../../infrastructure/repositories/InMemoryResidentRepository';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import { defaultStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import type { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import type {
  CurrentStaySummaryViewModel,
  DeviceItemViewModel,
  DocumentItemViewModel,
  OperationalReadinessViewModel,
  ProfileCompletionViewModel,
  ResidentWorkspaceViewModel,
  VehicleItemViewModel,
} from '../models/ResidentWorkspaceViewModel';

export class ResidentWorkspaceCoordinator {
  private _repository: ResidentRepository;
  private _stayRepository: StayRepository;

  constructor(
    repository: ResidentRepository = defaultResidentRepository,
    stayRepository: StayRepository = defaultStayRepository
  ) {
    this._repository = repository;
    this._stayRepository = stayRepository;
  }

  public get repository(): ResidentRepository {
    return this._repository;
  }

  public get residentRepository(): ResidentRepository {
    return this._repository;
  }

  public get stayRepository(): StayRepository {
    return this._stayRepository;
  }

  public createViewModel(residentId: string): ResidentWorkspaceViewModel {
    const activeResidentId = residentId || '';

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
      return this.mapResidentToViewModel(
        {
          id: activeResidentId || 'NOT_FOUND',
          residentCode: 'R000000',
          fullName: 'Unknown Resident',
          status: 'CHECKED_OUT',
          mobileNumber: 'N/A',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        null
      );
    }

    let stay: Stay | null = null;
    if (
      'getAllSync' in this.stayRepository &&
      typeof (this.stayRepository as { getAllSync?: () => Stay[] }).getAllSync === 'function'
    ) {
      const allStays = (this.stayRepository as { getAllSync: () => Stay[] }).getAllSync();
      stay =
        allStays.find(
          (s) =>
            s.residentId === resident?.id &&
            (s.status === StayStatus.ACTIVE || s.status === StayStatus.ON_NOTICE)
        ) ||
        allStays.find((s) => s.residentId === resident?.id) ||
        null;
    }

    return this.mapResidentToViewModel(resident, stay);
  }

  private mapResidentToViewModel(resident: Resident, stay: Stay | null): ResidentWorkspaceViewModel {
    const statusLabel =
      resident.status === 'ACTIVE'
        ? 'Active Resident'
        : resident.status === 'ON_NOTICE'
        ? 'On Notice'
        : resident.status === 'CHECKED_OUT'
        ? 'Checked Out'
        : 'Alumni';

    const formattedJoiningDate = this.formatDate(stay?.checkInDate || resident.createdAt);

    const documentsViewModel: DocumentItemViewModel[] =
      resident.documents && resident.documents.length > 0
        ? resident.documents.map((doc, idx) => ({
            id: `doc-${idx + 1}`,
            type: doc.type === 'OTHER' && doc.customType ? doc.customType : this.formatDocumentType(doc.type),
            number: doc.documentNumber,
            status: doc.verificationStatus,
            color: doc.verificationStatus === 'Verified' ? 'success' : 'primary',
          }))
        : [];

    let currentStay: CurrentStaySummaryViewModel;
    if (stay) {
      const bedDisplay =
        stay.allocatedBedIds && stay.allocatedBedIds.length > 0
          ? stay.allocatedBedIds.map((b) => b.split('-').pop()).join(', ')
          : 'Unassigned';

      const flatDisplay = stay.flatId ? stay.flatId.replace(/^Flat\s*/i, '') : 'N/A';

      currentStay = {
        stayId: stay.id,
        area: 'Main Wing',
        flat: flatDisplay,
        bed: bedDisplay,
        doorId: stay.doorId || 'N/A',
        joiningDate: formattedJoiningDate,
        monthlyRent: stay.agreedRent,
        securityDeposit: stay.agreedDeposit,
        stayStatus: stay.status === 'ACTIVE' ? 'Active Stay' : stay.status === 'ON_NOTICE' ? 'On Notice' : stay.status,
        hasActiveStay: stay.status === 'ACTIVE' || stay.status === 'ON_NOTICE',
      };
    } else {
      currentStay = {
        stayId: '',
        area: 'N/A',
        flat: 'N/A',
        bed: 'N/A',
        doorId: 'N/A',
        joiningDate: formattedJoiningDate,
        monthlyRent: 0,
        securityDeposit: 0,
        stayStatus: 'No Active Stay',
        hasActiveStay: false,
      };
    }

    // 1. Evaluate Profile Completion
    const { percentage, missingItems } = this.evaluateProfileCompletion(resident);
    const profileCompletion: ProfileCompletionViewModel = { percentage, missingItems };

    // 2. Evaluate Operational Readiness
    const operationalReadiness = this.evaluateOperationalReadiness(resident, currentStay);

    // 3. Vehicles
    const vehicles: VehicleItemViewModel[] =
      resident.vehicles && resident.vehicles.length > 0
        ? resident.vehicles.map((v) => ({
            id: v.id,
            vehicleType: v.vehicleType,
            registrationNumber: v.registrationNumber,
          }))
        : [];

    // 4. Devices
    const devices: DeviceItemViewModel[] =
      resident.devices && resident.devices.length > 0
        ? resident.devices.map((d) => ({
            id: d.id,
            deviceName: d.deviceName,
            deviceType: d.deviceType,
            macAddress: d.macAddress,
          }))
        : [];

    return {
      header: {
        fullName: resident.fullName,
        residentCode: resident.residentCode,
        residentId: resident.id,
        status: statusLabel,
      },
      currentStay,
      profileCompletion,
      operationalReadiness,
      personalInformation: {
        fullName: resident.fullName,
        residentCode: resident.residentCode,
        gender: resident.gender ? this.formatGender(resident.gender) : 'N/A',
        dateOfBirth: resident.dateOfBirth ? this.formatDate(resident.dateOfBirth) : 'N/A',
        occupation: resident.occupation || 'N/A',
        organizationName: resident.organizationName || 'N/A',
        bloodGroup: resident.bloodGroup || 'N/A',
      },
      contactInformation: {
        primaryMobile: resident.mobileNumber,
        alternateMobile: resident.alternateMobileNumber || 'N/A',
        email: resident.email || 'N/A',
      },
      address: {
        permanentAddress: resident.permanentAddress || 'N/A',
        correspondenceAddress: resident.correspondenceAddress || 'N/A',
        city: resident.city || 'N/A',
        state: resident.state || 'N/A',
        pinCode: resident.pinCode || 'N/A',
      },
      documents: documentsViewModel,
      emergencyContact: {
        contactName: resident.emergencyContact?.name || 'N/A',
        relationship: resident.emergencyContact?.relationship || 'N/A',
        emergencyPhone: resident.emergencyContact?.phone || 'N/A',
        motherName: resident.motherName || 'N/A',
      },
      vehicles,
      devices,
    };
  }

  private evaluateProfileCompletion(resident: Resident): { percentage: number; missingItems: string[] } {
    let score = 0;
    const missing: string[] = [];

    // Personal Info (20%)
    if (resident.fullName && resident.gender && resident.dateOfBirth) {
      score += 20;
    } else {
      missing.push('Personal Details');
    }

    // Contact Info (20%)
    if (resident.mobileNumber && resident.email) {
      score += 20;
    } else {
      missing.push('Contact Information');
    }

    // Permanent Address (20%)
    if (resident.permanentAddress && resident.city && resident.state && resident.pinCode) {
      score += 20;
    } else {
      missing.push('Address & PIN Code');
    }

    // Emergency Contact (20%)
    if (resident.emergencyContact && resident.emergencyContact.name && resident.emergencyContact.phone) {
      score += 20;
    } else {
      missing.push('Emergency Contact');
    }

    // Identity Documents (10%)
    if (resident.documents && resident.documents.length > 0) {
      score += 10;
    } else {
      missing.push('Identity Document');
    }

    // Vehicles / Devices (10%)
    const hasVehicle = resident.vehicles && resident.vehicles.length > 0;
    const hasDevice = resident.devices && resident.devices.length > 0;
    if (hasVehicle || hasDevice) {
      score += 10;
    } else {
      if (!hasVehicle) missing.push('Vehicle Details');
      if (!hasDevice) missing.push('Registered Devices');
    }

    return { percentage: Math.min(100, score), missingItems: missing };
  }

  private evaluateOperationalReadiness(
    resident: Resident,
    stay: CurrentStaySummaryViewModel
  ): OperationalReadinessViewModel {
    const hasActiveStay = stay.hasActiveStay;
    const hasGovernmentID =
      Boolean(resident.documents) &&
      resident.documents!.some((doc) => doc.verificationStatus === 'Verified');
    const hasEmergencyContact = Boolean(
      resident.emergencyContact &&
        resident.emergencyContact.name &&
        resident.emergencyContact.phone &&
        resident.emergencyContact.name !== 'N/A'
    );

    const requirements = [
      { label: 'Active Stay', isSatisfied: hasActiveStay },
      { label: 'Government ID', isSatisfied: hasGovernmentID },
      { label: 'Emergency Contact', isSatisfied: hasEmergencyContact },
    ];

    const missingMandatoryItems = requirements
      .filter((r) => !r.isSatisfied)
      .map((r) => r.label);

    const isReady = missingMandatoryItems.length === 0;
    const statusLabel = isReady ? 'Operationally Ready' : 'Attention Required';

    return {
      isReady,
      statusLabel,
      requirements,
      missingMandatoryItems,
    };
  }

  private formatGender(gender: string): string {
    switch (gender) {
      case 'MALE':
        return 'Male';
      case 'FEMALE':
        return 'Female';
      case 'OTHER':
        return 'Other';
      default:
        return gender;
    }
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
