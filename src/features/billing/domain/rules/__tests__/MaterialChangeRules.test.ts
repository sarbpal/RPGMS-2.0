import { describe, it, expect } from 'vitest';
import { MaterialChangeRules } from '../MaterialChangeRules';
import { DiscoveredObligation } from '../../valueObjects/DiscoveredObligation';

describe('MaterialChangeRules', () => {
  const baseRentObligation = new DiscoveredObligation({
    obligationKey: 'RENT:STAY-101:2026-08-15',
    stayId: 'STAY-101',
    residentId: 'RES-101',
    residentCode: 'RC-001',
    chargeType: 'RENT',
    amount: 12000,
    businessDate: '2026-08-15',
    entryDate: '2026-08-15T00:00:00.000Z',
    description: 'Monthly Rent (2026-08-15)',
    category: 'RENT',
    commitmentStatus: 'UNCOMMITTED',
  });

  it('detects no material change when snapshots are identical', () => {
    const result = MaterialChangeRules.detectMaterialChanges(
      [baseRentObligation],
      [baseRentObligation]
    );

    expect(result.hasMaterialChanges).toBe(false);
    expect(result.deltaDetails).toHaveLength(0);
  });

  it('detects material change when an obligation is removed in revalidation', () => {
    const result = MaterialChangeRules.detectMaterialChanges(
      [baseRentObligation],
      []
    );

    expect(result.hasMaterialChanges).toBe(true);
    expect(result.deltaDetails[0]).toContain('Obligation removed: RENT:STAY-101:2026-08-15');
  });

  it('detects material change when a new obligation is added in revalidation', () => {
    const lateObligation = new DiscoveredObligation({
      obligationKey: 'LAUNDRY:STAY-101:LND-01',
      stayId: 'STAY-101',
      residentId: 'RES-101',
      residentCode: 'RC-001',
      chargeType: 'LAUNDRY',
      amount: 450,
      businessDate: '2026-08-10',
      entryDate: '2026-08-16T00:00:00.000Z',
      description: 'Late Laundry Service',
      category: 'OTHER',
      commitmentStatus: 'UNCOMMITTED',
    });

    const result = MaterialChangeRules.detectMaterialChanges(
      [baseRentObligation],
      [baseRentObligation, lateObligation]
    );

    expect(result.hasMaterialChanges).toBe(true);
    expect(result.deltaDetails[0]).toContain('Obligation added: LAUNDRY:STAY-101:LND-01');
  });

  it('detects material change when an obligation amount changes', () => {
    const amendedObligation = new DiscoveredObligation({
      obligationKey: 'RENT:STAY-101:2026-08-15',
      stayId: 'STAY-101',
      residentId: 'RES-101',
      residentCode: 'RC-001',
      chargeType: 'RENT',
      amount: 13000,
      businessDate: '2026-08-15',
      entryDate: '2026-08-15T00:00:00.000Z',
      description: 'Monthly Rent (2026-08-15)',
      category: 'RENT',
      commitmentStatus: 'UNCOMMITTED',
    });

    const result = MaterialChangeRules.detectMaterialChanges(
      [baseRentObligation],
      [amendedObligation]
    );

    expect(result.hasMaterialChanges).toBe(true);
    expect(result.deltaDetails[0]).toContain('Amount changed for RENT:STAY-101:2026-08-15: ₹12000 -> ₹13000');
  });

  it('detects material change when an obligation becomes committed by source domain', () => {
    const committedObligation = new DiscoveredObligation({
      obligationKey: 'RENT:STAY-101:2026-08-15',
      stayId: 'STAY-101',
      residentId: 'RES-101',
      residentCode: 'RC-001',
      chargeType: 'RENT',
      amount: 12000,
      businessDate: '2026-08-15',
      entryDate: '2026-08-15T00:00:00.000Z',
      description: 'Monthly Rent (2026-08-15)',
      category: 'RENT',
      commitmentStatus: 'COMMITTED',
      financialReferenceId: 'INV-OUTSIDE-01',
    });

    const result = MaterialChangeRules.detectMaterialChanges(
      [baseRentObligation],
      [committedObligation]
    );

    expect(result.hasMaterialChanges).toBe(true);
    expect(result.deltaDetails[0]).toContain('Commitment status changed for RENT:STAY-101:2026-08-15: UNCOMMITTED -> COMMITTED');
  });
});
