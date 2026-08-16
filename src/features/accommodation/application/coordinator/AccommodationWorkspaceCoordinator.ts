import type { AccommodationStats } from '../../components/AccommodationSummary';
import {
  BedStatus,
  canDeleteFlat,
  canModifyFlatNumber,
  executeBlockBed,
  executeCompleteMaintenance,
  executeStartMaintenance,
  executeUnblockBed,
  type Flat,
  synchronizeBedOccupancy,
  validateFlatAreaConfigs,
} from '../../domain';
import type { AccommodationRepository } from '../../domain/interfaces/AccommodationRepository';
import { defaultAccommodationRepository } from '../../infrastructure/repositories/InMemoryAccommodationRepository';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { defaultStayRepository, InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { defaultResidentRepository, InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import type { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import type { Resident } from '../../../resident/domain/entities/Resident';
import type { AccommodationWorkspaceViewModel } from '../models/AccommodationWorkspaceViewModel';
import type { FlatDraft } from '../models/FlatDraft';

export interface BedOccupantInput {
  fullName: string;
  status: string;
  stayId?: string;
  allocatedBedIds?: string[];
}

export class AccommodationWorkspaceCoordinator {
  private _repository: AccommodationRepository;
  private _stayRepository: StayRepository;
  private _residentRepository: ResidentRepository;

  constructor(
    repository: AccommodationRepository = defaultAccommodationRepository,
    stayRepository: StayRepository = defaultStayRepository,
    residentRepository: ResidentRepository = defaultResidentRepository
  ) {
    this._repository = repository;
    this._stayRepository = stayRepository;
    this._residentRepository = residentRepository;
  }

  public get repository(): AccommodationRepository {
    return this._repository;
  }

  public get accommodationRepository(): AccommodationRepository {
    return this._repository;
  }

  public get stayRepository(): StayRepository {
    return this._stayRepository;
  }

  public get residentRepository(): ResidentRepository {
    return this._residentRepository;
  }

  /**
   * Load flats from repository and perform self-healing synchronization against active/on-notice stays.
   */
  public loadAndSynchronizeFlats(occupants?: BedOccupantInput[]): Flat[] {
    const initialFlats: Flat[] = this.repository.findAll();

    const { synchronizedFlats, hasUpdates } = this.synchronizeFlats(initialFlats, occupants);

    if (hasUpdates) {
      this.repository.saveAll(synchronizedFlats);
    }

    return synchronizedFlats;
  }

  /**
   * Transforms a FlatDraft into a Flat domain entity and saves it via repository abstraction.
   * Preserves existing bed status and occupant details when updating a flat.
   */
  public saveFlatDraft(draft: FlatDraft, flatToEdit?: Flat): Flat {
    // Enforce domain area configuration validation rules
    const validation = validateFlatAreaConfigs(draft.areas);
    if (!validation.isValid) {
      throw new Error('Flat Area configuration is invalid. Duplicate area names, duplicate prefixes, or 0-bed areas detected.');
    }

    // Enforce stable physical identifier protection rule (BR-ACC-003)
    if (flatToEdit && flatToEdit.name !== draft.flatNumber) {
      const { canModify } = canModifyFlatNumber(flatToEdit);
      if (!canModify) {
        throw new Error(`Flat number for Flat ${flatToEdit.name} cannot be modified while it contains occupied beds.`);
      }
    }

    const newFlat: Flat = {
      id: draft.flatNumber,
      name: draft.flatNumber,
      floor: draft.floor,
      description: draft.description,
      areas: draft.areas.map((area) => ({
        id: `${draft.flatNumber}-${area.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: area.name,
        bedPrefix: area.bedPrefix,
        defaultRent: area.defaultRent,
        defaultDeposit: area.defaultDeposit,
        beds: area.beds.map((bedId) => {
          const fullBedId = `${draft.flatNumber}-${bedId}`;
          let existingBedStatus: BedStatus = BedStatus.VACANT;
          let existingResidentName: string | undefined = undefined;
          let existingStayId: string | undefined = undefined;

          if (flatToEdit) {
            const foundBed = flatToEdit.areas
              .flatMap((a) => a.beds)
              .find((b) => b.id === fullBedId);
            if (foundBed) {
              existingBedStatus = foundBed.status;
              existingResidentName = foundBed.residentName;
              existingStayId = foundBed.stayId;
            }
          }

          return {
            id: fullBedId,
            name: bedId,
            status: existingBedStatus,
            residentName: existingResidentName,
            stayId: existingStayId,
            defaultRent: area.defaultRent,
            defaultDeposit: area.defaultDeposit,
          };
        }),
      })),
    };

    return this.saveFlat(newFlat);
  }

  /**
   * Validates whether a flat can be safely deleted using domain deletion rules.
   */
  public canDeleteFlat(flat: Flat) {
    return canDeleteFlat(flat);
  }

  /**
   * Save flat entity via repository abstraction.
   */
  public saveFlat(flat: Flat): Flat {
    return this.repository.save(flat);
  }

  /**
   * Delete flat entity by ID via repository abstraction.
   */
  public deleteFlat(id: string): void {
    this.repository.delete(id);
  }

  /**
   * Business Operation: Block a Bed (VACANT or MAINTENANCE -> BLOCKED).
   */
  public blockBed(flatId: string, bedId: string): Flat {
    const flat = this.repository.findById(flatId);
    if (!flat) throw new Error(`Flat ${flatId} not found.`);

    let targetBedFound = false;
    const updatedAreas = flat.areas.map((area) => ({
      ...area,
      beds: area.beds.map((bed) => {
        if (bed.id === bedId) {
          targetBedFound = true;
          return executeBlockBed(bed);
        }
        return bed;
      }),
    }));

    if (!targetBedFound) throw new Error(`Bed ${bedId} not found in Flat ${flatId}.`);

    const updatedFlat: Flat = { ...flat, areas: updatedAreas };
    return this.saveFlat(updatedFlat);
  }

  /**
   * Business Operation: Unblock a Bed (BLOCKED -> VACANT).
   */
  public unblockBed(flatId: string, bedId: string): Flat {
    const flat = this.repository.findById(flatId);
    if (!flat) throw new Error(`Flat ${flatId} not found.`);

    let targetBedFound = false;
    const updatedAreas = flat.areas.map((area) => ({
      ...area,
      beds: area.beds.map((bed) => {
        if (bed.id === bedId) {
          targetBedFound = true;
          return executeUnblockBed(bed);
        }
        return bed;
      }),
    }));

    if (!targetBedFound) throw new Error(`Bed ${bedId} not found in Flat ${flatId}.`);

    const updatedFlat: Flat = { ...flat, areas: updatedAreas };
    return this.saveFlat(updatedFlat);
  }

  /**
   * Business Operation: Put a Bed into Maintenance (VACANT or BLOCKED -> MAINTENANCE).
   */
  public startBedMaintenance(flatId: string, bedId: string): Flat {
    const flat = this.repository.findById(flatId);
    if (!flat) throw new Error(`Flat ${flatId} not found.`);

    let targetBedFound = false;
    const updatedAreas = flat.areas.map((area) => ({
      ...area,
      beds: area.beds.map((bed) => {
        if (bed.id === bedId) {
          targetBedFound = true;
          return executeStartMaintenance(bed);
        }
        return bed;
      }),
    }));

    if (!targetBedFound) throw new Error(`Bed ${bedId} not found in Flat ${flatId}.`);

    const updatedFlat: Flat = { ...flat, areas: updatedAreas };
    return this.saveFlat(updatedFlat);
  }

  /**
   * Business Operation: Complete Maintenance on a Bed (MAINTENANCE -> VACANT).
   */
  public completeBedMaintenance(flatId: string, bedId: string): Flat {
    const flat = this.repository.findById(flatId);
    if (!flat) throw new Error(`Flat ${flatId} not found.`);

    let targetBedFound = false;
    const updatedAreas = flat.areas.map((area) => ({
      ...area,
      beds: area.beds.map((bed) => {
        if (bed.id === bedId) {
          targetBedFound = true;
          return executeCompleteMaintenance(bed);
        }
        return bed;
      }),
    }));

    if (!targetBedFound) throw new Error(`Bed ${bedId} not found in Flat ${flatId}.`);

    const updatedFlat: Flat = { ...flat, areas: updatedAreas };
    return this.saveFlat(updatedFlat);
  }

  /**
   * Resolves the residentId for a given bedId by scanning all ACTIVE or ON_NOTICE
   * stays whose allocated beds include the specified bedId.
   *
   * Returns null when no active stay can be found for the bed, so callers can
   * conditionally suppress the "View Resident" action for unresolvable beds.
   */
  public getResidentIdForBed(bedId: string): string | null {
    const stays: Stay[] =
      this.stayRepository instanceof InMemoryStayRepository
        ? this.stayRepository.getAllSync()
        : [];

    const activeStay = stays.find(
      (s) =>
        (s.status === StayStatus.ACTIVE || s.status === StayStatus.ON_NOTICE) &&
        s.allocatedBedIds?.includes(bedId)
    );

    return activeStay ? activeStay.residentId : null;
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

    const occupantMap = new Map<string, { fullName: string; status: string; stayId?: string }>();

    if (occupants && occupants.length > 0) {
      occupants.forEach((occ) => {
        const isOccupying =
          occ.status === StayStatus.ACTIVE ||
          occ.status === StayStatus.ON_NOTICE ||
          occ.status === 'ACTIVE' ||
          occ.status === 'ON_NOTICE';
        if (isOccupying && occ.allocatedBedIds) {
          occ.allocatedBedIds.forEach((bedId) => {
            occupantMap.set(bedId, { fullName: occ.fullName, status: occ.status, stayId: occ.stayId });
          });
        }
      });
    } else {
      // Derive occupants from StayRepository & ResidentRepository
      const stays: Stay[] =
        this.stayRepository instanceof InMemoryStayRepository
          ? this.stayRepository.getAllSync()
          : [];

      const residents: Resident[] =
        this.residentRepository instanceof InMemoryResidentRepository
          ? this.residentRepository.getAllSync()
          : [];

      const residentLookup = new Map<string, Resident>();
      residents.forEach((r) => residentLookup.set(r.id, r));

      stays.forEach((stay) => {
        const isOccupying = stay.status === StayStatus.ACTIVE || stay.status === StayStatus.ON_NOTICE;
        if (isOccupying) {
          const res = residentLookup.get(stay.residentId);
          const fullName = res ? res.fullName : 'Occupied Bed';
          const bedIds = stay.allocatedBedIds || [];
          bedIds.forEach((bedId) => {
            occupantMap.set(bedId, { fullName, status: stay.status, stayId: stay.id });
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
          area.beds.some((bed) => bed.status === statusFilter)
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
