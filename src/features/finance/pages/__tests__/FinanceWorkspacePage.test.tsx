import { describe, it, expect, beforeEach } from 'vitest';
import { defaultFinanceRepository } from '../../infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../storage/financeStorage';
import { FinanceWorkspaceCoordinator } from '../../application/coordinator/FinanceWorkspaceCoordinator';

describe('Sprint FR-5 — FinanceWorkspacePage & FinanceWorkspaceCoordinator Integration Suite', () => {
  beforeEach(() => {
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
    expect(vm.metrics.pendingSettlementsCount).toBe(0);
    expect(vm.outstandingResidents).toEqual([]);
    expect(vm.settlementsReport).toEqual([]);
    expect(vm.activity).toEqual([]);
  });

  it('updates dashboard metrics dynamically when payments and bills are posted', () => {
    const coordinator = new FinanceWorkspaceCoordinator();

    // Post bill for valid active stay STAY-000001
    defaultFinanceRepository.saveBill({
      id: 'bill-test-1',
      billNumber: 'INV-1001',
      stayId: 'STAY-000001',
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
        stayId: 'STAY-000001',
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
      stayId: 'STAY-000001',
      amount: 12000,
      paymentDate: '2026-08-05',
      paymentMethod: 'CASH',
      allocations: [],
      createdAt: new Date().toISOString(),
    });

    defaultFinanceRepository.saveLedgerEntries([
      {
        id: 'led-pay-1',
        stayId: 'STAY-000001',
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
        stayId: 'STAY-000001',
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
});
