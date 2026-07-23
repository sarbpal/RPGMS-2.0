import type { LedgerEntry } from '../entities/LedgerEntry';

/**
 * Business Rule: Double Entry Validation
 * 
 * Invariant: Every financial posting must be double-entry balanced.
 * Sum of Debits MUST equal Sum of Credits across all entries in a posting batch.
 * Amounts must be non-negative and specify valid accounts.
 */
export function validateDoubleEntry(entries: Array<Omit<LedgerEntry, 'id' | 'createdAt'>>): void {
  if (!entries || entries.length === 0) {
    throw new Error('Ledger posting batch cannot be empty.');
  }

  let totalDebit = 0;
  let totalCredit = 0;

  for (const entry of entries) {
    if (!entry.stayId) {
      throw new Error('Ledger entry must belong to a Stay.');
    }
    if (!entry.account) {
      throw new Error('Ledger entry must specify an AccountType.');
    }
    if (entry.debit < 0 || entry.credit < 0) {
      throw new Error('Ledger entry amounts cannot be negative.');
    }
    if (entry.debit === 0 && entry.credit === 0) {
      throw new Error('Ledger entry must have either debit or credit amount greater than 0.');
    }
    totalDebit += entry.debit;
    totalCredit += entry.credit;
  }

  const roundedDebit = Math.round(totalDebit * 100) / 100;
  const roundedCredit = Math.round(totalCredit * 100) / 100;

  if (roundedDebit !== roundedCredit) {
    throw new Error(
      `Double-entry imbalance detected: Total Debit (${roundedDebit}) does not equal Total Credit (${roundedCredit}).`
    );
  }
}
