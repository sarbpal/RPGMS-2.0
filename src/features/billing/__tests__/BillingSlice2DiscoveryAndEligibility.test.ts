import { describe, it, expect, beforeEach } from 'vitest';
import {
  BillingDiscoveryService,
  BillingEligibilityService,
  BillingClaimService,
  InMemoryBillingClaimRepository,
  RentDiscoveryAdapter,
  ElectricityDiscoveryAdapter,
} from '../index';
import { Stay } from '../../stay/domain/entities/Stay';
import { CommercialAgreement } from '../../stay/domain/valueObjects/CommercialAgreement';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import type { ResidentRepository } from '../../resident/domain/interfaces/ResidentRepository';
import type { Resident } from '../../resident/domain/entities/Resident';
import { InMemoryElectricityRepository } from '../../electricity/infrastructure/repositories/InMemoryElectricityRepository';
import { ElectricityAllocation } from '../../electricity/domain/entities/ElectricityAllocation';
import { AllocationParticipant } from '../../electricity/domain/valueObjects/AllocationParticipant';

describe('Billing Slice 2: Discovery & Eligibility Foundation End-to-End Suite', () => {
  let claimRepo: InMemoryBillingClaimRepository;
  let elecRepo: InMemoryElectricityRepository;
  let mockStays: Map<string, Stay>;
  let mockResidents: Map<string, Resident>;
  let mockStayRepo: StayRepository;
  let mockResidentRepo: ResidentRepository;

  let rentAdapter: RentDiscoveryAdapter;
  let elecAdapter: ElectricityDiscoveryAdapter;
  let discoveryService: BillingDiscoveryService;
  let eligibilityService: BillingEligibilityService;
  let claimService: BillingClaimService;

  beforeEach(() => {
    claimRepo = new InMemoryBillingClaimRepository();
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

    rentAdapter = new RentDiscoveryAdapter(mockStayRepo, mockResidentRepo);
    elecAdapter = new ElectricityDiscoveryAdapter(elecRepo);

    discoveryService = new BillingDiscoveryService([
      rentAdapter,
      elecAdapter,
    ]);

    eligibilityService = new BillingEligibilityService(claimRepo);
    claimService = new BillingClaimService(claimRepo);
  });

  describe('1. Generic Multi-Domain Discovery Contract', () => {
    it('discovers obligations across Rent and Electricity domains concurrently for target stays', async () => {
      // 1. Setup Stay and Resident for Rent
      const stay1 = new Stay({
        id: 'STAY-1',
        residentId: 'RES-1',
        stayType: 'REGULAR',
        status: 'ACTIVE',
        checkInDate: '2026-08-10',
        billingAnchorDay: 10,
        commercialAgreements: [
          new CommercialAgreement({
            id: 'CA-1',
            stayId: 'STAY-1',
            rent: 12000,
            securityDeposit: 24000,
            effectiveFrom: '2026-08-10',
            amendmentReason: 'Initial',
            status: 'ACTIVE',
          }),
        ],
      });
      mockStays.set(stay1.id, stay1);
      mockResidents.set('RES-1', {
        id: 'RES-1',
        residentCode: 'RC-001',
        fullName: 'Rahul Sharma',
        status: 'ACTIVE',
        mobileNumber: '9876543210',
        createdAt: '2026-08-10T00:00:00.000Z',
        updatedAt: '2026-08-10T00:00:00.000Z',
      });

      // 2. Setup Confirmed Electricity Allocation with authoritative financeBillId
      elecRepo.saveAllocation(
        new ElectricityAllocation({
          id: 'ALLOC-01',
          billId: 'BILL-01',
          flatId: 'FLAT-101',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          totalSupplierAmount: 3000,
          totalPotentialShares: 2,
          totalSelectedShares: 2,
          amountPerShare: 1500,
          remainderPaise: 0,
          status: 'CONFIRMED',
          participants: [
            new AllocationParticipant({
              id: 'PART-01',
              allocationId: 'ALLOC-01',
              stayId: 'STAY-1',
              residentId: 'RES-1',
              residentCode: 'RC-001',
              residentNameSnapshot: 'Rahul S.',
              flatId: 'FLAT-101',
              potentialShares: 2,
              selectedShares: 2,
              allocatedAmount: 3000,
              financeBillId: 'INV-ELEC-777',
            }),
          ],
        })
      );

      // Execute multi-provider discovery
      const obligations = await discoveryService.discoverAll(
        ['STAY-1'],
        '2026-07-01',
        '2026-08-31'
      );

      expect(obligations).toHaveLength(2);

      const rentOb = obligations.find((o) => o.chargeType === 'RENT')!;
      expect(rentOb).toBeDefined();
      expect(rentOb.amount).toBe(12000);
      expect(rentOb.commitmentStatus).toBe('UNCOMMITTED');

      const elecOb = obligations.find((o) => o.chargeType === 'ELECTRICITY')!;
      expect(elecOb).toBeDefined();
      expect(elecOb.amount).toBe(3000);
      expect(elecOb.commitmentStatus).toBe('COMMITTED');
      expect(elecOb.financialReferenceId).toBe('INV-ELEC-777'); // Exact ID, no fallback string
    });
  });

  describe('2. Generic Eligibility Evaluation', () => {
    it('evaluates discovered batch separating billable claims from committed observations', async () => {
      const stay1 = new Stay({
        id: 'STAY-1',
        residentId: 'RES-1',
        stayType: 'REGULAR',
        status: 'ACTIVE',
        checkInDate: '2026-08-10',
        billingAnchorDay: 10,
        agreedRent: 12000,
      });
      mockStays.set(stay1.id, stay1);

      elecRepo.saveAllocation(
        new ElectricityAllocation({
          id: 'ALLOC-01',
          billId: 'BILL-01',
          flatId: 'FLAT-101',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          totalSupplierAmount: 3000,
          totalPotentialShares: 2,
          totalSelectedShares: 2,
          amountPerShare: 1500,
          remainderPaise: 0,
          status: 'CONFIRMED',
          participants: [
            new AllocationParticipant({
              id: 'PART-01',
              allocationId: 'ALLOC-01',
              stayId: 'STAY-1',
              residentId: 'RES-1',
              residentCode: 'RC-001',
              residentNameSnapshot: 'Rahul S.',
              flatId: 'FLAT-101',
              potentialShares: 2,
              selectedShares: 2,
              allocatedAmount: 3000,
              financeBillId: 'INV-ELEC-777',
            }),
          ],
        })
      );

      const obligations = await discoveryService.discoverAll(
        ['STAY-1'],
        '2026-07-01',
        '2026-08-31'
      );

      const summary = await eligibilityService.evaluateBatch(obligations);

      expect(summary.totalDiscovered).toBe(2);
      expect(summary.eligibleCount).toBe(1); // Rent
      expect(summary.eligibleAmount).toBe(12000);
      expect(summary.committedCount).toBe(1); // Electricity
      expect(summary.committedAmount).toBe(3000);
      expect(summary.claimedCount).toBe(0);
    });
  });

  describe('3. Rent Ownership Boundary', () => {
    it('Billing strictly consumes authoritative agreedRent and does NOT recalculate rent', async () => {
      const stay = new Stay({
        id: 'STAY-200',
        residentId: 'RES-200',
        stayType: 'REGULAR',
        status: 'ACTIVE',
        checkInDate: '2026-08-01',
        billingAnchorDay: 1,
        agreedRent: 18500,
      });
      mockStays.set(stay.id, stay);

      const obligations = await rentAdapter.discoverObligations(
        ['STAY-200'],
        '2026-08-01',
        '2026-08-31',
        '2026-08-31T23:59:59.000Z'
      );

      expect(obligations).toHaveLength(1);
      expect(obligations[0].amount).toBe(18500);
      expect(obligations[0].chargeType).toBe('RENT');
    });
  });

  describe('4. Electricity Ownership Boundary', () => {
    it('Billing strictly observes confirmed allocations with financeBillId as COMMITTED and prevents claim acquisition', async () => {
      elecRepo.saveAllocation(
        new ElectricityAllocation({
          id: 'ALLOC-ELEC',
          billId: 'BILL-SUPP',
          flatId: 'FLAT-202',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          totalSupplierAmount: 2000,
          totalPotentialShares: 2,
          totalSelectedShares: 2,
          amountPerShare: 1000,
          remainderPaise: 0,
          status: 'CONFIRMED',
          participants: [
            new AllocationParticipant({
              id: 'PART-99',
              allocationId: 'ALLOC-ELEC',
              stayId: 'STAY-202',
              residentId: 'RES-202',
              residentCode: 'RC-202',
              residentNameSnapshot: 'Resident 202',
              flatId: 'FLAT-202',
              potentialShares: 2,
              selectedShares: 2,
              allocatedAmount: 2000,
              financeBillId: 'INV-FIN-ELEC-999',
            }),
          ],
        })
      );

      const obligations = await elecAdapter.discoverObligations(
        ['STAY-202'],
        '2026-07-01',
        '2026-07-31',
        '2026-08-01T00:00:00.000Z'
      );

      expect(obligations).toHaveLength(1);
      const elecObligation = obligations[0];
      expect(elecObligation.commitmentStatus).toBe('COMMITTED');
      expect(elecObligation.financialReferenceId).toBe('INV-FIN-ELEC-999');

      // Attempting to acquire claim must fail
      const claimResult = await claimService.acquireClaim('RUN-X', 'OP-X', elecObligation);
      expect(claimResult.success).toBe(false);
      expect(claimResult.reason).toBe('CANNOT_CLAIM_COMMITTED_OBLIGATION');
    });

    it('handles confirmed allocation without financeBillId as COMMITTED (non-claimable) without fabricating a string', async () => {
      elecRepo.saveAllocation(
        new ElectricityAllocation({
          id: 'ALLOC-UNPOSTED',
          billId: 'BILL-SUPP-2',
          flatId: 'FLAT-203',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          totalSupplierAmount: 1000,
          totalPotentialShares: 1,
          totalSelectedShares: 1,
          amountPerShare: 1000,
          remainderPaise: 0,
          status: 'CONFIRMED',
          participants: [
            new AllocationParticipant({
              id: 'PART-100',
              allocationId: 'ALLOC-UNPOSTED',
              stayId: 'STAY-203',
              residentId: 'RES-203',
              residentCode: 'RC-203',
              residentNameSnapshot: 'Resident 203',
              flatId: 'FLAT-203',
              potentialShares: 1,
              selectedShares: 1,
              allocatedAmount: 1000,
              // financeBillId absent
            }),
          ],
        })
      );

      const obligations = await elecAdapter.discoverObligations(
        ['STAY-203'],
        '2026-07-01',
        '2026-07-31',
        '2026-08-01T00:00:00.000Z'
      );

      expect(obligations).toHaveLength(1);
      const elecObligation = obligations[0];
      expect(elecObligation.commitmentStatus).toBe('COMMITTED'); // Must remain COMMITTED
      expect(elecObligation.financialReferenceId).toBeUndefined(); // Strictly undefined
      expect(elecObligation.isClaimable()).toBe(false);

      // Claiming must be rejected
      const claimResult = await claimService.acquireClaim('RUN-Y', 'OP-Y', elecObligation);
      expect(claimResult.success).toBe(false);
      expect(claimResult.reason).toBe('CANNOT_CLAIM_COMMITTED_OBLIGATION');
    });
  });

  describe('5. Historical Stay Attribution', () => {
    it('discovers legitimate obligations for CHECKED_OUT and CLOSED historical stays without an ACTIVE-only filter', async () => {
      const checkedOutStay = new Stay({
        id: 'STAY-CHECKED-OUT',
        residentId: 'RES-CHECKED-OUT',
        stayType: 'REGULAR',
        status: 'CHECKED_OUT',
        checkInDate: '2026-06-01',
        actualCheckoutDate: '2026-08-25',
        billingAnchorDay: 5,
        agreedRent: 11000,
      });
      mockStays.set(checkedOutStay.id, checkedOutStay);

      elecRepo.saveAllocation(
        new ElectricityAllocation({
          id: 'ALLOC-HIST',
          billId: 'BILL-HIST',
          flatId: 'FLAT-HIST',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          totalSupplierAmount: 1800,
          totalPotentialShares: 1,
          totalSelectedShares: 1,
          amountPerShare: 1800,
          remainderPaise: 0,
          status: 'CONFIRMED',
          participants: [
            new AllocationParticipant({
              id: 'PART-HIST',
              allocationId: 'ALLOC-HIST',
              stayId: 'STAY-CHECKED-OUT',
              residentId: 'RES-CHECKED-OUT',
              residentCode: 'RC-HIST',
              residentNameSnapshot: 'Historical Resident',
              flatId: 'FLAT-HIST',
              potentialShares: 1,
              selectedShares: 1,
              allocatedAmount: 1800,
              financeBillId: 'INV-FIN-ELEC-HIST',
            }),
          ],
        })
      );

      const obligations = await discoveryService.discoverAll(
        ['STAY-CHECKED-OUT'],
        '2026-07-01',
        '2026-08-31'
      );

      expect(obligations).toHaveLength(3); // 2 Rent cycles (July 5, Aug 5) + 1 Elec (July period)
      expect(obligations.filter((o) => o.chargeType === 'RENT')).toHaveLength(2);
      expect(obligations.filter((o) => o.chargeType === 'ELECTRICITY')).toHaveLength(1);
      expect(obligations.map((o) => o.chargeType)).toContain('RENT');
      expect(obligations.map((o) => o.chargeType)).toContain('ELECTRICITY');
    });
  });

  describe('6. Business Safety & Invariant Preservation', () => {
    it('performs zero Stay, Bed, Resident mutation and zero Finance Bill creation', async () => {
      const stay = new Stay({
        id: 'STAY-SAFE',
        residentId: 'RES-SAFE',
        stayType: 'REGULAR',
        status: 'ACTIVE',
        checkInDate: '2026-08-01',
        billingAnchorDay: 1,
        agreedRent: 15000,
      });
      mockStays.set(stay.id, stay);

      const obligations = await discoveryService.discoverAll(
        ['STAY-SAFE'],
        '2026-08-01',
        '2026-08-31'
      );

      expect(obligations).toHaveLength(1);
      expect(stay.status).toBe('ACTIVE');
      expect(stay.agreedRent).toBe(15000);
      expect(stay.billingAnchorDay).toBe(1);

      // Claiming is an in-memory operational state, zero Finance posting
      const claimResult = await claimService.acquireClaim('RUN-SAFE', 'OP-SAFE', obligations[0]);
      expect(claimResult.success).toBe(true);
      expect(claimResult.claim?.status).toBe('CLAIM_ACQUIRED');
      expect(claimResult.claim?.financialReferenceId).toBeUndefined();
    });
  });
});
