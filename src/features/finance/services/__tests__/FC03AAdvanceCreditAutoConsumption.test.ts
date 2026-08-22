import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentApplicationService } from '../paymentService';
import { BillingApplicationService } from '../billingService';
import { DepositApplicationService } from '../depositService';
import { balanceEngine } from '../balanceEngine';
import { defaultFinanceRepository } from '../../infrastructure';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { AccountType, BillStatus, LedgerReferenceType } from '../../domain';

describe('FC-03A — Advance Credit Lifecycle & Auto-Consumption Test Suite', () => {
  let paymentService: PaymentApplicationService;
  let billingService: BillingApplicationService;
  let depositService: DepositApplicationService;
  let stayRepo: InMemoryStayRepository;

  const stayId = 'stay-fc03a-001';
  const residentId = 'res-fc03a-001';
  const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const sampleStay = new Stay({
    id: stayId,
    residentId,
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: '2026-08-01',
    agreedRent: 10000,
    agreedDeposit: 8000,
    allocatedBedIds: ['bed-101-a'],
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

    stayRepo = new InMemoryStayRepository([sampleStay]);
    billingService = new BillingApplicationService(defaultFinanceRepository, stayRepo);
    paymentService = new PaymentApplicationService(defaultFinanceRepository, stayRepo, billingService);
    depositService = new DepositApplicationService(defaultFinanceRepository, stayRepo);
  });

  it('Test 1 — No Advance available results in zero consumption without modifying bill', () => {
    const createResult = billingService.createBill({
      stayId,
      billType: 'MONTHLY_RENT',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-05`,
      totalAmount: 10000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    });

    expect(createResult.success).toBe(true);
    expect(createResult.bill?.status).toBe(BillStatus.UNPAID);
    expect(createResult.bill?.paidAmount).toBe(0);
    expect(createResult.bill?.balanceAmount).toBe(10000);

    const balances = balanceEngine.calculateStayBalances(stayId);
    expect(balances.receivableBalance).toBe(10000);
    expect(balances.advanceCreditBalance).toBe(0);
    expect(balances.netBalance).toBe(10000);
  });

  it('Test 2, 13, 14, 15, 16, 17, 18 — Advance < Bill: Partial payment, balanced Ledger entries, and exact balances', () => {
    // 1. Create an advance payment of ₹4,000 (when receivable is 0)
    paymentService.recordPayment({
      stayId,
      amount: 4000,
      paymentDate: `${currentMonthStr}-01`,
      paymentMethod: 'UPI',
      remarks: 'Prepaid advance',
    });

    let balances = balanceEngine.calculateStayBalances(stayId);
    expect(balances.advanceCreditBalance).toBe(4000);
    expect(balances.receivableBalance).toBe(0);
    expect(balances.netBalance).toBe(-4000);

    // 2. Realize a Rent bill of ₹10,000
    const createResult = billingService.createBill({
      stayId,
      billType: 'MONTHLY_RENT',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-05`,
      totalAmount: 10000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    });

    expect(createResult.success).toBe(true);
    const bill = createResult.bill!;
    expect(bill.paidAmount).toBe(4000);
    expect(bill.balanceAmount).toBe(6000);
    expect(bill.status).toBe(BillStatus.PARTIALLY_PAID);

    // 3. Verify Ledger entries
    const entries = defaultFinanceRepository.getLedgerEntriesByStayId(stayId);
    const advanceAppEntries = entries.filter(
      (e) => e.referenceType === LedgerReferenceType.ADVANCE_APPLICATION
    );
    expect(advanceAppEntries).toHaveLength(2);

    // Debit ADVANCE_CREDIT
    const advDebit = advanceAppEntries.find((e) => e.account === AccountType.ADVANCE_CREDIT);
    expect(advDebit?.debit).toBe(4000);
    expect(advDebit?.credit).toBe(0);
    expect(advDebit?.referenceId).toBe(`ADV-APP:${bill.id}`);

    // Credit ACCOUNTS_RECEIVABLE
    const arCredit = advanceAppEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
    expect(arCredit?.credit).toBe(4000);
    expect(arCredit?.debit).toBe(0);
    expect(arCredit?.referenceId).toBe(`ADV-APP:${bill.id}`);

    // Verify Ledger is perfectly balanced
    const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
    const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
    expect(totalDebits).toBe(totalCredits);

    // 4. Verify live derived balances
    balances = balanceEngine.calculateStayBalances(stayId);
    expect(balances.advanceCreditBalance).toBe(0);
    expect(balances.receivableBalance).toBe(6000);
    expect(balances.netBalance).toBe(6000);
  });

  it('Test 3 — Advance == Bill results in full payment and zero remaining balances', () => {
    paymentService.recordPayment({
      stayId,
      amount: 8000,
      paymentDate: `${currentMonthStr}-01`,
      paymentMethod: 'BANK_TRANSFER',
    });

    const createResult = billingService.createBill({
      stayId,
      billType: 'MONTHLY_RENT',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-05`,
      totalAmount: 8000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 8000, category: 'RENT' }],
    });

    const bill = createResult.bill!;
    expect(bill.paidAmount).toBe(8000);
    expect(bill.balanceAmount).toBe(0);
    expect(bill.status).toBe(BillStatus.PAID);

    const balances = balanceEngine.calculateStayBalances(stayId);
    expect(balances.advanceCreditBalance).toBe(0);
    expect(balances.receivableBalance).toBe(0);
    expect(balances.netBalance).toBe(0);
  });

  it('Test 4 — Advance > Bill results in full payment with leftover advance credit', () => {
    paymentService.recordPayment({
      stayId,
      amount: 15000,
      paymentDate: `${currentMonthStr}-01`,
      paymentMethod: 'UPI',
    });

    const createResult = billingService.createBill({
      stayId,
      billType: 'MONTHLY_RENT',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-05`,
      totalAmount: 10000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    });

    const bill = createResult.bill!;
    expect(bill.paidAmount).toBe(10000);
    expect(bill.balanceAmount).toBe(0);
    expect(bill.status).toBe(BillStatus.PAID);

    const balances = balanceEngine.calculateStayBalances(stayId);
    expect(balances.advanceCreditBalance).toBe(5000);
    expect(balances.receivableBalance).toBe(0);
    expect(balances.netBalance).toBe(-5000);
  });

  it('Test 5, 6, 7, 19 — Multi-bill chronological due date allocation across consecutive obligations', () => {
    // 1. Advance payment of ₹10,000
    paymentService.recordPayment({
      stayId,
      amount: 10000,
      paymentDate: `${currentMonthStr}-01`,
      paymentMethod: 'BANK_TRANSFER',
    });

    // 2. Bill 1: Electricity (Due Aug 02, ₹3,000)
    const bill1 = billingService.createBill({
      stayId,
      billType: 'ONE_TIME_CHARGE',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-02`,
      totalAmount: 3000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-e1', description: 'Electricity', amount: 3000, category: 'UTILITIES' }],
    }).bill!;

    expect(bill1.paidAmount).toBe(3000);
    expect(bill1.status).toBe(BillStatus.PAID);
    expect(balanceEngine.calculateStayBalances(stayId).advanceCreditBalance).toBe(7000);

    // 3. Bill 2: Laundry (Due Aug 04, ₹4,000)
    const bill2 = billingService.createBill({
      stayId,
      billType: 'ONE_TIME_CHARGE',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-04`,
      totalAmount: 4000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-l1', description: 'Laundry', amount: 4000, category: 'LAUNDRY' }],
    }).bill!;

    expect(bill2.paidAmount).toBe(4000);
    expect(bill2.status).toBe(BillStatus.PAID);
    expect(balanceEngine.calculateStayBalances(stayId).advanceCreditBalance).toBe(3000);

    // 4. Bill 3: Maintenance (Due Aug 07, ₹5,000)
    const bill3 = billingService.createBill({
      stayId,
      billType: 'ONE_TIME_CHARGE',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-07`,
      totalAmount: 5000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-m1', description: 'Maintenance', amount: 5000, category: 'MAINTENANCE' }],
    }).bill!;

    expect(bill3.paidAmount).toBe(3000);
    expect(bill3.balanceAmount).toBe(2000);
    expect(bill3.status).toBe(BillStatus.PARTIALLY_PAID);

    const finalBalances = balanceEngine.calculateStayBalances(stayId);
    expect(finalBalances.advanceCreditBalance).toBe(0);
    expect(finalBalances.receivableBalance).toBe(2000);
    expect(finalBalances.netBalance).toBe(2000);
  });

  it('Test 10 — Security Deposit is completely excluded from Advance Credit auto-consumption', () => {
    // 1. Record Security Deposit Contribution of ₹8,000
    depositService.recordDepositContribution(stayId, 8000, 'BANK_TRANSFER', 'Admission deposit');

    let balances = balanceEngine.calculateStayBalances(stayId);
    expect(balances.securityDepositHeld).toBe(8000);
    expect(balances.advanceCreditBalance).toBe(0);
    expect(balances.receivableBalance).toBe(0);

    // 2. Realize a Rent bill of ₹10,000
    const createResult = billingService.createBill({
      stayId,
      billType: 'MONTHLY_RENT',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-05`,
      totalAmount: 10000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    });

    const bill = createResult.bill!;
    // Security deposit MUST NOT be consumed for monthly rent
    expect(bill.paidAmount).toBe(0);
    expect(bill.balanceAmount).toBe(10000);
    expect(bill.status).toBe(BillStatus.UNPAID);

    balances = balanceEngine.calculateStayBalances(stayId);
    expect(balances.securityDepositHeld).toBe(8000);
    expect(balances.advanceCreditBalance).toBe(0);
    expect(balances.receivableBalance).toBe(10000);
  });

  it('Test 11, 12, 20 — Repeated applyAdvanceCreditToBills calls are strictly idempotent and prevent double-consumption', () => {
    // 1. Advance of ₹5,000
    paymentService.recordPayment({
      stayId,
      amount: 5000,
      paymentDate: `${currentMonthStr}-01`,
      paymentMethod: 'UPI',
    });

    // 2. Bill of ₹10,000 (auto-consumes ₹5,000)
    const bill = billingService.createBill({
      stayId,
      billType: 'MONTHLY_RENT',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-05`,
      totalAmount: 10000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    }).bill!;

    expect(bill.paidAmount).toBe(5000);
    expect(bill.balanceAmount).toBe(5000);
    expect(bill.status).toBe(BillStatus.PARTIALLY_PAID);

    // 3. Repeat call manually
    const repeatResult = paymentService.applyAdvanceCreditToBills(stayId);
    expect(repeatResult.success).toBe(true);
    expect(repeatResult.consumedTotal).toBe(0);
    expect(repeatResult.updatedBills).toHaveLength(0);

    const entries = defaultFinanceRepository.getLedgerEntriesByStayId(stayId);
    const advanceAppEntries = entries.filter(
      (e) => e.referenceType === LedgerReferenceType.ADVANCE_APPLICATION
    );
    // Still only exactly 2 entries (1 debit + 1 credit for the single consumption)
    expect(advanceAppEntries).toHaveLength(2);
  });

  it('Test 21, 22, 23 — Source-agnostic realization: Generic auto-consumption works uniformly across Rent, Utility, and Laundry', () => {
    // Advance of ₹15,000
    paymentService.recordPayment({
      stayId,
      amount: 15000,
      paymentDate: `${currentMonthStr}-01`,
      paymentMethod: 'BANK_TRANSFER',
    });

    // 1. Rent Bill
    const rentBill = billingService.generateMonthlyRentBill(stayId, currentMonthStr).bill!;
    expect(rentBill.status).toBe(BillStatus.PAID);
    expect(rentBill.paidAmount).toBe(10000);

    // 2. Utility Bill
    const utilBill = billingService.generateRecurringChargeBill(
      stayId,
      currentMonthStr,
      'ELECTRICITY',
      'Electricity Bill',
      2000
    ).bill!;
    expect(utilBill.status).toBe(BillStatus.PAID);
    expect(utilBill.paidAmount).toBe(2000);

    // 3. Laundry Bill
    const laundryBill = billingService.generateLaundryChargeBill(
      stayId,
      1500,
      `${currentMonthStr}-03`,
      'Laundry Service'
    ).bill!;
    expect(laundryBill.status).toBe(BillStatus.PAID);
    expect(laundryBill.paidAmount).toBe(1500);

    // Remaining Advance = 15000 - 10000 - 2000 - 1500 = 1500
    const balances = balanceEngine.calculateStayBalances(stayId);
    expect(balances.advanceCreditBalance).toBe(1500);
    expect(balances.receivableBalance).toBe(0);
  });

  it('Test 24 — Concurrent overlapping executions cannot double-consume Advance Credit or create duplicate ledger entries', async () => {
    // 1. Advance of ₹10,000
    paymentService.recordPayment({
      stayId,
      amount: 10000,
      paymentDate: `${currentMonthStr}-01`,
      paymentMethod: 'BANK_TRANSFER',
    });

    // 2. Open an unpaid Bill of ₹8,000 directly in repository (simulating pre-existing bill)
    const billId = 'bill-concurrent-001';
    defaultFinanceRepository.saveBill({
      id: billId,
      stayId,
      billNumber: 'INV-CONCURRENT-001',
      billType: 'MONTHLY_RENT',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-05`,
      totalAmount: 8000,
      paidAmount: 0,
      balanceAmount: 8000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-c1', description: 'Rent', amount: 8000, category: 'RENT' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Post bill realization entry to ledger
    defaultFinanceRepository.saveLedgerEntries([
      ...defaultFinanceRepository.getLedgerEntries(),
      {
        id: `led-bill-${Date.now()}-1`,
        stayId,
        postingDate: `${currentMonthStr}-01`,
        effectiveDate: `${currentMonthStr}-01`,
        referenceType: LedgerReferenceType.BILL,
        referenceId: billId,
        account: AccountType.ACCOUNTS_RECEIVABLE,
        debit: 8000,
        credit: 0,
        remarks: 'Bill realization',
        createdBy: 'TEST',
        createdAt: new Date().toISOString(),
      },
      {
        id: `led-bill-${Date.now()}-2`,
        stayId,
        postingDate: `${currentMonthStr}-01`,
        effectiveDate: `${currentMonthStr}-01`,
        referenceType: LedgerReferenceType.BILL,
        referenceId: billId,
        account: AccountType.RENT_REVENUE,
        debit: 0,
        credit: 8000,
        remarks: 'Revenue recognition',
        createdBy: 'TEST',
        createdAt: new Date().toISOString(),
      },
    ]);

    // 3. Execute overlapping concurrent calls
    const [resultA, resultB] = await Promise.all([
      Promise.resolve().then(() => paymentService.applyAdvanceCreditToBills(stayId)),
      Promise.resolve().then(() => paymentService.applyAdvanceCreditToBills(stayId)),
    ]);

    // Total consumed across both calls must NOT exceed ₹8,000 (never double-consumed)
    const totalConsumed = resultA.consumedTotal + resultB.consumedTotal;
    expect(totalConsumed).toBe(8000);

    // Bill must be paid exactly once
    const updatedBill = defaultFinanceRepository.getBills().find((b) => b.id === billId)!;
    expect(updatedBill.paidAmount).toBe(8000);
    expect(updatedBill.balanceAmount).toBe(0);
    expect(updatedBill.status).toBe(BillStatus.PAID);

    // Verify exactly one pair of ADV-APP entries in the ledger
    const entries = defaultFinanceRepository.getLedgerEntriesByStayId(stayId);
    const advAppEntries = entries.filter(
      (e) => e.referenceType === LedgerReferenceType.ADVANCE_APPLICATION
    );
    expect(advAppEntries).toHaveLength(2); // 1 debit + 1 credit

    // Verify remaining advance credit
    const balances = balanceEngine.calculateStayBalances(stayId);
    expect(balances.advanceCreditBalance).toBe(2000);
    expect(balances.receivableBalance).toBe(0);
  });

  it('Test 25 — Ledger duplicate protection: Existing ADV-APP ledger entry prevents duplicate application on stale bill', () => {
    // 1. Advance of ₹10,000
    paymentService.recordPayment({
      stayId,
      amount: 10000,
      paymentDate: `${currentMonthStr}-01`,
      paymentMethod: 'UPI',
    });

    const billId = 'bill-idempotency-001';
    // 2. Simulate existing ADV-APP entry already present in the ledger for this bill
    defaultFinanceRepository.saveLedgerEntries([
      ...defaultFinanceRepository.getLedgerEntries(),
      {
        id: 'led-adv-1',
        stayId,
        postingDate: `${currentMonthStr}-01`,
        effectiveDate: `${currentMonthStr}-01`,
        referenceType: LedgerReferenceType.ADVANCE_APPLICATION,
        referenceId: `ADV-APP:${billId}`,
        account: AccountType.ADVANCE_CREDIT,
        debit: 6000,
        credit: 0,
        remarks: 'Advance applied',
        createdBy: 'TEST',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'led-adv-2',
        stayId,
        postingDate: `${currentMonthStr}-01`,
        effectiveDate: `${currentMonthStr}-01`,
        referenceType: LedgerReferenceType.ADVANCE_APPLICATION,
        referenceId: `ADV-APP:${billId}`,
        account: AccountType.ACCOUNTS_RECEIVABLE,
        debit: 0,
        credit: 6000,
        remarks: 'Receivable reduced',
        createdBy: 'TEST',
        createdAt: new Date().toISOString(),
      },
    ]);

    // Stale bill in repository with totalAmount 6000 but still showing UNPAID
    defaultFinanceRepository.saveBill({
      id: billId,
      stayId,
      billNumber: 'INV-IDEM-001',
      billType: 'MONTHLY_RENT',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-05`,
      totalAmount: 6000,
      paidAmount: 0,
      balanceAmount: 6000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 6000, category: 'RENT' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Call applyAdvanceCreditToBills
    const result = paymentService.applyAdvanceCreditToBills(stayId);
    expect(result.success).toBe(true);
    expect(result.consumedTotal).toBe(0);

    // No new ledger entries created
    const advAppEntries = defaultFinanceRepository
      .getLedgerEntriesByStayId(stayId)
      .filter((e) => e.referenceType === LedgerReferenceType.ADVANCE_APPLICATION);
    expect(advAppEntries).toHaveLength(2);
  });
});
