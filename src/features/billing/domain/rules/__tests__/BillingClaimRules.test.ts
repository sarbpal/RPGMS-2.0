import { describe, it, expect } from 'vitest';
import { BillingClaimRules } from '../BillingClaimRules';
import { DiscoveredObligation } from '../../valueObjects/DiscoveredObligation';
import { BillingClaim } from '../../entities/BillingClaim';

describe('BillingClaimRules Domain Service (First Claim Wins & Commitment Validation)', () => {
  const uncommittedObligation = new DiscoveredObligation({
    obligationKey: 'RENT:STAY-101:2026-08-15',
    stayId: 'STAY-101',
    residentId: 'RES-101',
    residentCode: 'RC-001',
    chargeType: 'RENT',
    amount: 12000,
    businessDate: '2026-08-15',
    entryDate: '2026-08-15T00:00:00.000Z',
    description: 'Monthly Rent',
    category: 'RENT',
    commitmentStatus: 'UNCOMMITTED',
  });

  const committedObligation = new DiscoveredObligation({
    obligationKey: 'ELECTRICITY:STAY-101:ALLOC-PART-001',
    stayId: 'STAY-101',
    residentId: 'RES-101',
    residentCode: 'RC-001',
    chargeType: 'ELECTRICITY',
    amount: 850,
    businessDate: '2026-08-15',
    entryDate: '2026-08-15T00:00:00.000Z',
    description: 'Confirmed Electricity Allocation',
    category: 'UTILITIES',
    commitmentStatus: 'COMMITTED',
    financialReferenceId: 'INV-ELEC-001',
  });

  it('allows fresh claim acquisition on uncommitted obligation when no claim exists', () => {
    const result = BillingClaimRules.validateClaimAcquisition(
      uncommittedObligation,
      null,
      'RUN-1',
      'OP-1'
    );

    expect(result.canAcquire).toBe(true);
    expect(result.isNew).toBe(true);
  });

  it('REJECTS claim acquisition on COMMITTED obligations immediately', () => {
    const result = BillingClaimRules.validateClaimAcquisition(
      committedObligation,
      null,
      'RUN-1',
      'OP-1'
    );

    expect(result.canAcquire).toBe(false);
    expect(result.reason).toBe('CANNOT_CLAIM_COMMITTED_OBLIGATION');
  });

  it('allows re-acquisition if prior claim was RELEASED (non-financial retry)', () => {
    const releasedClaim = new BillingClaim({
      id: 'CLM-001',
      obligationKey: 'RENT:STAY-101:2026-08-15',
      stayId: 'STAY-101',
      billingRunId: 'RUN-1',
      billingOperationId: 'OP-1',
      amount: 12000,
    });
    releasedClaim.releaseClaim('Prior attempt failed before finance commit');

    const result = BillingClaimRules.validateClaimAcquisition(
      uncommittedObligation,
      releasedClaim,
      'RUN-2',
      'OP-2'
    );

    expect(result.canAcquire).toBe(true);
    expect(result.isReacquired).toBe(true);
  });

  it('REJECTS claim acquisition if prior claim is CLAIM_COMMITTED', () => {
    const committedClaim = new BillingClaim({
      id: 'CLM-001',
      obligationKey: 'RENT:STAY-101:2026-08-15',
      stayId: 'STAY-101',
      billingRunId: 'RUN-1',
      billingOperationId: 'OP-1',
      amount: 12000,
    });
    committedClaim.commitClaim('INV-FIN-001');

    const result = BillingClaimRules.validateClaimAcquisition(
      uncommittedObligation,
      committedClaim,
      'RUN-2',
      'OP-2'
    );

    expect(result.canAcquire).toBe(false);
    expect(result.reason).toBe('OBLIGATION_ALREADY_COMMITTED_IN_FINANCE');
  });

  it('enforces FIRST CLAIM WINS against competing runs when claim is actively CLAIM_ACQUIRED', () => {
    const activeClaim = new BillingClaim({
      id: 'CLM-001',
      obligationKey: 'RENT:STAY-101:2026-08-15',
      stayId: 'STAY-101',
      billingRunId: 'RUN-1',
      billingOperationId: 'OP-1',
      amount: 12000,
    });

    // Competing Run-2 / OP-2 attempts to claim
    const result = BillingClaimRules.validateClaimAcquisition(
      uncommittedObligation,
      activeClaim,
      'RUN-2',
      'OP-2'
    );

    expect(result.canAcquire).toBe(false);
    expect(result.reason).toBe('OBLIGATION_CLAIMED_BY_COMPETING_OPERATION');
  });

  it('idempotently recognizes claim when re-requested by the exact same operation', () => {
    const activeClaim = new BillingClaim({
      id: 'CLM-001',
      obligationKey: 'RENT:STAY-101:2026-08-15',
      stayId: 'STAY-101',
      billingRunId: 'RUN-1',
      billingOperationId: 'OP-1',
      amount: 12000,
    });

    const result = BillingClaimRules.validateClaimAcquisition(
      uncommittedObligation,
      activeClaim,
      'RUN-1',
      'OP-1'
    );

    expect(result.canAcquire).toBe(true);
    expect(result.isIdempotent).toBe(true);
  });
});
