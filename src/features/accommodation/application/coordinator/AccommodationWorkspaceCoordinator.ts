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
  public async loadAndSynchronizeFlats(occupants?: BedOccupantInput[]): Promise<Flat[]> {
    const initialFlats: Flat[] = await this.repository.findAll();

    const { synchronizedFlats, hasUpdates } = this.synchronizeFlats(initialFlats, occupants);

    if (hasUpdates) {
      await this.repository.saveAll(synchronizedFlats);
    }

    return synchronizedFlats;
  }

  /**
   * Transforms a FlatDraft into a Flat domain entity and saves it via repository abstraction.
   * Preserves existing bed status and occupant details when updating a flat.
   */
  public async saveFlatDraft(draft: FlatDraft, flatToEdit?: Flat): Promise<Flat> {
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

    return await this.saveFlat(newFlat);
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
  public async saveFlat(flat: Flat): Promise<Flat> {
    return await this.repository.save(flat);
  }

  /**
   * Delete flat entity by ID via repository abstraction.
   */
  public async deleteFlat(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Business Operation: Block a Bed (VACANT or MAINTENANCE -> BLOCKED).
   */
  public async blockBed(flatId: string, bedId: string): Promise<Flat> {
    const flat = await this.repository.findById(flatId);
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
    return await this.saveFlat(updatedFlat);
  }

  /**
   * Business Operation: Unblock a Bed (BLOCKED -> VACANT).
   */
  public async unblockBed(flatId: string, bedId: string): Promise<Flat> {
    const flat = await this.repository.findById(flatId);
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
    return await this.saveFlat(updatedFlat);
  }

  /**
   * Business Operation: Put a Bed into Maintenance (VACANT or BLOCKED -> MAINTENANCE).
   */
  public async startBedMaintenance(flatId: string, bedId: string): Promise<Flat> {
    const flat = await this.repository.findById(flatId);
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
    return await this.saveFlat(updatedFlat);
  }

  /**
   * Business Operation: Complete Maintenance on a Bed (MAINTENANCE -> VACANT).
   */
  public async completeBedMaintenance(flatId: string, bedId: string): Promise<Flat> {
    const flat = await this.repository.findById(flatId);
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
    return await this.saveFlat(updatedFlat);
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

        return { ...area, beds: updatedBeds };
      });

      return { ...flat, areas: updatedAreas };
    });

    return { synchronizedFlats, hasUpdates };
  }

  /**
   * Filters flats by search query (flat name, description, area name, bed ID, occupant name)
   * and by bed status (VACANT, OCCUPIED, ON_NOTICE, BLOCKED, MAINTENANCE).
   */
  public filterFlats(flats: Flat[], searchQuery: string, statusFilter: string): Flat[] {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const isStatusFiltered = statusFilter !== 'ALL';

    return flats
      .map((flat) => {
        const flatMatchesQuery =
          flat.name.toLowerCase().includes(trimmedQuery) ||
          (flat.floor ? flat.floor.toLowerCase().includes(trimmedQuery) : false) ||
          (flat.description && flat.description.toLowerCase().includes(trimmedQuery));

        const filteredAreas = flat.areas
          .map((area) => {
            const areaMatchesQuery = area.name.toLowerCase().includes(trimmedQuery);

            const filteredBeds = area.beds.filter((bed) => {
              const bedMatchesQuery =
                flatMatchesQuery ||
                areaMatchesQuery ||
                bed.name.toLowerCase().includes(trimmedQuery) ||
                bed.id.toLowerCase().includes(trimmedQuery) ||
                (bed.residentName && bed.residentName.toLowerCase().includes(trimmedQuery));

              const bedMatchesStatus = !isStatusFiltered || bed.status === statusFilter;

              return bedMatchesQuery && bedMatchesStatus;
            });

            return { ...area, beds: filteredBeds };
          })
          .filter((area) => area.beds.length > 0 || (!isStatusFiltered && flatMatchesQuery));

        return { ...flat, areas: filteredAreas };
      })
      .filter((flat) => flat.areas.length > 0);
  }

  /**
   * Computes aggregate stats across all loaded and synchronized flats.
   */
  public calculateStats(flats: Flat[]): AccommodationStats {
    let totalBeds = 0;
    let occupied = 0;
    let onNotice = 0;
    let vacant = 0;

    flats.forEach((flat) => {
      flat.areas.forEach((area) => {
        area.beds.forEach((bed) => {
          totalBeds++;
          switch (bed.status) {
            case BedStatus.OCCUPIED:
              occupied++;
              break;
            case BedStatus.ON_NOTICE:
              onNotice++;
              break;
            case BedStatus.VACANT:
              vacant++;
              break;
          }
        });
      });
    });

    return {
      totalFlats: flats.length,
      totalBeds,
      occupiedBeds: occupied,
      onNoticeBeds: onNotice,
      vacantBeds: vacant,
    };
  }

  /**
   * Pure ViewModel Transformation function.
   * Derives presentation state from domain data, applied filters, and calculated stats.
   */
  public createViewModel(
    flats: Flat[],
    searchQuery: string,
    statusFilter: string
  ): AccommodationWorkspaceViewModel {
    const stats = this.calculateStats(flats);
    const filteredFlats = this.filterFlats(flats, searchQuery, statusFilter);

    return {
      stats,
      flats,
      filteredFlats,
    };
  }
}
