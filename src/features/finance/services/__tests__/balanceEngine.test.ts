import { describe, it, expect, beforeEach } from 'vitest';
import { balanceEngine } from '../balanceEngine';
import { ledgerService } from '../ledgerService';
import { financeStorage } from '../../storage/financeStorage';
import { AccountType } from '../../domain';

describe('BalanceEngine Unit Test Suite (Sprint FR-3)', () => {
  const sampleStayId = 'stay-bal-101';

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
  });

  describe('Dynamic Account Balance Derivations', () => {
    it('returns zero for all account balances when no ledger entries exist for a stayId', () => {
      const balances = balanceEngine.calculateStayBalances(sampleStayId);

      expect(balances.receivableBalance).toBe(0);
      expect(balances.securityDepositHeld).toBe(0);
      expect(balances.advanceCreditBalance).toBe(0);
      expect(balances.netBalance).toBe(0);
    });

    it('derives ACCOUNTS_RECEIVABLE balance as sum(debit) - sum(credit)', () => {
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: 'BILL',
          referenceId: 'b-1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 10000,
          credit: 0,
          remarks: 'Bill 1',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: 'BILL',
          referenceId: 'b-1',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 10000,
          remarks: 'Bill 1 Rev',
          createdBy: 'TEST',
        },
      ]);

      // Post 4,000 payment
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: '2026-08-05',
          effectiveDate: '2026-08-05',
          referenceType: 'PAYMENT',
          referenceId: 'p-1',
          account: AccountType.CASH,
          debit: 4000,
          credit: 0,
          remarks: 'Payment 1',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: '2026-08-05',
          effectiveDate: '2026-08-05',
          referenceType: 'PAYMENT',
          referenceId: 'p-1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 0,
          credit: 4000,
          remarks: 'Payment 1 Rec Reduction',
          createdBy: 'TEST',
        },
      ]);

      const receivable = balanceEngine.getAccountBalance(sampleStayId, AccountType.ACCOUNTS_RECEIVABLE);
      expect(receivable).toBe(6000); // 10000 - 4000
    });

    it('derives SECURITY_DEPOSIT_LIABILITY as sum(credit) - sum(debit)', () => {
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: 'BILL',
          referenceId: 'dep-1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 8000,
          credit: 0,
          remarks: 'Deposit Rec',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: 'BILL',
          referenceId: 'dep-1',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 0,
          credit: 8000,
          remarks: 'Deposit Liability',
          createdBy: 'TEST',
        },
      ]);

      const depHeld = balanceEngine.getAccountBalance(sampleStayId, AccountType.SECURITY_DEPOSIT_LIABILITY);
      expect(depHeld).toBe(8000);
    });

    it('derives ADVANCE_CREDIT balance as sum(credit) - sum(debit)', () => {
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: 'PAYMENT',
          referenceId: 'p-adv',
          account: AccountType.BANK,
          debit: 3000,
          credit: 0,
          remarks: 'Overpayment Bank',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: 'PAYMENT',
          referenceId: 'p-adv',
          account: AccountType.ADVANCE_CREDIT,
          debit: 0,
          credit: 3000,
          remarks: 'Overpayment Credit',
          createdBy: 'TEST',
        },
      ]);

      const advBalance = balanceEngine.getAccountBalance(sampleStayId, AccountType.ADVANCE_CREDIT);
      expect(advBalance).toBe(3000);
    });
  });

  describe('Property-Wide Finance Summary Derivation (DEF-FIN-003)', () => {
    it('calculates net totalCollected correctly when cash and bank receipts and refund payouts occur', () => {
      // 1. Initial rent bills for two stays
      ledgerService.postEntries([
        {
          stayId: 'stay-1',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: 'BILL',
          referenceId: 'b-1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 10000,
          credit: 0,
          remarks: 'Rent Stay 1',
          createdBy: 'TEST',
        },
        {
          stayId: 'stay-1',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: 'BILL',
          referenceId: 'b-1',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 10000,
          remarks: 'Rent Stay 1',
          createdBy: 'TEST',
        },
      ]);

      ledgerService.postEntries([
        {
          stayId: 'stay-2',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: 'BILL',
          referenceId: 'b-2',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 12000,
          credit: 0,
          remarks: 'Rent Stay 2',
          createdBy: 'TEST',
        },
        {
          stayId: 'stay-2',
          postingDate: '2026-08-01',
          effectiveDate: '2026-08-01',
          referenceType: 'BILL',
          referenceId: 'b-2',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 12000,
          remarks: 'Rent Stay 2',
          createdBy: 'TEST',
        },
      ]);

      // 2. Stay 1 pays 10,000 via CASH (debit Cash 10,000, credit AR 10,000)
      ledgerService.postEntries([
        {
          stayId: 'stay-1',
          postingDate: '2026-08-02',
          effectiveDate: '2026-08-02',
          referenceType: 'PAYMENT',
          referenceId: 'pay-1',
          account: AccountType.CASH,
          debit: 10000,
          credit: 0,
          remarks: 'Cash Payment Stay 1',
          createdBy: 'TEST',
        },
        {
          stayId: 'stay-1',
          postingDate: '2026-08-02',
          effectiveDate: '2026-08-02',
          referenceType: 'PAYMENT',
          referenceId: 'pay-1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 0,
          credit: 10000,
          remarks: 'Cash Payment Stay 1',
          createdBy: 'TEST',
        },
      ]);

      // 3. Stay 2 pays 12,000 via BANK (debit Bank 12,000, credit AR 12,000)
      ledgerService.postEntries([
        {
          stayId: 'stay-2',
          postingDate: '2026-08-03',
          effectiveDate: '2026-08-03',
          referenceType: 'PAYMENT',
          referenceId: 'pay-2',
          account: AccountType.BANK,
          debit: 12000,
          credit: 0,
          remarks: 'Bank Payment Stay 2',
          createdBy: 'TEST',
        },
        {
          stayId: 'stay-2',
          postingDate: '2026-08-03',
          effectiveDate: '2026-08-03',
          referenceType: 'PAYMENT',
          referenceId: 'pay-2',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 0,
          credit: 12000,
          remarks: 'Bank Payment Stay 2',
          createdBy: 'TEST',
        },
      ]);

      // Verify intermediate totalCollected = 10000 + 12000 = 22000
      let summary = balanceEngine.calculateFinanceSummary();
      expect(summary.totalCollected).toBe(22000);
      expect(summary.totalOutstanding).toBe(0);

      // 4. Stay 1 receives a 2,000 CASH refund (debit Security Deposit Liability 2000, credit Cash 2000)
      ledgerService.postEntries([
        {
          stayId: 'stay-1',
          postingDate: '2026-08-10',
          effectiveDate: '2026-08-10',
          referenceType: 'SETTLEMENT',
          referenceId: 'stl-1',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 2000,
          credit: 0,
          remarks: 'Deposit Refund Stay 1',
          createdBy: 'TEST',
        },
        {
          stayId: 'stay-1',
          postingDate: '2026-08-10',
          effectiveDate: '2026-08-10',
          referenceType: 'SETTLEMENT',
          referenceId: 'stl-1',
          account: AccountType.CASH,
          debit: 0,
          credit: 2000,
          remarks: 'Deposit Refund Cash Payout Stay 1',
          createdBy: 'TEST',
        },
      ]);

      // 5. Stay 2 receives a 3,000 BANK refund payout (credit Bank 3000)
      ledgerService.postEntries([
        {
          stayId: 'stay-2',
          postingDate: '2026-08-10',
          effectiveDate: '2026-08-10',
          referenceType: 'SETTLEMENT',
          referenceId: 'stl-2',
          account: AccountType.REFUND_PAYABLE,
          debit: 3000,
          credit: 0,
          remarks: 'Refund Payable Settlement Stay 2',
          createdBy: 'TEST',
        },
        {
          stayId: 'stay-2',
          postingDate: '2026-08-10',
          effectiveDate: '2026-08-10',
          referenceType: 'SETTLEMENT',
          referenceId: 'stl-2',
          account: AccountType.BANK,
          debit: 0,
          credit: 3000,
          remarks: 'Refund Bank Payout Stay 2',
          createdBy: 'TEST',
        },
      ]);

      // Net totalCollected must be 22000 - 2000 - 3000 = 17000
      summary = balanceEngine.calculateFinanceSummary();
      expect(summary.totalCollected).toBe(17000);
      expect(summary.totalOutstanding).toBe(0);
    });

    it('derives unclamped negative net totalCollected when cash/bank refunds exceed cash/bank receipts', () => {
      // Seed a deposit refund payout without prior cash receipts in the period
      ledgerService.postEntries([
        {
          stayId: 'stay-3',
          postingDate: '2026-08-15',
          effectiveDate: '2026-08-15',
          referenceType: 'SETTLEMENT',
          referenceId: 'stl-3',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 5000,
          credit: 0,
          remarks: 'Deposit Refund Payout',
          createdBy: 'TEST',
        },
        {
          stayId: 'stay-3',
          postingDate: '2026-08-15',
          effectiveDate: '2026-08-15',
          referenceType: 'SETTLEMENT',
          referenceId: 'stl-3',
          account: AccountType.BANK,
          debit: 0,
          credit: 5000,
          remarks: 'Bank Refund Disbursement',
          createdBy: 'TEST',
        },
      ]);

      const summary = balanceEngine.calculateFinanceSummary();
      // Must reflect -5000 accurately without artificial zero-clamping
      expect(summary.totalCollected).toBe(-5000);
    });
  });
});
