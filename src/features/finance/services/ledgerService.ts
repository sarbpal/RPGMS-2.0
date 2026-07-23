import type { LedgerEntry, LedgerReferenceType, FinanceRepository } from '../domain';
import { AccountType, validateDoubleEntry } from '../domain';
import { defaultFinanceRepository } from '../infrastructure';

export interface PostEntriesResult {
  success: boolean;
  entries: LedgerEntry[];
  errors: string[];
}

export class LedgerApplicationService {
  private repository: FinanceRepository;

  constructor(repository: FinanceRepository = defaultFinanceRepository) {
    this.repository = repository;
  }

  /**
   * Application Use Case: Validate a batch of ledger entries before posting.
   * Delegates accounting invariants and double-entry rules to Domain.
   */
  public validatePosting(entriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[]): string[] {
    const errors: string[] = [];

    if (!entriesData || entriesData.length === 0) {
      errors.push('Posting batch cannot be empty.');
      return errors;
    }

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
    });

    try {
      validateDoubleEntry(entriesData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        errors.push(err.message);
      }
    }

    return errors;
  }

  /**
   * Application Use Case: Post a balanced collection of double-entry ledger records.
   * Single entry point for all financial transaction writes.
   * Coordinates validation and immutable appending via repository abstraction.
   */
  public postEntries(entriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[]): PostEntriesResult {
    const validationErrors = this.validatePosting(entriesData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        entries: [],
        errors: validationErrors,
      };
    }

    const currentEntries = this.repository.getLedgerEntries();
    const now = new Date().toISOString();

    const newEntries: LedgerEntry[] = entriesData.map((data, index) => ({
      ...data,
      id: `led_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
    }));

    const updatedLedger = [...currentEntries, ...newEntries];
    this.repository.saveLedgerEntries(updatedLedger);

    return {
      success: true,
      entries: newEntries,
      errors: [],
    };
  }

  /**
   * Application Use Case: Fetch all ledger entries associated with a specific Stay ID.
   */
  public getEntriesForStay(stayId: string): LedgerEntry[] {
    return this.repository.getLedgerEntriesByStayId(stayId);
  }

  /**
   * Application Use Case: Fetch all ledger entries stored in the system.
   */
  public getEntries(): LedgerEntry[] {
    return this.repository.getLedgerEntries();
  }

  /**
   * Application Use Case: Fetch a single ledger entry by its unique ID.
   */
  public getEntryById(id: string): LedgerEntry | null {
    const entries = this.getEntries();
    return entries.find((e) => e.id === id) || null;
  }

  /**
   * Application Use Case: Fetch ledger entries matching a specific reference type and ID.
   */
  public getEntriesByReference(
    referenceType: LedgerReferenceType,
    referenceId: string
  ): LedgerEntry[] {
    const entries = this.getEntries();
    return entries.filter(
      (e) => e.referenceType === referenceType && e.referenceId === referenceId
    );
  }

  /**
   * Application Use Case: Perform an accounting reversal for all entries matching a source document.
   * Constructs inverse ledger entries without modifying historical records.
   */
  public reverseEntries(
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

    const reversalData: Omit<LedgerEntry, 'id' | 'createdAt'>[] = originalEntries.map(
      (orig) => ({
        stayId: orig.stayId,
        postingDate: todayStr,
        effectiveDate: orig.effectiveDate,
        referenceType: 'REVERSAL' as LedgerReferenceType,
        referenceId: orig.id,
        account: orig.account,
        debit: orig.credit,
        credit: orig.debit,
        remarks: `Reversal of entry ${orig.id}: ${reversalRemarks}`,
        createdBy,
      })
    );

    return this.postEntries(reversalData);
  }
}

export const ledgerService = new LedgerApplicationService();
