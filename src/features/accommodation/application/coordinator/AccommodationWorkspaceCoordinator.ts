import type { AccommodationStats } from '../../components/AccommodationSummary';
import { BedStatus, type Flat, synchronizeBedOccupancy } from '../../domain';
import type { AccommodationRepository } from '../../domain/interfaces/AccommodationRepository';
import { InMemoryAccommodationRepository } from '../../infrastructure/repositories/InMemoryAccommodationRepository';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import type { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import type { Resident } from '../../../resident/domain/entities/Resident';
import type { AccommodationWorkspaceViewModel } from '../models/AccommodationWorkspaceViewModel';

export interface BedOccupantInput {
  fullName: string;
  status: string;
  allocatedBedIds?: string[];
}

export class AccommodationWorkspaceCoordinator {
  private repository: AccommodationRepository;
  private stayRepository: StayRepository;
  private residentRepository: ResidentRepository;

  constructor(
    repository: AccommodationRepository = new InMemoryAccommodationRepository(),
    stayRepository: StayRepository = new InMemoryStayRepository(),
    residentRepository: ResidentRepository = new InMemoryResidentRepository()
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
    this.residentRepository = residentRepository;
  }

  /**
   * Load flats from repository and perform self-healing synchronization against active/on-notice stays.
   */
  public loadAndSynchronizeFlats(occupants?: BedOccupantInput[]): Flat[] {
    const initialFlats: Flat[] =
      'getAllSync' in this.repository && typeof (this.repository as { getAllSync?: () => Flat[] }).getAllSync === 'function'
        ? (this.repository as { getAllSync: () => Flat[] }).getAllSync()
        : [];

    const { synchronizedFlats, hasUpdates } = this.synchronizeFlats(initialFlats, occupants);

    if (hasUpdates) {
      if (
        'saveAllSync' in this.repository &&
        typeof (this.repository as { saveAllSync?: (flats: Flat[]) => Flat[] }).saveAllSync === 'function'
      ) {
        (this.repository as { saveAllSync: (flats: Flat[]) => Flat[] }).saveAllSync(synchronizedFlats);
      }
    }

    return synchronizedFlats;
  }

  /**
   * Save flat entity via repository abstraction.
   */
  public saveFlat(flat: Flat): Flat {
    if (
      'saveSync' in this.repository &&
      typeof (this.repository as { saveSync?: (f: Flat) => Flat }).saveSync === 'function'
    ) {
      return (this.repository as { saveSync: (f: Flat) => Flat }).saveSync(flat);
    }
    return flat;
  }

  /**
   * Delete flat entity by ID via repository abstraction.
   */
  public deleteFlat(id: string): void {
    if (
      'deleteSync' in this.repository &&
      typeof (this.repository as { deleteSync?: (id: string) => void }).deleteSync === 'function'
    ) {
      (this.repository as { deleteSync: (id: string) => void }).deleteSync(id);
    }
  }

  /**
   * Synchronize flats status against active/on-notice stays (self-healing synchronization).
   */
  public synchronizeFlats(
    initialFlats: Flat[],
    occupants?: BedOccupantInput[]
  ): { synchronizedFlats: Flat[]; hasUpdates: boolean } {
    if (initialFlats.length === 0) {
      return { synchronizedFlats: [], hasUpdates: false };
    }

    const occupantMap = new Map<string, { fullName: string; status: string }>();

    if (occupants && occupants.length > 0) {
      occupants.forEach((occ) => {
        const isOccupying =
          occ.status === StayStatus.ACTIVE || occ.status === StayStatus.ON_NOTICE || occ.status === 'ACTIVE' || occ.status === 'ON_NOTICE';
        if (isOccupying && occ.allocatedBedIds) {
          occ.allocatedBedIds.forEach((bedId) => {
            occupantMap.set(bedId, { fullName: occ.fullName, status: occ.status });
          });
        }
      });
    } else {
      // Derive occupants from StayRepository & ResidentRepository
      const stays: Stay[] =
        'getAllSync' in this.stayRepository &&
        typeof (this.stayRepository as { getAllSync?: () => Stay[] }).getAllSync === 'function'
          ? (this.stayRepository as { getAllSync: () => Stay[] }).getAllSync()
          : [];

      const residents: Resident[] =
        'getAllSync' in this.residentRepository &&
        typeof (this.residentRepository as { getAllSync?: () => Resident[] }).getAllSync === 'function'
          ? (this.residentRepository as { getAllSync: () => Resident[] }).getAllSync()
          : [];

      const residentLookup = new Map<string, Resident>();
      residents.forEach((r) => residentLookup.set(r.id, r));

      stays.forEach((stay) => {
        const isOccupying = stay.status === StayStatus.ACTIVE || stay.status === StayStatus.ON_NOTICE;
        if (isOccupying && stay.allocatedBedIds) {
          const res = residentLookup.get(stay.residentId);
          const fullName = res ? res.fullName : 'Occupied Bed';
          stay.allocatedBedIds.forEach((bedId) => {
            occupantMap.set(bedId, { fullName, status: stay.status });
          });
        }
      });
    }

    let hasUpdates = false;

    const synchronizedFlats = initialFlats.map((flat) => {
      const updatedAreas = flat.areas.map((area) => {
        const expectedAreaRent = area.defaultRent || 0;
        const expectedAreaDeposit = area.defaultDeposit || 0;

        const updatedBeds = area.beds.map((bed) => {
          const occupant = occupantMap.get(bed.id);
          const { synchronizedBed, isChanged } = synchronizeBedOccupancy(
            bed,
            occupant,
            expectedAreaRent,
            expectedAreaDeposit
          );

          if (isChanged) {
            hasUpdates = true;
          }
          return synchronizedBed;
        });

        if (
          area.defaultRent !== expectedAreaRent ||
          area.defaultDeposit !== expectedAreaDeposit ||
          updatedBeds !== area.beds
        ) {
          hasUpdates = true;
          return {
            ...area,
            defaultRent: expectedAreaRent,
            defaultDeposit: expectedAreaDeposit,
            beds: updatedBeds,
          };
        }

        return area;
      });

      return { ...flat, areas: updatedAreas };
    });

    return { synchronizedFlats, hasUpdates };
  }

  /**
   * Constructs the ViewModel for Accommodation Workspace given the current flats state and filters.
   */
  public createViewModel(
    flats: Flat[],
    searchQuery: string = '',
    statusFilter: string = 'ALL'
  ): AccommodationWorkspaceViewModel {
    // 1. Calculate Summary Stats
    const totalFlats = flats.length;
    let totalBeds = 0;
    let vacantBeds = 0;
    let occupiedBeds = 0;
    let onNoticeBeds = 0;

    flats.forEach((flat) => {
      flat.areas.forEach((area) => {
        area.beds.forEach((bed) => {
          totalBeds++;
          if (bed.status === BedStatus.VACANT) {
            vacantBeds++;
          } else if (bed.status === BedStatus.OCCUPIED) {
            occupiedBeds++;
          } else if (bed.status === BedStatus.ON_NOTICE) {
            onNoticeBeds++;
          }
        });
      });
    });

    const stats: AccommodationStats = {
      totalFlats,
      totalBeds,
      vacantBeds,
      occupiedBeds,
      onNoticeBeds,
    };

    // 2. Filter Flats
    const filteredFlats = flats.filter((flat) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        flat.areas.some((area) =>
          area.beds.some((bed) => {
            if (statusFilter === BedStatus.OCCUPIED) {
              return bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.ON_NOTICE;
            }
            return bed.status === statusFilter;
          })
        );

      const matchesSearch =
        searchQuery.trim() === '' ||
        flat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flat.areas.some((area) =>
          area.beds.some(
            (bed) =>
              bed.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
              bed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (bed.residentName &&
                bed.residentName.toLowerCase().includes(searchQuery.toLowerCase()))
          )
        );

      return matchesStatus && matchesSearch;
    });

    return {
      stats,
      flats,
      filteredFlats,
    };
  }
}
