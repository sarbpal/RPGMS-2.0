import { describe, it, expect, beforeEach } from 'vitest';
import { SupplierBillAllocationService } from '../supplierBillAllocationService';
import { InMemoryElectricityRepository } from '../../infrastructure/repositories/InMemoryElectricityRepository';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { BillingApplicationService } from '../../../finance/services/billingService';
import { InMemoryFinanceRepository } from '../../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { BedAllocation } from '../../../stay/domain/valueObjects/BedAllocation';
import type { Resident } from '../../../resident/domain/entities/Resident';
import { AccountType, LedgerReferenceType } from '../../../finance/domain';

describe('Stage 3 — SupplierBillAllocationService Unit & Integration Tests', () => {
  let electricityRepo: InMemoryElectricityRepository;
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let financeRepo: InMemoryFinanceRepository;
  let billingService: BillingApplicationService;
  let allocationService: SupplierBillAllocationService;

  const resident1: Resident = {
    id: 'res-01',
    residentCode: 'R-001',
    fullName: 'Alice Johnson',
    status: 'ACTIVE',
    mobileNumber: '9876543210',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  const resident2: Resident = {
    id: 'res-02',
    residentCode: 'R-002',
    fullName: 'Bob Smith',
    status: 'ACTIVE',
    mobileNumber: '9876543211',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
  };

  beforeEach(() => {
    electricityRepo = new InMemoryElectricityRepository([], [], []);
    stayRepo = new InMemoryStayRepository([]);
    residentRepo = new InMemoryResidentRepository([resident1, resident2]);
    financeRepo = new InMemoryFinanceRepository();
    financeRepo.saveBills([]);
    financeRepo.saveLedgerEntries([]);
    billingService = new BillingApplicationService(financeRepo, stayRepo);
    allocationService = new SupplierBillAllocationService(
      electricityRepo,
      stayRepo,
      residentRepo,
      billingService,
      financeRepo
    );

    const stay1 = new Stay({
      id: 'stay-01',
      residentId: 'res-01',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-01', stayId: 'stay-01', flatId: 'flat-101', bedId: 'bed-1', allocatedFrom: '2026-07-01', status: 'ACTIVE' },
      ],
    });

    const stay2 = new Stay({
      id: 'stay-02',
      residentId: 'res-02',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-02', stayId: 'stay-02', flatId: 'flat-101', bedId: 'bed-2', allocatedFrom: '2026-07-01', status: 'ACTIVE' },
      ],
    });

    stayRepo.saveSync(stay1);
    stayRepo.saveSync(stay2);
  });

  it('Scenario 1: Creates draft allocation, discovers historical participants, and previews integer-paise math', () => {
    const result = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-001',
        supplierAmount: 1000,
        remarks: 'July 2026 Bill',
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    expect(result.success).toBe(true);
    expect(result.bill).not.toBeNull();
    expect(result.allocation).not.toBeNull();

    const bill = result.bill!;
    const alloc = result.allocation!;

    expect(bill.status).toBe('DRAFT');
    expect(bill.supplierAmount).toBe(1000);
    expect(alloc.status).toBe('DRAFT');
    expect(alloc.totalSupplierAmount).toBe(1000);
    expect(alloc.totalPotentialShares).toBe(2);
    expect(alloc.totalSelectedShares).toBe(2);
    expect(alloc.participants.length).toBe(2);

    // ₹1000 split across 2 selected shares = ₹500.00 each
    expect(alloc.participants[0].allocatedAmount).toBe(500);
    expect(alloc.participants[1].allocatedAmount).toBe(500);
  });

  it('Scenario 2: Operator updates candidate selected shares in draft review', () => {
    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-002',
        supplierAmount: 1000,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    const allocId = draftResult.allocation!.id;

    // Operator adjusts stay-01 selectedShares = 1, stay-02 selectedShares = 0
    const updateResult = allocationService.updateDraftShares(allocId, [
      { stayId: 'stay-01', selectedShares: 1 },
      { stayId: 'stay-02', selectedShares: 0 },
    ]);

    expect(updateResult.success).toBe(true);
    const updatedAlloc = updateResult.allocation!;

    expect(updatedAlloc.totalSelectedShares).toBe(1);
    expect(updatedAlloc.participants.find((p) => p.stayId === 'stay-01')?.allocatedAmount).toBe(1000);
    expect(updatedAlloc.participants.find((p) => p.stayId === 'stay-02')?.allocatedAmount).toBe(0);
  });

  it('Scenario 3: Rejects invalid selectedShares (> potentialShares or negative)', () => {
    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-003',
        supplierAmount: 1000,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    const allocId = draftResult.allocation!.id;

    expect(() =>
      allocationService.updateDraftShares(allocId, [{ stayId: 'stay-01', selectedShares: 5 }])
    ).toThrow('selectedShares (5) cannot exceed potentialShares (1)');
  });

  it('Scenario 4: Explicit RESIDENT_ALLOCATED confirmation posts Finance bills crediting ELECTRICITY_REVENUE', () => {
    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-004',
        supplierAmount: 1000,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    const allocId = draftResult.allocation!.id;

    const confirmResult = allocationService.confirmAllocation(allocId, 'operator-john', 'Approved by John');

    expect(confirmResult.success).toBe(true);
    const confirmedAlloc = confirmResult.allocation!;

    expect(confirmedAlloc.status).toBe('CONFIRMED');
    expect(confirmedAlloc.allocationOutcome).toBe('RESIDENT_ALLOCATED');
    expect(confirmedAlloc.confirmedBy).toBe('operator-john');

    // Verify financeBillId is attached to participants
    expect(confirmedAlloc.participants[0].financeBillId).toBeDefined();
    expect(confirmedAlloc.participants[1].financeBillId).toBeDefined();

    // Verify Finance ledger entries credit ELECTRICITY_REVENUE
    const ledgerEntries = financeRepo.getLedgerEntries();
    const utilityRevenueEntries = ledgerEntries.filter(
      (e) => e.account === AccountType.ELECTRICITY_REVENUE
    );

    expect(utilityRevenueEntries.length).toBe(2);
    expect(utilityRevenueEntries[0].referenceType).toBe(LedgerReferenceType.ELECTRICITY_ALLOCATION);
  });

  it('Scenario 5: Explicit OWNER_ABSORBED confirmation (selectedShares = 0) creates ₹0 resident receivables', () => {
    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-005',
        supplierAmount: 1200,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    const allocId = draftResult.allocation!.id;

    // Operator sets all selectedShares = 0
    allocationService.updateDraftShares(allocId, [
      { stayId: 'stay-01', selectedShares: 0 },
      { stayId: 'stay-02', selectedShares: 0 },
    ]);

    const confirmResult = allocationService.confirmAllocation(allocId, 'operator-mary', 'Owner absorbed month');

    expect(confirmResult.success).toBe(true);
    const confirmedAlloc = confirmResult.allocation!;

    expect(confirmedAlloc.status).toBe('CONFIRMED');
    expect(confirmedAlloc.allocationOutcome).toBe('OWNER_ABSORBED');
    expect(confirmedAlloc.ownerAbsorbedAmount).toBe(1200);

    // Verify zero Finance bills created
    const bills = financeRepo.getBills();
    expect(bills.length).toBe(0);
  });

  it('Scenario 6: Data quality issues survive confirmation with acknowledgedBy and acknowledgedAt timestamps', () => {
    const stayOrphan = new Stay({
      id: 'stay-orphan',
      residentId: 'res-nonexistent-99',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        new BedAllocation({ id: 'ba-orph', stayId: 'stay-orphan', flatId: 'flat-101', bedId: 'bed-1', allocatedFrom: '2026-07-01', status: 'ACTIVE' }),
      ],
    });
    stayRepo.saveSync(stayOrphan);

    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-006',
        supplierAmount: 500,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    expect(draftResult.dataQualityIssues.length).toBe(1);

    const allocId = draftResult.allocation!.id;
    const confirmResult = allocationService.confirmAllocation(allocId, 'operator-audit', 'Acknowledged missing resident record');

    expect(confirmResult.success).toBe(true);
    const confirmedAlloc = confirmResult.allocation!;

    expect(confirmedAlloc.dataQualityIssues.length).toBe(1);
    expect(confirmedAlloc.dataQualityIssues[0].acknowledgedBy).toBe('operator-audit');
    expect(confirmedAlloc.dataQualityIssues[0].acknowledgedAt).toBeDefined();
    expect(confirmedAlloc.dataQualityIssues[0].operatorNotes).toBe('Acknowledged missing resident record');
  });

  it('Scenario 7: Application compensating rollback executes if Finance billing fails mid-batch', () => {
    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-007',
        supplierAmount: 1000,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    const allocId = draftResult.allocation!.id;

    // Mock financeService.createBill to fail on stay-02
    const originalCreateBill = billingService.createBill.bind(billingService);
    let callCount = 0;
    billingService.createBill = (payload) => {
      callCount++;
      if (callCount === 2) {
        return { success: false, bill: null, errors: ['Simulated Finance database connection timeout'] };
      }
      return originalCreateBill(payload);
    };

    const confirmResult = allocationService.confirmAllocation(allocId, 'operator-john');

    expect(confirmResult.success).toBe(false);
    expect(confirmResult.errors[0]).toContain('compensating rollback executed');

    // Verify allocation remains in DRAFT status
    const allocInDb = electricityRepo.getAllocationById(allocId);
    expect(allocInDb?.status).toBe('DRAFT');

    // Verify created Finance bills were rolled back (0 bills in Finance repo)
    const billsInFinance = financeRepo.getBills();
    expect(billsInFinance.length).toBe(0);
  });

  it('Scenario 8: Attempting to modify shares or re-confirm an already CONFIRMED allocation throws domain error', () => {
    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-008',
        supplierAmount: 1000,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    const allocId = draftResult.allocation!.id;
    allocationService.confirmAllocation(allocId, 'operator-john');

    // Attempting re-confirmation
    const reConfirmResult = allocationService.confirmAllocation(allocId, 'operator-john');
    expect(reConfirmResult.success).toBe(false);
    expect(reConfirmResult.errors[0]).toContain('already CONFIRMED');

    // Attempting share modification
    const updateResult = allocationService.updateDraftShares(allocId, [{ stayId: 'stay-01', selectedShares: 1 }]);
    expect(updateResult.success).toBe(false);
    expect(updateResult.errors[0]).toContain('already CONFIRMED');
  });

  it('Protection Check: Confirms zero mutations to Stay, Resident, BedStatus, or physical sub-meter rules', () => {
    const stayInitial = stayRepo.findByIdSync('stay-01');
    const resInitial = residentRepo.getByIdSync('res-01');

    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-009',
        supplierAmount: 1000,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    allocationService.confirmAllocation(draftResult.allocation!.id, 'operator-john');

    const stayFinal = stayRepo.findByIdSync('stay-01');
    const resFinal = residentRepo.getByIdSync('res-01');

    expect(stayFinal?.status).toBe(stayInitial?.status);
    expect(resFinal?.status).toBe(resInitial?.status);
  });

  it('Scenario 9: Reverses a confirmed RESIDENT_ALLOCATED allocation, cancelling Finance bills and posting reversing double-entry ledger records (BR-E-49)', () => {
    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-009',
        supplierAmount: 1000,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    const allocId = draftResult.allocation!.id;
    allocationService.confirmAllocation(allocId, 'operator-john');

    const revResult = allocationService.reverseAllocation(
      allocId,
      'supervisor-jane',
      'Incorrect billing date range'
    );

    expect(revResult.success).toBe(true);
    const reversedAlloc = revResult.allocation!;
    expect(reversedAlloc.status).toBe('REVERSED');
    expect(reversedAlloc.reversedBy).toBe('supervisor-jane');
    expect(reversedAlloc.reversalReason).toBe('Incorrect billing date range');
    expect(reversedAlloc.reversalReferenceId).toBe(`rev_${allocId}`);
    expect(reversedAlloc.reversedAt).toBeDefined();

    // Verify resident Finance bills are CANCELLED
    const financeBills = financeRepo.getBills();
    expect(financeBills.length).toBe(2);
    expect(financeBills[0].status).toBe('CANCELLED');
    expect(financeBills[1].status).toBe('CANCELLED');

    // Verify reversing double-entry ledger entries exist (Debit ELECTRICITY_REVENUE, Credit ACCOUNTS_RECEIVABLE)
    const ledgerEntries = financeRepo.getLedgerEntries();
    const reversalEntries = ledgerEntries.filter((e) => e.referenceType === 'REVERSAL');
    expect(reversalEntries.length).toBeGreaterThan(0);
    expect(reversalEntries.some((e) => e.account === AccountType.ELECTRICITY_REVENUE && e.debit > 0)).toBe(true);
  });

  it('Scenario 10: Reverses a confirmed OWNER_ABSORBED allocation without resident Finance bill operations', () => {
    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-010',
        supplierAmount: 1200,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    const allocId = draftResult.allocation!.id;
    allocationService.updateDraftShares(allocId, [
      { stayId: 'stay-01', selectedShares: 0 },
      { stayId: 'stay-02', selectedShares: 0 },
    ]);
    allocationService.confirmAllocation(allocId, 'operator-mary');

    const revResult = allocationService.reverseAllocation(
      allocId,
      'supervisor-jane',
      'Owner absorbed in error'
    );

    expect(revResult.success).toBe(true);
    expect(revResult.allocation?.status).toBe('REVERSED');
    expect(revResult.allocation?.allocationOutcome).toBe('OWNER_ABSORBED');

    // Confirm zero resident Finance bills exist
    expect(financeRepo.getBills().length).toBe(0);
  });

  it('Scenario 11: Idempotency & Validation Guards — prevents double reversal or reversing DRAFT allocation', () => {
    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-011',
        supplierAmount: 1000,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    const allocId = draftResult.allocation!.id;

    // Attempting reversal on DRAFT allocation fails
    const draftRevResult = allocationService.reverseAllocation(allocId, 'supervisor-jane');
    expect(draftRevResult.success).toBe(false);
    expect(draftRevResult.errors[0]).toContain('Only CONFIRMED allocations can be reversed');

    // Confirm allocation then reverse
    allocationService.confirmAllocation(allocId, 'operator-john');
    const firstRevResult = allocationService.reverseAllocation(allocId, 'supervisor-jane');
    expect(firstRevResult.success).toBe(true);

    // Attempting second reversal fails (idempotency guard)
    const secondRevResult = allocationService.reverseAllocation(allocId, 'supervisor-jane');
    expect(secondRevResult.success).toBe(false);
    expect(secondRevResult.errors[0]).toContain('Only CONFIRMED allocations can be reversed');

    // Missing operator identity fails
    const missingOperatorResult = allocationService.reverseAllocation(allocId, '   ');
    expect(missingOperatorResult.success).toBe(false);
    expect(missingOperatorResult.errors[0]).toContain('Operator identity (reversedBy) is required');
  });

  it('Scenario 12: Application compensating rollback executes if Finance reversal fails mid-batch', () => {
    const draftResult = allocationService.createDraftAllocation(
      {
        supplierName: 'State Electricity Board',
        supplierBillNumber: 'INV-2026-012',
        supplierAmount: 1000,
      },
      'flat-101',
      '2026-07-01',
      '2026-07-31'
    );

    const allocId = draftResult.allocation!.id;
    allocationService.confirmAllocation(allocId, 'operator-john');

    // Mock ledgerService.reverseEntries on allocationService's internal ledgerService to fail
    const internalLedgerService = (allocationService as any).ledgerService;
    internalLedgerService.reverseEntries = () => ({
      success: false,
      entries: [],
      errors: ['Simulated Finance ledger lock failure'],
    });

    const revResult = allocationService.reverseAllocation(allocId, 'supervisor-jane');

    expect(revResult.success).toBe(false);
    expect(revResult.errors[0]).toContain('compensating rollback executed');

    // Verify allocation state remains CONFIRMED (not REVERSED)
    const allocInRepo = electricityRepo.getAllocationById(allocId);
    expect(allocInRepo?.status).toBe('CONFIRMED');

    // Verify Finance bills were restored to UNPAID (pre-reversal state)
    const billsInFinance = financeRepo.getBills();
    expect(billsInFinance.every((b) => b.status === 'UNPAID')).toBe(true);
  });
});

