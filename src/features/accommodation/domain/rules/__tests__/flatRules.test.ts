import { describe, it, expect } from 'vitest';
import {
  validateFlatAreaConfigs,
  canModifyFlatNumber,
  canModifyAreaPrefix,
  canModifyAreaBeds,
} from '../flatRules';
import {
  createMockFlat,
  createMockArea,
  createMockBed,
} from '../../../test/fixtures/accommodationFixtures';
import { BedStatus } from '../../valueObjects/BedStatus';

describe('flatRules Domain Module', () => {
  describe('validateFlatAreaConfigs', () => {
    it('returns isValid: true for a valid area configuration', () => {
      const result = validateFlatAreaConfigs([
        { name: 'Bedroom 1', bedPrefix: 'B', bedCount: 2 },
        { name: 'Hallway', bedPrefix: 'H', bedCount: 1 },
      ]);

      expect(result.isValid).toBe(true);
      expect(result.errors.areaErrors).toEqual({});
    });

    it('returns error when bedCount < 1', () => {
      const result = validateFlatAreaConfigs([
        { name: 'Study', bedPrefix: 'S', bedCount: 0 },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors.areaErrors['Study']?.bedCount).toBe(
        'Area must contain at least 1 bed.'
      );
    });

    it('detects duplicate area names (case-insensitive & trimmed)', () => {
      const result = validateFlatAreaConfigs([
        { name: 'Bedroom 1 ', bedPrefix: 'B1', bedCount: 2 },
        { name: 'bedroom 1', bedPrefix: 'B2', bedCount: 2 },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors.areaErrors['bedroom 1']?.name).toContain(
        'already used in this flat'
      );
    });

    it('detects duplicate bed prefixes (case-insensitive & trimmed)', () => {
      const result = validateFlatAreaConfigs([
        { name: 'Room 1', bedPrefix: 'b ', bedCount: 2 },
        { name: 'Room 2', bedPrefix: 'B', bedCount: 2 },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors.areaErrors['Room 2']?.bedPrefix).toContain(
        'already used in another area'
      );
    });

    it('aggregates multiple errors across multiple areas simultaneously', () => {
      const result = validateFlatAreaConfigs([
        { name: 'Bedroom 1', bedPrefix: 'B', bedCount: 0 },
        { name: 'bedroom 1', bedPrefix: 'B', bedCount: 1 },
      ]);

      expect(result.isValid).toBe(false);
      expect(result.errors.areaErrors['Bedroom 1']?.bedCount).toBeDefined();
      expect(result.errors.areaErrors['bedroom 1']?.name).toBeDefined();
      expect(result.errors.areaErrors['bedroom 1']?.bedPrefix).toBeDefined();
    });
  });

  describe('canModifyFlatNumber', () => {
    it('allows modifying flat number if all beds are vacant', () => {
      const flat = createMockFlat();
      const result = canModifyFlatNumber(flat);

      expect(result.canModify).toBe(true);
      expect(result.occupiedBeds).toHaveLength(0);
    });

    it('prevents modifying flat number if any bed is occupied or on notice', () => {
      const flat = createMockFlat({
        areas: [
          createMockArea({
            beds: [
              createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED, residentName: 'Jane Doe' }),
              createMockBed({ id: '101-B2', status: BedStatus.VACANT }),
            ],
          }),
        ],
      });

      const result = canModifyFlatNumber(flat);
      expect(result.canModify).toBe(false);
      expect(result.occupiedBeds).toHaveLength(1);
      expect(result.occupiedBeds[0].id).toBe('101-B1');
    });
  });

  describe('canModifyAreaPrefix', () => {
    it('allows modifying prefix if area has no occupied beds', () => {
      const area = createMockArea();
      const result = canModifyAreaPrefix(area);

      expect(result.canModify).toBe(true);
      expect(result.occupiedBeds).toHaveLength(0);
    });

    it('prevents modifying prefix if area contains an occupied bed', () => {
      const area = createMockArea({
        beds: [
          createMockBed({ id: '101-B1', status: BedStatus.ON_NOTICE }),
        ],
      });

      const result = canModifyAreaPrefix(area);
      expect(result.canModify).toBe(false);
      expect(result.occupiedBeds).toHaveLength(1);
    });
  });

  describe('canModifyAreaBeds', () => {
    it('allows reducing bed count when area has no occupied beds', () => {
      const area = createMockArea({
        beds: [
          createMockBed({ id: '101-B1' }),
          createMockBed({ id: '101-B2' }),
          createMockBed({ id: '101-B3' }),
        ],
      });

      const result = canModifyAreaBeds(area, 1);
      expect(result.canModify).toBe(true);
      expect(result.maxOccupiedIndex).toBe(0);
    });

    it('allows reducing bed count if newBedCount >= maxOccupiedIndex', () => {
      const area = createMockArea({
        beds: [
          createMockBed({ id: '101-B1', status: BedStatus.OCCUPIED }),
          createMockBed({ id: '101-B2', status: BedStatus.VACANT }),
          createMockBed({ id: '101-B3', status: BedStatus.VACANT }),
        ],
      });

      // Highest occupied bed index is 1 (B1)
      const result = canModifyAreaBeds(area, 2);
      expect(result.canModify).toBe(true);
      expect(result.maxOccupiedIndex).toBe(1);
    });

    it('prevents truncating occupied beds if newBedCount < maxOccupiedIndex', () => {
      const area = createMockArea({
        beds: [
          createMockBed({ id: '101-B1', status: BedStatus.VACANT }),
          createMockBed({ id: '101-B2', status: BedStatus.OCCUPIED }),
        ],
      });

      // Highest occupied bed index is 2 (B2)
      const result = canModifyAreaBeds(area, 1);
      expect(result.canModify).toBe(false);
      expect(result.maxOccupiedIndex).toBe(2);
      expect(result.occupiedBeds).toHaveLength(1);
    });
  });
});
