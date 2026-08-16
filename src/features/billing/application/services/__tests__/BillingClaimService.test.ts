import { describe, it, expect, beforeEach } from 'vitest';
import { BillingClaimService } from '../BillingClaimService';
import { InMemoryBillingClaimRepository } from '../../../infrastructure/repositories/InMemoryBillingClaimRepository';
import { DiscoveredObligation } from '../../../domain/valueObjects/DiscoveredObligation';

describe('BillingClaimService Application Service', () => {
  let claimRepo: InMemoryBillingClaimRepository;
  let claimService: BillingClaimService;

  const sampleUncommitted = new DiscoveredObligation({
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

  const sampleCommitted = new DiscoveredObligation({
    obligationKey: 'ELECTRICITY:STAY-101:ALLOC-001',
    stayId: 'STAY-101',
    residentId: 'RES-101',
    residentCode: 'RC-001',
    chargeType: 'ELECTRICITY',
    amount: 900,
    businessDate: '2026-08-15',
    entryDate: '2026-08-15T00:00:00.000Z',
    description: 'Confirmed Electricity',
    category: 'UTILITIES',
    commitmentStatus: 'COMMITTED',
    financialReferenceId: 'INV-ELEC-001',
  });

  beforeEach(() => {
    claimRepo = new InMemoryBillingClaimRepository();
    claimService = new BillingClaimService(claimRepo);
  });

  it('acquires a new claim successfully for an uncommitted obligation', async () => {
    const result = await claimService.acquireClaim('RUN-01', 'OP-01', sampleUncommitted);

    expect(result.success).toBe(true);
    expect(result.claim).toBeDefined();
    expect(result.claim?.status).toBe('CLAIM_ACQUIRED');
    expect(result.claim?.billingRunId).toBe('RUN-01');
    expect(result.claim?.billingOperationId).toBe('OP-01');

    const hasActive = await claimRepo.hasActiveClaim(sampleUncommitted.obligationKey);
    expect(hasActive).toBe(true);
  });

  it('rejects claim acquisition for COMMITTED obligations', async () => {
    const result = await claimService.acquireClaim('RUN-01', 'OP-01', sampleCommitted);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('CANNOT_CLAIM_COMMITTED_OBLIGATION');
  });

  it('enforces FIRST CLAIM WINS when a competing run attempts to claim the same obligation', async () => {
    // Run 1 claims
    const claim1 = await claimService.acquireClaim('RUN-01', 'OP-01', sampleUncommitted);
    expect(claim1.success).toBe(true);

    // Competing Run 2 attempts to claim
    const claim2 = await claimService.acquireClaim('RUN-02', 'OP-02', sampleUncommitted);
    expect(claim2.success).toBe(false);
    expect(claim2.reason).toBe('OBLIGATION_CLAIMED_BY_COMPETING_OPERATION');
  });

  it('idempotently returns existing claim when same operation requests claim again', async () => {
    const claim1 = await claimService.acquireClaim('RUN-01', 'OP-01', sampleUncommitted);
    expect(claim1.success).toBe(true);

    const claim2 = await claimService.acquireClaim('RUN-01', 'OP-01', sampleUncommitted);
    expect(claim2.success).toBe(true);
    expect(claim2.isIdempotent).toBe(true);
    expect(claim2.claim?.id).toBe(claim1.claim?.id);
  });

  it('commits a claim with financial reference upon successful billing completion', async () => {
    const result = await claimService.acquireClaim('RUN-01', 'OP-01', sampleUncommitted);
    const claimId = result.claim!.id;

    const committedClaim = await claimService.commitClaim(claimId, 'INV-FIN-2026-999');
    expect(committedClaim.status).toBe('CLAIM_COMMITTED');
    expect(committedClaim.financialReferenceId).toBe('INV-FIN-2026-999');

    // Subsequent run cannot claim
    const subsequentAttempt = await claimService.acquireClaim('RUN-02', 'OP-02', sampleUncommitted);
    expect(subsequentAttempt.success).toBe(false);
    expect(subsequentAttempt.reason).toBe('OBLIGATION_ALREADY_COMMITTED_IN_FINANCE');
  });

  it('releases a claim upon failure and allows re-claiming by a retry run', async () => {
    const result = await claimService.acquireClaim('RUN-01', 'OP-01', sampleUncommitted);
    const claimId = result.claim!.id;

    const releasedClaim = await claimService.releaseClaim(claimId, 'Non-financial processing failure');
    expect(releasedClaim.status).toBe('CLAIM_RELEASED');

    // Retry Run 2 can now claim it
    const retryAttempt = await claimService.acquireClaim('RUN-02', 'OP-02', sampleUncommitted);
    expect(retryAttempt.success).toBe(true);
    expect(retryAttempt.isReacquired).toBe(true);
    expect(retryAttempt.claim?.billingRunId).toBe('RUN-02');
  });

  it('processes batch claims, collecting successful claims and identifying failed obligations', async () => {
    const uncommitted2 = new DiscoveredObligation({
      ...sampleUncommitted,
      obligationKey: 'RENT:STAY-102:2026-08-15',
      stayId: 'STAY-102',
    });

    const batch = await claimService.acquireBatchClaims('RUN-01', 'OP-01', [
      sampleUncommitted,
      sampleCommitted, // Will fail: COMMITTED
      uncommitted2,
    ]);

    expect(batch.successfulClaims).toHaveLength(2);
    expect(batch.failedObligations).toHaveLength(1);
    expect(batch.failedObligations[0].obligation.obligationKey).toBe(sampleCommitted.obligationKey);
    expect(batch.failedObligations[0].reason).toBe('CANNOT_CLAIM_COMMITTED_OBLIGATION');
  });
});
