import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingExecutionService } from '../BillingExecutionService';
import { BillingClaimService } from '../BillingClaimService';
import { BillingDiscoveryService } from '../BillingDiscoveryService';
import { BillingEligibilityService } from '../BillingEligibilityService';
import { InMemoryBillingRunRepository } from '../../../infrastructure/repositories/InMemoryBillingRunRepository';
import { InMemoryBillingClaimRepository } from '../../../infrastructure/repositories/InMemoryBillingClaimRepository';
import { InMemoryFinanceRepository } from '../../../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { BillingApplicationService } from '../../../../finance/services/billingService';
import { DiscoveredObligation } from '../../../domain/valueObjects/DiscoveredObligation';
import type { ChargeDiscoveryProvider } from '../../../domain/interfaces/ChargeDiscoveryProvider';

describe('BillingExecutionService', () => {
  let runRepo: InMemoryBillingRunRepository;
  let claimRepo: InMemoryBillingClaimRepository;
  let claimService: BillingClaimService;
  let discoveryService: BillingDiscoveryService;
  let eligibilityService: BillingEligibilityService;
  let financeRepo: InMemoryFinanceRepository;
  let financeService: BillingApplicationService;
  let executionService: BillingExecutionService;

  let mockDiscoveredObligations: DiscoveredObligation[];

  const createMockProvider = (): ChargeDiscoveryProvider => ({
    providerKey: 'MOCK_PROVIDER',
    chargeType: 'RENT',
    discoverObligations: async (stayIds) => {
      return mockDiscoveredObligations.filter((o) => !stayIds || stayIds.includes(o.stayId));
    },
  });

  beforeEach(() => {
    runRepo = new InMemoryBillingRunRepository();
    claimRepo = new InMemoryBillingClaimRepository();
    claimService = new BillingClaimService(claimRepo);
    financeRepo = new InMemoryFinanceRepository();
    financeService = new BillingApplicationService(financeRepo);

    mockDiscoveredObligations = [
      new DiscoveredObligation({
        obligationKey: 'RENT:STAY-1:2026-08-01',
        stayId: 'STAY-1',
        residentId: 'RES-1',
        residentCode: 'RC-001',
        chargeType: 'RENT',
        amount: 10000,
        businessDate: '2026-08-01',
        entryDate: '2026-08-01T00:00:00.000Z',
        description: 'Monthly Rent August',
        category: 'RENT',
        commitmentStatus: 'UNCOMMITTED',
      }),
      new DiscoveredObligation({
        obligationKey: 'RENT:STAY-2:2026-08-01',
        stayId: 'STAY-2',
        residentId: 'RES-2',
        residentCode: 'RC-002',
        chargeType: 'RENT',
        amount: 12000,
        businessDate: '2026-08-01',
        entryDate: '2026-08-01T00:00:00.000Z',
        description: 'Monthly Rent August',
        category: 'RENT',
        commitmentStatus: 'UNCOMMITTED',
      }),
    ];

    discoveryService = new BillingDiscoveryService([createMockProvider()]);
    eligibilityService = new BillingEligibilityService(claimRepo);

    executionService = new BillingExecutionService(
      runRepo,
      claimRepo,
      discoveryService,
      eligibilityService,
      claimService,
      financeService
    );
  });

  describe('1. Draft Run Preparation', () => {
    it('creates a BillingRun in DRAFT_PREVIEW with pending stay operations', async () => {
      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-1', 'STAY-2'],
      });

      expect(run.status).toBe('DRAFT_PREVIEW');
      expect(run.operations).toHaveLength(2);
      expect(run.operations[0].status).toBe('PENDING');
      expect(run.operations[1].status).toBe('PENDING');

      // Verify zero database claims acquired during draft preview
      const allClaims = await claimRepo.listAllClaims();
      expect(allClaims).toHaveLength(0);
    });
  });

  describe('2. Confirmation & Material Change Detection', () => {
    it('confirms cleanly when no material changes exist', async () => {
      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-1'],
      });

      const confirmResult = await executionService.revalidateAndConfirm(run.id, '2026-08-16T10:00:00.000Z');
      expect(confirmResult.success).toBe(true);
      expect(confirmResult.run.status).toBe('CONFIRMED');
      expect(confirmResult.run.eligibilityCutoff).toBe('2026-08-16T10:00:00.000Z');
    });

    it('detects material changes and prevents automatic confirmation', async () => {
      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-1'],
      });

      // Simulate live change: Rent amount updated in Stay domain
      mockDiscoveredObligations = [
        new DiscoveredObligation({
          obligationKey: 'RENT:STAY-1:2026-08-01',
          stayId: 'STAY-1',
          residentId: 'RES-1',
          residentCode: 'RC-001',
          chargeType: 'RENT',
          amount: 11500, // changed from 10000
          businessDate: '2026-08-01',
          entryDate: '2026-08-01T00:00:00.000Z',
          description: 'Monthly Rent August (Amended)',
          category: 'RENT',
          commitmentStatus: 'UNCOMMITTED',
        }),
      ];

      const confirmResult = await executionService.revalidateAndConfirm(run.id, '2026-08-16T10:00:00.000Z');
      expect(confirmResult.success).toBe(false);
      expect(confirmResult.hasMaterialChanges).toBe(true);
      expect(confirmResult.deltaDetails?.[0]).toContain('Amount changed for RENT:STAY-1:2026-08-01: ₹10000 -> ₹11500');
      expect(confirmResult.run.status).toBe('DRAFT_PREVIEW');
    });
  });

  describe('3. Execution & Finance Integration', () => {
    it('executes a confirmed run, dispatches to Finance, and commits claims', async () => {
      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-1', 'STAY-2'],
      });

      await executionService.revalidateAndConfirm(run.id, '2026-08-16T10:00:00.000Z');
      const executedRun = await executionService.executeRun(run.id);

      expect(executedRun.status).toBe('COMPLETED');
      expect(executedRun.successfulOperationsCount).toBe(2);
      expect(executedRun.totalAmountBilled).toBe(22000);

      // Verify operations
      const op1 = executedRun.getOperationByStayId('STAY-1');
      const op2 = executedRun.getOperationByStayId('STAY-2');
      expect(op1?.status).toBe('SUCCESS');
      expect(op1?.financialBillId).toBeDefined();
      expect(op2?.status).toBe('SUCCESS');
      expect(op2?.financialBillId).toBeDefined();

      // Verify claims in repository are committed with authoritative bill IDs
      const claims1 = await claimRepo.getClaimsByOperationId(op1!.id);
      expect(claims1).toHaveLength(1);
      expect(claims1[0].status).toBe('CLAIM_COMMITTED');
      expect(claims1[0].financialReferenceId).toBe(op1?.financialBillId);

      // Verify Finance repository contains the persisted bills
      const financeBills = financeRepo.getBills();
      expect(financeBills).toHaveLength(2);
    });

    it('handles clean Finance rejection by marking operation FAILED and releasing claims', async () => {
      // Mock financeService to reject STAY-1
      vi.spyOn(financeService, 'createBill').mockReturnValueOnce({
        success: false,
        bill: null,
        errors: ['Stay account is locked for administrative review.'],
      });

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-1'],
      });

      await executionService.revalidateAndConfirm(run.id);
      const executedRun = await executionService.executeRun(run.id);

      expect(executedRun.status).toBe('FAILED');
      const op = executedRun.getOperationByStayId('STAY-1');
      expect(op?.status).toBe('FAILED');
      expect(op?.failureReason).toContain('Stay account is locked');

      // Verify claims are RELEASED (eligible for retry)
      const claims = await claimRepo.getClaimsByOperationId(op!.id);
      expect(claims).toHaveLength(1);
      expect(claims[0].status).toBe('CLAIM_RELEASED');
      expect(claims[0].releaseReason).toContain('Stay account is locked');
    });

    it('handles uncertain Finance outcome (exception/timeout) by entering RECOVERY_REQUIRED and keeping claims HELD', async () => {
      // Mock financeService to throw network timeout
      vi.spyOn(financeService, 'createBill').mockImplementationOnce(() => {
        throw new Error('ETIMEDOUT: Connection to Finance service timed out');
      });

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-1'],
      });

      await executionService.revalidateAndConfirm(run.id);
      const executedRun = await executionService.executeRun(run.id);

      expect(executedRun.status).toBe('FAILED');
      const op = executedRun.getOperationByStayId('STAY-1');
      expect(op?.status).toBe('RECOVERY_REQUIRED');
      expect(op?.failureReason).toContain('ETIMEDOUT');

      // CRITICAL INVARIANT: Claim MUST REMAIN HELD (CLAIM_ACQUIRED), never released!
      const claims = await claimRepo.getClaimsByOperationId(op!.id);
      expect(claims).toHaveLength(1);
      expect(claims[0].status).toBe('CLAIM_ACQUIRED');
      expect(claims[0].isActive()).toBe(true);
    });
  });

  describe('4. Graceful Stop & Retry Lineage', () => {
    it('marks pending operations as NOT_PROCESSED upon graceful stop without acquiring claims', async () => {
      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-1', 'STAY-2'],
      });

      await executionService.revalidateAndConfirm(run.id);
      await executionService.requestStop(run.id);

      const executedRun = await executionService.executeRun(run.id);

      expect(executedRun.status).toBe('FAILED');
      expect(executedRun.operations[0].status).toBe('NOT_PROCESSED');
      expect(executedRun.operations[1].status).toBe('NOT_PROCESSED');

      // No claims acquired for never-started operations
      const allClaims = await claimRepo.listAllClaims();
      expect(allClaims).toHaveLength(0);
    });

    it('creates an immutable Retry Run carrying over only retry-eligible operations', async () => {
      // Mock STAY-1 failure
      vi.spyOn(financeService, 'createBill').mockReturnValueOnce({
        success: false,
        bill: null,
        errors: ['Finance failure'],
      });

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-1', 'STAY-2'],
      });

      await executionService.revalidateAndConfirm(run.id);
      const executedRun = await executionService.executeRun(run.id);

      expect(executedRun.status).toBe('PARTIALLY_COMPLETED');
      expect(executedRun.getOperationByStayId('STAY-1')?.status).toBe('FAILED');
      expect(executedRun.getOperationByStayId('STAY-2')?.status).toBe('SUCCESS');

      // Create Retry Run
      const retryRun = await executionService.createRetryRun(executedRun.id, 'OP-ADMIN');

      expect(retryRun.retryOfRunId).toBe(executedRun.id);
      expect(retryRun.status).toBe('DRAFT_PREVIEW');
      expect(retryRun.operations).toHaveLength(1); // Only STAY-1 carried over
      expect(retryRun.operations[0].stayId).toBe('STAY-1');
      expect(retryRun.operations[0].status).toBe('PENDING');

      // Original run remains immutable
      const reloadedOrig = await runRepo.getById(executedRun.id);
      expect(reloadedOrig?.status).toBe('PARTIALLY_COMPLETED');
    });
  });
});
