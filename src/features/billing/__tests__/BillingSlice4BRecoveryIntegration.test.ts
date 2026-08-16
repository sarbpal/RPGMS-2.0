import { describe, it, expect, beforeEach } from 'vitest';
import { BillingWorkspaceCoordinator } from '../application/coordinator/BillingWorkspaceCoordinator';
import { InMemoryBillingRunRepository } from '../infrastructure/repositories/InMemoryBillingRunRepository';
import { InMemoryBillingClaimRepository } from '../infrastructure/repositories/InMemoryBillingClaimRepository';
import { InMemoryFinanceRepository } from '../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { InMemoryElectricityRepository } from '../../electricity/infrastructure/repositories/InMemoryElectricityRepository';
import { BillingClaim } from '../domain/entities/BillingClaim';
import { financeStorage } from '../../finance/storage/financeStorage';
import { Stay } from '../../stay/domain/entities/Stay';
import { CommercialAgreement } from '../../stay/domain/valueObjects/CommercialAgreement';
import { ElectricityAllocation } from '../../electricity/domain/entities/ElectricityAllocation';
import { AllocationParticipant } from '../../electricity/domain/valueObjects/AllocationParticipant';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../resident/domain/interfaces/ResidentRepository';
import type { Resident } from '../../resident/domain/entities/Resident';
import { AccountType } from '../../finance/domain/valueObjects/AccountType';
import { LedgerReferenceType } from '../../finance/domain/valueObjects/LedgerReferenceType';

describe('Billing Slice 4B: Recovery & Retry Workbench Integration Suite', () => {
  let runRepo: InMemoryBillingRunRepository;
  let claimRepo: InMemoryBillingClaimRepository;
  let financeRepo: InMemoryFinanceRepository;
  let elecRepo: InMemoryElectricityRepository;
  let mockStays: Map<string, Stay>;
  let mockResidents: Map<string, Resident>;
  let mockStayRepo: StayRepository;
  let mockResidentRepo: ResidentRepository;
  let coordinator: BillingWorkspaceCoordinator;

  beforeEach(() => {
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredLedgerEntries([]);
    runRepo = new InMemoryBillingRunRepository();
    claimRepo = new InMemoryBillingClaimRepository();
    financeRepo = new InMemoryFinanceRepository();
    elecRepo = new InMemoryElectricityRepository();
    mockStays = new Map();
    mockResidents = new Map();

    mockStayRepo = {
      findById: async (id: string) => mockStays.get(id) || null,
      findByIdSync: (id: string) => mockStays.get(id) || null,
      getAllSync: () => Array.from(mockStays.values()),
      findByResidentId: async (resId: string) =>
        Array.from(mockStays.values()).filter((s) => s.residentId === resId),
      findActiveByResidentId: async (resId: string) =>
        Array.from(mockStays.values()).find((s) => s.residentId === resId && s.status === 'ACTIVE') || null,
      save: async (stay: Stay) => {
        mockStays.set(stay.id, stay);
        return stay;
      },
      update: async (stay: Stay) => {
        mockStays.set(stay.id, stay);
        return stay;
      },
      delete: async () => {},
      findStaysByFlatAndPeriodOverlap: async () => [],
      findStaysByFlatAndPeriodOverlapSync: () => [],
    };

    mockResidentRepo = {
      getById: async (id: string) => mockResidents.get(id) || null,
      getByIdSync: (id: string) => mockResidents.get(id) || null,
      getAll: async () => Array.from(mockResidents.values()),
      getAllSync: () => Array.from(mockResidents.values()),
      search: async () => [],
      save: async (r: Resident) => {
        mockResidents.set(r.id, r);
        return r;
      },
      update: async (r: Resident) => {
        mockResidents.set(r.id, r);
        return r;
      },
      delete: async () => {},
    };

    coordinator = new BillingWorkspaceCoordinator(
      runRepo,
      claimRepo,
      mockStayRepo,
      mockResidentRepo,
      elecRepo,
      financeRepo
    );
  });

  const setupStay = (id: string, rent: number): Stay => {
    const stay = new Stay({
      id,
      residentId: `RES-${id}`,
      stayType: 'REGULAR',
      status: 'ACTIVE',
      checkInDate: '2026-08-01',
      billingAnchorDay: 1,
      agreedRent: rent,
      commercialAgreements: [
        new CommercialAgreement({
          id: `CA-${id}`,
          stayId: id,
          rent,
          securityDeposit: rent * 2,
          effectiveFrom: '2026-08-01',
          amendmentReason: 'Initial agreement',
          status: 'ACTIVE',
        }),
      ],
    });
    mockStays.set(id, stay);
    mockResidents.set(`RES-${id}`, {
      id: `RES-${id}`,
      residentCode: `RC-${id}`,
      fullName: `Resident ${id}`,
      status: 'ACTIVE',
      mobileNumber: '9876543210',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    });
    return stay;
  };

  describe('1. Uncertain Dispatch & Recovery Requirement', () => {
    it('retains CLAIM_ACQUIRED when dispatch outcome is uncertain (RECOVERY_REQUIRED)', async () => {
      setupStay('STAY-301', 12000);

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-301'],
      });

      const run = await runRepo.getById(preview.runId);
      const op = run?.operations[0];
      op?.markRecoveryRequired('Network timeout during Finance dispatch', 'Check invoice in Finance');
      if (run) await runRepo.save(run);

      // Acquire claim
      await claimRepo.saveClaim(
        new BillingClaim({
          id: 'claim_301',
          obligationKey: 'RENT:STAY-301:2026-08-01',
          stayId: 'STAY-301',
          billingRunId: preview.runId,
          billingOperationId: op!.id,
          amount: 12000,
          status: 'CLAIM_ACQUIRED',
          claimedAt: new Date().toISOString(),
        })
      );

      // Claims remain held (CLAIM_ACQUIRED)
      const claims = await claimRepo.getClaimsByOperationId(op!.id);
      expect(claims).toHaveLength(1);
      expect(claims[0].status).toBe('CLAIM_ACQUIRED');
      expect(claims[0].isActive()).toBe(true);

      // Unresolved recovery operation is discovered by coordinator
      const recoveryOps = await coordinator.getUnresolvedRecoveryOperations();
      expect(recoveryOps).toHaveLength(1);
      expect(recoveryOps[0].id).toBe(op!.id);
    });
  });

  describe('2. Evidence Inspection & Conclusive resolveAsCommitted', () => {
    it('correlates active Finance Bill + balanced ledger, resolves as COMMITTED, commits claims, and bars retry', async () => {
      setupStay('STAY-302', 14000);

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-302'],
      });

      const run = await runRepo.getById(preview.runId);
      const op = run?.operations[0];
      op?.markClaimed(['RENT:STAY-302:2026-08-01'], 14000);
      op?.markRecoveryRequired('Gateway timeout during createBill');
      if (run) await runRepo.save(run);

      // Claim held
      await claimRepo.saveClaim(
        new BillingClaim({
          id: 'claim_302',
          obligationKey: 'RENT:STAY-302:2026-08-01',
          stayId: 'STAY-302',
          billingRunId: preview.runId,
          billingOperationId: op!.id,
          amount: 14000,
          status: 'CLAIM_ACQUIRED',
          claimedAt: new Date().toISOString(),
        })
      );

      // Setup Finance authoritative commitment
      const financeBill = financeRepo.saveBill({
        id: 'bill-302',
        stayId: 'STAY-302',
        billNumber: 'INV-202608-0302',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        totalAmount: 14000,
        paidAmount: 0,
        balanceAmount: 14000,
        status: 'UNPAID',
        lineItems: [
          {
            id: 'li-302',
            description: 'Monthly Rent',
            amount: 14000,
            category: 'RENT',
            obligationKey: 'RENT:STAY-302:2026-08-01',
          },
        ],
        remarks: `Billing Run ${preview.runId} - Stay STAY-302`,
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      });

      financeRepo.saveLedgerEntries([
        {
          id: 'led-302-1',
          stayId: 'STAY-302',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: LedgerReferenceType.BILL,
          referenceId: financeBill.id,
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 14000,
          credit: 0,
          remarks: 'Invoice INV-202608-0302',
          createdBy: 'BILLING_ENGINE',
          createdAt: '2026-08-01T00:00:00.000Z',
        },
        {
          id: 'led-302-2',
          stayId: 'STAY-302',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: LedgerReferenceType.BILL,
          referenceId: financeBill.id,
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 14000,
          remarks: 'Revenue recognition',
          createdBy: 'BILLING_ENGINE',
          createdAt: '2026-08-01T00:00:00.000Z',
        },
      ]);

      // 1. Evidence inspection verifies COMMITTED
      const evidence = await coordinator.inspectRecoveryEvidence(op!.id);
      expect(evidence.assessment).toBe('COMMITTED');
      expect(evidence.recommendedAction).toBe('RESOLVE_COMMITTED');
      expect(evidence.recommendedBillId).toBe('bill-302');

      // 2. Resolve as COMMITTED
      const resolved = await coordinator.resolveRecoveryAsCommitted(
        op!.id,
        'bill-302',
        'OP-AUDITOR',
        'Verified in ledger'
      );
      expect(resolved.status).toBe('SUCCESS');
      expect(resolved.financialBillId).toBe('bill-302');

      // 3. Claims are COMMITTED
      const claim = await claimRepo.getClaimByObligationKey('RENT:STAY-302:2026-08-01');
      expect(claim?.status).toBe('CLAIM_COMMITTED');
      expect(claim?.financialReferenceId).toBe('bill-302');

      // 4. Retry Scope strictly EXCLUDES this resolved operation
      const retryScope = await coordinator.getRetryScope(preview.runId);
      expect(retryScope.canCreateRetry).toBe(false); // No eligible stays left
      expect(retryScope.stays[0].isEligible).toBe(false);
      expect(retryScope.stays[0].exclusionReason).toContain('Already billed successfully');
    });
  });

  describe('3. Evidence Inspection & Conclusive resolveAsNotCommitted', () => {
    it('verifies zero Finance evidence, resolves as NOT_COMMITTED, releases claims, and enables retry', async () => {
      setupStay('STAY-303', 11000);

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-303'],
      });

      const run = await runRepo.getById(preview.runId);
      const op = run?.operations[0];
      op?.markClaimed(['RENT:STAY-303:2026-08-01'], 11000);
      op?.markRecoveryRequired('Network drop before Finance connection');
      if (run) await runRepo.save(run);

      // Claim held
      await claimRepo.saveClaim(
        new BillingClaim({
          id: 'claim_303',
          obligationKey: 'RENT:STAY-303:2026-08-01',
          stayId: 'STAY-303',
          billingRunId: preview.runId,
          billingOperationId: op!.id,
          amount: 11000,
          status: 'CLAIM_ACQUIRED',
          claimedAt: new Date().toISOString(),
        })
      );

      // 1. Evidence inspection verifies NOT_COMMITTED
      const evidence = await coordinator.inspectRecoveryEvidence(op!.id);
      expect(evidence.assessment).toBe('NOT_COMMITTED');
      expect(evidence.recommendedAction).toBe('RESOLVE_NOT_COMMITTED');

      // 2. Resolve as NOT_COMMITTED
      const resolved = await coordinator.resolveRecoveryAsNotCommitted(
        op!.id,
        'OP-AUDITOR',
        'Finance database has no record of this bill'
      );
      expect(resolved.status).toBe('FAILED');
      expect(resolved.failureReason).toBe('Finance database has no record of this bill');

      // 3. Claims are RELEASED
      const claim = await claimRepo.getClaimByObligationKey('RENT:STAY-303:2026-08-01');
      expect(claim?.status).toBe('CLAIM_RELEASED');

      // 4. Retry Scope includes this stay
      const retryScope = await coordinator.getRetryScope(preview.runId);
      expect(retryScope.canCreateRetry).toBe(true);
      expect(retryScope.eligibleStaysCount).toBe(1);
      expect(retryScope.stays[0].isEligible).toBe(true);

      // 5. Create Retry Run
      const retryPreview = await coordinator.createRetryRun(preview.runId, 'OP-ADMIN', 'Second cycle');
      expect(retryPreview.runId).toContain('RUN-RETRY-');
      expect(retryPreview.eligibleStaysCount).toBe(1);

      // Execute Retry Run successfully
      const retryResult = await coordinator.confirmAndStartRun(retryPreview.runId);
      expect(retryResult.status).toBe('COMPLETED');
      expect(retryResult.totalAmount).toBe(11000);

      // Exactly ONE bill now exists in Finance
      const bills = financeRepo.getBillsByStayId('STAY-303');
      expect(bills).toHaveLength(1);
      expect(bills[0].totalAmount).toBe(11000);
    });
  });

  describe('4. Inconclusive Evidence (UNKNOWN) Protection', () => {
    it('prevents resolving as NOT_COMMITTED when Finance evidence is UNKNOWN/incomplete', async () => {
      setupStay('STAY-304', 16000);

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-304'],
      });

      const run = await runRepo.getById(preview.runId);
      const op = run?.operations[0];
      op?.markClaimed(['RENT:STAY-304:2026-08-01'], 16000);
      op?.markRecoveryRequired('Timeout error');
      if (run) await runRepo.save(run);

      // Setup a bill with MISMATCHED amount (incomplete write)
      financeRepo.saveBill({
        id: 'bill-incomplete-304',
        stayId: 'STAY-304',
        billNumber: 'INV-202608-0304',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        totalAmount: 8000, // Mismatched amount!
        paidAmount: 0,
        balanceAmount: 8000,
        status: 'UNPAID',
        lineItems: [
          {
            id: 'li-304',
            description: 'Partial Rent',
            amount: 8000,
            category: 'RENT',
            obligationKey: 'RENT:STAY-304:2026-08-01',
          },
        ],
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      });

      // Evidence inspection returns UNKNOWN
      const evidence = await coordinator.inspectRecoveryEvidence(op!.id);
      expect(evidence.assessment).toBe('UNKNOWN');
      expect(evidence.recommendedAction).toBe('MANUAL_INVESTIGATION_REQUIRED');

      // Attempting to resolve as NOT_COMMITTED is strictly rejected
      await expect(
        coordinator.resolveRecoveryAsNotCommitted(op!.id, 'OP-ADMIN', 'Trying to force')
      ).rejects.toThrow('Force-resolving uncertain or committed outcomes is prohibited');

      // Attempting to resolve as COMMITTED is strictly rejected
      await expect(
        coordinator.resolveRecoveryAsCommitted(op!.id, 'bill-incomplete-304', 'OP-ADMIN', 'Notes')
      ).rejects.toThrow('Evidence assessment is \'UNKNOWN\'');
    });
  });

  describe('5. Confirmed Electricity Boundary (Amended D-5)', () => {
    it('ensures confirmed Electricity allocations remain strictly outside Billing recovery', async () => {
      setupStay('STAY-305', 13000);

      // Confirmed Electricity allocation in source domain
      elecRepo.saveAllocation(
        new ElectricityAllocation({
          id: 'ALLOC-ELEC-305',
          billId: 'BILL-SUPP-305',
          flatId: 'FLAT-305',
          periodStart: '2026-08-01',
          periodEnd: '2026-08-31',
          totalSupplierAmount: 2500,
          totalPotentialShares: 1,
          totalSelectedShares: 1,
          amountPerShare: 2500,
          remainderPaise: 0,
          status: 'CONFIRMED',
          participants: [
            new AllocationParticipant({
              id: 'PART-305',
              allocationId: 'ALLOC-ELEC-305',
              stayId: 'STAY-305',
              residentId: 'RES-STAY-305',
              residentCode: 'RC-STAY-305',
              residentNameSnapshot: 'Resident STAY-305',
              flatId: 'FLAT-305',
              potentialShares: 1,
              selectedShares: 1,
              allocatedAmount: 2500,
              financeBillId: 'INV-ELEC-CONFIRMED-305',
            }),
          ],
        })
      );

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-305'],
      });

      // Preview only includes uncommitted Rent (₹13,000) as billable
      expect(preview.totalEligibleAmount).toBe(13000);
      expect(preview.totalCommittedAmount).toBe(2500);

      // Simulate Rent failure
      const run = await runRepo.getById(preview.runId);
      const op = run?.operations[0];
      op?.markFailed('Rent calculation failure');
      if (run) await runRepo.save(run);

      // Retry run only targets Rent; Electricity remains untouched
      const retryPreview = await coordinator.createRetryRun(preview.runId, 'OP-ADMIN');
      expect(retryPreview.totalEligibleAmount).toBe(13000);
      expect(retryPreview.totalCommittedAmount).toBe(2500);
    });
  });
});
