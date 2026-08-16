import { describe, it, expect, beforeEach } from 'vitest';
import { BillingEligibilityService } from '../BillingEligibilityService';
import { InMemoryBillingClaimRepository } from '../../../infrastructure/repositories/InMemoryBillingClaimRepository';
import { DiscoveredObligation } from '../../../domain/valueObjects/DiscoveredObligation';
import { BillingClaim } from '../../../domain/entities/BillingClaim';

describe('BillingEligibilityService Application Service', () => {
  let claimRepo: InMemoryBillingClaimRepository;
  let eligibilityService: BillingEligibilityService;

  const validUncommittedRent = new DiscoveredObligation({
    obligationKey: 'RENT:STAY-101:2026-08-15',
    stayId: 'STAY-101',
    residentId: 'RES-101',
    residentCode: 'RC-001',
    chargeType: 'RENT',
    amount: 15000,
    businessDate: '2026-08-15',
    entryDate: '2026-08-15T00:00:00.000Z',
    description: 'Monthly Rent',
    category: 'RENT',
    commitmentStatus: 'UNCOMMITTED',
  });

  const validCommittedElectricity = new DiscoveredObligation({
    obligationKey: 'ELECTRICITY:STAY-101:ALLOC-001',
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
    financialReferenceId: 'INV-ELEC-2026-001',
  });

  beforeEach(() => {
    claimRepo = new InMemoryBillingClaimRepository();
    eligibilityService = new BillingEligibilityService(claimRepo);
  });

  it('evaluates uncommitted obligation with no claim as ELIGIBLE_FOR_CLAIM', async () => {
    const result = await eligibilityService.evaluateObligation(validUncommittedRent);

    expect(result.category).toBe('ELIGIBLE_FOR_CLAIM');
    expect(result.isClaimable).toBe(true);
  });

  it('evaluates COMMITTED obligation as COMMITTED_BY_SOURCE_DOMAIN and not claimable', async () => {
    const result = await eligibilityService.evaluateObligation(validCommittedElectricity);

    expect(result.category).toBe('COMMITTED_BY_SOURCE_DOMAIN');
    expect(result.isClaimable).toBe(false);
    expect(result.reason).toContain('already been financially committed');
  });

  it('evaluates active claim by another operation as ALREADY_CLAIMED_BY_OTHER', async () => {
    const activeClaim = new BillingClaim({
      id: 'CLM-01',
      obligationKey: validUncommittedRent.obligationKey,
      stayId: validUncommittedRent.stayId,
      billingRunId: 'RUN-A',
      billingOperationId: 'OP-A',
      amount: validUncommittedRent.amount,
      status: 'CLAIM_ACQUIRED',
    });
    await claimRepo.saveClaim(activeClaim);

    const result = await eligibilityService.evaluateObligation(
      validUncommittedRent,
      'RUN-B',
      'OP-B'
    );

    expect(result.category).toBe('ALREADY_CLAIMED_BY_OTHER');
    expect(result.isClaimable).toBe(false);
    expect(result.reason).toContain('actively claimed by Run RUN-A');
  });

  it('evaluates active claim by the same operation as IDEMPOTENT_ACTIVE_CLAIM', async () => {
    const activeClaim = new BillingClaim({
      id: 'CLM-01',
      obligationKey: validUncommittedRent.obligationKey,
      stayId: validUncommittedRent.stayId,
      billingRunId: 'RUN-A',
      billingOperationId: 'OP-A',
      amount: validUncommittedRent.amount,
      status: 'CLAIM_ACQUIRED',
    });
    await claimRepo.saveClaim(activeClaim);

    const result = await eligibilityService.evaluateObligation(
      validUncommittedRent,
      'RUN-A',
      'OP-A'
    );

    expect(result.category).toBe('IDEMPOTENT_ACTIVE_CLAIM');
    expect(result.isClaimable).toBe(true);
  });

  it('evaluates released claim as REACQUIRABLE_RELEASED', async () => {
    const releasedClaim = new BillingClaim({
      id: 'CLM-01',
      obligationKey: validUncommittedRent.obligationKey,
      stayId: validUncommittedRent.stayId,
      billingRunId: 'RUN-A',
      billingOperationId: 'OP-A',
      amount: validUncommittedRent.amount,
      status: 'CLAIM_RELEASED',
    });
    await claimRepo.saveClaim(releasedClaim);

    const result = await eligibilityService.evaluateObligation(
      validUncommittedRent,
      'RUN-B',
      'OP-B'
    );

    expect(result.category).toBe('REACQUIRABLE_RELEASED');
    expect(result.isClaimable).toBe(true);
  });

  it('evaluates batch of obligations and aggregates summary counts and amounts', async () => {
    const uncommitted2 = new DiscoveredObligation({
      ...validUncommittedRent,
      obligationKey: 'RENT:STAY-102:2026-08-15',
      stayId: 'STAY-102',
      amount: 12000,
    });

    const summary = await eligibilityService.evaluateBatch([
      validUncommittedRent,
      validCommittedElectricity,
      uncommitted2,
    ]);

    expect(summary.totalDiscovered).toBe(3);
    expect(summary.eligibleCount).toBe(2);
    expect(summary.eligibleAmount).toBe(27000);
    expect(summary.committedCount).toBe(1);
    expect(summary.committedAmount).toBe(850);
    expect(summary.claimedCount).toBe(0);
    expect(summary.ineligibleCount).toBe(0);
  });
});
