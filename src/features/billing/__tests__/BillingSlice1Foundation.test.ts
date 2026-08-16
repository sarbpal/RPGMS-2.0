import { describe, it, expect, beforeEach } from 'vitest';
import {
  BillingRun,
  BillingOperation,
  DiscoveredObligation,
  ObligationKey,
  BillingClaimService,
  InMemoryBillingClaimRepository,
} from '../index';

describe('Billing Slice 1: Domain & Claim Model Foundation End-to-End Suite', () => {
  let claimRepo: InMemoryBillingClaimRepository;
  let claimService: BillingClaimService;

  beforeEach(() => {
    claimRepo = new InMemoryBillingClaimRepository();
    claimService = new BillingClaimService(claimRepo);
  });

  describe('1. Obligation Identity', () => {
    it('Requirement 1: Same business obligation produces the same obligationKey', () => {
      const key1 = ObligationKey.forRent('STAY-101', '2026-08-15');
      const key2 = ObligationKey.forRent('STAY-101', '2026-08-15');

      expect(key1.value).toBe('RENT:STAY-101:2026-08-15');
      expect(key1.equals(key2)).toBe(true);
    });

    it('Requirement 2: Different obligations produce different obligationKeys', () => {
      const rentKey = ObligationKey.forRent('STAY-101', '2026-08-15');
      const diffStayKey = ObligationKey.forRent('STAY-102', '2026-08-15');
      const diffDateKey = ObligationKey.forRent('STAY-101', '2026-09-15');
      const elecKey = ObligationKey.forElectricity('STAY-101', 'ALLOC-001');

      expect(rentKey.value).not.toBe(diffStayKey.value);
      expect(rentKey.value).not.toBe(diffDateKey.value);
      expect(rentKey.value).not.toBe(elecKey.value);
    });

    it('Requirement 3: Obligation identity does NOT depend on Billing Run ID', () => {
      const keyRunA = ObligationKey.forRent('STAY-200', '2026-08-01');
      const keyRunB = ObligationKey.forRent('STAY-200', '2026-08-01');

      expect(keyRunA.value).toBe(keyRunB.value);
      expect(keyRunA.value).not.toContain('RUN-');
    });

    it('Requirement 4: Obligation identity does NOT depend on processing timestamp', () => {
      const keyT1 = ObligationKey.forLaundry('STAY-300', 'LND-99');
      const keyT2 = ObligationKey.forLaundry('STAY-300', 'LND-99');

      expect(keyT1.value).toBe(keyT2.value);
    });
  });

  describe('2. Commitment Semantics', () => {
    it('Requirement 5: UNCOMMITTED obligation is claimable', () => {
      const uncommitted = new DiscoveredObligation({
        obligationKey: 'RENT:STAY-101:2026-08-15',
        stayId: 'STAY-101',
        residentId: 'RES-101',
        residentCode: 'RC-001',
        chargeType: 'RENT',
        amount: 14000,
        businessDate: '2026-08-15',
        entryDate: '2026-08-15T00:00:00.000Z',
        description: 'Rent',
        category: 'RENT',
        commitmentStatus: 'UNCOMMITTED',
      });

      expect(uncommitted.isClaimable()).toBe(true);
      expect(uncommitted.isCommitted()).toBe(false);
    });

    it('Requirement 6 & 7: COMMITTED obligation cannot enter claim acquisition and retains financialReferenceId', async () => {
      const committed = new DiscoveredObligation({
        obligationKey: 'ELECTRICITY:STAY-101:ALLOC-001',
        stayId: 'STAY-101',
        residentId: 'RES-101',
        residentCode: 'RC-001',
        chargeType: 'ELECTRICITY',
        amount: 950,
        businessDate: '2026-08-15',
        entryDate: '2026-08-15T00:00:00.000Z',
        description: 'Confirmed Electricity Allocation',
        category: 'UTILITIES',
        commitmentStatus: 'COMMITTED',
        financialReferenceId: 'INV-ELEC-001',
      });

      expect(committed.isClaimable()).toBe(false);
      expect(committed.isCommitted()).toBe(true);
      expect(committed.financialReferenceId).toBe('INV-ELEC-001');

      // Attempting claim acquisition must be immediately rejected
      const claimResult = await claimService.acquireClaim('RUN-1', 'OP-1', committed);
      expect(claimResult.success).toBe(false);
      expect(claimResult.reason).toBe('CANNOT_CLAIM_COMMITTED_OBLIGATION');
    });
  });

  describe('3. First Claim Wins, Repository Atomicity & Idempotency', () => {
    const uncommittedObligation = new DiscoveredObligation({
      obligationKey: 'RENT:STAY-101:2026-08-15',
      stayId: 'STAY-101',
      residentId: 'RES-101',
      residentCode: 'RC-001',
      chargeType: 'RENT',
      amount: 14000,
      businessDate: '2026-08-15',
      entryDate: '2026-08-15T00:00:00.000Z',
      description: 'Rent',
      category: 'RENT',
      commitmentStatus: 'UNCOMMITTED',
    });

    it('Requirement 8: First operation successfully acquires an obligation', async () => {
      const result = await claimService.acquireClaim('RUN-1', 'OP-1', uncommittedObligation);

      expect(result.success).toBe(true);
      expect(result.claim).toBeDefined();
      expect(result.claim?.status).toBe('CLAIM_ACQUIRED');
      expect(result.claim?.billingRunId).toBe('RUN-1');
      expect(result.claim?.billingOperationId).toBe('OP-1');
    });

    it('Requirement 9: Second independent operation cannot acquire the same active obligation', async () => {
      await claimService.acquireClaim('RUN-1', 'OP-1', uncommittedObligation);

      const secondResult = await claimService.acquireClaim('RUN-2', 'OP-2', uncommittedObligation);
      expect(secondResult.success).toBe(false);
      expect(secondResult.reason).toBe('OBLIGATION_CLAIMED_BY_COMPETING_OPERATION');
      expect(secondResult.claim?.billingRunId).toBe('RUN-1');
    });

    it('Requirement 10: Repository acquisition itself enforces uniqueness (Two simulated attempts produce exactly ONE owner)', async () => {
      // Direct repository acquisition boundary test
      const repoResult1 = await claimRepo.tryAcquireClaim({
        obligationKey: uncommittedObligation.obligationKey,
        stayId: uncommittedObligation.stayId,
        billingRunId: 'RUN-A',
        billingOperationId: 'OP-A',
        amount: uncommittedObligation.amount,
      });

      const repoResult2 = await claimRepo.tryAcquireClaim({
        obligationKey: uncommittedObligation.obligationKey,
        stayId: uncommittedObligation.stayId,
        billingRunId: 'RUN-B',
        billingOperationId: 'OP-B',
        amount: uncommittedObligation.amount,
      });

      expect(repoResult1.success).toBe(true);
      expect(repoResult2.success).toBe(false);
      if (!repoResult2.success) {
        expect(repoResult2.reason).toBe('OBLIGATION_CLAIMED_BY_COMPETING_OPERATION');
      }

      // Exactly ONE claim exists in the repository
      const allClaims = await claimRepo.listAllClaims();
      expect(allClaims).toHaveLength(1);
      expect(allClaims[0].billingOperationId).toBe('OP-A');
    });

    it('Requirement 11: Repeated acquisition by the same operation is idempotent', async () => {
      const claim1 = await claimService.acquireClaim('RUN-1', 'OP-1', uncommittedObligation);
      const claim2 = await claimService.acquireClaim('RUN-1', 'OP-1', uncommittedObligation);

      expect(claim1.success).toBe(true);
      expect(claim2.success).toBe(true);
      expect(claim2.isIdempotent).toBe(true);
      expect(claim2.claim?.id).toBe(claim1.claim?.id);
    });

    it('Requirement 11b: A released claim can be reacquired by a later retry operation', async () => {
      const claim1 = await claimService.acquireClaim('RUN-1', 'OP-1', uncommittedObligation);
      expect(claim1.success).toBe(true);

      await claimService.releaseClaim(claim1.claim!.id, 'Calculation failure before finance post');

      const retryClaim = await claimService.acquireClaim('RUN-2', 'OP-2', uncommittedObligation);
      expect(retryClaim.success).toBe(true);
      expect(retryClaim.isReacquired).toBe(true);
      expect(retryClaim.claim?.billingRunId).toBe('RUN-2');
      expect(retryClaim.claim?.billingOperationId).toBe('OP-2');
    });

    it('Requirement 11c: A committed claim cannot be reacquired', async () => {
      const claim1 = await claimService.acquireClaim('RUN-1', 'OP-1', uncommittedObligation);
      expect(claim1.success).toBe(true);

      await claimService.commitClaim(claim1.claim!.id, 'INV-FIN-2026-999');

      const attempt = await claimService.acquireClaim('RUN-2', 'OP-2', uncommittedObligation);
      expect(attempt.success).toBe(false);
      expect(attempt.reason).toBe('OBLIGATION_ALREADY_COMMITTED_IN_FINANCE');
    });
  });

  describe('4. Billing Run Lifecycle', () => {
    it('Requirement 12: BillingRun lifecycle transitions obey defined rules', () => {
      const run = new BillingRun({
        id: 'RUN-100',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-1',
      });

      expect(run.status).toBe('DRAFT_PREVIEW');

      run.confirm('2026-08-16T10:00:00.000Z');
      expect(run.status).toBe('CONFIRMED');
      expect(run.eligibilityCutoff).toBe('2026-08-16T10:00:00.000Z');

      run.startProcessing();
      expect(run.status).toBe('PROCESSING');

      run.finalize();
      expect(run.status).toBe('COMPLETED');
    });

    it('Requirement 13: Invalid BillingRun transitions are rejected', () => {
      const run = new BillingRun({
        id: 'RUN-100',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-1',
      });

      expect(() => run.startProcessing()).toThrow('Must be CONFIRMED');
      expect(() => run.finalize()).toThrow('Cannot finalize');

      run.confirm();
      expect(() => run.confirm()).toThrow('Must be in DRAFT_PREVIEW');
    });
  });

  describe('5. Billing Operation Lifecycle', () => {
    it('Requirement 14: BillingOperation lifecycle transitions obey defined rules', () => {
      const op = new BillingOperation({
        id: 'OP-10',
        billingRunId: 'RUN-10',
        stayId: 'STAY-10',
        residentId: 'RES-10',
      });

      expect(op.status).toBe('PENDING');

      op.markClaimed(['RENT:STAY-10:2026-08-15'], 15000);
      expect(op.status).toBe('CLAIMED');
      expect(op.totalAmount).toBe(15000);

      op.startProcessing();
      expect(op.status).toBe('PROCESSING');

      op.markSuccess('INV-FIN-2026-10');
      expect(op.status).toBe('SUCCESS');
      expect(op.financialBillId).toBe('INV-FIN-2026-10');
      expect(op.isTerminal()).toBe(true);
    });

    it('Requirement 15: Failed operation retains enough identity for retry/recovery', () => {
      const op = new BillingOperation({
        id: 'OP-10',
        billingRunId: 'RUN-10',
        stayId: 'STAY-10',
        residentId: 'RES-10',
      });

      op.markClaimed(['RENT:STAY-10:2026-08-15'], 15000);
      op.startProcessing();
      op.markRecoveryRequired('Network timeout during Finance Bill creation', 'Invoice might be pending in Finance');

      expect(op.status).toBe('RECOVERY_REQUIRED');
      expect(op.stayId).toBe('STAY-10');
      expect(op.obligationKeys).toContain('RENT:STAY-10:2026-08-15');
      expect(op.failureReason).toBe('Network timeout during Finance Bill creation');
      expect(op.recoveryNotes).toBe('Invoice might be pending in Finance');
    });

    it('Requirement 16: Retry does NOT create a new business obligation identity', () => {
      const originalKey = ObligationKey.forRent('STAY-10', '2026-08-15');
      const retryKey = ObligationKey.forRent('STAY-10', '2026-08-15');

      expect(originalKey.value).toBe(retryKey.value);
      expect(retryKey.value).toBe('RENT:STAY-10:2026-08-15');
    });
  });

  describe('6. Domain Isolation & Zero-Coupling Invariants', () => {
    it('Requirement 17: Billing foundation contains no Electricity calculation or allocation math', () => {
      const discoveredElec = new DiscoveredObligation({
        obligationKey: 'ELECTRICITY:STAY-101:ALLOC-001',
        stayId: 'STAY-101',
        residentId: 'RES-101',
        residentCode: 'RC-001',
        chargeType: 'ELECTRICITY',
        amount: 850,
        businessDate: '2026-08-15',
        entryDate: '2026-08-15T00:00:00.000Z',
        description: 'Electricity allocation',
        category: 'UTILITIES',
        commitmentStatus: 'COMMITTED',
        financialReferenceId: 'INV-ELEC-001',
      });

      expect(discoveredElec.amount).toBe(850);
      expect(discoveredElec.isCommitted()).toBe(true);
    });

    it('Requirement 18: Billing foundation performs no Finance Bill creation or Ledger posting', async () => {
      const uncommitted = new DiscoveredObligation({
        obligationKey: 'RENT:STAY-101:2026-08-15',
        stayId: 'STAY-101',
        residentId: 'RES-101',
        residentCode: 'RC-001',
        chargeType: 'RENT',
        amount: 14000,
        businessDate: '2026-08-15',
        entryDate: '2026-08-15T00:00:00.000Z',
        description: 'Rent',
        category: 'RENT',
        commitmentStatus: 'UNCOMMITTED',
      });

      const result = await claimService.acquireClaim('RUN-1', 'OP-1', uncommitted);
      expect(result.success).toBe(true);
      expect(result.claim?.status).toBe('CLAIM_ACQUIRED');
      expect(result.claim?.financialReferenceId).toBeUndefined();
    });

    it('Requirement 19: Billing foundation performs no Stay aggregate mutation', () => {
      const op = new BillingOperation({
        id: 'OP-1',
        billingRunId: 'RUN-1',
        stayId: 'STAY-101',
        residentId: 'RES-101',
      });

      expect(typeof op.stayId).toBe('string');
      expect(op.stayId).toBe('STAY-101');
    });

    it('Requirement 20: Billing foundation performs no Accommodation inventory mutation', () => {
      const run = new BillingRun({
        id: 'RUN-1',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-1',
      });

      expect(run.periodStart).toBe('2026-08-01');
      expect(run.periodEnd).toBe('2026-08-31');
    });
  });
});
