import { describe, it, expect } from 'vitest';
import { validateMeterReadingMonotonicity, calculateOccupantEqualSplit } from '../meterRules';
import { ElectricityTariff } from '../../valueObjects/ElectricityTariff';

describe('Sprint FR-6 / OS-1 — Meter Domain Rules & Tariff Calculation', () => {
  describe('validateMeterReadingMonotonicity', () => {
    it('accepts reading when currentReading is greater than previousReading', () => {
      const res = validateMeterReadingMonotonicity(100, 150);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
    });

    it('accepts reading when currentReading equals previousReading (zero consumption)', () => {
      const res = validateMeterReadingMonotonicity(100, 100);
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
    });

    it('rejects reading when currentReading is less than previousReading (non-monotonic)', () => {
      const res = validateMeterReadingMonotonicity(150, 100);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('cannot be less than previous reading');
    });

    it('rejects negative reading inputs', () => {
      const res = validateMeterReadingMonotonicity(-10, 100);
      expect(res.valid).toBe(false);
      expect(res.errors[0]).toContain('non-negative number');
    });
  });

  describe('ElectricityTariff.calculateCost', () => {
    it('calculates flat rate tariff correctly', () => {
      const tariff = new ElectricityTariff({
        id: 't1',
        name: 'Flat Rate',
        ratePerUnit: 10,
        fixedCharge: 100,
        effectiveFrom: '2026-01-01',
      });

      expect(tariff.calculateCost(0)).toBe(100); // Fixed charge only
      expect(tariff.calculateCost(50)).toBe(600); // 100 + (50 * 10) = 600
    });

    it('calculates slab tariff progressively across units', () => {
      const tariff = new ElectricityTariff({
        id: 't2',
        name: 'Slab Tariff',
        ratePerUnit: 8.5,
        fixedCharge: 100,
        effectiveFrom: '2026-01-01',
        slabs: [
          { fromUnits: 0, toUnits: 100, ratePerUnit: 5 },
          { fromUnits: 100, toUnits: 200, ratePerUnit: 8 },
          { fromUnits: 200, toUnits: null, ratePerUnit: 10 },
        ],
      });

      // 50 units: 100 fixed + (50 * 5) = 350
      expect(tariff.calculateCost(50)).toBe(350);

      // 150 units: 100 fixed + (100 * 5) + (50 * 8) = 100 + 500 + 400 = 1000
      expect(tariff.calculateCost(150)).toBe(1000);

      // 250 units: 100 fixed + (100 * 5) + (100 * 8) + (50 * 10) = 100 + 500 + 800 + 500 = 1900
      expect(tariff.calculateCost(250)).toBe(1900);
    });
  });

  describe('calculateOccupantEqualSplit', () => {
    it('splits bill evenly and allocates paise remainder deterministically to first resident', () => {
      const stayIds = ['stay-1', 'stay-2', 'stay-3'];
      const totalAmount = 100.0;
      const totalUnits = 300;

      const splits = calculateOccupantEqualSplit(totalAmount, totalUnits, stayIds);
      expect(splits.length).toBe(3);

      // 10000 paise / 3 = 3333 paise each, with 1 paise remainder
      // stay-1: 33.34, stay-2: 33.33, stay-3: 33.33
      expect(splits[0].allocatedAmount).toBe(33.34);
      expect(splits[1].allocatedAmount).toBe(33.33);
      expect(splits[2].allocatedAmount).toBe(33.33);

      // Verify exact sum equals total bill amount without rounding error
      const sum = splits.reduce((acc, curr) => acc + curr.allocatedAmount, 0);
      expect(Number(sum.toFixed(2))).toBe(100.0);
    });

    it('handles empty stay list safely', () => {
      const splits = calculateOccupantEqualSplit(100, 50, []);
      expect(splits.length).toBe(0);
    });
  });
});
