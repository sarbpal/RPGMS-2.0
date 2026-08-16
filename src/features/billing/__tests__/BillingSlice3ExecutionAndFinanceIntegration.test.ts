import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BillingClaim,
  DiscoveredObligation,
  BillingClaimService,
  BillingDiscoveryService,
  BillingEligibilityService,
  BillingExecutionService,
  RentDiscoveryAdapter,
  ElectricityDiscoveryAdapter,
  InMemoryBillingRunRepository,
  InMemoryBillingClaimRepository,
} from '../index';
import { Stay } from '../../stay/domain/entities/Stay';
import { CommercialAgreement } from '../../stay/domain/valueObjects/CommercialAgreement';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../resident/domain/interfaces/ResidentRepository';
import type { Resident } from '../../resident/domain/entities/Resident';
import { InMemoryElectricityRepository } from '../../electricity/infrastructure/repositories/InMemoryElectricityRepository';
import { ElectricityAllocation } from '../../electricity/domain/entities/ElectricityAllocation';
import { AllocationParticipant } from '../../electricity/domain/valueObjects/AllocationParticipant';
import { InMemoryFinanceRepository } from '../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { BillingApplicationService } from '../../finance/services/billingService';
import { AccountType } from '../../finance/domain/valueObjects/AccountType';

describe('Billing Slice 3: Execution Orchestration & Finance Integration End-to-End Suite', () => {
  let runRepo: InMemoryBillingRunRepository;
  let claimRepo: InMemoryBillingClaimRepository;
  let elecRepo: InMemoryElectricityRepository;
  let financeRepo: InMemoryFinanceRepository;
  let mockStays: Map<string, Stay>;
  let mockResidents: Map<string, Resident>;
  let mockStayRepo: StayRepository;
  let mockResidentRepo: ResidentRepository;

  let rentAdapter: RentDiscoveryAdapter;
  let elecAdapter: ElectricityDiscoveryAdapter;
  let discoveryService: BillingDiscoveryService;
  let eligibilityService: BillingEligibilityService;
  let claimService: BillingClaimService;
  let financeService: BillingApplicationService;
  let executionService: BillingExecutionService;

  beforeEach(() => {
    runRepo = new InMemoryBillingRunRepository();
    claimRepo = new InMemoryBillingClaimRepository();
    elecRepo = new InMemoryElectricityRepository();
    financeRepo = new InMemoryFinanceRepository();
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

    rentAdapter = new RentDiscoveryAdapter(mockStayRepo, mockResidentRepo);
    elecAdapter = new ElectricityDiscoveryAdapter(elecRepo);

    discoveryService = new BillingDiscoveryService([rentAdapter, elecAdapter]);
    eligibilityService = new BillingEligibilityService(claimRepo);
    claimService = new BillingClaimService(claimRepo);
    financeService = new BillingApplicationService(financeRepo, mockStayRepo);

    executionService = new BillingExecutionService(
      runRepo,
      claimRepo,
      discoveryService,
      eligibilityService,
      claimService,
      financeService
    );
  });

  const setupStay = (id: string, rent: number, anchorDay: number = 1): Stay => {
    const stay = new Stay({
      id,
      residentId: `RES-${id}`,
      stayType: 'REGULAR',
      status: 'ACTIVE',
      checkInDate: '2026-08-01',
      billingAnchorDay: anchorDay,
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

  describe('1. Standard Execution & Finance Invariants', () => {
    it('Safety Test 1 & 12: One Stay with one Rent obligation creates a successful Finance Bill and commits claims', async () => {
      setupStay('STAY-101', 12000, 1);

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-101'],
      });

      await executionService.revalidateAndConfirm(run.id);
      const executed = await executionService.executeRun(run.id);

      expect(executed.status).toBe('COMPLETED');
      const op = executed.getOperationByStayId('STAY-101')!;
      expect(op.status).toBe('SUCCESS');
      expect(op.financialBillId).toBeDefined();

      // Check Finance Bill created
      const bill = financeRepo.getBills().find((b) => b.id === op.financialBillId);
      expect(bill).toBeDefined();
      expect(bill?.stayId).toBe('STAY-101');
      expect(bill?.totalAmount).toBe(12000);
      expect(bill?.billType).toBe('MONTHLY_RENT');

      // Check Ledger entries posted (Debit AR, Credit RENT_REVENUE)
      const ledgerEntries = financeRepo.getLedgerEntriesByStayId('STAY-101');
      expect(ledgerEntries).toHaveLength(2);
      expect(ledgerEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE)?.debit).toBe(12000);
      expect(ledgerEntries.find((e) => e.account === AccountType.RENT_REVENUE)?.credit).toBe(12000);

      // Check claims committed with authoritative Finance Bill ID
      const claims = await claimRepo.getClaimsByOperationId(op.id);
      expect(claims).toHaveLength(1);
      expect(claims[0].status).toBe('CLAIM_COMMITTED');
      expect(claims[0].financialReferenceId).toBe(bill?.id);
    });

    it('Safety Test 2: One Stay with multiple eligible obligations creates one consolidated Bill', async () => {
      setupStay('STAY-102', 15000, 1);

      // Custom discovery provider adding a second unbilled charge
      discoveryService.registerProvider({
        providerKey: 'ANCILLARY_PROVIDER',
        chargeType: 'OTHER',
        discoverObligations: async (stayIds) => {
          if (!stayIds.includes('STAY-102')) return [];
          return [
            new DiscoveredObligation({
              obligationKey: 'OTHER:STAY-102:SRV-01',
              stayId: 'STAY-102',
              residentId: 'RES-STAY-102',
              residentCode: 'RC-STAY-102',
              chargeType: 'OTHER',
              amount: 1500,
              businessDate: '2026-08-10',
              entryDate: '2026-08-10T00:00:00.000Z',
              description: 'Locker Rental',
              category: 'OTHER',
              commitmentStatus: 'UNCOMMITTED',
            }),
          ];
        },
      });

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-102'],
      });

      await executionService.revalidateAndConfirm(run.id);
      const executed = await executionService.executeRun(run.id);

      expect(executed.status).toBe('COMPLETED');
      const op = executed.getOperationByStayId('STAY-102')!;
      expect(op.status).toBe('SUCCESS');
      expect(op.totalAmount).toBe(16500); // 15000 Rent + 1500 Locker

      // Exactly ONE consolidated Finance Bill
      const bills = financeRepo.getBillsByStayId('STAY-102');
      expect(bills).toHaveLength(1);
      expect(bills[0].totalAmount).toBe(16500);
      expect(bills[0].lineItems).toHaveLength(2);

      // Both claims committed with same Bill ID
      const claims = await claimRepo.getClaimsByOperationId(op.id);
      expect(claims).toHaveLength(2);
      expect(claims[0].status).toBe('CLAIM_COMMITTED');
      expect(claims[1].status).toBe('CLAIM_COMMITTED');
      expect(claims[0].financialReferenceId).toBe(bills[0].id);
      expect(claims[1].financialReferenceId).toBe(bills[0].id);
    });
  });

  describe('2. Electricity Domain Boundary (Amended D-5)', () => {
    it('Safety Test 3 & 4: Confirmed Electricity + Rent results in Billing creating a Finance Bill ONLY for Rent', async () => {
      setupStay('STAY-103', 14000, 1);

      // Confirmed Electricity allocation in Electricity domain with existing Finance bill
      elecRepo.saveAllocation(
        new ElectricityAllocation({
          id: 'ALLOC-ELEC-103',
          billId: 'BILL-SUPP-103',
          flatId: 'FLAT-103',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          totalSupplierAmount: 2000,
          totalPotentialShares: 1,
          totalSelectedShares: 1,
          amountPerShare: 2000,
          remainderPaise: 0,
          status: 'CONFIRMED',
          participants: [
            new AllocationParticipant({
              id: 'PART-103',
              allocationId: 'ALLOC-ELEC-103',
              stayId: 'STAY-103',
              residentId: 'RES-STAY-103',
              residentCode: 'RC-STAY-103',
              residentNameSnapshot: 'Resident 103',
              flatId: 'FLAT-103',
              potentialShares: 1,
              selectedShares: 1,
              allocatedAmount: 2000,
              financeBillId: 'INV-ELEC-EXISTING-103',
            }),
          ],
        })
      );

      const run = await executionService.createDraftRun({
        periodStart: '2026-07-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-103'],
      });

      await executionService.revalidateAndConfirm(run.id);
      const executed = await executionService.executeRun(run.id);

      expect(executed.status).toBe('COMPLETED');
      const op = executed.getOperationByStayId('STAY-103')!;
      expect(op.status).toBe('SUCCESS');
      expect(op.totalAmount).toBe(14000); // Only Rent!

      // Verify the Finance Bill created by Billing contains only Rent
      const createdBill = financeRepo.getBills().find((b) => b.id === op.financialBillId);
      expect(createdBill?.totalAmount).toBe(14000);
      expect(createdBill?.lineItems).toHaveLength(1);
      expect(createdBill?.lineItems[0].category).toBe('RENT');

      // Verify Electricity obligation was NEVER claimed
      const allClaims = await claimRepo.listAllClaims();
      const elecClaims = allClaims.filter((c) => c.obligationKey.startsWith('ELECTRICITY:'));
      expect(elecClaims).toHaveLength(0);
    });
  });

  describe('3. Clean Finance Failure & Retry Lineage', () => {
    it('Safety Test 5 & 6: Clean Finance rejection marks operation FAILED, releases claims, and makes obligation retry eligible', async () => {
      setupStay('STAY-104', 10000, 1);

      // Force finance service failure
      vi.spyOn(financeService, 'createBill').mockReturnValueOnce({
        success: false,
        bill: null,
        errors: ['Stay account is frozen.'],
      });

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-104'],
      });

      await executionService.revalidateAndConfirm(run.id);
      const executed = await executionService.executeRun(run.id);

      expect(executed.status).toBe('FAILED');
      const op = executed.getOperationByStayId('STAY-104')!;
      expect(op.status).toBe('FAILED');
      expect(op.failureReason).toContain('Stay account is frozen');

      // Claims are RELEASED
      const claims = await claimRepo.getClaimsByOperationId(op.id);
      expect(claims).toHaveLength(1);
      expect(claims[0].status).toBe('CLAIM_RELEASED');

      // Retry run can reacquire the released claim
      const retryRun = await executionService.createRetryRun(executed.id, 'OP-ADMIN');
      await executionService.revalidateAndConfirm(retryRun.id);

      // Restore finance service to succeed on retry
      vi.restoreAllMocks();
      const retryExecuted = await executionService.executeRun(retryRun.id);

      expect(retryExecuted.status).toBe('COMPLETED');
      const retryOp = retryExecuted.getOperationByStayId('STAY-104')!;
      expect(retryOp.status).toBe('SUCCESS');
      expect(retryOp.financialBillId).toBeDefined();
    });
  });

  describe('4. Uncertain Outcomes & Recovery-Required Protection', () => {
    it('Safety Test 7, 8, 9, 10, 11: Finance exception marks RECOVERY_REQUIRED, holds claims, and blocks competing runs', async () => {
      setupStay('STAY-105', 18000, 1);

      // Simulate timeout / unhandled exception
      vi.spyOn(financeService, 'createBill').mockImplementationOnce(() => {
        throw new Error('Connection reset by peer during Finance invoice generation');
      });

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-105'],
      });

      await executionService.revalidateAndConfirm(run.id);
      const executed = await executionService.executeRun(run.id);

      expect(executed.status).toBe('FAILED');
      const op = executed.getOperationByStayId('STAY-105')!;
      expect(op.status).toBe('RECOVERY_REQUIRED');
      expect(op.failureReason).toContain('Connection reset by peer');

      // CRITICAL: Claim remains CLAIM_ACQUIRED (Held)
      const claims = await claimRepo.getClaimsByOperationId(op.id);
      expect(claims).toHaveLength(1);
      expect(claims[0].status).toBe('CLAIM_ACQUIRED');
      expect(claims[0].isActive()).toBe(true);

      // Attempting to retry automatically must be rejected
      await expect(executionService.createRetryRun(executed.id, 'OP-ADMIN')).rejects.toThrow(
        'has no retry-eligible operations'
      );

      // A competing independent Billing Run attempting to claim the same obligation is BLOCKED
      vi.restoreAllMocks();
      const competingRun = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ANOTHER',
        stayIds: ['STAY-105'],
      });
      await executionService.revalidateAndConfirm(competingRun.id);
      const competingExecuted = await executionService.executeRun(competingRun.id);

      const competingOp = competingExecuted.getOperationByStayId('STAY-105')!;
      expect(competingOp.status).toBe('CLAIM_FAILED');
      expect(competingOp.failureReason).toContain('OBLIGATION_CLAIMED_BY_COMPETING_OPERATION');
    });
  });

  describe('5. Graceful Stop Semantics', () => {
    it('Safety Test 13 & 14: Graceful stop marks pending operations NOT_PROCESSED and does not touch other operations', async () => {
      setupStay('STAY-106', 10000, 1);
      setupStay('STAY-107', 12000, 1);

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-106', 'STAY-107'],
      });

      await executionService.revalidateAndConfirm(run.id);

      // Request graceful stop prior to execution loop
      await executionService.requestStop(run.id);
      const executed = await executionService.executeRun(run.id);

      expect(executed.status).toBe('FAILED');
      expect(executed.operations[0].status).toBe('NOT_PROCESSED');
      expect(executed.operations[1].status).toBe('NOT_PROCESSED');

      // Verify no claims were acquired
      const allClaims = await claimRepo.listAllClaims();
      expect(allClaims).toHaveLength(0);
    });
  });

  describe('6. Revalidation & All-or-Nothing Concurrency', () => {
    it('Safety Test 15 & 16: Pre-dispatch revalidation excludes obligations committed after draft preview, all-or-nothing dispatch', async () => {
      setupStay('STAY-108', 11000, 1);

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-108'],
      });

      // Obligation is committed in Finance from an external source before run execution
      await claimRepo.saveClaim(
        new BillingClaim({
          id: 'CLM-EXTERNAL',
          obligationKey: 'RENT:STAY-108:2026-08-01',
          stayId: 'STAY-108',
          billingRunId: 'RUN-EXTERNAL',
          billingOperationId: 'OP-EXTERNAL',
          amount: 11000,
          status: 'CLAIM_COMMITTED',
          financialReferenceId: 'INV-EXT-999',
        })
      );

      await executionService.revalidateAndConfirm(run.id, undefined, true); // forceConfirm to bypass draft diff
      const executed = await executionService.executeRun(run.id);

      const op = executed.getOperationByStayId('STAY-108')!;
      expect(op.status).toBe('CLAIM_FAILED');
      expect(op.failureReason).toContain('OBLIGATION_ALREADY_COMMITTED_IN_FINANCE');
    });

    it('Safety Test 17 & 18: Retry creates new run lineage and run aggregation correctly resolves mixed outcomes', async () => {
      setupStay('STAY-109', 10000, 1);
      setupStay('STAY-110', 12000, 1);

      // STAY-109 fails, STAY-110 succeeds
      vi.spyOn(financeService, 'createBill')
        .mockReturnValueOnce({
          success: false,
          bill: null,
          errors: ['Stay 109 blocked'],
        })
        .mockReturnValueOnce({
          success: true,
          bill: {
            id: 'BILL-110',
            stayId: 'STAY-110',
            billNumber: 'INV-202608-0110',
            billType: 'MONTHLY_RENT',
            period: '2026-08',
            issueDate: '2026-08-01',
            dueDate: '2026-08-07',
            lineItems: [],
            totalAmount: 12000,
            paidAmount: 0,
            balanceAmount: 12000,
            status: 'UNPAID',
            createdAt: '2026-08-01',
            updatedAt: '2026-08-01',
          },
          errors: [],
        });

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-109', 'STAY-110'],
      });

      await executionService.revalidateAndConfirm(run.id);
      const executed = await executionService.executeRun(run.id);

      // PARTIALLY_COMPLETED aggregation
      expect(executed.status).toBe('PARTIALLY_COMPLETED');
      expect(executed.successfulOperationsCount).toBe(1);
      expect(executed.failedOperationsCount).toBe(1);

      // Retry run
      const retryRun = await executionService.createRetryRun(executed.id, 'OP-ADMIN');
      expect(retryRun.retryOfRunId).toBe(executed.id);
      expect(retryRun.operations).toHaveLength(1);
      expect(retryRun.operations[0].stayId).toBe('STAY-109');
    });
  });

  describe('7. Isolation & Architectural Non-Coupling', () => {
    it('Safety Test 19 & 20: Billing contains zero direct LedgerApplicationService or direct FinanceRepository writes', async () => {
      setupStay('STAY-111', 13000, 1);

      const postEntriesSpy = vi.spyOn(financeService['ledgerService'], 'postEntries');

      const run = await executionService.createDraftRun({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-ADMIN',
        stayIds: ['STAY-111'],
      });

      await executionService.revalidateAndConfirm(run.id);
      await executionService.executeRun(run.id);

      // Billing called BillingApplicationService.createBill(), which internally called postEntries
      // Billing itself did NOT directly invoke ledgerService.postEntries()
      expect(postEntriesSpy).toHaveBeenCalledTimes(1);
    });
  });
});
