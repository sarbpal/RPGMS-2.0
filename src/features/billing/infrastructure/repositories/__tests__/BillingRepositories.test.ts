import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryBillingRunRepository } from '../InMemoryBillingRunRepository';
import { InMemoryBillingClaimRepository } from '../InMemoryBillingClaimRepository';
import { BillingRun } from '../../../domain/entities/BillingRun';

describe('Billing Infrastructure Repositories (Atomic Claim Acquisition Boundary)', () => {
  let runRepo: InMemoryBillingRunRepository;
  let claimRepo: InMemoryBillingClaimRepository;

  beforeEach(() => {
    runRepo = new InMemoryBillingRunRepository();
    claimRepo = new InMemoryBillingClaimRepository();
  });

  describe('InMemoryBillingClaimRepository.tryAcquireClaim', () => {
    const defaultParams = {
      obligationKey: 'RENT:STAY-101:2026-08-15',
      stayId: 'STAY-101',
      billingRunId: 'RUN-01',
      billingOperationId: 'OP-01',
      amount: 12000,
    };

    it('successfully acquires a claim atomically when no claim exists', async () => {
      const result = await claimRepo.tryAcquireClaim(defaultParams);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.claim).toBeDefined();
        expect(result.claim.status).toBe('CLAIM_ACQUIRED');
        expect(result.isNew).toBe(true);
      }

      const hasActive = await claimRepo.hasActiveClaim(defaultParams.obligationKey);
      expect(hasActive).toBe(true);
    });

    it('enforces FIRST CLAIM WINS at the repository boundary when a second operation attempts to acquire the same obligationKey', async () => {
      // First operation acquires
      const result1 = await claimRepo.tryAcquireClaim(defaultParams);
      expect(result1.success).toBe(true);

      // Competing second operation attempts acquisition on the same obligation
      const result2 = await claimRepo.tryAcquireClaim({
        ...defaultParams,
        billingRunId: 'RUN-02',
        billingOperationId: 'OP-02',
      });

      expect(result2.success).toBe(false);
      if (!result2.success && result1.success) {
        expect(result2.reason).toBe('OBLIGATION_CLAIMED_BY_COMPETING_OPERATION');
        expect(result2.claim.id).toBe(result1.claim.id);
        expect(result2.claim.billingOperationId).toBe('OP-01');
      }

      // Exactly ONE claim exists in the repository
      const allClaims = await claimRepo.listAllClaims();
      expect(allClaims).toHaveLength(1);
    });

    it('returns existing claim idempotently when the same operation re-requests acquisition', async () => {
      const result1 = await claimRepo.tryAcquireClaim(defaultParams);
      expect(result1.success).toBe(true);

      const result2 = await claimRepo.tryAcquireClaim(defaultParams);
      expect(result2.success).toBe(true);
      if (result2.success && result1.success) {
        expect(result2.isIdempotent).toBe(true);
        expect(result2.claim.id).toBe(result1.claim.id);
      }
    });

    it('blocks acquisition at the repository boundary if claim is already CLAIM_COMMITTED', async () => {
      const result1 = await claimRepo.tryAcquireClaim(defaultParams);
      expect(result1.success).toBe(true);

      if (result1.success) {
        result1.claim.commitClaim('INV-FIN-2026-999');
        await claimRepo.saveClaim(result1.claim);
      }

      const result2 = await claimRepo.tryAcquireClaim({
        ...defaultParams,
        billingRunId: 'RUN-02',
        billingOperationId: 'OP-02',
      });

      expect(result2.success).toBe(false);
      if (!result2.success) {
        expect(result2.reason).toBe('OBLIGATION_ALREADY_COMMITTED_IN_FINANCE');
      }
    });

    it('allows re-acquisition at the repository boundary if prior claim was CLAIM_RELEASED', async () => {
      const result1 = await claimRepo.tryAcquireClaim(defaultParams);
      expect(result1.success).toBe(true);

      if (result1.success) {
        result1.claim.releaseClaim('Calculation failed');
        await claimRepo.saveClaim(result1.claim);
      }

      // Retry Run 2 can re-acquire
      const retryResult = await claimRepo.tryAcquireClaim({
        ...defaultParams,
        billingRunId: 'RUN-02',
        billingOperationId: 'OP-02',
      });

      expect(retryResult.success).toBe(true);
      if (retryResult.success) {
        expect(retryResult.isReacquired).toBe(true);
        expect(retryResult.claim.billingRunId).toBe('RUN-02');
        expect(retryResult.claim.status).toBe('CLAIM_ACQUIRED');
      }
    });
  });

  describe('BillingRunRepository', () => {
    it('saves and retrieves BillingRun by ID', async () => {
      const run = new BillingRun({
        id: 'RUN-100',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-1',
      });

      await runRepo.save(run);
      const retrieved = await runRepo.getById('RUN-100');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('RUN-100');
      expect(retrieved?.status).toBe('DRAFT_PREVIEW');
    });

    it('identifies active BillingRun', async () => {
      const draftRun = new BillingRun({
        id: 'RUN-DRAFT',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-1',
      });
      await runRepo.save(draftRun);

      expect(await runRepo.getActiveRun()).toBeNull();

      draftRun.confirm();
      await runRepo.save(draftRun);

      const active = await runRepo.getActiveRun();
      expect(active?.id).toBe('RUN-DRAFT');
      expect(active?.status).toBe('CONFIRMED');
    });
  });
});
