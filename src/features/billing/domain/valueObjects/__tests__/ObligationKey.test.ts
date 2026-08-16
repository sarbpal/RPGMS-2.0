import { describe, it, expect } from 'vitest';
import { ObligationKey } from '../ObligationKey';

describe('ObligationKey Value Object', () => {
  it('deterministically creates a Rent obligation key from stayId and anniversary date', () => {
    const key1 = ObligationKey.forRent('STAY-101', '2026-08-15');
    const key2 = ObligationKey.forRent('STAY-101', '2026-08-15');

    expect(key1.value).toBe('RENT:STAY-101:2026-08-15');
    expect(key1.equals(key2)).toBe(true);
    expect(key1.equals('RENT:STAY-101:2026-08-15')).toBe(true);
  });

  it('produces different obligationKeys for different stays or dates', () => {
    const keyA = ObligationKey.forRent('STAY-101', '2026-08-15');
    const keyB = ObligationKey.forRent('STAY-102', '2026-08-15');
    const keyC = ObligationKey.forRent('STAY-101', '2026-09-15');

    expect(keyA.equals(keyB)).toBe(false);
    expect(keyA.equals(keyC)).toBe(false);
  });

  it('does NOT depend on billingRunId or processing timestamps', () => {
    const keyBeforeRun = ObligationKey.forRent('STAY-200', '2026-08-01');
    const keyDuringRun = ObligationKey.forRent('STAY-200', '2026-08-01');
    const keyRetryRun = ObligationKey.forRent('STAY-200', '2026-08-01');

    expect(keyBeforeRun.value).toBe(keyDuringRun.value);
    expect(keyDuringRun.value).toBe(keyRetryRun.value);
  });

  it('creates keys for electricity and laundry obligations', () => {
    const elecKey = ObligationKey.forElectricity('STAY-300', 'ALLOC-PART-999');
    const lndKey = ObligationKey.forLaundry('STAY-300', 'LND-ENTRY-456');

    expect(elecKey.value).toBe('ELECTRICITY:STAY-300:ALLOC-PART-999');
    expect(lndKey.value).toBe('LAUNDRY:STAY-300:LND-ENTRY-456');
  });

  it('parses valid obligation key strings', () => {
    const parsed = ObligationKey.parse('RENT:STAY-400:2026-10-01');
    expect(parsed.chargeType).toBe('RENT');
    expect(parsed.stayId).toBe('STAY-400');
    expect(parsed.sourceIdentifier).toBe('2026-10-01');
    expect(parsed.value).toBe('RENT:STAY-400:2026-10-01');
  });

  it('rejects invalid construction inputs', () => {
    expect(() => ObligationKey.create('' as any, 'STAY-1', 'ID')).toThrow();
    expect(() => ObligationKey.create('RENT', '', 'ID')).toThrow();
    expect(() => ObligationKey.create('RENT', 'STAY-1', '')).toThrow();
    expect(() => ObligationKey.parse('INVALID_FORMAT')).toThrow();
  });
});
