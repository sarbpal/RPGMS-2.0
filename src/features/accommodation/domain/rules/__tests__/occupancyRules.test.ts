import { describe, it, expect } from 'vitest';
import {
  isBedOccupied,
  hasOccupiedBeds,
  canDeleteArea,
  canDeleteFlat,
  synchronizeBedOccupancy,
} from '../occupancyRules';
import {
  createMockBed,
  createMockArea,
  createMockFlat,
} from '../../../test/fixtures/accommodationFixtures';
import { BedStatus } from '../../valueObjects/BedStatus';

describe('occupancyRules Domain Module', () => {
  describe('isBedOccupied', () => {
    it('returns true when status is OCCUPIED', () => {
      const bed = createMockBed({ status: BedStatus.OCCUPIED });
      expect(isBedOccupied(bed)).toBe(true);
    });

    it('returns true when status is ON_NOTICE', () => {
      const bed = createMockBed({ status: BedStatus.ON_NOTICE });
      expect(isBedOccupied(bed)).toBe(true);
    });

    it('returns true when residentName is present even if status is VACANT', () => {
      const bed = createMockBed({ status: BedStatus.VACANT, residentName: 'John Doe' });
      expect(isBedOccupied(bed)).toBe(true);
    });

    it('returns false when bed is VACANT, BLOCKED, or MAINTENANCE with no residentName', () => {
      expect(isBedOccupied(createMockBed({ status: BedStatus.VACANT }))).toBe(false);
      expect(isBedOccupied(createMockBed({ status: BedStatus.BLOCKED }))).toBe(false);
      expect(isBedOccupied(createMockBed({ status: BedStatus.MAINTENANCE }))).toBe(false);
      expect(isBedOccupied(createMockBed({ status: BedStatus.RESERVED }))).toBe(false);
    });
  });

  describe('hasOccupiedBeds and Deletion Protection', () => {
    it('allows deleting an area when all beds are vacant', () => {
      const area = createMockArea({
        beds: [createMockBed({ id: '101-B1' }), createMockBed({ id: '101-B2' })],
      });

      expect(hasOccupiedBeds(area)).toBe(false);
      expect(canDeleteArea(area).canDelete).toBe(true);
      expect(canDeleteArea(area).occupiedBeds).toHaveLength(0);
    });

    it('prevents deleting an area when it contains occupied beds (BR-ACC-005)', () => {
      const area = createMockArea({
        beds: [
          createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Alice' }),
        ],
      });

      expect(hasOccupiedBeds(area)).toBe(true);
      const result = canDeleteArea(area);
      expect(result.canDelete).toBe(false);
      expect(result.occupiedBeds).toHaveLength(1);
    });

    it('allows deleting a flat when all beds across all areas are vacant', () => {
      const flat = createMockFlat();
      expect(canDeleteFlat(flat).canDelete).toBe(true);
    });

    it('prevents deleting a flat when any bed in any area is occupied or on-notice (BR-015, BR-ACC-004)', () => {
      const flat = createMockFlat({
        areas: [
          createMockArea({
            beds: [createMockBed({ id: '101-B1', status: BedStatus.ON_NOTICE })],
          }),
        ],
      });

      const result = canDeleteFlat(flat);
      expect(result.canDelete).toBe(false);
      expect(result.occupiedBeds).toHaveLength(1);
      expect(result.occupiedBeds[0].id).toBe('101-B1');
    });
  });

  describe('synchronizeBedOccupancy', () => {
    it('synchronizes vacant bed to OCCUPIED when active resident occupant input is provided', () => {
      const bed = createMockBed({ status: BedStatus.VACANT });
      const residentInput = { fullName: 'Jane Doe', status: 'ACTIVE' };

      const { synchronizedBed, isChanged } = synchronizeBedOccupancy(
        bed,
        residentInput,
        5000,
        10000
      );

      expect(isChanged).toBe(true);
      expect(synchronizedBed.status).toBe(BedStatus.OCCUPIED);
      expect(synchronizedBed.residentName).toBe('Jane Doe');
      expect(synchronizedBed.defaultRent).toBe(5000);
      expect(synchronizedBed.defaultDeposit).toBe(10000);
    });

    it('synchronizes vacant bed to ON_NOTICE when on-notice resident occupant input is provided', () => {
      const bed = createMockBed({ status: BedStatus.VACANT });
      const residentInput = { fullName: 'John Smith', status: 'ON_NOTICE' };

      const { synchronizedBed, isChanged } = synchronizeBedOccupancy(
        bed,
        residentInput,
        5000,
        10000
      );

      expect(isChanged).toBe(true);
      expect(synchronizedBed.status).toBe(BedStatus.ON_NOTICE);
      expect(synchronizedBed.residentName).toBe('John Smith');
    });

    it('synchronizes occupied bed back to VACANT when resident occupant input is removed', () => {
      const bed = createMockBed({
        status: BedStatus.OCCUPIED,
        residentName: 'Jane Doe',
        defaultRent: 5000,
        defaultDeposit: 10000,
      });

      const { synchronizedBed, isChanged } = synchronizeBedOccupancy(
        bed,
        undefined,
        5000,
        10000
      );

      expect(isChanged).toBe(true);
      expect(synchronizedBed.status).toBe(BedStatus.VACANT);
      expect(synchronizedBed.residentName).toBeUndefined();
    });

    it('returns isChanged: false when bed state is already synchronized', () => {
      const bed = createMockBed({
        status: BedStatus.OCCUPIED,
        residentName: 'Jane Doe',
        defaultRent: 5000,
        defaultDeposit: 10000,
      });
      const residentInput = { fullName: 'Jane Doe', status: 'ACTIVE' };

      const { synchronizedBed, isChanged } = synchronizeBedOccupancy(
        bed,
        residentInput,
        5000,
        10000
      );

      expect(isChanged).toBe(false);
      expect(synchronizedBed).toEqual(bed);
    });
  });
});
