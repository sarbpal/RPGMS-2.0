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
});
