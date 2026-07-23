import type { StayBalance, FinanceSummary } from '../types';
import { AccountType } from '../types';
import { ledgerService } from './ledgerService';

export const balanceEngine = {
  /**
   * Helper: Calculate total debits and credits for a specific account for a given stay (or all stays).
   * 
   * @param stayId Target Stay ID (or undefined for all stays)
   * @param account Target AccountType
   * @returns Object containing total debit and total credit amounts
   */
  getAccountTotals(stayId?: string, account?: AccountType): { debit: number; credit: number } {
    const entries = stayId
      ? ledgerService.getEntriesForStay(stayId)
      : ledgerService.getEntries();

    let debit = 0;
    let credit = 0;

    entries.forEach((e) => {
      if (!account || e.account === account) {
        debit += e.debit || 0;
        credit += e.credit || 0;
      }
    });

    return {
      debit: Math.round(debit * 100) / 100,
      credit: Math.round(credit * 100) / 100,
    };
  },

  /**
   * Helper: Calculate the net balance for a specific account for a given stay.
   * - Asset accounts (ACCOUNTS_RECEIVABLE, CASH, BANK): balance = sum(debit) - sum(credit)
   * - Liability & Revenue accounts (SECURITY_DEPOSIT_LIABILITY, ADVANCE_CREDIT, REFUND_PAYABLE, RENT_REVENUE, DAMAGE_RECOVERY): balance = sum(credit) - sum(debit)
   * 
   * @param stayId Target Stay ID
   * @param account Target AccountType
   * @returns Net account balance
   */
  getAccountBalance(stayId: string, account: AccountType): number {
    const totals = this.getAccountTotals(stayId, account);

    let net: number;
    if (
      account === AccountType.ACCOUNTS_RECEIVABLE ||
      account === AccountType.CASH ||
      account === AccountType.BANK
    ) {
      net = totals.debit - totals.credit;
    } else {
      net = totals.credit - totals.debit;
    }


    return Math.max(0, Math.round(net * 100) / 100);
  },

  /**
   * Derive all dynamic financial balances for a specific Stay ID directly from its ledger entries.
   * Computes Accounts Receivable, Advance Credit, Security Deposit Held, Refund Payable, and Net Outstanding.
   * 
   * @param stayId Target Stay ID
   * @returns StayBalance object containing derived financial balances
   */
  calculateStayBalances(stayId: string): StayBalance {
    if (!stayId || stayId.trim() === '') {
      return {
        receivableBalance: 0,
        securityDepositHeld: 0,
        advanceCreditBalance: 0,
        refundPayable: 0,
        netBalance: 0,
      };
    }

    const receivableBalance = this.getAccountBalance(stayId, AccountType.ACCOUNTS_RECEIVABLE);
    const securityDepositHeld = this.getAccountBalance(
      stayId,
      AccountType.SECURITY_DEPOSIT_LIABILITY
    );
    const advanceCreditBalance = this.getAccountBalance(stayId, AccountType.ADVANCE_CREDIT);
    const refundPayable = this.getAccountBalance(stayId, AccountType.REFUND_PAYABLE);

    // Net balance = Receivable Balance - Advance Credit Balance
    const netBalance = Math.round((receivableBalance - advanceCreditBalance) * 100) / 100;

    return {
      receivableBalance,
      securityDepositHeld,
      advanceCreditBalance,
      refundPayable,
      netBalance,
    };
  },

  /**
   * Derive property-wide aggregated financial summary metrics directly from all ledger entries.
   * Computes Total Collections (Cash + Bank), Total Outstanding Receivables, Total Deposits Held, and Total Advance Credits.
   * 
   * @returns FinanceSummary object containing property-wide metrics
   */
  calculateFinanceSummary(): FinanceSummary {
    const cashTotals = this.getAccountTotals(undefined, AccountType.CASH);
    const bankTotals = this.getAccountTotals(undefined, AccountType.BANK);
    const arTotals = this.getAccountTotals(undefined, AccountType.ACCOUNTS_RECEIVABLE);
    const depositTotals = this.getAccountTotals(undefined, AccountType.SECURITY_DEPOSIT_LIABILITY);
    const advanceTotals = this.getAccountTotals(undefined, AccountType.ADVANCE_CREDIT);

    // Total collected = Cash debits + Bank debits
    const totalCollected = Math.max(
      0,
      Math.round((cashTotals.debit + bankTotals.debit) * 100) / 100
    );

    // Total outstanding receivables = AR debits - AR credits
    const totalOutstanding = Math.max(
      0,
      Math.round((arTotals.debit - arTotals.credit) * 100) / 100
    );

    // Total deposits held = Deposit credits - Deposit debits
    const totalDepositHeld = Math.max(
      0,
      Math.round((depositTotals.credit - depositTotals.debit) * 100) / 100
    );

    // Total advance credit = Advance credits - Advance debits
    const totalAdvanceCredit = Math.max(
      0,
      Math.round((advanceTotals.credit - advanceTotals.debit) * 100) / 100
    );

    return {
      totalCollected,
      totalOutstanding,
      totalDepositHeld,
      totalAdvanceCredit,
    };
  },
};
