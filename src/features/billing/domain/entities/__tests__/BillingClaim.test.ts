import { describe, it, expect } from 'vitest';
import { BillingClaim } from '../BillingClaim';

describe('BillingClaim Aggregate Entity', () => {
  const defaultProps = {
    id: 'CLM-001',
    obligationKey: 'RENT:STAY-101:2026-08-15',
    stayId: 'STAY-101',
    billingRunId: 'RUN-2026-08',
    billingOperationId: 'OP-001',
    amount: 12000,
  };

  it('instantiates with CLAIM_ACQUIRED status by default and is active', () => {
    const claim = new BillingClaim(defaultProps);

    expect(claim.id).toBe('CLM-001');
    expect(claim.status).toBe('CLAIM_ACQUIRED');
    expect(claim.isActive()).toBe(true);
    expect(claim.amount).toBe(12000);
    expect(claim.financialReferenceId).toBeUndefined();
  });

  it('transitions to CLAIM_COMMITTED upon commit with financial reference', () => {
    const claim = new BillingClaim(defaultProps);
    claim.commitClaim('INV-2026-888');

    expect(claim.status).toBe('CLAIM_COMMITTED');
    expect(claim.financialReferenceId).toBe('INV-2026-888');
    expect(claim.committedAt).toBeDefined();
    expect(claim.isActive()).toBe(true);
  });

  it('idempotently allows re-committing with identical financialReferenceId', () => {
    const claim = new BillingClaim(defaultProps);
    claim.commitClaim('INV-2026-888');
    expect(() => claim.commitClaim('INV-2026-888')).not.toThrow();
  });

  it('rejects committing with a different financialReferenceId if already committed', () => {
    const claim = new BillingClaim(defaultProps);
    claim.commitClaim('INV-2026-888');
    expect(() => claim.commitClaim('INV-2026-999')).toThrow('already committed');
  });

  it('transitions to CLAIM_RELEASED upon release with a reason', () => {
    const claim = new BillingClaim(defaultProps);
    claim.releaseClaim('Non-financial processing failure occurred.');

    expect(claim.status).toBe('CLAIM_RELEASED');
    expect(claim.releaseReason).toBe('Non-financial processing failure occurred.');
    expect(claim.releasedAt).toBeDefined();
    expect(claim.isActive()).toBe(false);
  });

  it('prevents releasing a committed claim', () => {
    const claim = new BillingClaim(defaultProps);
    claim.commitClaim('INV-2026-888');

    expect(() => claim.releaseClaim('Try release')).toThrow('Cannot release committed financial BillingClaim');
  });

  it('prevents committing a released claim', () => {
    const claim = new BillingClaim(defaultProps);
    claim.releaseClaim('Failure');

    expect(() => claim.commitClaim('INV-2026-888')).toThrow('Cannot commit released BillingClaim');
  });
});
