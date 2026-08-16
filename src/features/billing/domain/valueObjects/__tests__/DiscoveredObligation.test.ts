import { describe, it, expect } from 'vitest';
import { DiscoveredObligation } from '../DiscoveredObligation';
import { ObligationKey } from '../ObligationKey';

describe('DiscoveredObligation Value Object', () => {
  const validUncommittedProps = {
    obligationKey: ObligationKey.forRent('STAY-101', '2026-08-15').value,
    stayId: 'STAY-101',
    residentId: 'RES-101',
    residentCode: 'RC-001',
    chargeType: 'RENT' as const,
    amount: 12000,
    businessDate: '2026-08-15',
    entryDate: '2026-08-15T00:00:00.000Z',
    description: 'Monthly Rent (15-Aug to 14-Sep)',
    category: 'RENT' as const,
    commitmentStatus: 'UNCOMMITTED' as const,
  };

  it('instantiates an UNCOMMITTED obligation that is claimable', () => {
    const obligation = new DiscoveredObligation(validUncommittedProps);

    expect(obligation.obligationKey).toBe('RENT:STAY-101:2026-08-15');
    expect(obligation.amount).toBe(12000);
    expect(obligation.isClaimable()).toBe(true);
    expect(obligation.isCommitted()).toBe(false);
    expect(obligation.financialReferenceId).toBeUndefined();
  });

  it('instantiates a COMMITTED obligation that is not claimable and retains financialReferenceId', () => {
    const committedObligation = new DiscoveredObligation({
      ...validUncommittedProps,
      chargeType: 'ELECTRICITY',
      category: 'UTILITIES',
      amount: 850.5,
      commitmentStatus: 'COMMITTED',
      financialReferenceId: 'INV-ELEC-2026-001',
    });

    expect(committedObligation.isClaimable()).toBe(false);
    expect(committedObligation.isCommitted()).toBe(true);
    expect(committedObligation.financialReferenceId).toBe('INV-ELEC-2026-001');
  });

  it('validates amount must be positive number', () => {
    expect(
      () =>
        new DiscoveredObligation({
          ...validUncommittedProps,
          amount: 0,
        })
    ).toThrow('amount must be a positive number');

    expect(
      () =>
        new DiscoveredObligation({
          ...validUncommittedProps,
          amount: -500,
        })
    ).toThrow('amount must be a positive number');
  });

  it('rejects missing required fields', () => {
    expect(
      () =>
        new DiscoveredObligation({
          ...validUncommittedProps,
          obligationKey: '',
        })
    ).toThrow('valid obligationKey');

    expect(
      () =>
        new DiscoveredObligation({
          ...validUncommittedProps,
          stayId: '',
        })
    ).toThrow('valid stayId');
  });
});
