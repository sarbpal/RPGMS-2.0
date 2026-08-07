import { describe, it, expect, beforeEach } from 'vitest';
import { defaultFinanceRepository } from '../../infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../storage/financeStorage';
import { settlementService } from '../../services/settlementService';
import { balanceEngine } from '../../services/balanceEngine';

describe('Sprint FR-5 — ResidentFinancialProfile & SettlementDialog Integration Suite', () => {
  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
  });

  it('calculates stay balances accurately when bills and payments are recorded', () => {
    const stayId = 'STAY-000001';

    // Seed bill
    defaultFinanceRepository.saveBill({
      id: 'bill-201',
      billNumber: 'INV-2026-001',
      stayId,
      billType: 'MONTHLY_RENT',
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      totalAmount: 15000,
      paidAmount: 0,
      balanceAmount: 15000,
      status: 'UNPAID',
      lineItems: [
        {
          id: 'li-1',
          description: 'Monthly Rent for 2026-08',
          amount: 15000,
          category: 'RENT',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    defaultFinanceRepository.saveLedgerEntries([
      {
        id: 'led-201',
        stayId,
        postingDate: '2026-08-01',
        effectiveDate: '2026-08-01',
        referenceType: 'BILL',
        referenceId: 'bill-201',
        account: 'ACCOUNTS_RECEIVABLE',
        debit: 15000,
        credit: 0,
        remarks: 'Monthly Rent Billed',
        createdBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
    ]);

    const initialBalances = balanceEngine.calculateStayBalances(stayId);
    expect(initialBalances.receivableBalance).toBe(15000);

    // Simulate payment recording
    defaultFinanceRepository.savePayment({
      id: 'pay-201',
      paymentNumber: 'PAY-2001',
      stayId,
      amount: 15000,
      paymentDate: '2026-08-03',
      paymentMethod: 'UPI',
      allocations: [],
      createdAt: new Date().toISOString(),
    });

    defaultFinanceRepository.saveLedgerEntries([
      {
        id: 'led-202',
        stayId,
        postingDate: '2026-08-03',
        effectiveDate: '2026-08-03',
        referenceType: 'PAYMENT',
        referenceId: 'pay-201',
        account: 'BANK',
        debit: 15000,
        credit: 0,
        remarks: 'UPI Payment Received',
        createdBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'led-203',
        stayId,
        postingDate: '2026-08-03',
        effectiveDate: '2026-08-03',
        referenceType: 'PAYMENT',
        referenceId: 'pay-201',
        account: 'ACCOUNTS_RECEIVABLE',
        debit: 0,
        credit: 15000,
        remarks: 'Receivable Cleared',
        createdBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
    ]);

    const updatedBalances = balanceEngine.calculateStayBalances(stayId);
    expect(updatedBalances.receivableBalance).toBe(0);
  });

  it('generates Stage 1 settlement preview via settlementService for checkout dialog', () => {
    const stayId = 'STAY-000001';

    // Seed Security Deposit liability entry (10,000 held)
    defaultFinanceRepository.saveLedgerEntries([
      {
        id: 'led-dep-1',
        stayId,
        postingDate: '2026-08-01',
        effectiveDate: '2026-08-01',
        referenceType: 'SETTLEMENT',
        referenceId: 'init-dep',
        account: 'SECURITY_DEPOSIT_LIABILITY',
        debit: 0,
        credit: 10000,
        remarks: 'Security deposit held',
        createdBy: 'SYSTEM',
        createdAt: new Date().toISOString(),
      },
    ]);

    const previewResult = settlementService.generateSettlementPreview(stayId, 2000, 'Room painting deduction');

    expect(previewResult.success).toBe(true);
    expect(previewResult.preview).toBeDefined();
    expect(previewResult.preview?.securityDepositHeld).toBe(10000);
    expect(previewResult.preview?.damageDeductions).toBe(2000);
    expect(previewResult.preview?.netSettlementAmount).toBe(8000);
    expect(previewResult.preview?.outcome).toBe('HOSTEL_REFUNDS_RESIDENT');
  });
});
