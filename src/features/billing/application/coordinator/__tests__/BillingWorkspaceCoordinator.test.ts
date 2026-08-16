import { describe, it, expect, beforeEach } from 'vitest';
import { BillingWorkspaceCoordinator } from '../BillingWorkspaceCoordinator';
import { InMemoryBillingRunRepository } from '../../../infrastructure/repositories/InMemoryBillingRunRepository';
import { InMemoryBillingClaimRepository } from '../../../infrastructure/repositories/InMemoryBillingClaimRepository';
import { InMemoryFinanceRepository } from '../../../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { InMemoryElectricityRepository } from '../../../../electricity/infrastructure/repositories/InMemoryElectricityRepository';
import { Stay } from '../../../../stay/domain/entities/Stay';
import { CommercialAgreement } from '../../../../stay/domain/valueObjects/CommercialAgreement';
import { ElectricityAllocation } from '../../../../electricity/domain/entities/ElectricityAllocation';
import { AllocationParticipant } from '../../../../electricity/domain/valueObjects/AllocationParticipant';
import type { StayRepository } from '../../../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../../../resident/domain/interfaces/ResidentRepository';
import type { Resident } from '../../../../resident/domain/entities/Resident';

describe('BillingWorkspaceCoordinator', () => {
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
      fullName: `Resident Name ${id}`,
      status: 'ACTIVE',
      mobileNumber: '9876543210',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    });
    return stay;
  };

  describe('1. Workspace Summary & Metrics', () => {
    it('returns empty dashboard summary when no runs exist', async () => {
      const summary = await coordinator.getWorkspaceSummary();
      expect(summary.totalRunsCount).toBe(0);
      expect(summary.activeRun).toBeNull();
      expect(summary.totalAmountBilledAllTime).toBe(0);
    });

    it('returns accurate aggregation across historical runs', async () => {
      setupStay('STAY-1', 10000);
      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-1'],
      });

      await coordinator.confirmAndStartRun(preview.runId);

      const summary = await coordinator.getWorkspaceSummary();
      expect(summary.totalRunsCount).toBe(1);
      expect(summary.completedRunsCount).toBe(1);
      expect(summary.totalAmountBilledAllTime).toBe(10000);
      expect(summary.recentRuns).toHaveLength(1);
    });
  });

  describe('2. Preview Generation & Revalidation', () => {
    it('generates a full preview with stay-level and charge-level breakdown', async () => {
      setupStay('STAY-101', 12000);

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-101'],
      });

      expect(preview.runId).toBeDefined();
      expect(preview.totalEligibleAmount).toBe(12000);
      expect(preview.affectedStaysCount).toBe(1);
      expect(preview.stays).toHaveLength(1);

      const stayPreview = preview.stays[0];
      expect(stayPreview.stayId).toBe('STAY-101');
      expect(stayPreview.residentName).toBe('Resident Name STAY-101');
      expect(stayPreview.status).toBe('BILLABLE');
      expect(stayPreview.charges).toHaveLength(1);
      expect(stayPreview.charges[0].amount).toBe(12000);
      expect(stayPreview.charges[0].isEligible).toBe(true);
    });

    it('distinguishes confirmed Electricity as ALREADY_COMMITTED and excludes it from eligible amount', async () => {
      setupStay('STAY-102', 15000);

      // Save confirmed electricity allocation
      elecRepo.saveAllocation(
        new ElectricityAllocation({
          id: 'ALLOC-ELEC-102',
          billId: 'BILL-SUPP-102',
          flatId: 'FLAT-102',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          totalSupplierAmount: 2500,
          totalPotentialShares: 1,
          totalSelectedShares: 1,
          amountPerShare: 2500,
          remainderPaise: 0,
          status: 'CONFIRMED',
          participants: [
            new AllocationParticipant({
              id: 'PART-102',
              allocationId: 'ALLOC-ELEC-102',
              stayId: 'STAY-102',
              residentId: 'RES-STAY-102',
              residentCode: 'RC-STAY-102',
              residentNameSnapshot: 'Resident Name STAY-102',
              flatId: 'FLAT-102',
              potentialShares: 1,
              selectedShares: 1,
              allocatedAmount: 2500,
              financeBillId: 'INV-ELEC-EXISTING',
            }),
          ],
        })
      );

      const preview = await coordinator.generatePreview({
        periodStart: '2026-07-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-102'],
      });

      expect(preview.totalEligibleAmount).toBe(15000); // Only Rent
      expect(preview.totalCommittedAmount).toBe(2500); // Electricity observed
      expect(preview.totalDiscoveredAmount).toBe(17500);

      const stayPreview = preview.stays[0];
      expect(stayPreview.charges).toHaveLength(2);

      const rentCharge = stayPreview.charges.find((c) => c.chargeType === 'RENT');
      const elecCharge = stayPreview.charges.find((c) => c.chargeType === 'ELECTRICITY');

      expect(rentCharge?.isEligible).toBe(true);
      expect(elecCharge?.isEligible).toBe(false);
      expect(elecCharge?.commitmentStatus).toBe('COMMITTED');
    });
  });

  describe('3. Execution & Graceful Stop', () => {
    it('executes a confirmed run and returns completed summary', async () => {
      setupStay('STAY-103', 14000);

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-103'],
      });

      const result = await coordinator.confirmAndStartRun(preview.runId);

      expect(result.status).toBe('COMPLETED');
      expect(result.successfulOperationsCount).toBe(1);
      expect(result.totalAmount).toBe(14000);

      // Verify run details
      const details = await coordinator.getRunDetails(preview.runId);
      expect(details).not.toBeNull();
      expect(details?.operations).toHaveLength(1);
      expect(details?.operations[0].status).toBe('SUCCESS');
      expect(details?.operations[0].financialBillId).toBeDefined();
    });

    it('requests graceful stop and updates run state', async () => {
      setupStay('STAY-104', 11000);
      setupStay('STAY-105', 12000);

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-104', 'STAY-105'],
      });

      const reval = await coordinator.revalidatePreview(preview.runId);
      expect(reval.canConfirm).toBe(true);

      // Stop confirmed run
      const stoppedSummary = await coordinator.requestStop(preview.runId);
      expect(stoppedSummary.status).toBe('STOPPING');
    });
  });

  describe('4. Recovery & Retry Coordination', () => {
    it('inspects and resolves recovery operations, and creates retry runs', async () => {
      setupStay('STAY-106', 15000);

      // Create run with an uncertain operation
      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-01',
        stayIds: ['STAY-106'],
      });

      const run = await runRepo.getById(preview.runId);
      const op = run?.operations[0];
      op?.markRecoveryRequired('Network timeout during dispatch');
      if (run) await runRepo.save(run);

      // 1. Coordinator lists unresolved recovery operations
      const unresolved = await coordinator.getUnresolvedRecoveryOperations();
      expect(unresolved).toHaveLength(1);
      expect(unresolved[0].id).toBe(op?.id);

      // 2. Inspect evidence (NOT_COMMITTED)
      const evidence = await coordinator.inspectRecoveryEvidence(op!.id);
      expect(evidence.assessment).toBe('NOT_COMMITTED');

      // 3. Resolve as NOT_COMMITTED
      const resolved = await coordinator.resolveRecoveryAsNotCommitted(
        op!.id,
        'OP-ADMIN',
        'Invoice was not created in Finance'
      );
      expect(resolved.status).toBe('FAILED');

      // 4. Inspect retry scope
      const scope = await coordinator.getRetryScope(preview.runId);
      expect(scope.canCreateRetry).toBe(true);
      expect(scope.eligibleStaysCount).toBe(1);

      // 5. Create Retry Run
      const retryPreview = await coordinator.createRetryRun(preview.runId, 'OP-ADMIN', 'Second cycle');
      expect(retryPreview.runId).toContain('RUN-RETRY-');
      expect(retryPreview.eligibleStaysCount).toBe(1);
    });
  });
});
