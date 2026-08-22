import { describe, it, expect, beforeEach } from 'vitest';
import { AccommodationWorkspaceCoordinator } from '../AccommodationWorkspaceCoordinator';
import { InMemoryAccommodationRepository } from '../../../infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryStayRepository } from '../../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import {
  createMockFlat,
  createMockArea,
  createMockBed,
  createMockFlatDraft,
  createMockStay,
  createMockResident,
} from '../../../test/fixtures/accommodationFixtures';
import { BedStatus } from '../../../domain/valueObjects/BedStatus';
import { StayStatus } from '../../../../stay/domain/valueObjects/StayStatus';
import { Stay } from '../../../../stay/domain/entities/Stay';
// Seed data imports for consistency regression
import { accommodationSeedData } from '../../../infrastructure/data/accommodationSeedData';
import { staySeedData } from '../../../../stay/infrastructure/data/staySeedData';
import { residentSeedData } from '../../../../resident/infrastructure/data/residentSeedData';

describe('AccommodationWorkspaceCoordinator Integration Suite', () => {
  let repository: InMemoryAccommodationRepository;
  let stayRepository: InMemoryStayRepository;
  let residentRepository: InMemoryResidentRepository;
  let coordinator: AccommodationWorkspaceCoordinator;

  beforeEach(() => {
    // Use empty repositories so that each test controls its own data.
    // The seed regression suite below uses its own seeded coordinator.
    repository = new InMemoryAccommodationRepository([]);
    stayRepository = new InMemoryStayRepository([]);
    residentRepository = new InMemoryResidentRepository([]);
    coordinator = new AccommodationWorkspaceCoordinator(
      repository,
      stayRepository,
      residentRepository
    );
  });

  describe('saveFlatDraft', () => {
    it('creates and saves a new Flat from a valid draft and updates repository state', async () => {
      const draft = createMockFlatDraft({ flatNumber: '105' });
      const result = await coordinator.saveFlatDraft(draft);

      expect(result.id).toBe('105');
      expect(result.areas).toHaveLength(1);
      expect(result.areas[0].beds).toHaveLength(2);
      expect(result.areas[0].beds[0].id).toBe('105-B1');

      // Refinement 3: Verify repository state after operation
      const savedInRepo = await repository.findById('105');
      expect(savedInRepo).toBeDefined();
      expect(savedInRepo?.name).toBe('105');
    });

    it('throws error when draft area configuration validation fails', async () => {
      const invalidDraft = createMockFlatDraft({
        areas: [{ name: 'Room 1', bedPrefix: 'B', defaultRent: 5000, defaultDeposit: 10000, beds: [] }],
      });

      await expect(coordinator.saveFlatDraft(invalidDraft)).rejects.toThrow(
        'Flat Area configuration is invalid'
      );
    });

    it('throws error when attempting to rename flat number while it contains occupied beds (BR-ACC-003)', async () => {
      const occupiedFlat = createMockFlat({
        id: '101',
        name: '101',
        areas: [
          createMockArea({
            beds: [createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Jane' })],
          }),
        ],
      });
      await repository.save(occupiedFlat);

      const renamedDraft = createMockFlatDraft({ flatNumber: '999' });

      await expect(coordinator.saveFlatDraft(renamedDraft, occupiedFlat)).rejects.toThrow(
        'cannot be modified while it contains occupied beds'
      );
    });

    it('preserves existing bed status, occupant details, and stayId when updating an existing flat draft', async () => {
      const existingFlat = createMockFlat({
        id: '101',
        name: '101',
        areas: [
          createMockArea({
            beds: [
              createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Jane Doe', stayId: 'stay-101' }),
              createMockBed({ id: '101-B2', status: BedStatus.VACANT }),
            ],
          }),
        ],
      });
      await repository.save(existingFlat);

      const updatedDraft = createMockFlatDraft({
        flatNumber: '101',
        description: 'Updated Description',
      });

      const updatedFlat = await coordinator.saveFlatDraft(updatedDraft, existingFlat);

      expect(updatedFlat.description).toBe('Updated Description');
      expect(updatedFlat.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);
      expect(updatedFlat.areas[0].beds[0].residentName).toBe('Jane Doe');
      expect(updatedFlat.areas[0].beds[0].stayId).toBe('stay-101');

      // Refinement 3: Verify repository state
      const repoState = await repository.findById('101');
      expect(repoState?.description).toBe('Updated Description');
      expect(repoState?.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);
      expect(repoState?.areas[0].beds[0].stayId).toBe('stay-101');
    });
  });

  describe('blockBed / unblockBed Operations', () => {
    it('blocks a vacant bed and updates repository state', async () => {
      const flat = createMockFlat({ id: '101' });
      await repository.save(flat);

      const updatedFlat = await coordinator.blockBed('101', '101-B1');
      expect(updatedFlat.areas[0].beds[0].status).toBe(BedStatus.BLOCKED);

      // Refinement 3: Verify repository state
      const repoFlat = await repository.findById('101');
      expect(repoFlat?.areas[0].beds[0].status).toBe(BedStatus.BLOCKED);
    });

    it('unblocks a blocked bed and updates repository state', async () => {
      const flat = createMockFlat({
        id: '101',
        areas: [
          createMockArea({
            beds: [createMockBed({ id: '101-B1', status: BedStatus.BLOCKED })],
          }),
        ],
      });
      await repository.save(flat);

      const updatedFlat = await coordinator.unblockBed('101', '101-B1');
      expect(updatedFlat.areas[0].beds[0].status).toBe(BedStatus.VACANT);

      // Refinement 3: Verify repository state
      const repoFlat = await repository.findById('101');
      expect(repoFlat?.areas[0].beds[0].status).toBe(BedStatus.VACANT);
    });
  });

  describe('startBedMaintenance / completeBedMaintenance Operations', () => {
    it('puts a bed into maintenance and completes maintenance, verifying repository state', async () => {
      const flat = createMockFlat({ id: '101' });
      await repository.save(flat);

      // 1. Start Maintenance
      const maintenanceFlat = await coordinator.startBedMaintenance('101', '101-B1');
      expect(maintenanceFlat.areas[0].beds[0].status).toBe(BedStatus.MAINTENANCE);

      // Refinement 3: Verify repository state after start
      const repoFlat1 = await repository.findById('101');
      expect(repoFlat1?.areas[0].beds[0].status).toBe(BedStatus.MAINTENANCE);

      // 2. Complete Maintenance
      const completedFlat = await coordinator.completeBedMaintenance('101', '101-B1');
      expect(completedFlat.areas[0].beds[0].status).toBe(BedStatus.VACANT);

      // Refinement 3: Verify repository state after completion
      const repoFlat2 = await repository.findById('101');
      expect(repoFlat2?.areas[0].beds[0].status).toBe(BedStatus.VACANT);
    });
  });

  describe('loadAndSynchronizeFlats', () => {
    it('synchronizes bed status, residentName, and stayId against active stays in StayRepository & ResidentRepository', async () => {
      const flat = createMockFlat({
        id: '101',
        areas: [
          createMockArea({
            beds: [
              createMockBed({ id: '101-B1', status: BedStatus.VACANT }),
              createMockBed({ id: '101-B2', status: BedStatus.VACANT }),
            ],
          }),
        ],
      });
      await repository.save(flat);

      const resident = createMockResident({ id: 'res-1', fullName: 'Jane Doe' });
      await residentRepository.save(resident);

      const stay = createMockStay({
        id: 'stay-1',
        residentId: 'res-1',
        flatId: '101',
        allocatedBedIds: ['101-B1'],
        status: StayStatus.ACTIVE,
      });
      await stayRepository.save(stay);

      const synchronized = await coordinator.loadAndSynchronizeFlats();

      const targetBed = synchronized[0].areas[0].beds.find((b) => b.id === '101-B1');
      expect(targetBed?.status).toBe(BedStatus.OCCUPIED);
      expect(targetBed?.residentName).toBe('Jane Doe');
      expect(targetBed?.stayId).toBe('stay-1');

      // Refinement 3: Verify repository state
      const repoFlat = await repository.findById('101');
      expect(repoFlat?.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);
      expect(repoFlat?.areas[0].beds[0].residentName).toBe('Jane Doe');
      expect(repoFlat?.areas[0].beds[0].stayId).toBe('stay-1');
    });

    it('synchronizes bed status to ON_NOTICE with residentName and stayId when stay is ON_NOTICE', async () => {
      const flat = createMockFlat({
        id: '102',
        areas: [
          createMockArea({
            beds: [createMockBed({ id: '102-B1', status: BedStatus.VACANT })],
          }),
        ],
      });
      await repository.save(flat);

      const resident = createMockResident({ id: 'res-2', fullName: 'John Notice' });
      await residentRepository.save(resident);

      const stay = createMockStay({
        id: 'stay-notice-1',
        residentId: 'res-2',
        flatId: '102',
        allocatedBedIds: ['102-B1'],
        status: StayStatus.ON_NOTICE,
      });
      await stayRepository.save(stay);

      const synchronized = await coordinator.loadAndSynchronizeFlats();
      const bed = synchronized[0].areas[0].beds.find((b) => b.id === '102-B1');
      expect(bed?.status).toBe(BedStatus.ON_NOTICE);
      expect(bed?.residentName).toBe('John Notice');
      expect(bed?.stayId).toBe('stay-notice-1');
    });

    it('clears residentName and stayId when a previously occupied or on-notice stay is checked out', async () => {
      const flat = createMockFlat({
        id: '101',
        areas: [
          createMockArea({
            beds: [
              createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Jane Doe', stayId: 'stay-1' }),
              createMockBed({ id: '101-B2', status: BedStatus.ON_NOTICE, residentName: 'John Notice', stayId: 'stay-2' }),
            ],
          }),
        ],
      });
      await repository.save(flat);

      // Stays in repository are CHECKED_OUT (no active stays)
      const resident = createMockResident({ id: 'res-1', fullName: 'Jane Doe' });
      await residentRepository.save(resident);

      const checkedOutStay = createMockStay({
        id: 'stay-1',
        residentId: 'res-1',
        flatId: '101',
        allocatedBedIds: ['101-B1'],
        status: StayStatus.CHECKED_OUT,
      });
      await stayRepository.save(checkedOutStay);

      const synchronized = await coordinator.loadAndSynchronizeFlats();
      const beds = synchronized[0].areas[0].beds;

      const bed1 = beds.find((b) => b.id === '101-B1');
      expect(bed1?.status).toBe(BedStatus.VACANT);
      expect(bed1?.residentName).toBeUndefined();
      expect(bed1?.stayId).toBeUndefined();

      const bed2 = beds.find((b) => b.id === '101-B2');
      expect(bed2?.status).toBe(BedStatus.VACANT);
      expect(bed2?.residentName).toBeUndefined();
      expect(bed2?.stayId).toBeUndefined();
    });
  });

  describe('createViewModel', () => {
    it('calculates stats and applies status & search query filters', () => {
      const flat1 = createMockFlat({
        id: '101',
        name: 'Flat 101',
        areas: [
          createMockArea({
            beds: [
              createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Jane' }),
              createMockBed({ id: '101-B2', status: BedStatus.VACANT }),
            ],
          }),
        ],
      });
      const flat2 = createMockFlat({
        id: '102',
        name: 'Flat 102',
        areas: [
          createMockArea({
            beds: [createMockBed({ id: '102-B1', status: BedStatus.ON_NOTICE, residentName: 'Bob' })],
          }),
        ],
      });

      const viewModel = coordinator.createViewModel([flat1, flat2], 'Jane', BedStatus.OCCUPIED);

      expect(viewModel.stats.totalBeds).toBe(3);
      expect(viewModel.stats.occupiedBeds).toBe(1);
      expect(viewModel.stats.onNoticeBeds).toBe(1);
      expect(viewModel.stats.vacantBeds).toBe(1);

      expect(viewModel.filteredFlats).toHaveLength(1);
      expect(viewModel.filteredFlats[0].name).toBe('Flat 101');
    });

    it('OCCUPIED filter — does NOT include ON_NOTICE beds', () => {
      const flat = createMockFlat({
        id: '101',
        name: 'Flat 101',
        areas: [
          createMockArea({
            beds: [
              createMockBed({ id: '101-B1', status: BedStatus.ON_NOTICE, residentName: 'Alice' }),
              createMockBed({ id: '101-B2', status: BedStatus.VACANT }),
            ],
          }),
        ],
      });

      const viewModel = coordinator.createViewModel([flat], '', BedStatus.OCCUPIED);

      // A flat containing only ON_NOTICE and VACANT beds must not appear under the OCCUPIED filter.
      expect(viewModel.filteredFlats).toHaveLength(0);
    });

    it('ON_NOTICE filter — returns flats with on-notice beds independently of OCCUPIED filter', () => {
      const flat = createMockFlat({
        id: '101',
        name: 'Flat 101',
        areas: [
          createMockArea({
            beds: [
              createMockBed({ id: '101-B1', status: BedStatus.ON_NOTICE, residentName: 'Alice' }),
            ],
          }),
        ],
      });

      // OCCUPIED filter: flat must NOT appear (ON_NOTICE is its own status)
      const vmOccupied = coordinator.createViewModel([flat], '', BedStatus.OCCUPIED);
      expect(vmOccupied.filteredFlats).toHaveLength(0);

      // ON_NOTICE filter: flat must appear
      const vmOnNotice = coordinator.createViewModel([flat], '', BedStatus.ON_NOTICE);
      expect(vmOnNotice.filteredFlats).toHaveLength(1);
    });

    it('VACANT filter — does NOT include flats that contain only occupied beds', () => {
      const flat = createMockFlat({
        id: '101',
        name: 'Flat 101',
        areas: [
          createMockArea({
            beds: [
              createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Bob' }),
            ],
          }),
        ],
      });

      const viewModel = coordinator.createViewModel([flat], '', BedStatus.VACANT);

      // A flat with no vacant beds must not appear under the VACANT filter.
      expect(viewModel.filteredFlats).toHaveLength(0);
    });
  });

  // Refinement 4: Explicit Multi-bed Occupancy & Partial Bed Release Integration Scenario
  describe('Refinement 4 Integration Scenario: Multi-bed Occupancy & Partial Release', () => {
    it('validates multi-bed occupancy where 1 Bed is released, leaving Stay active with remaining Bed', async () => {
      const flat = createMockFlat({
        id: '101',
        areas: [
          createMockArea({
            beds: [
              createMockBed({ id: '101-B1', status: BedStatus.VACANT }),
              createMockBed({ id: '101-B2', status: BedStatus.VACANT }),
            ],
          }),
        ],
      });
      await repository.save(flat);

      const resident = createMockResident({ id: 'res-100', fullName: 'Alice Walker' });
      await residentRepository.save(resident);

      // Step 1: Stay occupies 2 beds (101-B1 and 101-B2)
      const stay = createMockStay({
        id: 'stay-100',
        residentId: 'res-100',
        flatId: '101',
        allocatedBedIds: ['101-B1', '101-B2'],
        status: StayStatus.ACTIVE,
      });
      await stayRepository.save(stay);

      // Initial synchronization: both beds occupied by Alice Walker
      const sync1 = await coordinator.loadAndSynchronizeFlats();
      expect(sync1[0].areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);
      expect(sync1[0].areas[0].beds[1].status).toBe(BedStatus.OCCUPIED);

      // Step 2: Partial Bed Release — release 101-B1 (update stay.allocatedBedIds to ['101-B2'])
      const updatedStay: Stay = new Stay({
        ...stay,
        status: stay.status,
        allocatedBedIds: ['101-B2'], // 101-B1 released
      });
      await stayRepository.save(updatedStay);

      // Step 3: Synchronize again
      const sync2 = await coordinator.loadAndSynchronizeFlats();

      const bed1 = sync2[0].areas[0].beds.find((b) => b.id === '101-B1');
      const bed2 = sync2[0].areas[0].beds.find((b) => b.id === '101-B2');

      // Verify: 101-B1 is now VACANT, 101-B2 is still OCCUPIED by Alice
      expect(bed1?.status).toBe(BedStatus.VACANT);
      expect(bed1?.residentName).toBeUndefined();
      expect(bed2?.status).toBe(BedStatus.OCCUPIED);
      expect(bed2?.residentName).toBe('Alice Walker');

      // Refinement 3: Verify repository state after partial release
      const repoFlat = await repository.findById('101');
      expect(repoFlat?.areas[0].beds[0].status).toBe(BedStatus.VACANT);
      expect(repoFlat?.areas[0].beds[1].status).toBe(BedStatus.OCCUPIED);
    });
  });

  // Refinement 5: Decision Support Regression Test
  describe('Refinement 5 Decision Support Regression Test', () => {
    it('confirms that failed operations leave repository state completely unchanged', async () => {
      const flat = createMockFlat({
        id: '101',
        areas: [
          createMockArea({
            beds: [createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Jane Doe' })],
          }),
        ],
      });
      await repository.save(flat);

      // Verify initial state
      const initialRepoState = await repository.findById('101');
      expect(initialRepoState?.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);

      // Attempt illegal operation: block an occupied bed
      await expect(coordinator.blockBed('101', '101-B1')).rejects.toThrow(
        'currently occupied by a resident and cannot be blocked'
      );

      // Decision Support Verification: Repository state MUST remain completely unchanged
      const postFailureRepoState = await repository.findById('101');
      expect(postFailureRepoState?.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);
      expect(postFailureRepoState?.areas[0].beds[0].residentName).toBe('Jane Doe');
      expect(postFailureRepoState).toEqual(initialRepoState);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Accommodation Issue #1 — getResidentIdForBed
  // ────────────────────────────────────────────────────────────────────────────
  describe('getResidentIdForBed', () => {
    const bedId = '101-B1';
    const residentId = 'RES-TEST-01';

    it('returns the residentId when an ACTIVE stay allocates the bed', () => {
      const stayRepo = new InMemoryStayRepository([]);
      stayRepo.saveSync(
        new Stay({
          id: 'STAY-ACTIVE-01',
          residentId,
          stayType: 'REGULAR' as any,
          status: StayStatus.ACTIVE,
          checkInDate: '2026-01-01',
          allocatedBedIds: [bedId],
        })
      );

      const coord = new AccommodationWorkspaceCoordinator(repository, stayRepo, residentRepository);
      expect(coord.getResidentIdForBed(bedId)).toBe(residentId);
    });

    it('returns the residentId when an ON_NOTICE stay allocates the bed', () => {
      const stayRepo = new InMemoryStayRepository([]);
      stayRepo.saveSync(
        new Stay({
          id: 'STAY-NOTICE-01',
          residentId,
          stayType: 'REGULAR' as any,
          status: StayStatus.ON_NOTICE,
          checkInDate: '2026-01-01',
          allocatedBedIds: [bedId],
        })
      );

      const coord = new AccommodationWorkspaceCoordinator(repository, stayRepo, residentRepository);
      expect(coord.getResidentIdForBed(bedId)).toBe(residentId);
    });

    it('returns null when no stay allocates the bed at all', () => {
      const stayRepo = new InMemoryStayRepository([]);
      const coord = new AccommodationWorkspaceCoordinator(repository, stayRepo, residentRepository);
      expect(coord.getResidentIdForBed(bedId)).toBeNull();
    });

    it('returns null when the only stay for the bed is checked-out (historical)', () => {
      const stayRepo = new InMemoryStayRepository([]);
      stayRepo.saveSync(
        new Stay({
          id: 'STAY-CHECKED-OUT-01',
          residentId,
          stayType: 'REGULAR' as any,
          status: StayStatus.CHECKED_OUT,
          checkInDate: '2026-01-01',
          allocatedBedIds: [bedId],
        })
      );

      const coord = new AccommodationWorkspaceCoordinator(repository, stayRepo, residentRepository);
      expect(coord.getResidentIdForBed(bedId)).toBeNull();
    });

    it('returns null for a bed that has no matching stay even when other active stays exist for different beds', () => {
      const stayRepo = new InMemoryStayRepository([]);
      stayRepo.saveSync(
        new Stay({
          id: 'STAY-ACTIVE-OTHER',
          residentId: 'RES-OTHER',
          stayType: 'REGULAR' as any,
          status: StayStatus.ACTIVE,
          checkInDate: '2026-01-01',
          allocatedBedIds: ['101-B2'], // different bed
        })
      );

      const coord = new AccommodationWorkspaceCoordinator(repository, stayRepo, residentRepository);
      expect(coord.getResidentIdForBed(bedId)).toBeNull(); // '101-B1' has no active stay
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Seed Data Consistency Regression Suite
  // Verifies that the three seed datasets (accommodation, stay, resident) are
  // internally consistent and that loadAndSynchronizeFlats() does NOT wipe
  // intentionally occupied/on-notice beds to VACANT on startup.
  // ────────────────────────────────────────────────────────────────────────────
  describe('Seed Data Consistency — loadAndSynchronizeFlats() startup contract', () => {
    let seedCoordinator: AccommodationWorkspaceCoordinator;

    beforeEach(() => {
      // Use real seed repositories (not empty mocks) so the test exercises
      // the same initial state the application loads on startup.
      const seedAccommodationRepo = new InMemoryAccommodationRepository(accommodationSeedData);
      const seedStayRepo = new InMemoryStayRepository(staySeedData);
      const seedResidentRepo = new InMemoryResidentRepository(residentSeedData);
      seedCoordinator = new AccommodationWorkspaceCoordinator(
        seedAccommodationRepo,
        seedStayRepo,
        seedResidentRepo
      );
    });

    it('accommodationSeedData does not contain explicit stayId values (Stay is single source of truth)', () => {
      const allSeededBeds = accommodationSeedData.flatMap((f) => f.areas.flatMap((a) => a.beds));
      allSeededBeds.forEach((bed) => {
        expect(
          bed.stayId,
          `Seeded bed ${bed.id} must not have an explicit stayId in accommodationSeedData`
        ).toBeUndefined();
      });
    });

    it('every active/on-notice seeded stay references an existing resident', () => {
      const residentIds = new Set(residentSeedData.map((r) => r.id));
      const activeStays = staySeedData.filter(
        (s) => s.status === StayStatus.ACTIVE || s.status === StayStatus.ON_NOTICE
      );
      activeStays.forEach((stay) => {
        expect(
          residentIds.has(stay.residentId),
          `Stay ${stay.id} references residentId '${stay.residentId}' which does not exist in residentSeedData`
        ).toBe(true);
      });
    });

    it('every active bed allocation in seed stays references a bed that exists in the referenced flat', () => {
      const flatBedIndex = new Map<string, Set<string>>();
      accommodationSeedData.forEach((flat) => {
        const bedIds = new Set<string>();
        flat.areas.forEach((area) => area.beds.forEach((bed) => bedIds.add(bed.id)));
        flatBedIndex.set(flat.id, bedIds);
      });

      const activeStays = staySeedData.filter(
        (s) => s.status === StayStatus.ACTIVE || s.status === StayStatus.ON_NOTICE
      );
      activeStays.forEach((stay) => {
        stay.bedAllocations
          .filter((ba) => ba.status === 'ACTIVE')
          .forEach((ba) => {
            const flatBeds = flatBedIndex.get(ba.flatId);
            expect(
              flatBeds,
              `Stay ${stay.id} allocation references flat '${ba.flatId}' which does not exist in accommodationSeedData`
            ).toBeDefined();
            expect(
              flatBeds?.has(ba.bedId),
              `Stay ${stay.id} allocation references bed '${ba.bedId}' which does not exist in flat '${ba.flatId}'`
            ).toBe(true);
          });
      });
    });

    it('loadAndSynchronizeFlats() reconstructs Flat 101 / Bed 101-B1 as OCCUPIED with resident name Rajesh Kumar and stayId STAY-2026-00041 from staySeedData', async () => {
      const flats = await seedCoordinator.loadAndSynchronizeFlats();
      const flat101 = flats.find((f) => f.id === '101');
      expect(flat101, 'Flat 101 must exist in synchronized result').toBeDefined();

      const bed = flat101!.areas
        .flatMap((a) => a.beds)
        .find((b) => b.id === '101-B1');
      expect(bed, 'Bed 101-B1 must exist').toBeDefined();
      expect(bed!.status).toBe(BedStatus.OCCUPIED);
      expect(bed!.residentName).toBe('Rajesh Kumar');
      expect(bed!.stayId).toBe('STAY-2026-00041');
    });

    it('loadAndSynchronizeFlats() preserves Flat 102 / Beds 102-B1 and 102-B2 as ON_NOTICE with resident name Amit Sharma and stayId STAY-2026-00042', async () => {
      const flats = await seedCoordinator.loadAndSynchronizeFlats();
      const flat102 = flats.find((f) => f.id === '102');
      expect(flat102, 'Flat 102 must exist in synchronized result').toBeDefined();

      const beds = flat102!.areas.flatMap((a) => a.beds);

      const bed1 = beds.find((b) => b.id === '102-B1');
      expect(bed1, 'Bed 102-B1 must exist').toBeDefined();
      expect(bed1!.status).toBe(BedStatus.ON_NOTICE);
      expect(bed1!.residentName).toBe('Amit Sharma');
      expect(bed1!.stayId).toBe('STAY-2026-00042');

      const bed2 = beds.find((b) => b.id === '102-B2');
      expect(bed2, 'Bed 102-B2 must exist').toBeDefined();
      expect(bed2!.status).toBe(BedStatus.ON_NOTICE);
      expect(bed2!.residentName).toBe('Amit Sharma');
      expect(bed2!.stayId).toBe('STAY-2026-00042');
    });

    it('loadAndSynchronizeFlats() does NOT convert seeded OCCUPIED or ON_NOTICE beds to VACANT', async () => {
      const flats = await seedCoordinator.loadAndSynchronizeFlats();
      const allBeds = flats.flatMap((f) => f.areas.flatMap((a) => a.beds));

      // 101-B1 must remain OCCUPIED (active stay from Rajesh Kumar)
      const bed101B1 = allBeds.find((b) => b.id === '101-B1');
      expect(bed101B1?.status).not.toBe(BedStatus.VACANT);
      expect(bed101B1?.stayId).toBe('STAY-2026-00041');

      // 102-B1 and 102-B2 must remain ON_NOTICE (on-notice stay from Amit Sharma)
      const bed102B1 = allBeds.find((b) => b.id === '102-B1');
      const bed102B2 = allBeds.find((b) => b.id === '102-B2');
      expect(bed102B1?.status).not.toBe(BedStatus.VACANT);
      expect(bed102B1?.stayId).toBe('STAY-2026-00042');
      expect(bed102B2?.status).not.toBe(BedStatus.VACANT);
      expect(bed102B2?.stayId).toBe('STAY-2026-00042');
    });

    it('loadAndSynchronizeFlats() leaves Flat 103 beds vacant (no active stay allocated there)', async () => {
      const flats = await seedCoordinator.loadAndSynchronizeFlats();
      const flat103 = flats.find((f) => f.id === '103');
      expect(flat103, 'Flat 103 must exist in synchronized result').toBeDefined();

      flat103!.areas.flatMap((a) => a.beds).forEach((bed) => {
        expect(bed.status).toBe(BedStatus.VACANT);
        expect(bed.residentName).toBeUndefined();
        expect(bed.stayId).toBeUndefined();
      });
    });
  });
});
