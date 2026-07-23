import type { LedgerEntry } from '../entities/LedgerEntry';
import type { StayBalance, FinanceSummary } from '../valueObjects/StayBalance';
import { AccountType } from '../valueObjects/AccountType';

export interface AccountTotals {
  debit: number;
  credit: number;
}

/**
 * Business Rule: Account Net Balance Derivation
 * 
 * Asset accounts (ACCOUNTS_RECEIVABLE, CASH, BANK): balance = sum(debit) - sum(credit)
 * Liability & Revenue accounts: balance = sum(credit) - sum(debit)
 */
export function calculateAccountBalance(entries: LedgerEntry[], stayId: string, account: AccountType): number {
  let debit = 0;
  let credit = 0;

  for (const entry of entries) {
    if (entry.stayId === stayId && entry.account === account) {
      debit += entry.debit;
      credit += entry.credit;
    }
  }

  let net: number;
  if (
    account === AccountType.ACCOUNTS_RECEIVABLE ||
    account === AccountType.CASH ||
    account === AccountType.BANK
  ) {
    net = debit - credit;
  } else {
    net = credit - debit;
  }

  return Math.max(0, Math.round(net * 100) / 100);
}

/**
 * Business Rule: Stay Balance Calculation
 * 
 * Invariant: Balances are derived dynamically from immutable ledger entries.
 */
export function calculateStayBalancesFromLedger(entries: LedgerEntry[], stayId: string): StayBalance {
  const receivableBalance = calculateAccountBalance(entries, stayId, AccountType.ACCOUNTS_RECEIVABLE);
  const securityDepositHeld = calculateAccountBalance(entries, stayId, AccountType.SECURITY_DEPOSIT_LIABILITY);
  const advanceCreditBalance = calculateAccountBalance(entries, stayId, AccountType.ADVANCE_CREDIT);
  const refundPayable = calculateAccountBalance(entries, stayId, AccountType.REFUND_PAYABLE);

  const netBalance = Math.round((receivableBalance - advanceCreditBalance) * 100) / 100;

  return {
    receivableBalance,
    securityDepositHeld,
    advanceCreditBalance,
    refundPayable,
    netBalance,
  };
}

/**
 * Business Rule: Property-Wide Finance Summary Derivation
 */
export function calculateFinanceSummaryFromLedger(entries: LedgerEntry[]): FinanceSummary {
  const stayIds = Array.from(new Set(entries.map((e) => e.stayId)));

  let totalCollected = 0;
  let totalOutstanding = 0;
  let totalDepositHeld = 0;
  let totalAdvanceCredit = 0;

  for (const entry of entries) {
    if (entry.account === AccountType.CASH || entry.account === AccountType.BANK) {
      totalCollected += entry.debit;
    }
  }

  for (const stayId of stayIds) {
    const balances = calculateStayBalancesFromLedger(entries, stayId);
    totalOutstanding += balances.receivableBalance;
    totalDepositHeld += balances.securityDepositHeld;
    totalAdvanceCredit += balances.advanceCreditBalance;
  }

  return {
    totalCollected: Math.round(totalCollected * 100) / 100,
    totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    totalDepositHeld: Math.round(totalDepositHeld * 100) / 100,
    totalAdvanceCredit: Math.round(totalAdvanceCredit * 100) / 100,
  };
}
