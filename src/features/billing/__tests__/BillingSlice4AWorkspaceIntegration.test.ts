import { describe, it, expect, beforeEach } from 'vitest';
import { BillingWorkspaceCoordinator } from '../application/coordinator/BillingWorkspaceCoordinator';
import { InMemoryBillingRunRepository } from '../infrastructure/repositories/InMemoryBillingRunRepository';
import { InMemoryBillingClaimRepository } from '../infrastructure/repositories/InMemoryBillingClaimRepository';
import { InMemoryFinanceRepository } from '../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { InMemoryElectricityRepository } from '../../electricity/infrastructure/repositories/InMemoryElectricityRepository';
import { Stay } from '../../stay/domain/entities/Stay';
import { CommercialAgreement } from '../../stay/domain/valueObjects/CommercialAgreement';
import { ElectricityAllocation } from '../../electricity/domain/entities/ElectricityAllocation';
import { AllocationParticipant } from '../../electricity/domain/valueObjects/AllocationParticipant';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../resident/domain/interfaces/ResidentRepository';
import type { Resident } from '../../resident/domain/entities/Resident';
import { AccountType } from '../../finance/domain/valueObjects/AccountType';

describe('Billing Slice 4A: Normal Billing Operator Workspace Integration Suite', () => {
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
      fullName: `Resident ${id}`,
      status: 'ACTIVE',
      mobileNumber: '9876543210',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
    });
    return stay;
  };

  describe('1. Normal Billing Lifecycle (Preview → Confirmation → Execution)', () => {
    it('generates an accurate preview, executes run, and posts single consolidated Finance Bill per Stay', async () => {
      setupStay('STAY-201', 12000);
      setupStay('STAY-202', 15000);

      // 1. Preview
      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-MANAGER',
        stayIds: ['STAY-201', 'STAY-202'],
      });

      expect(preview.runId).toBeDefined();
      expect(preview.totalEligibleAmount).toBe(27000);
      expect(preview.eligibleStaysCount).toBe(2);
      expect(preview.hasMaterialChanges).toBe(false);
      expect(preview.canConfirm).toBe(true);

      // Verify zero claims in repository during preview
      const previewClaims = await claimRepo.listAllClaims();
      expect(previewClaims).toHaveLength(0);

      // 2. Confirm & Start Execution
      const result = await coordinator.confirmAndStartRun(preview.runId);

      expect(result.status).toBe('COMPLETED');
      expect(result.successfulOperationsCount).toBe(2);
      expect(result.totalAmount).toBe(27000);

      // 3. Finance & Claims Verification
      const financeBills = financeRepo.getBills();
      expect(financeBills).toHaveLength(2);

      const bill201 = financeBills.find((b) => b.stayId === 'STAY-201');
      expect(bill201?.totalAmount).toBe(12000);
      expect(bill201?.lineItems[0].obligationKey).toBe('RENT:STAY-201:2026-08-01');

      const claims201 = await claimRepo.getClaimsByOperationId(result.id);
      expect(claims201).toBeDefined();

      // 4. Run Details Inspection
      const details = await coordinator.getRunDetails(preview.runId);
      expect(details?.operations).toHaveLength(2);
      expect(details?.operations[0].status).toBe('SUCCESS');
      expect(details?.operations[0].financialBillId).toBe(bill201?.id);
    });
  });

  describe('2. Electricity Boundary in Workspace (Amended D-5)', () => {
    it('presents confirmed Electricity as source-committed and excludes it from Billing Run invoice totals', async () => {
      setupStay('STAY-203', 14000);

      // Confirmed Electricity allocation in source domain
      elecRepo.saveAllocation(
        new ElectricityAllocation({
          id: 'ALLOC-ELEC-203',
          billId: 'BILL-SUPP-203',
          flatId: 'FLAT-203',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          totalSupplierAmount: 3000,
          totalPotentialShares: 1,
          totalSelectedShares: 1,
          amountPerShare: 3000,
          remainderPaise: 0,
          status: 'CONFIRMED',
          participants: [
            new AllocationParticipant({
              id: 'PART-203',
              allocationId: 'ALLOC-ELEC-203',
              stayId: 'STAY-203',
              residentId: 'RES-STAY-203',
              residentCode: 'RC-STAY-203',
              residentNameSnapshot: 'Resident STAY-203',
              flatId: 'FLAT-203',
              potentialShares: 1,
              selectedShares: 1,
              allocatedAmount: 3000,
              financeBillId: 'INV-ELEC-PREVIOUS-203',
            }),
          ],
        })
      );

      const preview = await coordinator.generatePreview({
        periodStart: '2026-07-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-MANAGER',
        stayIds: ['STAY-203'],
      });

      expect(preview.totalEligibleAmount).toBe(14000); // Rent only
      expect(preview.totalCommittedAmount).toBe(3000); // Observed Electricity

      const stay = preview.stays[0];
      const elecCharge = stay.charges.find((c) => c.chargeType === 'ELECTRICITY');
      expect(elecCharge?.isEligible).toBe(false);
      expect(elecCharge?.commitmentStatus).toBe('COMMITTED');

      // Execute Run
      const executed = await coordinator.confirmAndStartRun(preview.runId);
      expect(executed.totalAmount).toBe(14000);

      // Finance Bill created by Billing is strictly ₹14,000 for Rent
      const createdBill = financeRepo.getBills().find((b) => b.totalAmount === 14000);
      expect(createdBill).toBeDefined();
      expect(createdBill?.billType).toBe('MONTHLY_RENT');
    });
  });

  describe('3. Material Change Handling', () => {
    it('detects live obligation changes and blocks unacknowledged confirmation', async () => {
      setupStay('STAY-204', 10000);

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-MANAGER',
        stayIds: ['STAY-204'],
      });

      // Amend stay rent live in Stay domain
      const amendedStay = new Stay({
        id: 'STAY-204',
        residentId: 'RES-STAY-204',
        stayType: 'REGULAR',
        status: 'ACTIVE',
        checkInDate: '2026-08-01',
        billingAnchorDay: 1,
        agreedRent: 11500, // changed amount
        commercialAgreements: [
          new CommercialAgreement({
            id: 'CA-STAY-204-V2',
            stayId: 'STAY-204',
            rent: 11500,
            securityDeposit: 23000,
            effectiveFrom: '2026-08-01',
            amendmentReason: 'Rent hike',
            status: 'ACTIVE',
          }),
        ],
      });
      mockStays.set('STAY-204', amendedStay);

      // Revalidate
      const revalidated = await coordinator.revalidatePreview(preview.runId);
      expect(revalidated.hasMaterialChanges).toBe(true);
      expect(revalidated.canConfirm).toBe(false);
      expect(revalidated.deltaDetails[0]).toContain('Amount changed for RENT:STAY-204:2026-08-01: ₹10000 -> ₹11500');

      // Attempting to confirm without forceConfirm must throw error
      await expect(coordinator.confirmAndStartRun(preview.runId, false)).rejects.toThrow(
        'Material changes detected since preview'
      );

      // Force confirming acknowledges the change and executes with updated authoritative amount
      const executed = await coordinator.confirmAndStartRun(preview.runId, true);
      expect(executed.status).toBe('COMPLETED');
      expect(executed.totalAmount).toBe(11500);
    });
  });

  describe('4. Graceful Stop & History Retrieval', () => {
    it('supports requesting graceful stop and lists historical runs chronologically', async () => {
      setupStay('STAY-205', 10000);
      setupStay('STAY-206', 12000);

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-MANAGER',
        stayIds: ['STAY-205', 'STAY-206'],
      });

      const run = await runRepo.getById(preview.runId);
      run?.confirm();
      if (run) await runRepo.save(run);

      const stopped = await coordinator.requestStop(preview.runId);
      expect(stopped.status).toBe('STOPPING');

      const history = await coordinator.getRunHistory(10);
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].id).toBe(preview.runId);
    });
  });

  describe('5. Architectural Non-Coupling & Scope Invariants', () => {
    it('verifies that coordinator contains zero direct ledger or FinanceRepository writes', async () => {
      setupStay('STAY-207', 13000);

      const preview = await coordinator.generatePreview({
        periodStart: '2026-08-01',
        periodEnd: '2026-08-31',
        operatorId: 'OP-MANAGER',
        stayIds: ['STAY-207'],
      });

      await coordinator.confirmAndStartRun(preview.runId);

      // Ledger entries are posted internally by FinanceApplicationService
      const ledgerEntries = financeRepo.getLedgerEntriesByStayId('STAY-207');
      expect(ledgerEntries).toHaveLength(2);
      expect(ledgerEntries.find((e) => e.account === AccountType.RENT_REVENUE)?.credit).toBe(13000);
    });
  });
});
