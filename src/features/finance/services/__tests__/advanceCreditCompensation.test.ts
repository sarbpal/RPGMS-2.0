/**
 * Pre-Supabase Hardening — Advance Credit Compensation Boundary Tests
 *
 * Validates that applyAdvanceCreditToBills() correctly wraps ledger posting and Bill
 * projection persistence in a joint compensating-rollback boundary (BR-425 / ADR-040).
 *
 * Covers:
 *   TEST A — Ledger post failure leaves no partial state.
 *   TEST B — First-bill persistence failure after successful ledger post restores both.
 *   TEST C — Multi-bill: bill persistence failure restores all bills and ledger.
 *   TEST D — Retry after a simulated failure succeeds with no duplicate ledger entries.
 *   TEST E — Successful idempotent replay creates no duplicate entries or bill mutations.
 *   TEST F — Zero / no available advance leaves system unchanged.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentApplicationService } from '../paymentService';
import { BillingApplicationService } from '../billingService';
import { LedgerApplicationService } from '../ledgerService';
import { BalanceApplicationService } from '../balanceEngine';
import { InMemoryFinanceRepository } from '../../infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { AccountType, BillStatus, LedgerReferenceType } from '../../domain';
import type { Bill } from '../../domain';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TODAY = new Date().toISOString().split('T')[0];
const MONTH = TODAY.slice(0, 7);
const stayId = 'stay-adv-comp-001';
const residentId = 'res-adv-comp-001';

function makeBill(overrides: Partial<Bill> & { id: string }): Bill {
  return {
    stayId,
    billNumber: `INV-${overrides.id}`,
    billType: 'MONTHLY_RENT',
    period: MONTH,
    issueDate: `${MONTH}-01`,
    dueDate: `${MONTH}-05`,
    totalAmount: 5000,
    paidAmount: 0,
    balanceAmount: 5000,
    status: BillStatus.UNPAID,
    lineItems: [{ id: 'li-1', description: 'Rent', amount: 5000, category: 'RENT' }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Pre-Supabase Hardening — Advance Credit Compensation Boundary (BR-425)', () => {
  let financeRepo: InMemoryFinanceRepository;
  let stayRepo: InMemoryStayRepository;
  let ledgerService: LedgerApplicationService;
  let balanceService: BalanceApplicationService;
  let billingService: BillingApplicationService;
  let paymentService: PaymentApplicationService;

  const sampleStay = new Stay({
    id: stayId,
    residentId,
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: `${MONTH}-01`,
    agreedRent: 5000,
    agreedDeposit: 5000,
    allocatedBedIds: ['bed-comp-a'],
  });

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
    financeStorage.saveStoredDepositTransactions([]);

    financeRepo = new InMemoryFinanceRepository();
    stayRepo = new InMemoryStayRepository([sampleStay]);
    ledgerService = new LedgerApplicationService(financeRepo, stayRepo);
    balanceService = new BalanceApplicationService(financeRepo);
    billingService = new BillingApplicationService(financeRepo, stayRepo, ledgerService);
    paymentService = new PaymentApplicationService(
      financeRepo,
      stayRepo,
      billingService,
      ledgerService,
      balanceService
    );

    // Seed advance credit of 10000 directly via ledger
    financeRepo.saveLedgerEntries([
      {
        id: 'led-advance-1',
        stayId,
        postingDate: TODAY,
        effectiveDate: TODAY,
        referenceType: LedgerReferenceType.PAYMENT,
        referenceId: 'pay-seed-001',
        account: AccountType.BANK,
        debit: 10000,
        credit: 0,
        remarks: 'Seed advance payment',
        createdBy: 'TEST',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'led-advance-2',
        stayId,
        postingDate: TODAY,
        effectiveDate: TODAY,
        referenceType: LedgerReferenceType.PAYMENT,
        referenceId: 'pay-seed-001',
        account: AccountType.ADVANCE_CREDIT,
        debit: 0,
        credit: 10000,
        remarks: 'Seed advance credit liability',
        createdBy: 'TEST',
        createdAt: new Date().toISOString(),
      },
    ]);

    expect(balanceService.getAccountBalance(stayId, AccountType.ADVANCE_CREDIT)).toBe(10000);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST A
  // ─────────────────────────────────────────────────────────────────────────
  it('TEST A — Ledger post failure leaves no partial state', () => {
    const billA = makeBill({ id: 'bill-a-001', totalAmount: 6000, balanceAmount: 6000 });
    financeRepo.saveBill(billA);
    financeRepo.saveLedgerEntries([
      ...financeRepo.getLedgerEntries(),
      { id: 'led-ba-1', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billA.id, account: AccountType.ACCOUNTS_RECEIVABLE, debit: 6000, credit: 0, remarks: 'Bill realization', createdBy: 'TEST', createdAt: new Date().toISOString() },
      { id: 'led-ba-2', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billA.id, account: AccountType.RENT_REVENUE, debit: 0, credit: 6000, remarks: 'Revenue', createdBy: 'TEST', createdAt: new Date().toISOString() },
    ]);

    const ledgerCountBefore = financeRepo.getLedgerEntries().length;
    const billBefore = { ...financeRepo.getBills().find((b) => b.id === billA.id)! };

    vi.spyOn(ledgerService, 'postEntries').mockReturnValueOnce({
      success: false,
      entries: [],
      errors: ['Simulated ledger persistence failure'],
    });

    const result = paymentService.applyAdvanceCreditToBills(stayId);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('Failed to post advance application ledger entries');
    expect(financeRepo.getLedgerEntries()).toHaveLength(ledgerCountBefore);
    const billAfter = financeRepo.getBills().find((b) => b.id === billA.id)!;
    expect(billAfter.paidAmount).toBe(billBefore.paidAmount);
    expect(billAfter.status).toBe(billBefore.status);
    expect(balanceService.getAccountBalance(stayId, AccountType.ADVANCE_CREDIT)).toBe(10000);

    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST B
  // ─────────────────────────────────────────────────────────────────────────
  it('TEST B — First-bill persistence failure restores ledger and bill', () => {
    const billB = makeBill({ id: 'bill-b-001', totalAmount: 5000, balanceAmount: 5000 });
    financeRepo.saveBill(billB);
    financeRepo.saveLedgerEntries([
      ...financeRepo.getLedgerEntries(),
      { id: 'led-bb-1', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billB.id, account: AccountType.ACCOUNTS_RECEIVABLE, debit: 5000, credit: 0, remarks: 'Bill realization', createdBy: 'TEST', createdAt: new Date().toISOString() },
      { id: 'led-bb-2', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billB.id, account: AccountType.RENT_REVENUE, debit: 0, credit: 5000, remarks: 'Revenue', createdBy: 'TEST', createdAt: new Date().toISOString() },
    ]);

    const ledgerCountBefore = financeRepo.getLedgerEntries().length;
    const billBefore = { ...financeRepo.getBills().find((b) => b.id === billB.id)! };

    const originalSaveBills = financeRepo.saveBills.bind(financeRepo);
    let saveCallCount = 0;
    vi.spyOn(financeRepo, 'saveBills').mockImplementation((bills) => {
      saveCallCount++;
      if (saveCallCount === 1) throw new Error('Simulated bill persistence failure');
      return originalSaveBills(bills);
    });

    const result = paymentService.applyAdvanceCreditToBills(stayId);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('rolled back');

    const ledgerAfter = financeRepo.getLedgerEntries();
    expect(ledgerAfter).toHaveLength(ledgerCountBefore);
    expect(ledgerAfter.filter((e) => e.referenceType === LedgerReferenceType.ADVANCE_APPLICATION)).toHaveLength(0);

    const billAfter = financeRepo.getBills().find((b) => b.id === billB.id)!;
    expect(billAfter.paidAmount).toBe(billBefore.paidAmount);
    expect(billAfter.status).toBe(billBefore.status);
    expect(balanceService.getAccountBalance(stayId, AccountType.ADVANCE_CREDIT)).toBe(10000);

    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST C
  // ─────────────────────────────────────────────────────────────────────────
  it('TEST C — Multi-bill: bill persistence failure restores ledger and all bills', () => {
    const billC1 = makeBill({ id: 'bill-c-001', totalAmount: 6000, balanceAmount: 6000, dueDate: `${MONTH}-03` });
    const billC2 = makeBill({ id: 'bill-c-002', totalAmount: 4000, balanceAmount: 4000, dueDate: `${MONTH}-07` });
    financeRepo.saveBill(billC1);
    financeRepo.saveBill(billC2);
    financeRepo.saveLedgerEntries([
      ...financeRepo.getLedgerEntries(),
      { id: 'led-c1-1', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billC1.id, account: AccountType.ACCOUNTS_RECEIVABLE, debit: 6000, credit: 0, remarks: 'C1 realization', createdBy: 'TEST', createdAt: new Date().toISOString() },
      { id: 'led-c1-2', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billC1.id, account: AccountType.RENT_REVENUE, debit: 0, credit: 6000, remarks: 'Revenue C1', createdBy: 'TEST', createdAt: new Date().toISOString() },
      { id: 'led-c2-1', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billC2.id, account: AccountType.ACCOUNTS_RECEIVABLE, debit: 4000, credit: 0, remarks: 'C2 realization', createdBy: 'TEST', createdAt: new Date().toISOString() },
      { id: 'led-c2-2', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billC2.id, account: AccountType.RENT_REVENUE, debit: 0, credit: 4000, remarks: 'Revenue C2', createdBy: 'TEST', createdAt: new Date().toISOString() },
    ]);

    const ledgerCountBefore = financeRepo.getLedgerEntries().length;
    const bill1Before = { ...financeRepo.getBills().find((b) => b.id === billC1.id)! };
    const bill2Before = { ...financeRepo.getBills().find((b) => b.id === billC2.id)! };

    const originalSaveBills = financeRepo.saveBills.bind(financeRepo);
    let saveCallCount = 0;
    vi.spyOn(financeRepo, 'saveBills').mockImplementation((bills) => {
      saveCallCount++;
      if (saveCallCount === 1) throw new Error('Simulated multi-bill persistence failure');
      return originalSaveBills(bills);
    });

    const result = paymentService.applyAdvanceCreditToBills(stayId);

    expect(result.success).toBe(false);
    expect(result.errors[0]).toContain('rolled back');

    const ledgerAfter = financeRepo.getLedgerEntries();
    expect(ledgerAfter).toHaveLength(ledgerCountBefore);
    expect(ledgerAfter.filter((e) => e.referenceType === LedgerReferenceType.ADVANCE_APPLICATION)).toHaveLength(0);

    const bill1After = financeRepo.getBills().find((b) => b.id === billC1.id)!;
    const bill2After = financeRepo.getBills().find((b) => b.id === billC2.id)!;
    expect(bill1After.paidAmount).toBe(bill1Before.paidAmount);
    expect(bill1After.status).toBe(bill1Before.status);
    expect(bill2After.paidAmount).toBe(bill2Before.paidAmount);
    expect(bill2After.status).toBe(bill2Before.status);
    expect(balanceService.getAccountBalance(stayId, AccountType.ADVANCE_CREDIT)).toBe(10000);

    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST D
  // ─────────────────────────────────────────────────────────────────────────
  it('TEST D — Retry after simulated failure succeeds with no duplicate ledger entries', () => {
    const billD = makeBill({ id: 'bill-d-001', totalAmount: 7000, balanceAmount: 7000 });
    financeRepo.saveBill(billD);
    financeRepo.saveLedgerEntries([
      ...financeRepo.getLedgerEntries(),
      { id: 'led-d-1', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billD.id, account: AccountType.ACCOUNTS_RECEIVABLE, debit: 7000, credit: 0, remarks: 'Bill D realization', createdBy: 'TEST', createdAt: new Date().toISOString() },
      { id: 'led-d-2', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billD.id, account: AccountType.RENT_REVENUE, debit: 0, credit: 7000, remarks: 'Revenue D', createdBy: 'TEST', createdAt: new Date().toISOString() },
    ]);

    const originalSaveBills = financeRepo.saveBills.bind(financeRepo);
    let saveCallCount = 0;
    const saveSpy = vi.spyOn(financeRepo, 'saveBills').mockImplementation((bills) => {
      saveCallCount++;
      if (saveCallCount === 1) throw new Error('Simulated first-attempt failure');
      return originalSaveBills(bills);
    });

    const firstResult = paymentService.applyAdvanceCreditToBills(stayId);
    expect(firstResult.success).toBe(false);

    // Verify clean rollback
    expect(financeRepo.getLedgerEntries().filter((e) => e.referenceType === LedgerReferenceType.ADVANCE_APPLICATION)).toHaveLength(0);
    expect(financeRepo.getBills().find((b) => b.id === billD.id)!.status).toBe(BillStatus.UNPAID);

    saveSpy.mockRestore();

    // Retry succeeds
    const retryResult = paymentService.applyAdvanceCreditToBills(stayId);
    expect(retryResult.success).toBe(true);
    expect(retryResult.consumedTotal).toBe(7000);

    // Exactly 2 ADVANCE_APPLICATION entries
    const advAppEntries = financeRepo.getLedgerEntries().filter((e) => e.referenceType === LedgerReferenceType.ADVANCE_APPLICATION);
    expect(advAppEntries).toHaveLength(2);

    const billDAfter = financeRepo.getBills().find((b) => b.id === billD.id)!;
    expect(billDAfter.paidAmount).toBe(7000);
    expect(billDAfter.status).toBe(BillStatus.PAID);
    expect(balanceService.getAccountBalance(stayId, AccountType.ADVANCE_CREDIT)).toBe(3000);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST E
  // ─────────────────────────────────────────────────────────────────────────
  it('TEST E — Idempotent replay after success creates no duplicates', () => {
    const billE = makeBill({ id: 'bill-e-001', totalAmount: 5000, balanceAmount: 5000 });
    financeRepo.saveBill(billE);
    financeRepo.saveLedgerEntries([
      ...financeRepo.getLedgerEntries(),
      { id: 'led-e-1', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billE.id, account: AccountType.ACCOUNTS_RECEIVABLE, debit: 5000, credit: 0, remarks: 'Bill E realization', createdBy: 'TEST', createdAt: new Date().toISOString() },
      { id: 'led-e-2', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.BILL, referenceId: billE.id, account: AccountType.RENT_REVENUE, debit: 0, credit: 5000, remarks: 'Revenue E', createdBy: 'TEST', createdAt: new Date().toISOString() },
    ]);

    const firstResult = paymentService.applyAdvanceCreditToBills(stayId);
    expect(firstResult.success).toBe(true);
    expect(firstResult.consumedTotal).toBe(5000);

    const ledgerAfterFirst = financeRepo.getLedgerEntries().length;
    const billAfterFirst = { ...financeRepo.getBills().find((b) => b.id === billE.id)! };

    const repeatResult = paymentService.applyAdvanceCreditToBills(stayId);
    expect(repeatResult.success).toBe(true);
    expect(repeatResult.consumedTotal).toBe(0);

    expect(financeRepo.getLedgerEntries()).toHaveLength(ledgerAfterFirst);
    const billAfterRepeat = financeRepo.getBills().find((b) => b.id === billE.id)!;
    expect(billAfterRepeat.paidAmount).toBe(billAfterFirst.paidAmount);
    expect(billAfterRepeat.status).toBe(billAfterFirst.status);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // TEST F
  // ─────────────────────────────────────────────────────────────────────────
  it('TEST F — Zero available advance results in no mutations', () => {
    // Consume all advance credit
    financeRepo.saveLedgerEntries([
      ...financeRepo.getLedgerEntries(),
      { id: 'led-consume-adv', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.ADVANCE_APPLICATION, referenceId: 'ADV-APP:other-bill', account: AccountType.ADVANCE_CREDIT, debit: 10000, credit: 0, remarks: 'Prior consumption', createdBy: 'TEST', createdAt: new Date().toISOString() },
      { id: 'led-consume-ar', stayId, postingDate: TODAY, effectiveDate: TODAY, referenceType: LedgerReferenceType.ADVANCE_APPLICATION, referenceId: 'ADV-APP:other-bill', account: AccountType.ACCOUNTS_RECEIVABLE, debit: 0, credit: 10000, remarks: 'Prior AR reduction', createdBy: 'TEST', createdAt: new Date().toISOString() },
    ]);

    expect(balanceService.getAccountBalance(stayId, AccountType.ADVANCE_CREDIT)).toBe(0);

    const billF = makeBill({ id: 'bill-f-001', totalAmount: 3000, balanceAmount: 3000 });
    financeRepo.saveBill(billF);

    const ledgerCountBefore = financeRepo.getLedgerEntries().length;
    const billBefore = { ...financeRepo.getBills().find((b) => b.id === billF.id)! };

    const result = paymentService.applyAdvanceCreditToBills(stayId);

    expect(result.success).toBe(true);
    expect(result.consumedTotal).toBe(0);
    expect(result.updatedBills).toHaveLength(0);
    expect(financeRepo.getLedgerEntries()).toHaveLength(ledgerCountBefore);

    const billAfter = financeRepo.getBills().find((b) => b.id === billF.id)!;
    expect(billAfter.paidAmount).toBe(billBefore.paidAmount);
    expect(billAfter.status).toBe(billBefore.status);
  });
});
