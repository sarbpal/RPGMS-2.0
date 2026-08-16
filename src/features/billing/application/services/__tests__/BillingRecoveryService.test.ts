import { describe, it, expect, beforeEach } from 'vitest';
import { BillingRecoveryService } from '../BillingRecoveryService';
import { InMemoryBillingRunRepository } from '../../../infrastructure/repositories/InMemoryBillingRunRepository';
import { InMemoryBillingClaimRepository } from '../../../infrastructure/repositories/InMemoryBillingClaimRepository';
import { InMemoryFinanceRepository } from '../../../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../../../finance/storage/financeStorage';
import { BillingClaimService } from '../BillingClaimService';
import { BillingRun } from '../../../domain/entities/BillingRun';
import { BillingOperation } from '../../../domain/entities/BillingOperation';
import { BillingClaim } from '../../../domain/entities/BillingClaim';
import { AccountType } from '../../../../finance/domain/valueObjects/AccountType';
import { LedgerReferenceType } from '../../../../finance/domain/valueObjects/LedgerReferenceType';
import type { StayRepository } from '../../../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../../../resident/domain/interfaces/ResidentRepository';

describe('BillingRecoveryService Unit Tests', () => {
  let runRepo: InMemoryBillingRunRepository;
  let claimRepo: InMemoryBillingClaimRepository;
  let financeRepo: InMemoryFinanceRepository;
  let claimService: BillingClaimService;
  let stayRepo: StayRepository;
  let residentRepo: ResidentRepository;
  let recoveryService: BillingRecoveryService;

  beforeEach(() => {
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredLedgerEntries([]);
    runRepo = new InMemoryBillingRunRepository();
    claimRepo = new InMemoryBillingClaimRepository();
    financeRepo = new InMemoryFinanceRepository();
    claimService = new BillingClaimService(claimRepo);

    stayRepo = {
      findById: async () => null,
      findByIdSync: () => null,
      getAllSync: () => [],
      findByResidentId: async () => [],
      findActiveByResidentId: async () => null,
      save: async (s) => s,
      update: async (s) => s,
      delete: async () => {},
      findStaysByFlatAndPeriodOverlap: async () => [],
      findStaysByFlatAndPeriodOverlapSync: () => [],
    };

    residentRepo = {
      getById: async (id: string) => ({
        id,
        residentCode: `RC-${id}`,
        fullName: `Resident ${id}`,
        status: 'ACTIVE',
        mobileNumber: '9999999999',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      }),
      getByIdSync: (id: string) => ({
        id,
        residentCode: `RC-${id}`,
        fullName: `Resident ${id}`,
        status: 'ACTIVE',
        mobileNumber: '9999999999',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      }),
      getAll: async () => [],
      getAllSync: () => [],
      search: async () => [],
      save: async (r) => r,
      update: async (r) => r,
      delete: async () => {},
    };

    recoveryService = new BillingRecoveryService({
      billingRunRepository: runRepo,
      claimRepository: claimRepo,
      claimService,
      stayRepository: stayRepo,
      residentRepository: residentRepo,
      financeRepository: financeRepo,
    });
  });

  const setupUncertainRun = async (): Promise<{ run: BillingRun; op: BillingOperation; claim: BillingClaim }> => {
    const op = new BillingOperation({
      id: 'op_RUN-101_STAY-1',
      billingRunId: 'RUN-101',
      stayId: 'STAY-1',
      residentId: 'RES-1',
      residentCode: 'RC-001',
      status: 'RECOVERY_REQUIRED',
      obligationKeys: ['RENT:STAY-1:2026-08-01'],
      totalAmount: 12000,
      failureReason: 'Dispatch exception: network timeout',
      recoveryNotes: 'Check invoice in Finance',
    });

    const run = new BillingRun({
      id: 'RUN-101',
      periodStart: '2026-08-01',
      periodEnd: '2026-08-31',
      operatorId: 'OP-01',
      status: 'FAILED',
      operations: [op],
    });

    await runRepo.save(run);

    const claim = new BillingClaim({
      id: 'claim_1',
      obligationKey: 'RENT:STAY-1:2026-08-01',
      stayId: 'STAY-1',
      billingRunId: 'RUN-101',
      billingOperationId: 'op_RUN-101_STAY-1',
      amount: 12000,
      status: 'CLAIM_ACQUIRED', // Held!
    });
    await claimRepo.saveClaim(claim);

    return { run, op, claim };
  };

  describe('1. Evidence Inspection & Classification', () => {
    it('classifies evidence as COMMITTED when active Bill and balanced ledger exist', async () => {
      const { op } = await setupUncertainRun();

      // Post bill & ledger in Finance
      financeRepo.saveBill({
        id: 'bill-1001',
        stayId: 'STAY-1',
        billNumber: 'INV-202608-0001',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        totalAmount: 12000,
        paidAmount: 0,
        balanceAmount: 12000,
        status: 'UNPAID',
        lineItems: [
          {
            id: 'li-1',
            description: 'Rent',
            amount: 12000,
            category: 'RENT',
            obligationKey: 'RENT:STAY-1:2026-08-01',
          },
        ],
        remarks: 'Billing Run RUN-101 - Stay STAY-1',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      });

      financeRepo.saveLedgerEntries([
        {
          id: 'led-1',
          stayId: 'STAY-1',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: LedgerReferenceType.BILL,
          referenceId: 'bill-1001',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 12000,
          credit: 0,
          remarks: 'Invoice INV-202608-0001',
          createdBy: 'BILLING_ENGINE',
          createdAt: '2026-08-01T10:00:00.000Z',
        },
        {
          id: 'led-2',
          stayId: 'STAY-1',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: LedgerReferenceType.BILL,
          referenceId: 'bill-1001',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 12000,
          remarks: 'Revenue recognition',
          createdBy: 'BILLING_ENGINE',
          createdAt: '2026-08-01T10:00:00.000Z',
        },
      ]);

      const evidence = await recoveryService.inspectRecoveryEvidence(op.id);
      expect(evidence.assessment).toBe('COMMITTED');
      expect(evidence.recommendedAction).toBe('RESOLVE_COMMITTED');
      expect(evidence.recommendedBillId).toBe('bill-1001');
      expect(evidence.matchedBills).toHaveLength(1);
      expect(evidence.matchedLedgerEntries).toHaveLength(2);
    });

    it('classifies evidence as NOT_COMMITTED when zero Bills and zero ledgers exist', async () => {
      const { op } = await setupUncertainRun();

      const evidence = await recoveryService.inspectRecoveryEvidence(op.id);
      expect(evidence.assessment).toBe('NOT_COMMITTED');
      expect(evidence.recommendedAction).toBe('RESOLVE_NOT_COMMITTED');
      expect(evidence.matchedBills).toHaveLength(0);
      expect(evidence.matchedLedgerEntries).toHaveLength(0);
    });

    it('classifies evidence as UNKNOWN when bill is cancelled or ledger is missing/unbalanced', async () => {
      const { op } = await setupUncertainRun();

      // Post cancelled bill without ledgers
      financeRepo.saveBill({
        id: 'bill-cancelled-1',
        stayId: 'STAY-1',
        billNumber: 'INV-202608-0099',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        totalAmount: 12000,
        paidAmount: 0,
        balanceAmount: 0,
        status: 'CANCELLED',
        lineItems: [
          {
            id: 'li-1',
            description: 'Rent',
            amount: 12000,
            category: 'RENT',
            obligationKey: 'RENT:STAY-1:2026-08-01',
          },
        ],
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      });

      const evidence = await recoveryService.inspectRecoveryEvidence(op.id);
      expect(evidence.assessment).toBe('UNKNOWN');
      expect(evidence.recommendedAction).toBe('MANUAL_INVESTIGATION_REQUIRED');
    });
  });

  describe('2. resolveAsCommitted', () => {
    it('resolves operation to SUCCESS and commits claims when evidence is COMMITTED', async () => {
      const { op, claim } = await setupUncertainRun();

      // Setup Finance committed bill + ledger
      financeRepo.saveBill({
        id: 'bill-1002',
        stayId: 'STAY-1',
        billNumber: 'INV-202608-0002',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        totalAmount: 12000,
        paidAmount: 0,
        balanceAmount: 12000,
        status: 'UNPAID',
        lineItems: [
          {
            id: 'li-1',
            description: 'Rent',
            amount: 12000,
            category: 'RENT',
            obligationKey: 'RENT:STAY-1:2026-08-01',
          },
        ],
        remarks: 'Billing Run RUN-101 - Stay STAY-1',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      });

      financeRepo.saveLedgerEntries([
        {
          id: 'led-1',
          stayId: 'STAY-1',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: LedgerReferenceType.BILL,
          referenceId: 'bill-1002',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 12000,
          credit: 0,
          remarks: 'Invoice INV-202608-0002',
          createdBy: 'BILLING_ENGINE',
          createdAt: '2026-08-01T10:00:00.000Z',
        },
        {
          id: 'led-2',
          stayId: 'STAY-1',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: LedgerReferenceType.BILL,
          referenceId: 'bill-1002',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 12000,
          remarks: 'Revenue recognition',
          createdBy: 'BILLING_ENGINE',
          createdAt: '2026-08-01T10:00:00.000Z',
        },
      ]);

      const resolvedOp = await recoveryService.resolveAsCommitted(op.id, 'bill-1002', 'OP-ADMIN', 'Verified invoice');

      expect(resolvedOp.status).toBe('SUCCESS');
      expect(resolvedOp.financialBillId).toBe('bill-1002');
      expect(resolvedOp.recoveryNotes).toContain('Resolved COMMITTED: Operator OP-ADMIN: Verified Finance Bill INV-202608-0002 - Verified invoice');

      // Claim is committed
      const updatedClaim = await claimRepo.getClaimByObligationKey(claim.obligationKey);
      expect(updatedClaim?.status).toBe('CLAIM_COMMITTED');
      expect(updatedClaim?.financialReferenceId).toBe('bill-1002');
    });

    it('rejects resolveAsCommitted if no Finance bill exists', async () => {
      const { op } = await setupUncertainRun();

      await expect(
        recoveryService.resolveAsCommitted(op.id, 'bill-nonexistent', 'OP-ADMIN', 'Notes')
      ).rejects.toThrow('Cannot resolve operation');
    });
  });

  describe('3. resolveAsNotCommitted', () => {
    it('resolves operation to FAILED and releases claims when evidence is NOT_COMMITTED', async () => {
      const { op, claim } = await setupUncertainRun();

      const resolvedOp = await recoveryService.resolveAsNotCommitted(
        op.id,
        'OP-ADMIN',
        'Invoice was never created in Finance'
      );

      expect(resolvedOp.status).toBe('FAILED');
      expect(resolvedOp.failureReason).toBe('Invoice was never created in Finance');
      expect(resolvedOp.recoveryNotes).toContain('Resolved NOT_COMMITTED: Invoice was never created in Finance');

      // Claim is released
      const updatedClaim = await claimRepo.getClaimByObligationKey(claim.obligationKey);
      expect(updatedClaim?.status).toBe('CLAIM_RELEASED');
      expect(updatedClaim?.releaseReason).toContain('Recovery resolved NOT_COMMITTED');
    });

    it('rejects resolveAsNotCommitted if Finance evidence is COMMITTED', async () => {
      const { op } = await setupUncertainRun();

      // Post valid bill
      financeRepo.saveBill({
        id: 'bill-1003',
        stayId: 'STAY-1',
        billNumber: 'INV-202608-0003',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        totalAmount: 12000,
        paidAmount: 0,
        balanceAmount: 12000,
        status: 'UNPAID',
        lineItems: [
          {
            id: 'li-1',
            description: 'Rent',
            amount: 12000,
            category: 'RENT',
            obligationKey: 'RENT:STAY-1:2026-08-01',
          },
        ],
        remarks: 'Billing Run RUN-101 - Stay STAY-1',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      });
      financeRepo.saveLedgerEntries([
        {
          id: 'led-1',
          stayId: 'STAY-1',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: LedgerReferenceType.BILL,
          referenceId: 'bill-1003',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 12000,
          credit: 0,
          remarks: 'Invoice',
          createdBy: 'BILLING',
          createdAt: '2026-08-01T10:00:00.000Z',
        },
        {
          id: 'led-2',
          stayId: 'STAY-1',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: LedgerReferenceType.BILL,
          referenceId: 'bill-1003',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 12000,
          remarks: 'Revenue',
          createdBy: 'BILLING',
          createdAt: '2026-08-01T10:00:00.000Z',
        },
      ]);

      await expect(
        recoveryService.resolveAsNotCommitted(op.id, 'OP-ADMIN', 'Try force not committed')
      ).rejects.toThrow('Cannot resolve operation');
    });
  });

  describe('4. Retry Run Scoping & Creation', () => {
    it('blocks retry creation if run has unresolved RECOVERY_REQUIRED operations', async () => {
      const { run } = await setupUncertainRun();

      const scope = await recoveryService.getRetryScope(run.id);
      expect(scope.hasUnresolvedRecovery).toBe(true);
      expect(scope.canCreateRetry).toBe(false);
      expect(scope.blockingReason).toContain('remain in RECOVERY_REQUIRED status');

      await expect(recoveryService.createRetryRun(run.id, 'OP-ADMIN')).rejects.toThrow(
        'Cannot create retry run'
      );
    });

    it('creates retry run correctly after recovery resolution, setting retryOfRunId and scoping failed stays', async () => {
      const op = new BillingOperation({
        id: 'op_RUN-101_STAY-1',
        billingRunId: 'RUN-101',
        stayId: 'STAY-1',
        residentId: 'RES-1',
        residentCode: 'RC-001',
        status: 'RECOVERY_REQUIRED',
        obligationKeys: ['RENT:STAY-1:2026-08-01'],
        totalAmount: 12000,
        failureReason: 'Dispatch exception: network timeout',
        recoveryNotes: 'Check invoice in Finance',
      });

      const successOp = new BillingOperation({
        id: 'op_RUN-101_STAY-2',
        billingRunId: 'RUN-101',
        stayId: 'STAY-2',
        residentId: 'RES-2',
        residentCode: 'RC-002',
        status: 'SUCCESS',
        financialBillId: 'bill-existing-2',
      });

      const run = new BillingRun({
        id: 'RUN-101',
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        status: 'FAILED',
        operations: [op, successOp],
      });

      await runRepo.save(run);

      const claim = new BillingClaim({
        id: 'claim_1',
        obligationKey: 'RENT:STAY-1:2026-08-01',
        stayId: 'STAY-1',
        billingRunId: 'RUN-101',
        billingOperationId: 'op_RUN-101_STAY-1',
        amount: 12000,
        status: 'CLAIM_ACQUIRED',
      });
      await claimRepo.saveClaim(claim);

      // Resolve uncertain op as NOT_COMMITTED
      await recoveryService.resolveAsNotCommitted(op.id, 'OP-ADMIN', 'Confirmed no bill');

      // Now inspect retry scope
      const scope = await recoveryService.getRetryScope(run.id);
      expect(scope.hasUnresolvedRecovery).toBe(false);
      expect(scope.canCreateRetry).toBe(true);
      expect(scope.eligibleStaysCount).toBe(1);
      expect(scope.excludedStaysCount).toBe(1);

      const stay1Item = scope.stays.find((s) => s.stayId === 'STAY-1');
      expect(stay1Item?.isEligible).toBe(true);

      const stay2Item = scope.stays.find((s) => s.stayId === 'STAY-2');
      expect(stay2Item?.isEligible).toBe(false);
      expect(stay2Item?.exclusionReason).toContain('Already billed successfully');

      // Create retry run
      const retryRun = await recoveryService.createRetryRun(run.id, 'OP-ADMIN', 'Second attempt');
      expect(retryRun.retryOfRunId).toBe('RUN-101');
      expect(retryRun.status).toBe('DRAFT_PREVIEW');
      expect(retryRun.periodStart).toBe(run.periodStart);
      expect(retryRun.periodEnd).toBe(run.periodEnd);
      expect(retryRun.operations).toHaveLength(1);
      expect(retryRun.operations[0].stayId).toBe('STAY-1');
    });
  });
});
