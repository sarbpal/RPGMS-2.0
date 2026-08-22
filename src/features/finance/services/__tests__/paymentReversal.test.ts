import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentApplicationService } from '../paymentService';
import { BillingApplicationService } from '../billingService';
import { LedgerApplicationService } from '../ledgerService';
import { BalanceApplicationService } from '../balanceEngine';
import { SettlementApplicationService } from '../settlementService';
import { ReportingApplicationService } from '../reportingService';
import { InMemoryFinanceRepository } from '../../infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository, Stay, StayStatus } from '../../../stay';
import { InMemoryResidentRepository, ResidentStatus, type Resident } from '../../../resident';
import { ResidentLifecycleService } from '../../../resident/services/ResidentLifecycleService';
import { AccountType, LedgerReferenceType, BillStatus, type BillType } from '../../domain';

describe('FC-07 — Payment Reversal & Financial Integrity Suite', () => {
  let financeRepo: InMemoryFinanceRepository;
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let ledgerService: LedgerApplicationService;
  let balanceService: BalanceApplicationService;
  let billingService: BillingApplicationService;
  let paymentService: PaymentApplicationService;
  let settlementService: SettlementApplicationService;
  let reportingService: ReportingApplicationService;
  let residentLifecycleService: ResidentLifecycleService;

  const testStayId = 'stay_rev_test_101';
  const testResidentId = 'res_rev_test_101';

  const createTestBill = (stayId: string, amount: number, period = '2026-06', desc = 'Monthly Rent') => {
    return billingService.createBill({
      stayId,
      billType: 'MONTHLY_RENT' as BillType,
      period,
      issueDate: `${period}-01`,
      dueDate: `${period}-07`,
      totalAmount: amount,
      status: 'UNPAID' as BillStatus,
      lineItems: [
        {
          id: `li_${Date.now()}_${Math.random()}`,
          description: desc,
          amount,
          category: 'RENT',
          obligationKey: `RENT:${stayId}:${period}-01:${amount}`,
        },
      ],
      remarks: desc,
    });
  };

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
    financeStorage.saveStoredDepositTransactions([]);

    financeRepo = new InMemoryFinanceRepository();
    stayRepo = new InMemoryStayRepository();
    residentRepo = new InMemoryResidentRepository();
    residentLifecycleService = new ResidentLifecycleService(residentRepo, stayRepo, financeRepo);

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
    settlementService = new SettlementApplicationService(
      financeRepo,
      stayRepo,
      undefined,
      residentRepo,
      undefined,
      undefined,
      residentLifecycleService
    );
    reportingService = new ReportingApplicationService(
      financeRepo,
      stayRepo,
      residentRepo,
      billingService,
      paymentService,
      settlementService
    );

    const testResident: Resident = {
      id: testResidentId,
      fullName: 'Vikram Mehta',
      residentCode: 'R00202',
      mobileNumber: '9123456780',
      status: ResidentStatus.ACTIVE,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
    residentRepo.save(testResident);

    const testStay = new Stay({
      id: testStayId,
      residentId: testResidentId,
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-06-01',
      allocatedBedIds: ['bed-202-a'],
      agreedRent: 12000,
      agreedDeposit: 10000,
    });
    stayRepo.saveSync(testStay);
  });

  describe('1. Basic Payment Reversal (Single Bill, Multi-Bill, Mixed, Pure Advance)', () => {
    it('reverses a single-bill allocated payment and restores bill to UNPAID', () => {
      // 1. Generate Rent Bill ₹12,000
      const billRes = createTestBill(testStayId, 12000, '2026-06');
      expect(billRes.success).toBe(true);
      expect(balanceService.getAccountBalance(testStayId, AccountType.ACCOUNTS_RECEIVABLE)).toBe(12000);

      // 2. Record full payment ₹12,000 via UPI
      const payRes = paymentService.recordPayment({
        stayId: testStayId,
        amount: 12000,
        paymentDate: '2026-06-05',
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-123456',
        remarks: 'June Rent Payment',
      });
      expect(payRes.success).toBe(true);
      expect(balanceService.getAccountBalance(testStayId, AccountType.ACCOUNTS_RECEIVABLE)).toBe(0);

      const billAfterPay = financeRepo.getBillsByStayId(testStayId)[0];
      expect(billAfterPay.paidAmount).toBe(12000);
      expect(billAfterPay.balanceAmount).toBe(0);
      expect(billAfterPay.status).toBe(BillStatus.PAID);

      // 3. Execute Reversal
      const revRes = paymentService.reversePayment({
        paymentId: payRes.payment!.id,
        reversalReason: 'Cheque/UPI bounced by resident bank',
        reversedBy: 'ACCOUNTS_OPERATOR',
      });

      expect(revRes.success).toBe(true);
      expect(revRes.payment?.status).toBe('REVERSED');
      expect(revRes.payment?.reversalReason).toBe('Cheque/UPI bounced by resident bank');
      expect(revRes.payment?.reversedBy).toBe('ACCOUNTS_OPERATOR');
      expect(revRes.payment?.reversedAt).toBeDefined();

      // 4. Invariant: Ledger Accounts Receivable Restored
      expect(balanceService.getAccountBalance(testStayId, AccountType.ACCOUNTS_RECEIVABLE)).toBe(12000);

      // 5. Invariant: Bill State Restored to UNPAID
      const billAfterRev = financeRepo.getBillsByStayId(testStayId)[0];
      expect(billAfterRev.paidAmount).toBe(0);
      expect(billAfterRev.balanceAmount).toBe(12000);
      expect(billAfterRev.status).toBe(BillStatus.UNPAID);

      // 6. Invariant: Reversal Ledger Entries Posted
      const ledgerEntries = financeRepo.getLedgerEntriesByStayId(testStayId);
      const revEntries = ledgerEntries.filter((e) => e.referenceType === LedgerReferenceType.REVERSAL);
      expect(revEntries.length).toBe(2);
      expect(revEntries.find((e) => e.account === AccountType.BANK)?.credit).toBe(12000);
      expect(revEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE)?.debit).toBe(12000);
    });

    it('reverses a multi-bill allocated payment and restores all bills in FIFO order', () => {
      // 2 Bills: June Rent ₹8,000 + July Rent ₹2,000 = ₹10,000
      createTestBill(testStayId, 8000, '2026-06', 'June Rent');
      createTestBill(testStayId, 2000, '2026-07', 'July Rent');

      const payRes = paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-10',
        paymentMethod: 'BANK_TRANSFER',
      });
      expect(payRes.success).toBe(true);
      expect(payRes.payment?.allocations.length).toBe(2);

      // Execute Reversal
      const revRes = paymentService.reversePayment({
        paymentId: payRes.payment!.id,
        reversalReason: 'Wrong bank transfer credited by mistake',
      });
      expect(revRes.success).toBe(true);

      // Verify both bills restored
      const bills = financeRepo.getBillsByStayId(testStayId);
      bills.forEach((b) => {
        expect(b.paidAmount).toBe(0);
        expect(b.balanceAmount).toBe(b.totalAmount);
        expect(b.status).toBe(BillStatus.UNPAID);
      });
      expect(balanceService.getAccountBalance(testStayId, AccountType.ACCOUNTS_RECEIVABLE)).toBe(10000);
    });

    it('reverses a mixed payment (Allocations + Advance Credit)', () => {
      // Bill: ₹6,000. Payment: ₹10,000 (Receivable: ₹6,000, Advance: ₹4,000)
      createTestBill(testStayId, 6000, '2026-06');
      const payRes = paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-05',
        paymentMethod: 'BANK_TRANSFER',
      });
      expect(payRes.success).toBe(true);
      expect(balanceService.getAccountBalance(testStayId, AccountType.ACCOUNTS_RECEIVABLE)).toBe(0);
      expect(balanceService.getAccountBalance(testStayId, AccountType.ADVANCE_CREDIT)).toBe(4000);

      // Execute Reversal
      const revRes = paymentService.reversePayment({
        paymentId: payRes.payment!.id,
        reversalReason: 'Duplicate bank entry',
      });
      expect(revRes.success).toBe(true);

      // Verify Receivable restored to ₹6,000, Advance derecognized to ₹0
      expect(balanceService.getAccountBalance(testStayId, AccountType.ACCOUNTS_RECEIVABLE)).toBe(6000);
      expect(balanceService.getAccountBalance(testStayId, AccountType.ADVANCE_CREDIT)).toBe(0);

      const bill = financeRepo.getBillsByStayId(testStayId)[0];
      expect(bill.status).toBe(BillStatus.UNPAID);
      expect(bill.balanceAmount).toBe(6000);

      // Check reversal ledger entries: CR BANK 10,000, DR AR 6,000, DR ADV 4,000
      const revEntries = financeRepo
        .getLedgerEntriesByStayId(testStayId)
        .filter((e) => e.referenceType === LedgerReferenceType.REVERSAL);
      expect(revEntries.length).toBe(3);
      expect(revEntries.find((e) => e.account === AccountType.BANK)?.credit).toBe(10000);
      expect(revEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE)?.debit).toBe(6000);
      expect(revEntries.find((e) => e.account === AccountType.ADVANCE_CREDIT)?.debit).toBe(4000);
    });

    it('reverses a pure Advance Credit payment without modifying any bills', () => {
      // Payment with 0 dues
      const payRes = paymentService.recordPayment({
        stayId: testStayId,
        amount: 8000,
        paymentDate: '2026-06-01',
        paymentMethod: 'CASH',
      });
      expect(payRes.success).toBe(true);
      expect(balanceService.getAccountBalance(testStayId, AccountType.ADVANCE_CREDIT)).toBe(8000);

      // Reversal
      const revRes = paymentService.reversePayment({
        paymentId: payRes.payment!.id,
        reversalReason: 'Cash returned to resident',
      });
      expect(revRes.success).toBe(true);
      expect(balanceService.getAccountBalance(testStayId, AccountType.ADVANCE_CREDIT)).toBe(0);

      const revEntries = financeRepo
        .getLedgerEntriesByStayId(testStayId)
        .filter((e) => e.referenceType === LedgerReferenceType.REVERSAL);
      expect(revEntries.length).toBe(2);
      expect(revEntries.find((e) => e.account === AccountType.CASH)?.credit).toBe(8000);
      expect(revEntries.find((e) => e.account === AccountType.ADVANCE_CREDIT)?.debit).toBe(8000);
    });
  });

  describe('2. Historical Immutability (Rule 2)', () => {
    it('preserves original Payment amount, original allocations, and original ledger entries', () => {
      createTestBill(testStayId, 10000, '2026-06');
      const payRes = paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-05',
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-99999',
      });
      const originalPay = payRes.payment!;
      const originalEntryCount = financeRepo.getLedgerEntries().length;

      // Reversal
      const revRes = paymentService.reversePayment({
        paymentId: originalPay.id,
        reversalReason: 'Transaction cancelled',
      });
      expect(revRes.success).toBe(true);

      // Re-read Payment from repository
      const storedPayment = paymentService.getPaymentById(originalPay.id)!;
      expect(storedPayment.amount).toBe(10000);
      expect(storedPayment.allocations.length).toBe(1);
      expect(storedPayment.allocations[0].amount).toBe(10000);
      expect(storedPayment.referenceNumber).toBe('UPI-99999');
      expect(storedPayment.status).toBe('REVERSED');

      // Original ledger entries remain intact
      const allEntries = financeRepo.getLedgerEntries();
      expect(allEntries.length).toBe(originalEntryCount + 2); // 2 new reversal entries appended
      const originalEntries = allEntries.filter(
        (e) => e.referenceType === LedgerReferenceType.PAYMENT && e.referenceId === originalPay.id
      );
      expect(originalEntries.length).toBe(2);
    });
  });

  describe('3. Preservation of Later Payments on Same Bill (Rule 6)', () => {
    it('reverses first payment on a bill while keeping subsequent payments intact', () => {
      // Bill: ₹10,000
      const billRes = createTestBill(testStayId, 10000, '2026-06');
      const billId = billRes.bill!.id;

      // Payment A: ₹6,000 (bill owed: ₹4,000)
      const payA = paymentService.recordPayment({
        stayId: testStayId,
        amount: 6000,
        paymentDate: '2026-06-05',
        paymentMethod: 'UPI',
      }).payment!;

      // Payment B: ₹4,000 (bill paid: ₹10,000, status: PAID)
      paymentService.recordPayment({
        stayId: testStayId,
        amount: 4000,
        paymentDate: '2026-06-07',
        paymentMethod: 'CASH',
      });

      let bill = financeRepo.getBillsByStayId(testStayId).find((b) => b.id === billId)!;
      expect(bill.paidAmount).toBe(10000);
      expect(bill.status).toBe(BillStatus.PAID);

      // Reverse Payment A (₹6,000)
      const revRes = paymentService.reversePayment({
        paymentId: payA.id,
        reversalReason: 'Payment A charged back',
      });
      expect(revRes.success).toBe(true);

      // Bill should reflect Payment B's ₹4,000 intact (paid: ₹4,000, balance: ₹6,000, PARTIALLY_PAID)
      bill = financeRepo.getBillsByStayId(testStayId).find((b) => b.id === billId)!;
      expect(bill.paidAmount).toBe(4000);
      expect(bill.balanceAmount).toBe(6000);
      expect(bill.status).toBe(BillStatus.PARTIALLY_PAID);
      expect(balanceService.getAccountBalance(testStayId, AccountType.ACCOUNTS_RECEIVABLE)).toBe(6000);
    });
  });

  describe('4. Consumed Advance Credit Guard (Rule 8 - Mandatory Critical Scenario)', () => {
    it('CRITICAL: strictly rejects reversal if advance credit was already consumed by downstream billing', () => {
      // 1. Payment A creates ₹10,000 Advance Credit
      const payA = paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-01',
        paymentMethod: 'BANK_TRANSFER',
      }).payment!;
      expect(balanceService.getAccountBalance(testStayId, AccountType.ADVANCE_CREDIT)).toBe(10000);

      // 2. Later billing generates ₹8,000 bill and auto-consumes ₹8,000 of the advance credit
      createTestBill(testStayId, 8000, '2026-06');
      paymentService.applyAdvanceCreditToBills(testStayId);

      // Live Advance Credit is now ₹2,000 (8,000 consumed)
      expect(balanceService.getAccountBalance(testStayId, AccountType.ADVANCE_CREDIT)).toBe(2000);
      const bill = financeRepo.getBillsByStayId(testStayId)[0];
      expect(bill.status).toBe(BillStatus.PAID);

      const entryCountBefore = financeRepo.getLedgerEntries().length;

      // 3. Attempt to reverse Payment A
      const revRes = paymentService.reversePayment({
        paymentId: payA.id,
        reversalReason: 'Attempting invalid reversal of consumed advance',
      });

      // 4. Expected: REJECTED with actionable message, NO ledger mutation, NO bill mutation
      expect(revRes.success).toBe(false);
      expect(revRes.errors[0]).toContain('already been consumed by subsequent bills');
      expect(revRes.errors[0]).toContain('8,000');

      // Verify no changes occurred
      expect(balanceService.getAccountBalance(testStayId, AccountType.ADVANCE_CREDIT)).toBe(2000);
      expect(financeRepo.getLedgerEntries().length).toBe(entryCountBefore);
      expect(paymentService.getPaymentById(payA.id)?.status).toBe('RECORDED');
      expect(financeRepo.getBillsByStayId(testStayId)[0].status).toBe(BillStatus.PAID);
    });
  });

  describe('5. Settlement Protection (Rule 11)', () => {
    it('strictly rejects payment reversal on a stay that has completed financial settlement', () => {
      // 1. Bill and Payment
      createTestBill(testStayId, 10000, '2026-06');
      const pay = paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-05',
        paymentMethod: 'UPI',
      }).payment!;

      // 2. Complete Settlement
      const previewRes = settlementService.generateSettlementPreview(testStayId);
      expect(previewRes.success).toBe(true);
      const confirmRes = settlementService.confirmSettlement(previewRes.preview!);
      expect(confirmRes.success).toBe(true);
      expect(confirmRes.settlement?.status).toBe('SETTLED');

      // 3. Attempt Payment Reversal
      const revRes = paymentService.reversePayment({
        paymentId: pay.id,
        reversalReason: 'Attempt to reverse on settled stay',
      });

      expect(revRes.success).toBe(false);
      expect(revRes.errors[0]).toContain('already completed financial settlement');
      expect(paymentService.getPaymentById(pay.id)?.status).toBe('RECORDED');
    });
  });

  describe('6. Post-Checkout Reversal (Rule 12)', () => {
    it('allows payment reversal on a CHECKED_OUT stay before settlement without affecting checkout status', () => {
      createTestBill(testStayId, 10000, '2026-06');
      const pay = paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-05',
        paymentMethod: 'UPI',
      }).payment!;

      // Stay checks out
      const stay = stayRepo.findByIdSync(testStayId)!;
      stay.processCheckout({ actualCheckoutDate: '2026-06-30', reason: 'Normal checkout' });
      stayRepo.saveSync(stay);
      expect(stay.status).toBe(StayStatus.CHECKED_OUT);

      // Reversal post-checkout
      const revRes = paymentService.reversePayment({
        paymentId: pay.id,
        reversalReason: 'Post-checkout discovered invalid payment',
      });
      expect(revRes.success).toBe(true);
      expect(revRes.payment?.status).toBe('REVERSED');
      expect(stayRepo.findByIdSync(testStayId)?.status).toBe(StayStatus.CHECKED_OUT);
      expect(balanceService.getAccountBalance(testStayId, AccountType.ACCOUNTS_RECEIVABLE)).toBe(10000);
    });
  });

  describe('7. Idempotency & Double Reversal Prevention (Rule 14 & 15)', () => {
    it('replays identical reversal with same idempotencyKey without duplicate ledger entries', () => {
      createTestBill(testStayId, 10000, '2026-06');
      const pay = paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-05',
        paymentMethod: 'UPI',
      }).payment!;

      const key = 'IDEMP-REV-001';
      const res1 = paymentService.reversePayment({
        paymentId: pay.id,
        reversalReason: 'Incorrect transaction',
        idempotencyKey: key,
      });
      expect(res1.success).toBe(true);
      const entryCountAfterFirst = financeRepo.getLedgerEntries().length;

      // Replay
      const res2 = paymentService.reversePayment({
        paymentId: pay.id,
        reversalReason: 'Incorrect transaction',
        idempotencyKey: key,
      });
      expect(res2.success).toBe(true);
      expect(res2.payment?.id).toBe(pay.id);
      expect(financeRepo.getLedgerEntries().length).toBe(entryCountAfterFirst);
    });

    it('rejects reversal with same idempotencyKey but conflicting parameters', () => {
      createTestBill(testStayId, 10000, '2026-06');
      const pay = paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-05',
        paymentMethod: 'UPI',
      }).payment!;

      const key = 'IDEMP-REV-002';
      paymentService.reversePayment({
        paymentId: pay.id,
        reversalReason: 'First reason',
        idempotencyKey: key,
      });

      const resConflict = paymentService.reversePayment({
        paymentId: pay.id,
        reversalReason: 'Different conflicting reason',
        idempotencyKey: key,
      });
      expect(resConflict.success).toBe(false);
      expect(resConflict.errors[0]).toContain('Idempotency key conflict');
    });

    it('rejects duplicate reversal on an already reversed payment without idempotency replay', () => {
      createTestBill(testStayId, 10000, '2026-06');
      const pay = paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-05',
        paymentMethod: 'UPI',
      }).payment!;

      paymentService.reversePayment({
        paymentId: pay.id,
        reversalReason: 'First reversal',
      });

      // Second attempt with new reason / key
      const resSecond = paymentService.reversePayment({
        paymentId: pay.id,
        reversalReason: 'Second reversal attempt',
      });
      expect(resSecond.success).toBe(false);
      expect(resSecond.errors[0]).toContain('already been reversed');
    });
  });

  describe('8. Compensating Rollback Safety (Rule 18)', () => {
    it('restores ledger, bills, and payments cleanly if repository throws during payment update', () => {
      createTestBill(testStayId, 10000, '2026-06');
      const pay = paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-05',
        paymentMethod: 'UPI',
      }).payment!;

      const initialEntries = financeRepo.getLedgerEntries().length;
      const initialBills = financeRepo.getBills().map((b) => ({ ...b }));

      // Mock savePayment to throw
      const origSavePayment = financeRepo.savePayment.bind(financeRepo);
      vi.spyOn(financeRepo, 'savePayment').mockImplementation(() => {
        throw new Error('Database disk write failure on savePayment');
      });

      const revRes = paymentService.reversePayment({
        paymentId: pay.id,
        reversalReason: 'Rollback test',
      });

      expect(revRes.success).toBe(false);
      expect(revRes.errors[0]).toContain('rolled back');

      // Verify complete rollback to pre-operation snapshot
      expect(financeRepo.getLedgerEntries().length).toBe(initialEntries);
      expect(financeRepo.getBills()).toEqual(initialBills);
      expect(paymentService.getPaymentById(pay.id)?.status).toBe('RECORDED');

      vi.spyOn(financeRepo, 'savePayment').mockImplementation(origSavePayment);
    });
  });

  describe('9. Reporting Reconciliation (Rule 20)', () => {
    it('excludes reversed payments from MonthlyCollections and ResidentFinancialSummary reports', () => {
      // Rent ₹15,000
      createTestBill(testStayId, 15000, '2026-06');

      // Payment 1: ₹10,000 (valid)
      paymentService.recordPayment({
        stayId: testStayId,
        amount: 10000,
        paymentDate: '2026-06-05',
        paymentMethod: 'BANK_TRANSFER',
      });

      // Payment 2: ₹5,000 (will be reversed)
      const pay2 = paymentService.recordPayment({
        stayId: testStayId,
        amount: 5000,
        paymentDate: '2026-06-06',
        paymentMethod: 'CASH',
      }).payment!;

      let monthlyReport = reportingService.getMonthlyCollections(6, 2026);
      expect(monthlyReport.totalCollections).toBe(15000);
      expect(monthlyReport.paymentCount).toBe(2);

      let residentSummary = reportingService.getResidentFinancialSummary(testStayId)!;
      expect(residentSummary.totalPaymentsAmount).toBe(15000);

      // Reverse Payment 2
      paymentService.reversePayment({
        paymentId: pay2.id,
        reversalReason: 'Invalid cash collection',
      });

      // Reports must now show only ₹10,000
      monthlyReport = reportingService.getMonthlyCollections(6, 2026);
      expect(monthlyReport.totalCollections).toBe(10000);
      expect(monthlyReport.cashCollections).toBe(0);
      expect(monthlyReport.bankCollections).toBe(10000);
      expect(monthlyReport.paymentCount).toBe(1);

      residentSummary = reportingService.getResidentFinancialSummary(testStayId)!;
      expect(residentSummary.totalPaymentsAmount).toBe(10000);
      expect(residentSummary.currentBalance).toBe(5000); // ₹5,000 receivable restored
    });
  });
});
