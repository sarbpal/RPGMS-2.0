import { describe, it, expect, beforeEach } from 'vitest';
import { StayAccommodationCoordinator } from '../StayAccommodationCoordinator';
import { InMemoryStayRepository } from '../../../infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { Stay } from '../../../domain/entities/Stay';
import { StayStatus } from '../../../domain/valueObjects/StayStatus';
import { StayType } from '../../../domain/valueObjects/StayType';
import { BedStatus } from '../../../../accommodation/domain/valueObjects/BedStatus';
import type { Flat } from '../../../../accommodation/domain/entities/Flat';
import type { Resident } from '../../../../resident/domain/entities/Resident';
import { ResidentStatus } from '../../../../resident/domain/valueObjects/ResidentStatus';

describe('StayAccommodationCoordinator Integration Suite (CR-3.3)', () => {
  let stayRepo: InMemoryStayRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let residentRepo: InMemoryResidentRepository;
  let coordinator: StayAccommodationCoordinator;

  const sampleFlat101: Flat = {
    id: 'flat-101',
    name: '101',
    floor: '1',
    description: '1st Floor Double Sharing',
    areas: [
      {
        id: 'area-101-bedroom',
        name: 'Bedroom',
        defaultRent: 8000,
        defaultDeposit: 6500,
        beds: [
          { id: 'bed-101-a', name: '101-A', status: BedStatus.OCCUPIED, residentName: 'Rohan Sharma', defaultRent: 8000, defaultDeposit: 6500 },
          { id: 'bed-101-b', name: '101-B', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
        ],
      },
    ],
  };

  const sampleFlat102: Flat = {
    id: 'flat-102',
    name: '102',
    floor: '1',
    description: '1st Floor Double Sharing',
    areas: [
      {
        id: 'area-102-bedroom',
        name: 'Bedroom',
        defaultRent: 8000,
        defaultDeposit: 6500,
        beds: [
          { id: 'bed-102-a', name: '102-A', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
          { id: 'bed-102-b', name: '102-B', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
        ],
      },
    ],
  };

  const sampleResident: Resident = {
    id: 'res-000001',
    residentCode: 'RESID-000001',
    fullName: 'Rohan Sharma',
    mobileNumber: '9876543210',
    status: ResidentStatus.ACTIVE,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const sampleStay = new Stay({
    id: 'stay-000001',
    residentId: 'res-000001',
    stayType: StayType.REGULAR,
    status: StayStatus.ACTIVE,
    checkInDate: '2026-01-01',
    flatId: 'flat-101',
    allocatedBedIds: ['bed-101-a'],
    agreedRent: 8000,
    agreedDeposit: 6500,
  });

  beforeEach(() => {
    stayRepo = new InMemoryStayRepository([sampleStay]);
    accommodationRepo = new InMemoryAccommodationRepository([sampleFlat101, sampleFlat102]);
    residentRepo = new InMemoryResidentRepository([sampleResident]);
    coordinator = new StayAccommodationCoordinator(stayRepo, accommodationRepo, residentRepo);
  });

  describe('allocateAdditionalBed', () => {
    it('allocates additional bed to Stay and updates physical bed status to OCCUPIED in AccommodationRepository', () => {
      const projection = coordinator.allocateAdditionalBed({
        stayId: 'stay-000001',
        flatId: 'flat-101',
        bedId: 'bed-101-b',
        effectiveFrom: '2026-03-01',
        reason: 'Added sibling to bed 101-B',
      });

      expect(projection.activeBedIds).toEqual(['bed-101-a', 'bed-101-b']);

      const updatedStay = stayRepo.findByIdSync('stay-000001');
      expect(updatedStay?.allocatedBedIds).toEqual(['bed-101-a', 'bed-101-b']);

      const updatedFlat = accommodationRepo.findById('flat-101');
      const bedB = updatedFlat?.areas[0].beds.find((b) => b.id === 'bed-101-b');
      expect(bedB?.status).toBe(BedStatus.OCCUPIED);
      expect(bedB?.residentName).toBe('Rohan Sharma');
    });

    it('rejects allocating non-vacant bed', () => {
      expect(() =>
        coordinator.allocateAdditionalBed({
          stayId: 'stay-000001',
          flatId: 'flat-101',
          bedId: 'bed-101-a', // Already occupied
          effectiveFrom: '2026-03-01',
        })
      ).toThrow('is currently OCCUPIED');
    });
  });

  describe('releaseBed', () => {
    it('releases bed from multi-bed Stay and updates physical bed status to VACANT', () => {
      // First allocate second bed so we have 2 active beds
      coordinator.allocateAdditionalBed({
        stayId: 'stay-000001',
        flatId: 'flat-101',
        bedId: 'bed-101-b',
        effectiveFrom: '2026-03-01',
      });

      const projection = coordinator.releaseBed({
        stayId: 'stay-000001',
        bedId: 'bed-101-b',
        effectiveUntil: '2026-03-15',
        reason: 'Sibling checked out',
      });

      expect(projection.activeBedIds).toEqual(['bed-101-a']);

      const updatedFlat = accommodationRepo.findById('flat-101');
      const bedB = updatedFlat?.areas[0].beds.find((b) => b.id === 'bed-101-b');
      expect(bedB?.status).toBe(BedStatus.VACANT);
      expect(bedB?.residentName).toBeUndefined();
    });
  });

  describe('transferBed', () => {
    it('transfers residency within same flat and updates physical bed statuses in AccommodationRepository', () => {
      const projection = coordinator.transferBed({
        stayId: 'stay-000001',
        fromBedId: 'bed-101-a',
        toBedId: 'bed-101-b',
        effectiveDate: '2026-03-10',
        reason: 'Moved to bed 101-B',
      });

      expect(projection.activeBedIds).toEqual(['bed-101-b']);

      const updatedFlat = accommodationRepo.findById('flat-101');
      const bedA = updatedFlat?.areas[0].beds.find((b) => b.id === 'bed-101-a');
      const bedB = updatedFlat?.areas[0].beds.find((b) => b.id === 'bed-101-b');

      expect(bedA?.status).toBe(BedStatus.VACANT);
      expect(bedA?.residentName).toBeUndefined();
      expect(bedB?.status).toBe(BedStatus.OCCUPIED);
      expect(bedB?.residentName).toBe('Rohan Sharma');
    });
  });

  describe('transferFlat', () => {
    it('transfers residency across flats and updates physical bed statuses across both Flat entities', () => {
      const projection = coordinator.transferFlat({
        stayId: 'stay-000001',
        newFlatId: 'flat-102',
        newBedIds: ['bed-102-a'],
        effectiveDate: '2026-04-01',
        reason: 'Moved to flat 102',
      });

      expect(projection.flatId).toBe('flat-102');
      expect(projection.activeBedIds).toEqual(['bed-102-a']);

      const prevFlat = accommodationRepo.findById('flat-101');
      const prevBedA = prevFlat?.areas[0].beds.find((b) => b.id === 'bed-101-a');
      expect(prevBedA?.status).toBe(BedStatus.VACANT);
      expect(prevBedA?.residentName).toBeUndefined();

      const newFlat = accommodationRepo.findById('flat-102');
      const newBedA = newFlat?.areas[0].beds.find((b) => b.id === 'bed-102-a');
      expect(newBedA?.status).toBe(BedStatus.OCCUPIED);
      expect(newBedA?.residentName).toBe('Rohan Sharma');
    });
  });

  describe('Transactional Rollback', () => {
    it('rolls back all repository modifications if an error occurs mid-operation', () => {
      expect(() =>
        coordinator.transferFlat({
          stayId: 'stay-000001',
          newFlatId: 'non-existent-flat',
          newBedIds: ['bed-999'],
          effectiveDate: '2026-04-01',
        })
      ).toThrow('Destination Flat with ID non-existent-flat not found');

      // Verify Stay remains unchanged in flat 101 / bed 101-a
      const stay = stayRepo.findByIdSync('stay-000001');
      expect(stay?.flatId).toBe('flat-101');
      expect(stay?.allocatedBedIds).toEqual(['bed-101-a']);

      // Verify Flat 101 bed remains OCCUPIED
      const flat = accommodationRepo.findById('flat-101');
      const bedA = flat?.areas[0].beds.find((b) => b.id === 'bed-101-a');
      expect(bedA?.status).toBe(BedStatus.OCCUPIED);
    });
  });
});
