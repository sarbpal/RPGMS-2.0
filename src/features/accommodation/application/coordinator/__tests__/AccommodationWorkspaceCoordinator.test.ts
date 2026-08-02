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

describe('AccommodationWorkspaceCoordinator Integration Suite', () => {
  let repository: InMemoryAccommodationRepository;
  let stayRepository: InMemoryStayRepository;
  let residentRepository: InMemoryResidentRepository;
  let coordinator: AccommodationWorkspaceCoordinator;

  beforeEach(() => {
    repository = new InMemoryAccommodationRepository();
    stayRepository = new InMemoryStayRepository();
    residentRepository = new InMemoryResidentRepository();
    coordinator = new AccommodationWorkspaceCoordinator(
      repository,
      stayRepository,
      residentRepository
    );
  });

  describe('saveFlatDraft', () => {
    it('creates and saves a new Flat from a valid draft and updates repository state', () => {
      const draft = createMockFlatDraft({ flatNumber: '105' });
      const result = coordinator.saveFlatDraft(draft);

      expect(result.id).toBe('105');
      expect(result.areas).toHaveLength(1);
      expect(result.areas[0].beds).toHaveLength(2);
      expect(result.areas[0].beds[0].id).toBe('105-B1');

      // Refinement 3: Verify repository state after operation
      const savedInRepo = repository.findById('105');
      expect(savedInRepo).toBeDefined();
      expect(savedInRepo?.name).toBe('105');
    });

    it('throws error when draft area configuration validation fails', () => {
      const invalidDraft = createMockFlatDraft({
        areas: [{ name: 'Room 1', bedPrefix: 'B', defaultRent: 5000, defaultDeposit: 10000, beds: [] }],
      });

      expect(() => coordinator.saveFlatDraft(invalidDraft)).toThrow(
        'Flat Area configuration is invalid'
      );
    });

    it('throws error when attempting to rename flat number while it contains occupied beds (BR-ACC-003)', () => {
      const occupiedFlat = createMockFlat({
        id: '101',
        name: '101',
        areas: [
          createMockArea({
            beds: [createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Jane' })],
          }),
        ],
      });
      repository.save(occupiedFlat);

      const renamedDraft = createMockFlatDraft({ flatNumber: '999' });

      expect(() => coordinator.saveFlatDraft(renamedDraft, occupiedFlat)).toThrow(
        'cannot be modified while it contains occupied beds'
      );
    });

    it('preserves existing bed status and occupant details when updating an existing flat draft', () => {
      const existingFlat = createMockFlat({
        id: '101',
        name: '101',
        areas: [
          createMockArea({
            beds: [
              createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Jane Doe' }),
              createMockBed({ id: '101-B2', status: BedStatus.VACANT }),
            ],
          }),
        ],
      });
      repository.save(existingFlat);

      const updatedDraft = createMockFlatDraft({
        flatNumber: '101',
        description: 'Updated Description',
      });

      const updatedFlat = coordinator.saveFlatDraft(updatedDraft, existingFlat);

      expect(updatedFlat.description).toBe('Updated Description');
      expect(updatedFlat.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);
      expect(updatedFlat.areas[0].beds[0].residentName).toBe('Jane Doe');

      // Refinement 3: Verify repository state
      const repoState = repository.findById('101');
      expect(repoState?.description).toBe('Updated Description');
      expect(repoState?.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);
    });
  });

  describe('blockBed / unblockBed Operations', () => {
    it('blocks a vacant bed and updates repository state', () => {
      const flat = createMockFlat({ id: '101' });
      repository.save(flat);

      const updatedFlat = coordinator.blockBed('101', '101-B1');
      expect(updatedFlat.areas[0].beds[0].status).toBe(BedStatus.BLOCKED);

      // Refinement 3: Verify repository state
      const repoFlat = repository.findById('101');
      expect(repoFlat?.areas[0].beds[0].status).toBe(BedStatus.BLOCKED);
    });

    it('unblocks a blocked bed and updates repository state', () => {
      const flat = createMockFlat({
        id: '101',
        areas: [
          createMockArea({
            beds: [createMockBed({ id: '101-B1', status: BedStatus.BLOCKED })],
          }),
        ],
      });
      repository.save(flat);

      const updatedFlat = coordinator.unblockBed('101', '101-B1');
      expect(updatedFlat.areas[0].beds[0].status).toBe(BedStatus.VACANT);

      // Refinement 3: Verify repository state
      const repoFlat = repository.findById('101');
      expect(repoFlat?.areas[0].beds[0].status).toBe(BedStatus.VACANT);
    });
  });

  describe('startBedMaintenance / completeBedMaintenance Operations', () => {
    it('puts a bed into maintenance and completes maintenance, verifying repository state', () => {
      const flat = createMockFlat({ id: '101' });
      repository.save(flat);

      // 1. Start Maintenance
      const maintenanceFlat = coordinator.startBedMaintenance('101', '101-B1');
      expect(maintenanceFlat.areas[0].beds[0].status).toBe(BedStatus.MAINTENANCE);

      // Refinement 3: Verify repository state after start
      expect(repository.findById('101')?.areas[0].beds[0].status).toBe(
        BedStatus.MAINTENANCE
      );

      // 2. Complete Maintenance
      const completedFlat = coordinator.completeBedMaintenance('101', '101-B1');
      expect(completedFlat.areas[0].beds[0].status).toBe(BedStatus.VACANT);

      // Refinement 3: Verify repository state after completion
      expect(repository.findById('101')?.areas[0].beds[0].status).toBe(
        BedStatus.VACANT
      );
    });
  });

  describe('loadAndSynchronizeFlats', () => {
    it('synchronizes bed status against active stays in StayRepository & ResidentRepository', async () => {
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
      repository.save(flat);

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

      const synchronized = coordinator.loadAndSynchronizeFlats();

      const targetBed = synchronized[0].areas[0].beds.find((b) => b.id === '101-B1');
      expect(targetBed?.status).toBe(BedStatus.OCCUPIED);
      expect(targetBed?.residentName).toBe('Jane Doe');

      // Refinement 3: Verify repository state
      const repoFlat = repository.findById('101');
      expect(repoFlat?.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);
      expect(repoFlat?.areas[0].beds[0].residentName).toBe('Jane Doe');
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

      expect(viewModel.stats.totalFlats).toBe(2);
      expect(viewModel.stats.totalBeds).toBe(3);
      expect(viewModel.stats.occupiedBeds).toBe(1);
      expect(viewModel.stats.onNoticeBeds).toBe(1);
      expect(viewModel.stats.vacantBeds).toBe(1);

      expect(viewModel.filteredFlats).toHaveLength(1);
      expect(viewModel.filteredFlats[0].name).toBe('Flat 101');
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
      repository.save(flat);

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
      const sync1 = coordinator.loadAndSynchronizeFlats();
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
      const sync2 = coordinator.loadAndSynchronizeFlats();

      const bed1 = sync2[0].areas[0].beds.find((b) => b.id === '101-B1');
      const bed2 = sync2[0].areas[0].beds.find((b) => b.id === '101-B2');

      // Verify: 101-B1 is now VACANT, 101-B2 is still OCCUPIED by Alice
      expect(bed1?.status).toBe(BedStatus.VACANT);
      expect(bed1?.residentName).toBeUndefined();
      expect(bed2?.status).toBe(BedStatus.OCCUPIED);
      expect(bed2?.residentName).toBe('Alice Walker');

      // Refinement 3: Verify repository state after partial release
      const repoFlat = repository.findById('101');
      expect(repoFlat?.areas[0].beds[0].status).toBe(BedStatus.VACANT);
      expect(repoFlat?.areas[0].beds[1].status).toBe(BedStatus.OCCUPIED);
    });
  });

  // Refinement 5: Decision Support Regression Test
  describe('Refinement 5 Decision Support Regression Test', () => {
    it('confirms that failed operations leave repository state completely unchanged', () => {
      const flat = createMockFlat({
        id: '101',
        areas: [
          createMockArea({
            beds: [createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Jane Doe' })],
          }),
        ],
      });
      repository.save(flat);

      // Verify initial state
      const initialRepoState = repository.findById('101');
      expect(initialRepoState?.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);

      // Attempt illegal operation: block an occupied bed
      expect(() => coordinator.blockBed('101', '101-B1')).toThrow(
        'currently occupied by a resident and cannot be blocked'
      );

      // Decision Support Verification: Repository state MUST remain completely unchanged
      const postFailureRepoState = repository.findById('101');
      expect(postFailureRepoState?.areas[0].beds[0].status).toBe(BedStatus.OCCUPIED);
      expect(postFailureRepoState?.areas[0].beds[0].residentName).toBe('Jane Doe');
      expect(postFailureRepoState).toEqual(initialRepoState);
    });
  });
});
