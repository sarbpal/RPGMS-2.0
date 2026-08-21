import { describe, it, expect, beforeEach } from 'vitest';
import { defaultFinanceRepository } from '../../infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../storage/financeStorage';
import { FinanceWorkspaceCoordinator } from '../../application/coordinator/FinanceWorkspaceCoordinator';

describe('Sprint FR-5 — FinanceWorkspacePage & FinanceWorkspaceCoordinator Integration Suite', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rpgms_stays');
      localStorage.removeItem('rpgms_residents');
    }
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
  });

  it('constructs complete FinanceWorkspaceViewModel for FinanceWorkspacePage rendering', () => {
    const coordinator = new FinanceWorkspaceCoordinator();
    const vm = coordinator.createViewModel(8);

    expect(vm).toBeDefined();
    expect(vm.metrics).toBeDefined();
    expect(vm.metrics.outstandingReceivables).toBe(0);
    expect(vm.metrics.totalMonthlyBilling).toBe(0);
    expect(vm.metrics.totalCollections).toBe(0);
    expect(vm.metrics.pendingSettlementsCount).toBe(1); // 1 stay on notice (STAY-2026-00042) in canonical seed data
    expect(vm.outstandingResidents).toEqual([]);
    expect(vm.settlementsReport).toEqual([]);
    expect(vm.activity).toEqual([]);
  });

  it('updates dashboard metrics dynamically when payments and bills are posted', () => {
    const coordinator = new FinanceWorkspaceCoordinator();

    // Post bill for valid active stay STAY-2026-00041
    defaultFinanceRepository.saveBill({
      id: 'bill-test-1',
      billNumber: 'INV-1001',
      stayId: 'STAY-2026-00041',
      billType: 'MONTHLY_RENT',
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      totalAmount: 12000,
      paidAmount: 0,
      balanceAmount: 12000,
      status: 'UNPAID',
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 12000, category: 'RENT' }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    defaultFinanceRepository.saveLedgerEntries([
      {
        id: 'led-bill-1',
        stayId: 'STAY-2026-00041',
        postingDate: '2026-08-01',
        effectiveDate: '2026-08-01',
        referenceType: 'BILL',
        referenceId: 'bill-test-1',
        account: 'ACCOUNTS_RECEIVABLE',
        debit: 12000,
        credit: 0,
        remarks: 'Monthly Rent',
        createdBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
    ]);

    const vmAfterBill = coordinator.createViewModel(8);
    expect(vmAfterBill.metrics.outstandingReceivables).toBe(12000);
    expect(vmAfterBill.metrics.totalMonthlyBilling).toBe(12000);
    expect(vmAfterBill.outstandingResidents.length).toBe(1);

    // Post payment
    defaultFinanceRepository.savePayment({
      id: 'pay-test-1',
      paymentNumber: 'PAY-1001',
      stayId: 'STAY-2026-00041',
      amount: 12000,
      paymentDate: '2026-08-05',
      paymentMethod: 'CASH',
      allocations: [],
      createdAt: new Date().toISOString(),
    });

    defaultFinanceRepository.saveLedgerEntries([
      {
        id: 'led-pay-1',
        stayId: 'STAY-2026-00041',
        postingDate: '2026-08-05',
        effectiveDate: '2026-08-05',
        referenceType: 'PAYMENT',
        referenceId: 'pay-test-1',
        account: 'CASH',
        debit: 12000,
        credit: 0,
        remarks: 'Payment',
        createdBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'led-pay-2',
        stayId: 'STAY-2026-00041',
        postingDate: '2026-08-05',
        effectiveDate: '2026-08-05',
        referenceType: 'PAYMENT',
        referenceId: 'pay-test-1',
        account: 'ACCOUNTS_RECEIVABLE',
        debit: 0,
        credit: 12000,
        remarks: 'Payment',
        createdBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
    ]);

    const vmAfterPay = coordinator.createViewModel(8);
    expect(vmAfterPay.metrics.outstandingReceivables).toBe(0);
    expect(vmAfterPay.metrics.totalCollections).toBe(12000);
    expect(vmAfterPay.outstandingResidents.length).toBe(0);
    expect(vmAfterPay.activity.length).toBeGreaterThan(0);
  });

  describe('Global Action Flow & Stay Selection UI', () => {
    it('provides getActiveStaysForSelection with active and on-notice seed stays', () => {
      const coordinator = new FinanceWorkspaceCoordinator();
      const stays = coordinator.getActiveStaysForSelection();

      expect(stays.length).toBeGreaterThanOrEqual(2);
      const rajesh = stays.find((s) => s.residentName.includes('Rajesh'));
      expect(rajesh).toBeDefined();
      expect(rajesh?.flatName).toContain('101');
      expect(rajesh?.allocatedBedsLabel).toContain('101-B1');

      const amit = stays.find((s) => s.residentName.includes('Amit'));
      expect(amit).toBeDefined();
      expect(amit?.status).toBe('ON_NOTICE');
    });
  });

  describe('Finance Correction F-01 — Resident-Scoped Current Month Charges Suite', () => {
    const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const seedPropertyBills = () => {
      const stayCharges = [
        { stayId: 'stay-000004', amount: 12000 }, // Tito Singh
        { stayId: 'STAY-2026-00041', amount: 8500 },  // Rajesh Kumar
        { stayId: 'STAY-2026-00042', amount: 9000 },  // Amit Sharma
        { stayId: 'stay-000002', amount: 12000 },
        { stayId: 'stay-000003', amount: 12000 },
        { stayId: 'stay-000005', amount: 12000 },
        { stayId: 'stay-000006', amount: 12000 },
        { stayId: 'stay-000007', amount: 12000 },
      ];

      stayCharges.forEach((sc, idx) => {
        defaultFinanceRepository.saveBill({
          id: `bill-prop-${idx + 1}`,
          billNumber: `INV-${currentMonthStr.replace('-', '')}-${String(idx + 1).padStart(4, '0')}`,
          stayId: sc.stayId,
          billType: 'MONTHLY_RENT',
          period: currentMonthStr,
          issueDate: `${currentMonthStr}-01`,
          dueDate: `${currentMonthStr}-07`,
          totalAmount: sc.amount,
          paidAmount: 0,
          balanceAmount: sc.amount,
          status: 'UNPAID',
          lineItems: [{ id: `li-prop-${idx + 1}`, description: 'Rent', amount: sc.amount, category: 'RENT' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    };

    it('TEST 1 & TEST 5: preserves property-wide metrics.totalMonthlyBilling = 89,500 while isolating stay-scoped monthly charges = 12,000', () => {
      seedPropertyBills();
      const coordinator = new FinanceWorkspaceCoordinator();

      // TEST 5: Verify property-wide dashboard total is exactly ₹89,500
      const dashboardVm = coordinator.createViewModel(8);
      expect(dashboardVm.metrics.totalMonthlyBilling).toBe(89500);

      // TEST 1: Query bills for Tito Singh (stay-000004) specifically
      const titoBills = defaultFinanceRepository.getBillsByStayId('stay-000004');
      const titoCurrentMonthCharges = titoBills
        .filter((b) => b.period === currentMonthStr && b.status !== 'CANCELLED')
        .reduce((sum, b) => sum + b.totalAmount, 0);

      expect(titoCurrentMonthCharges).toBe(12000);
      expect(titoCurrentMonthCharges).not.toBe(89500);
      expect(dashboardVm.metrics.totalMonthlyBilling).not.toBe(titoCurrentMonthCharges);
    });

    it('TEST 2: enforces strict stay isolation between Stay A and Stay B', () => {
      seedPropertyBills();

      // Stay A (stay-000004, Tito Singh) = ₹12,000
      // Stay B (STAY-2026-00041, Rajesh Kumar) = ₹8,500
      const billsA = defaultFinanceRepository.getBillsByStayId('stay-000004');
      const stayACharges = billsA
        .filter((b) => b.period === currentMonthStr && b.status !== 'CANCELLED')
        .reduce((sum, b) => sum + b.totalAmount, 0);

      const billsB = defaultFinanceRepository.getBillsByStayId('STAY-2026-00041');
      const stayBCharges = billsB
        .filter((b) => b.period === currentMonthStr && b.status !== 'CANCELLED')
        .reduce((sum, b) => sum + b.totalAmount, 0);

      expect(stayACharges).toBe(12000);
      expect(stayBCharges).toBe(8500);
      expect(stayACharges + stayBCharges).toBe(20500);
      // Stay A never shows combined or other stays' bills
      expect(stayACharges).not.toBe(20500);
      expect(stayBCharges).not.toBe(20500);
    });

    it('TEST 3: excludes CANCELLED bills from stay-scoped current month charges', () => {
      seedPropertyBills();
      const stayId = 'stay-000004';

      // Add a cancelled bill for Tito Singh
      defaultFinanceRepository.saveBill({
        id: 'bill-cancelled-1',
        billNumber: 'INV-CANCELLED-001',
        stayId,
        billType: 'ONE_TIME_CHARGE',
        period: currentMonthStr,
        issueDate: `${currentMonthStr}-10`,
        dueDate: `${currentMonthStr}-10`,
        totalAmount: 3000,
        paidAmount: 0,
        balanceAmount: 0,
        status: 'CANCELLED',
        lineItems: [{ id: 'li-c-1', description: 'Cancelled Fee', amount: 3000, category: 'OTHER' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const bills = defaultFinanceRepository.getBillsByStayId(stayId);
      const activeCharges = bills
        .filter((b) => b.period === currentMonthStr && b.status !== 'CANCELLED')
        .reduce((sum, b) => sum + b.totalAmount, 0);

      // Active charges should remain 12000, excluding the 3000 cancelled bill
      expect(activeCharges).toBe(12000);
    });

    it('TEST 4: verifies Outstanding Balance remains derived independently from ledger entries', () => {
      const stayId = 'stay-000004';

      defaultFinanceRepository.saveLedgerEntries([
        {
          id: 'led-tito-1',
          stayId,
          postingDate: `${currentMonthStr}-01`,
          effectiveDate: `${currentMonthStr}-01`,
          referenceType: 'BILL',
          referenceId: 'bill-prop-1',
          account: 'ACCOUNTS_RECEIVABLE',
          debit: 12000,
          credit: 0,
          remarks: 'Monthly Rent',
          createdBy: 'SYSTEM',
          createdAt: new Date().toISOString(),
        },
      ]);

      const coordinator = new FinanceWorkspaceCoordinator();
      const balances = coordinator.balanceEngine.calculateStayBalances(stayId);

      expect(balances.receivableBalance).toBe(12000);
    });
  });
});
