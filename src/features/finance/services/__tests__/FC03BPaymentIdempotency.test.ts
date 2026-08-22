import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentApplicationService } from '../paymentService';
import { BillingApplicationService } from '../billingService';
import { BalanceApplicationService } from '../balanceEngine';
import { LedgerApplicationService } from '../ledgerService';
import { defaultFinanceRepository } from '../../infrastructure';
import { InMemoryFinanceRepository } from '../../infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { AccountType, LedgerReferenceType, BillStatus } from '../../domain';
import { calculatePaymentAllocations } from '../../domain/rules/PaymentAllocationRule';

describe('FC-03B — Payment Idempotency & Dependency-Injection Test Suite', () => {
  let paymentService: PaymentApplicationService;
  let billingService: BillingApplicationService;
  let stayRepo: InMemoryStayRepository;

  const stayId1 = 'stay-fc03b-001';
  const stayId2 = 'stay-fc03b-002';

  const sampleStay1 = new Stay({
    id: stayId1,
    residentId: 'res-fc03b-001',
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: '2026-08-01',
    agreedRent: 10000,
    agreedDeposit: 8000,
    allocatedBedIds: ['bed-001'],
  });

  const sampleStay2 = new Stay({
    id: stayId2,
    residentId: 'res-fc03b-002',
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: '2026-08-01',
    agreedRent: 12000,
    agreedDeposit: 10000,
    allocatedBedIds: ['bed-002'],
  });

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rpgms_stays');
    }
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
    financeStorage.saveStoredDepositTransactions([]);

    stayRepo = new InMemoryStayRepository([sampleStay1, sampleStay2]);
    billingService = new BillingApplicationService(defaultFinanceRepository, stayRepo);
    paymentService = new PaymentApplicationService(defaultFinanceRepository, stayRepo);
  });

  it('TEST 1 — New payment with idempotencyKey succeeds', () => {
    billingService.createBill({
      stayId: stayId1,
      billType: 'MONTHLY_RENT',
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      totalAmount: 10000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    });

    const result = paymentService.recordPayment({
      stayId: stayId1,
      amount: 10000,
      paymentDate: '2026-08-05',
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-TXN-101',
      idempotencyKey: 'idem-key-001',
      remarks: 'August Rent',
    });

    expect(result.success).toBe(true);
    expect(result.payment).toBeDefined();
    expect(result.payment?.idempotencyKey).toBe('idem-key-001');
    expect(result.payment?.amount).toBe(10000);
    expect(result.payment?.allocations).toHaveLength(1);
    expect(result.payment?.allocations[0].amount).toBe(10000);
  });

  it('TEST 2 — Same idempotencyKey + same payment attributes returns/replays existing payment', () => {
    billingService.createBill({
      stayId: stayId1,
      billType: 'MONTHLY_RENT',
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      totalAmount: 10000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    });

    const first = paymentService.recordPayment({
      stayId: stayId1,
      amount: 10000,
      paymentDate: '2026-08-05',
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-TXN-101',
      idempotencyKey: 'idem-key-002',
    });

    const replay = paymentService.recordPayment({
      stayId: stayId1,
      amount: 10000,
      paymentDate: '2026-08-05',
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-TXN-101',
      idempotencyKey: 'idem-key-002',
    });

    expect(replay.success).toBe(true);
    expect(replay.payment?.id).toBe(first.payment?.id);
    expect(replay.payment?.paymentNumber).toBe(first.payment?.paymentNumber);

    // Ensure Ledger entries were NOT posted twice
    const ledgerEntries = defaultFinanceRepository
      .getLedgerEntriesByStayId(stayId1)
      .filter((e) => e.referenceType === LedgerReferenceType.PAYMENT);
    expect(ledgerEntries).toHaveLength(2); // 1 Debit Bank + 1 Credit AR
  });

  it('TEST 3 — Same idempotencyKey + different amount is rejected as conflict', () => {
    paymentService.recordPayment({
      stayId: stayId1,
      amount: 5000,
      paymentDate: '2026-08-05',
      paymentMethod: 'CASH',
      idempotencyKey: 'idem-key-003',
    });

    const conflict = paymentService.recordPayment({
      stayId: stayId1,
      amount: 8000,
      paymentDate: '2026-08-05',
      paymentMethod: 'CASH',
      idempotencyKey: 'idem-key-003',
    });

    expect(conflict.success).toBe(false);
    expect(conflict.payment).toBeNull();
    expect(conflict.errors[0]).toContain('Idempotency key conflict');
  });

  it('TEST 4 — Same idempotencyKey + conflicting payment method/reference is rejected as conflict', () => {
    paymentService.recordPayment({
      stayId: stayId1,
      amount: 5000,
      paymentDate: '2026-08-05',
      paymentMethod: 'CASH',
      idempotencyKey: 'idem-key-004',
    });

    const conflictMethod = paymentService.recordPayment({
      stayId: stayId1,
      amount: 5000,
      paymentDate: '2026-08-05',
      paymentMethod: 'UPI',
      idempotencyKey: 'idem-key-004',
    });

    expect(conflictMethod.success).toBe(false);
    expect(conflictMethod.errors[0]).toContain('Idempotency key conflict');
  });

  it('TEST 5 — Same referenceNumber + same stay + same payment method + same financial attributes replays existing payment', () => {
    const first = paymentService.recordPayment({
      stayId: stayId1,
      amount: 6000,
      paymentDate: '2026-08-05',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'NEFT-889900',
    });

    const replay = paymentService.recordPayment({
      stayId: stayId1,
      amount: 6000,
      paymentDate: '2026-08-05',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'NEFT-889900',
    });

    expect(replay.success).toBe(true);
    expect(replay.payment?.id).toBe(first.payment?.id);
    expect(defaultFinanceRepository.getPaymentsByStayId(stayId1)).toHaveLength(1);
  });

  it('TEST 6 — Same referenceNumber + conflicting amount is rejected as conflict', () => {
    paymentService.recordPayment({
      stayId: stayId1,
      amount: 6000,
      paymentDate: '2026-08-05',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'NEFT-889900',
    });

    const conflict = paymentService.recordPayment({
      stayId: stayId1,
      amount: 9000,
      paymentDate: '2026-08-05',
      paymentMethod: 'BANK_TRANSFER',
      referenceNumber: 'NEFT-889900',
    });

    expect(conflict.success).toBe(false);
    expect(conflict.errors[0]).toContain('Duplicate external reference conflict');
    expect(defaultFinanceRepository.getPaymentsByStayId(stayId1)).toHaveLength(1);
  });

  it('TEST 7 — Null/undefined referenceNumber remains valid where supported (e.g., CASH)', () => {
    const cash1 = paymentService.recordPayment({
      stayId: stayId1,
      amount: 1000,
      paymentDate: '2026-08-01',
      paymentMethod: 'CASH',
    });
    const cash2 = paymentService.recordPayment({
      stayId: stayId1,
      amount: 1000,
      paymentDate: '2026-08-02',
      paymentMethod: 'CASH',
    });

    expect(cash1.success).toBe(true);
    expect(cash2.success).toBe(true);
    expect(cash1.payment?.id).not.toBe(cash2.payment?.id);
    expect(defaultFinanceRepository.getPaymentsByStayId(stayId1)).toHaveLength(2);
  });

  it('TEST 8 — Different stays may use the same referenceNumber (stay-scoped)', () => {
    const p1 = paymentService.recordPayment({
      stayId: stayId1,
      amount: 5000,
      paymentDate: '2026-08-01',
      paymentMethod: 'UPI',
      referenceNumber: 'SHARED-REF-001',
    });

    const p2 = paymentService.recordPayment({
      stayId: stayId2,
      amount: 5000,
      paymentDate: '2026-08-01',
      paymentMethod: 'UPI',
      referenceNumber: 'SHARED-REF-001',
    });

    expect(p1.success).toBe(true);
    expect(p2.success).toBe(true);
    expect(p1.payment?.stayId).toBe(stayId1);
    expect(p2.payment?.stayId).toBe(stayId2);
  });

  it('TEST 9 — Concurrent recordPayment calls with the same idempotencyKey produce exactly one payment', async () => {
    billingService.createBill({
      stayId: stayId1,
      billType: 'MONTHLY_RENT',
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      totalAmount: 10000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    });

    const [res1, res2] = await Promise.all([
      Promise.resolve().then(() =>
        paymentService.recordPayment({
          stayId: stayId1,
          amount: 10000,
          paymentDate: '2026-08-05',
          paymentMethod: 'BANK_TRANSFER',
          idempotencyKey: 'concurrent-key-1',
        })
      ),
      Promise.resolve().then(() =>
        paymentService.recordPayment({
          stayId: stayId1,
          amount: 10000,
          paymentDate: '2026-08-05',
          paymentMethod: 'BANK_TRANSFER',
          idempotencyKey: 'concurrent-key-1',
        })
      ),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(res1.payment?.id).toBe(res2.payment?.id);
    expect(defaultFinanceRepository.getPaymentsByStayId(stayId1)).toHaveLength(1);
  });

  it('TEST 10, 11 — Different stays can execute independently without cross-blocking', async () => {
    const [res1, res2] = await Promise.all([
      Promise.resolve().then(() =>
        paymentService.recordPayment({
          stayId: stayId1,
          amount: 3000,
          paymentDate: '2026-08-01',
          paymentMethod: 'CASH',
          idempotencyKey: 'stay1-p',
        })
      ),
      Promise.resolve().then(() =>
        paymentService.recordPayment({
          stayId: stayId2,
          amount: 4000,
          paymentDate: '2026-08-01',
          paymentMethod: 'CASH',
          idempotencyKey: 'stay2-p',
        })
      ),
    ]);

    expect(res1.success).toBe(true);
    expect(res2.success).toBe(true);
    expect(defaultFinanceRepository.getPaymentsByStayId(stayId1)).toHaveLength(1);
    expect(defaultFinanceRepository.getPaymentsByStayId(stayId2)).toHaveLength(1);
  });

  it('TEST 12, 13, 14 — Duplicate payment cannot double-post CASH/BANK, double-create ADVANCE_CREDIT, or double-allocate Bills', () => {
    // Bill for 5,000
    billingService.createBill({
      stayId: stayId1,
      billType: 'MONTHLY_RENT',
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      totalAmount: 5000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 5000, category: 'RENT' }],
    });

    // Pay 8,000 (5,000 AR settlement + 3,000 Advance Credit)
    paymentService.recordPayment({
      stayId: stayId1,
      amount: 8000,
      paymentDate: '2026-08-05',
      paymentMethod: 'UPI',
      idempotencyKey: 'dup-safety-key',
    });

    // Duplicate submission
    paymentService.recordPayment({
      stayId: stayId1,
      amount: 8000,
      paymentDate: '2026-08-05',
      paymentMethod: 'UPI',
      idempotencyKey: 'dup-safety-key',
    });

    const entries = defaultFinanceRepository.getLedgerEntriesByStayId(stayId1);
    const paymentEntries = entries.filter((e) => e.referenceType === LedgerReferenceType.PAYMENT);
    
    // Exactly 3 entries: 1 DR Bank 8000, 1 CR AR 5000, 1 CR Advance 3000
    expect(paymentEntries).toHaveLength(3);

    const bankDebit = paymentEntries.find((e) => e.account === AccountType.BANK)?.debit;
    expect(bankDebit).toBe(8000);

    const advanceCredit = paymentEntries.find((e) => e.account === AccountType.ADVANCE_CREDIT)?.credit;
    expect(advanceCredit).toBe(3000);

    const bill = defaultFinanceRepository.getBillsByStayId(stayId1)[0];
    expect(bill.paidAmount).toBe(5000);
    expect(bill.balanceAmount).toBe(0);
    expect(bill.status).toBe(BillStatus.PAID);
  });

  it('TEST 15, 16, 17, 18 — Mathematical invariants: allocations valid, paid <= total, balance >= 0, ledger balanced', () => {
    billingService.createBill({
      stayId: stayId1,
      billType: 'MONTHLY_RENT',
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      totalAmount: 7500,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 7500, category: 'RENT' }],
    });

    const res = paymentService.recordPayment({
      stayId: stayId1,
      amount: 7500,
      paymentDate: '2026-08-05',
      paymentMethod: 'CASH',
      idempotencyKey: 'math-inv-1',
    });

    expect(res.success).toBe(true);
    const bill = defaultFinanceRepository.getBillsByStayId(stayId1)[0];
    expect(bill.paidAmount).toBe(7500);
    expect(bill.paidAmount).toBeLessThanOrEqual(bill.totalAmount);
    expect(bill.balanceAmount).toBe(0);
    expect(bill.balanceAmount).toBeGreaterThanOrEqual(0);

    const entries = defaultFinanceRepository.getLedgerEntriesByStayId(stayId1);
    const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
    expect(totalDebits).toBe(totalCredits);
  });

  it('TEST 19, 20 — PaymentApplicationService with custom FinanceRepository uses injected BalanceApplicationService and never queries default singleton state', () => {
    class IsolatedMockFinanceRepository implements InMemoryFinanceRepository {
      private ledger: any[] = [];
      private bills: any[] = [];
      private payments: any[] = [];
      private settlements: any[] = [];
      private deposits: any[] = [];

      getLedgerEntries() { return this.ledger; }
      getLedgerEntriesByStayId(stayId: string) { return this.ledger.filter((e) => e.stayId === stayId); }
      saveLedgerEntries(entries: any[]) { this.ledger = entries; return entries; }

      getBills() { return this.bills; }
      getBillsByStayId(stayId: string) { return this.bills.filter((b) => b.stayId === stayId); }
      saveBill(bill: any) { this.bills.push(bill); return bill; }
      saveBills(bills: any[]) { this.bills = bills; return bills; }

      getPayments() { return this.payments; }
      getPaymentsByStayId(stayId: string) { return this.payments.filter((p) => p.stayId === stayId); }
      savePayment(payment: any) { this.payments.push(payment); return payment; }

      getSettlements() { return this.settlements; }
      getSettlementByStayId() { return null; }
      saveSettlement(s: any) { this.settlements.push(s); return s; }

      getDepositTransactions() { return this.deposits; }
      getDepositTransactionsByStayId() { return []; }
      saveDepositTransaction(d: any) { this.deposits.push(d); return d; }
    }

    const customRepo = new IsolatedMockFinanceRepository();
    const customStayRepo = new InMemoryStayRepository([sampleStay1]);
    const customBalanceService = new BalanceApplicationService(customRepo);
    const customLedgerService = new LedgerApplicationService(customRepo, customStayRepo);

    // Put a bill in customRepo
    customRepo.saveBill({
      id: 'custom-bill-1',
      stayId: stayId1,
      billNumber: 'INV-CUSTOM-001',
      billType: 'MONTHLY_RENT',
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      totalAmount: 4000,
      paidAmount: 0,
      balanceAmount: 4000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 4000, category: 'RENT' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    customRepo.saveLedgerEntries([
      {
        id: 'led-c1',
        stayId: stayId1,
        postingDate: '2026-08-01',
        effectiveDate: '2026-08-01',
        referenceType: LedgerReferenceType.BILL,
        referenceId: 'custom-bill-1',
        account: AccountType.ACCOUNTS_RECEIVABLE,
        debit: 4000,
        credit: 0,
        remarks: 'Bill',
        createdBy: 'TEST',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'led-c2',
        stayId: stayId1,
        postingDate: '2026-08-01',
        effectiveDate: '2026-08-01',
        referenceType: LedgerReferenceType.BILL,
        referenceId: 'custom-bill-1',
        account: AccountType.RENT_REVENUE,
        debit: 0,
        credit: 4000,
        remarks: 'Revenue',
        createdBy: 'TEST',
        createdAt: new Date().toISOString(),
      },
    ]);

    // Instantiate hermetic service
    const hermeticPaymentService = new PaymentApplicationService(
      customRepo,
      customStayRepo,
      undefined,
      customLedgerService,
      customBalanceService
    );

    expect(hermeticPaymentService.getBalanceService()).toBe(customBalanceService);

    // Record payment via hermetic service
    const hermeticRes = hermeticPaymentService.recordPayment({
      stayId: stayId1,
      amount: 4000,
      paymentDate: '2026-08-05',
      paymentMethod: 'CASH',
      idempotencyKey: 'hermetic-key-1',
    });

    expect(hermeticRes.success).toBe(true);

    // Custom repo has the payment and ledger entries
    expect(customRepo.getPaymentsByStayId(stayId1)).toHaveLength(1);
    expect(customRepo.getLedgerEntriesByStayId(stayId1)).toHaveLength(4);

    // Default repository remains completely empty/untouched
    expect(defaultFinanceRepository.getPaymentsByStayId(stayId1)).toHaveLength(0);
    expect(defaultFinanceRepository.getLedgerEntriesByStayId(stayId1)).toHaveLength(0);
  });

  it('TEST 21 — PaymentAllocationRule remains pure and deterministic', () => {
    const bills = [
      {
        id: 'b1',
        stayId: stayId1,
        billNumber: 'INV-1',
        billType: 'MONTHLY_RENT' as const,
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-05',
        totalAmount: 5000,
        paidAmount: 0,
        balanceAmount: 5000,
        status: BillStatus.UNPAID,
        lineItems: [],
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
      {
        id: 'b2',
        stayId: stayId1,
        billNumber: 'INV-2',
        billType: 'MONTHLY_RENT' as const,
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-10',
        totalAmount: 3000,
        paidAmount: 0,
        balanceAmount: 3000,
        status: BillStatus.UNPAID,
        lineItems: [],
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
    ];

    const allocResult = calculatePaymentAllocations(bills, 6000);
    expect(allocResult.allocatedTotal).toBe(6000);
    expect(allocResult.advanceCreditTotal).toBe(0);
    expect(allocResult.allocations).toEqual([
      { billId: 'b1', amount: 5000 },
      { billId: 'b2', amount: 1000 },
    ]);
  });

  it('TEST 22, 23, 24 — Existing FC-03A advance auto-consumption and payment queries work seamlessly', () => {
    // 1. Advance payment of 15,000
    paymentService.recordPayment({
      stayId: stayId1,
      amount: 15000,
      paymentDate: '2026-08-01',
      paymentMethod: 'UPI',
      idempotencyKey: 'adv-init-1',
    });

    // 2. Generate Rent bill of 10,000 -> Auto-consumes 10,000 from Advance
    const rentBill = billingService.createBill({
      stayId: stayId1,
      billType: 'MONTHLY_RENT',
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-05',
      totalAmount: 10000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    }).bill!;

    expect(rentBill.status).toBe(BillStatus.PAID);
    expect(rentBill.paidAmount).toBe(10000);

    // 3. Verify payment query use cases
    const all = paymentService.getAllPayments();
    expect(all).toHaveLength(1);

    const forStay = paymentService.getPaymentsByStayId(stayId1);
    expect(forStay).toHaveLength(1);

    const byId = paymentService.getPaymentById(all[0].id);
    expect(byId).toBeDefined();
    expect(byId?.id).toBe(all[0].id);
  });

  describe('Financial Integrity & Failure Boundaries', () => {
    it('TEST 25 — Ledger posting failure: No payment is saved, no bills are allocated, lock is released, and subsequent retry succeeds', () => {
      // Mock ledgerService to return failure
      class FailingLedgerService extends LedgerApplicationService {
        postEntries() {
          return { success: false, entries: [], errors: ['Simulated ledger posting error'] };
        }
      }

      const failingLedgerService = new FailingLedgerService(defaultFinanceRepository, stayRepo);
      const svc = new PaymentApplicationService(
        defaultFinanceRepository,
        stayRepo,
        undefined,
        failingLedgerService
      );

      // Create a bill
      billingService.createBill({
        stayId: stayId1,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-05',
        totalAmount: 5000,
        status: BillStatus.UNPAID,
        lineItems: [{ id: 'li-1', description: 'Rent', amount: 5000, category: 'RENT' }],
      });

      const res = svc.recordPayment({
        stayId: stayId1,
        amount: 5000,
        paymentDate: '2026-08-05',
        paymentMethod: 'CASH',
        idempotencyKey: 'fail-ledger-1',
      });

      expect(res.success).toBe(false);
      expect(res.payment).toBeNull();
      expect(res.errors[0]).toContain('Simulated ledger posting error');

      // Zero payments saved
      expect(defaultFinanceRepository.getPaymentsByStayId(stayId1)).toHaveLength(0);

      // Bill remains UNPAID with 0 paidAmount
      const bill = defaultFinanceRepository.getBillsByStayId(stayId1)[0];
      expect(bill.paidAmount).toBe(0);
      expect(bill.status).toBe(BillStatus.UNPAID);

      // Subsequent valid call with normal service succeeds (lock was released)
      const retryRes = paymentService.recordPayment({
        stayId: stayId1,
        amount: 5000,
        paymentDate: '2026-08-05',
        paymentMethod: 'CASH',
        idempotencyKey: 'fail-ledger-1',
      });

      expect(retryRes.success).toBe(true);
      expect(defaultFinanceRepository.getPaymentsByStayId(stayId1)).toHaveLength(1);
    });

    it('TEST 26, 27, 28 — Payment persistence failure boundary: Compensating rollback cleans ledger and bills, lock is released, and retry produces exactly one financial realization', () => {
      // Custom repo that throws on savePayment on first attempt, but succeeds on retry
      class FlakyPaymentFinanceRepository implements InMemoryFinanceRepository {
        public ledger: any[] = [];
        public bills: any[] = [];
        public payments: any[] = [];
        public settlements: any[] = [];
        public deposits: any[] = [];
        public shouldFailPaymentSave = true;

        getLedgerEntries() { return this.ledger; }
        getLedgerEntriesByStayId(stayId: string) { return this.ledger.filter((e) => e.stayId === stayId); }
        saveLedgerEntries(entries: any[]) { this.ledger = entries; return entries; }

        getBills() { return this.bills; }
        getBillsByStayId(stayId: string) { return this.bills.filter((b) => b.stayId === stayId); }
        saveBill(bill: any) { this.bills.push(bill); return bill; }
        saveBills(bills: any[]) { this.bills = bills; return bills; }

        getPayments() { return this.payments; }
        getPaymentsByStayId(stayId: string) { return this.payments.filter((p) => p.stayId === stayId); }
        savePayment(payment: any) {
          if (this.shouldFailPaymentSave) {
            throw new Error('Simulated repository disk error during savePayment');
          }
          this.payments.push(payment);
          return payment;
        }

        getSettlements() { return this.settlements; }
        getSettlementByStayId() { return null; }
        saveSettlement(s: any) { this.settlements.push(s); return s; }

        getDepositTransactions() { return this.deposits; }
        getDepositTransactionsByStayId() { return []; }
        saveDepositTransaction(d: any) { this.deposits.push(d); return d; }
      }

      const flakyRepo = new FlakyPaymentFinanceRepository();
      const customStayRepo = new InMemoryStayRepository([sampleStay1, sampleStay2]);
      const balanceSvc = new BalanceApplicationService(flakyRepo);
      const ledgerSvc = new LedgerApplicationService(flakyRepo, customStayRepo);
      const billingSvc = new BillingApplicationService(flakyRepo, customStayRepo, ledgerSvc);
      const paymentSvc = new PaymentApplicationService(
        flakyRepo,
        customStayRepo,
        billingSvc,
        ledgerSvc,
        balanceSvc
      );

      // 1. Pre-existing unrelated Ledger entries for stayId1 (Deposit) and stayId2 (Bill)
      flakyRepo.saveLedgerEntries([
        {
          id: 'pre-led-stay1',
          stayId: stayId1,
          postingDate: '2026-07-31',
          effectiveDate: '2026-07-31',
          referenceType: LedgerReferenceType.SETTLEMENT,
          referenceId: 'dep-001',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 0,
          credit: 8000,
          remarks: 'Pre-existing Deposit',
          createdBy: 'TEST',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'pre-led-stay2',
          stayId: stayId2,
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: LedgerReferenceType.BILL,
          referenceId: 'bill-stay2',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 12000,
          credit: 0,
          remarks: 'Stay 2 Bill',
          createdBy: 'TEST',
          createdAt: new Date().toISOString(),
        },
      ]);

      // 2. Pre-existing unrelated Bill for stayId2
      flakyRepo.saveBill({
        id: 'bill-stay2',
        stayId: stayId2,
        billNumber: 'INV-STAY2-001',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        totalAmount: 12000,
        paidAmount: 0,
        balanceAmount: 12000,
        status: BillStatus.UNPAID,
        lineItems: [{ id: 'li-s2', description: 'Rent', amount: 12000, category: 'RENT' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 3. Create target bill for stayId1
      billingSvc.createBill({
        stayId: stayId1,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-05',
        totalAmount: 6000,
        status: BillStatus.UNPAID,
        lineItems: [{ id: 'li-1', description: 'Rent', amount: 6000, category: 'RENT' }],
      });

      // At this point, ledger has 4 entries (2 pre-existing + 2 from stayId1 bill creation)
      expect(flakyRepo.ledger).toHaveLength(4);

      // Attempt payment for stayId1 with idempotency key
      expect(() =>
        paymentSvc.recordPayment({
          stayId: stayId1,
          amount: 6000,
          paymentDate: '2026-08-05',
          paymentMethod: 'UPI',
          idempotencyKey: 'flaky-idem-key',
        })
      ).toThrow('Simulated repository disk error during savePayment');

      // Verify compensating rollback isolation:
      // A. Ledger entries: exactly the 4 pre-existing entries remain (0 payment ledger entries)
      expect(flakyRepo.ledger).toHaveLength(4);
      expect(flakyRepo.ledger.some((e) => e.id === 'pre-led-stay1')).toBe(true);
      expect(flakyRepo.ledger.some((e) => e.id === 'pre-led-stay2')).toBe(true);
      const paymentLedgerEntries = flakyRepo.ledger.filter((e) => e.referenceType === LedgerReferenceType.PAYMENT);
      expect(paymentLedgerEntries).toHaveLength(0);

      // B. Affected bill for stayId1 remains restored to UNPAID with 0 paidAmount
      const billStay1AfterFail = flakyRepo.getBillsByStayId(stayId1)[0];
      expect(billStay1AfterFail.paidAmount).toBe(0);
      expect(billStay1AfterFail.status).toBe(BillStatus.UNPAID);

      // C. Unrelated bill for stayId2 remains completely intact
      const billStay2AfterFail = flakyRepo.getBillsByStayId(stayId2)[0];
      expect(billStay2AfterFail.paidAmount).toBe(0);
      expect(billStay2AfterFail.balanceAmount).toBe(12000);
      expect(billStay2AfterFail.status).toBe(BillStatus.UNPAID);

      // D. Payment entity was not saved
      expect(flakyRepo.payments).toHaveLength(0);

      // Now heal the storage failure and retry with the SAME idempotency key
      flakyRepo.shouldFailPaymentSave = false;

      const retryRes = paymentSvc.recordPayment({
        stayId: stayId1,
        amount: 6000,
        paymentDate: '2026-08-05',
        paymentMethod: 'UPI',
        idempotencyKey: 'flaky-idem-key',
      });

      expect(retryRes.success).toBe(true);
      expect(retryRes.payment).toBeDefined();
      expect(retryRes.payment?.idempotencyKey).toBe('flaky-idem-key');

      // Exactly 1 payment in repo
      expect(flakyRepo.payments).toHaveLength(1);

      // Exactly 6 ledger entries (4 prior + 2 from the single successful payment)
      expect(flakyRepo.ledger).toHaveLength(6);

      // Bill for stayId1 is PAID
      const billStay1AfterSuccess = flakyRepo.getBillsByStayId(stayId1)[0];
      expect(billStay1AfterSuccess.paidAmount).toBe(6000);
      expect(billStay1AfterSuccess.status).toBe(BillStatus.PAID);

      // Bill for stayId2 is still completely intact
      const billStay2AfterSuccess = flakyRepo.getBillsByStayId(stayId2)[0];
      expect(billStay2AfterSuccess.paidAmount).toBe(0);
      expect(billStay2AfterSuccess.status).toBe(BillStatus.UNPAID);
    });
  });
});
