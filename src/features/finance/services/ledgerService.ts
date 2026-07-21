import type { LedgerEntry, LedgerReferenceType } from '../types';
import { AccountType } from '../types';
import { financeStorage } from '../storage/financeStorage';

export interface PostEntriesResult {
  success: boolean;
  entries: LedgerEntry[];
  errors: string[];
}

export const ledgerService = {
  /**
   * Validate a batch of ledger entries before posting.
   * Enforces double-entry balance (sum(debits) === sum(credits)), non-empty fields, valid accounts, and non-negative values.
   * 
   * @param entriesData Array of entry payloads to validate
   * @returns Array of validation error messages (empty array if valid)
   */
  validatePosting(entriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[]): string[] {
    const errors: string[] = [];

    if (!entriesData || entriesData.length === 0) {
      errors.push('Posting batch cannot be empty.');
      return errors;
    }

    let totalDebits = 0;
    let totalCredits = 0;

    const validAccountValues = new Set<string>(Object.values(AccountType));

    entriesData.forEach((entry, idx) => {
      const prefix = `Entry [${idx + 1}]:`;

      if (!entry.stayId || typeof entry.stayId !== 'string' || entry.stayId.trim() === '') {
        errors.push(`${prefix} Missing or invalid stayId.`);
      }

      if (!entry.account || !validAccountValues.has(entry.account)) {
        errors.push(`${prefix} Missing or invalid account (${entry.account}).`);
      }

      if (typeof entry.debit !== 'number' || isNaN(entry.debit) || entry.debit < 0) {
        errors.push(`${prefix} Debit amount must be a non-negative number.`);
      }

      if (typeof entry.credit !== 'number' || isNaN(entry.credit) || entry.credit < 0) {
        errors.push(`${prefix} Credit amount must be a non-negative number.`);
      }

      if (entry.debit === 0 && entry.credit === 0) {
        errors.push(`${prefix} Entry must have a non-zero debit or credit amount.`);
      }

      if (entry.debit > 0 && entry.credit > 0) {
        errors.push(`${prefix} Entry cannot have both debit and credit amounts greater than zero.`);
      }

      if (!entry.postingDate) {
        errors.push(`${prefix} Missing postingDate.`);
      }

      if (!entry.effectiveDate) {
        errors.push(`${prefix} Missing effectiveDate.`);
      }

      totalDebits += entry.debit || 0;
      totalCredits += entry.credit || 0;
    });

    // Enforce double-entry balance using rounded integers to avoid JS floating point precision issues
    const roundedDebits = Math.round(totalDebits * 100);
    const roundedCredits = Math.round(totalCredits * 100);

    if (roundedDebits !== roundedCredits) {
      errors.push(
        `Double-entry imbalance: Total debits (${totalDebits}) must equal total credits (${totalCredits}).`
      );
    }

    return errors;
  },

  /**
   * Post a balanced collection of double-entry ledger records.
   * Single entry point for all financial transaction writes.
   * Immutably appends new entries to storage after validation.
   * 
   * @param entriesData Array of entry objects to post (without id/createdAt)
   * @returns PostEntriesResult containing success status, created entries, and error messages
   */
  postEntries(
    entriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[]
  ): PostEntriesResult {
    const validationErrors = this.validatePosting(entriesData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        entries: [],
        errors: validationErrors,
      };
    }

    const currentEntries = financeStorage.getStoredLedgerEntries();
    const now = new Date().toISOString();

    const newEntries: LedgerEntry[] = entriesData.map((data, index) => ({
      ...data,
      id: `led_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
    }));

    const updatedLedger = [...currentEntries, ...newEntries];
    financeStorage.saveStoredLedgerEntries(updatedLedger);

    return {
      success: true,
      entries: newEntries,
      errors: [],
    };
  },

  /**
   * Fetch all ledger entries associated with a specific Stay ID.
   * 
   * @param stayId Target Stay ID
   * @returns Array of matching LedgerEntry objects
   */
  getEntriesForStay(stayId: string): LedgerEntry[] {
    const entries = financeStorage.getStoredLedgerEntries();
    return entries.filter((e) => e.stayId === stayId);
  },

  /**
   * Fetch all ledger entries stored in the system.
   * 
   * @returns Array of all LedgerEntry objects
   */
  getEntries(): LedgerEntry[] {
    return financeStorage.getStoredLedgerEntries();
  },

  /**
   * Fetch a single ledger entry by its unique ID.
   * 
   * @param id Target entry ID
   * @returns LedgerEntry or null
   */
  getEntryById(id: string): LedgerEntry | null {
    const entries = this.getEntries();
    return entries.find((e) => e.id === id) || null;
  },

  /**
   * Fetch ledger entries matching a specific reference type and ID (e.g. BILL, PAYMENT, SETTLEMENT).
   * 
   * @param referenceType Source document reference type
   * @param referenceId Source document ID
   * @returns Array of matching LedgerEntry objects
   */
  getEntriesByReference(
    referenceType: LedgerReferenceType,
    referenceId: string
  ): LedgerEntry[] {
    const entries = this.getEntries();
    return entries.filter(
      (e) => e.referenceType === referenceType && e.referenceId === referenceId
    );
  },

  /**
   * Perform an accounting reversal for all entries matching a source document reference.
   * Creates new inverse ledger entries (swapping debits and credits).
   * Original entries are NEVER modified or deleted.
   * 
   * @param referenceType Type of reference to reverse
   * @param referenceId ID of reference to reverse
   * @param reversalRemarks Reason for reversal
   * @param createdBy User/system identifier creating the reversal
   * @returns PostEntriesResult containing the reversal entries
   */
  reverseEntries(
    referenceType: LedgerReferenceType,
    referenceId: string,
    reversalRemarks: string,
    createdBy = 'SYSTEM'
  ): PostEntriesResult {
    const originalEntries = this.getEntriesByReference(referenceType, referenceId);
    if (originalEntries.length === 0) {
      return {
        success: false,
        entries: [],
        errors: [`No ledger entries found for reference ${referenceType}:${referenceId}.`],
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Build inverse entries: swap debit & credit
    const reversalData: Omit<LedgerEntry, 'id' | 'createdAt'>[] = originalEntries.map(
      (orig) => ({
        stayId: orig.stayId,
        postingDate: todayStr,
        effectiveDate: orig.effectiveDate,
        referenceType: 'REVERSAL' as LedgerReferenceType,
        referenceId: orig.id, // Links directly to original entry ID
        account: orig.account,
        debit: orig.credit, // Swap credit to debit
        credit: orig.debit, // Swap debit to credit
        remarks: `Reversal of entry ${orig.id}: ${reversalRemarks}`,
        createdBy,
      })
    );

    return this.postEntries(reversalData);
  },
};
