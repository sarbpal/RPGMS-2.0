import type { Resident } from '../../domain/entities/Resident';
import type { ResidentRepository } from '../../domain/interfaces/ResidentRepository';
import { InMemoryResidentRepository } from '../../infrastructure/repositories/InMemoryResidentRepository';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import type { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import type {
  ResidentCardViewModel,
  ResidentListFilter,
  ResidentsListViewModel,
  ResidentSummaryStatsViewModel,
} from '../models/ResidentsListViewModel';

export class ResidentsListCoordinator {
  private repository: ResidentRepository;
  private stayRepository: StayRepository;

  constructor(
    repository: ResidentRepository = new InMemoryResidentRepository(),
    stayRepository: StayRepository = new InMemoryStayRepository()
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
  }

  public createViewModel(
    searchQuery: string = '',
    activeFilter: ResidentListFilter = 'ALL'
  ): ResidentsListViewModel {
    let allResidents: Resident[] = [];
    if ('getAllSync' in this.repository && typeof (this.repository as { getAllSync: () => Resident[] }).getAllSync === 'function') {
      allResidents = (this.repository as { getAllSync: () => Resident[] }).getAllSync();
    }

    // 1. Calculate Summary Stats from all residents
    const summary: ResidentSummaryStatsViewModel = {
      totalCount: allResidents.length,
      activeCount: allResidents.filter((r) => r.status === 'ACTIVE').length,
      onNoticeCount: allResidents.filter((r) => r.status === 'ON_NOTICE').length,
      alumniCount: allResidents.filter((r) => r.status === 'ALUMNI').length,
    };

    // 2. Filter residents by search query using existing search logic
    const q = searchQuery.trim().toLowerCase();
    const searchFilteredResidents = allResidents.filter((r) => {
      if (!q) return true;
      return (
        r.fullName.toLowerCase().includes(q) ||
        r.residentCode.toLowerCase().includes(q) ||
        r.mobileNumber.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q))
      );
    });

    // 3. Filter by active filter tab
    const filteredResidents = searchFilteredResidents.filter((r) => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'ACTIVE') return r.status === 'ACTIVE';
      if (activeFilter === 'ON_NOTICE') return r.status === 'ON_NOTICE';
      if (activeFilter === 'ALUMNI') return r.status === 'ALUMNI';
      return true;
    });

    // 4. Load stays if available for Stay projection (Flat, Bed)
    let stays: Stay[] = [];
    if ('getAllSync' in this.stayRepository && typeof (this.stayRepository as { getAllSync: () => Stay[] }).getAllSync === 'function') {
      stays = (this.stayRepository as { getAllSync: () => Stay[] }).getAllSync();
    }

    const stayMap = new Map<string, Stay>();
    stays.forEach((stay) => {
      if (stay.status === StayStatus.ACTIVE || stay.status === StayStatus.ON_NOTICE) {
        stayMap.set(stay.residentId, stay);
      }
    });

    // 5. Map filtered residents to ResidentCardViewModel
    const residents: ResidentCardViewModel[] = filteredResidents.map((r) => {
      const activeStay = stayMap.get(r.id);

      let flat: string | undefined;
      let bed: string | undefined;

      if (activeStay && activeStay.allocatedBedIds && activeStay.allocatedBedIds.length > 0) {
        const bedId = activeStay.allocatedBedIds[0];
        const parts = bedId.split('-');
        if (parts.length >= 2) {
          flat = `Flat ${parts[0]}`;
          bed = parts.slice(1).join('-');
        } else {
          bed = bedId;
        }
      }

      return {
        id: r.id,
        residentCode: r.residentCode,
        fullName: r.fullName,
        mobileNumber: r.mobileNumber,
        status: r.status,
        statusLabel: this.formatStatusLabel(r.status),
        flat,
        bed,
        doorId: undefined,
      };
    });

    return {
      summary,
      residents,
      activeFilter,
      searchQuery,
    };
  }

  private formatStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'ON_NOTICE':
        return 'On Notice';
      case 'CHECKED_OUT':
        return 'Checked Out';
      case 'ALUMNI':
        return 'Alumni';
      default:
        return status;
    }
  }
}
