import type { LedgerEntry } from '../types';
import { financeStorage } from '../storage/financeStorage';

export const ledgerService = {
  /**
   * Append a new immutable double-entry record to the financial ledger.
   * Single entry point for all financial transaction writes.
   * 
   * @param entryData Data required to construct a LedgerEntry (without system timestamps or generated IDs)
   * @returns The newly created LedgerEntry stub
   */
  postLedgerEntry(
    _entryData: Omit<LedgerEntry, 'id' | 'createdAt'>
  ): LedgerEntry | null {
    // Skeleton stub for Sprint F1
    return null;
  },

  /**
   * Fetch all ledger entries associated with a specific Stay ID.
   * 
   * @param stayId The Stay ID to retrieve financial ledger entries for
   * @returns Array of matching LedgerEntry objects
   */
  getLedgerEntriesByStayId(stayId: string): LedgerEntry[] {
    const entries = financeStorage.getStoredLedgerEntries();
    return entries.filter((e) => e.stayId === stayId);
  },

  /**
   * Fetch all ledger entries stored in the system.
   * 
   * @returns Array of all LedgerEntry objects
   */
  getAllLedgerEntries(): LedgerEntry[] {
    return financeStorage.getStoredLedgerEntries();
  },
};
