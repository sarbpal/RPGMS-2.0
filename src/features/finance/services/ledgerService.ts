import type { LedgerEntry, LedgerReferenceType, FinanceRepository } from '../domain';
import { AccountType, validateDoubleEntry } from '../domain';
import { defaultFinanceRepository } from '../infrastructure';
import { balanceEngine } from './balanceEngine';

export interface PostEntriesResult {
  success: boolean;
  entries: LedgerEntry[];
  errors: string[];
}

export interface ResidentLedgerRow {
  id: string;
  date: string;
  referenceNumber: string;
  transactionType: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  status?: string;
  createdAt: string;
}

export interface ResidentLedgerViewModel {
  residentName: string;
  residentCode: string;
  stayId: string;
  currentOutstandingBalance: number;
  currentAdvanceBalance: number;
  rows: ResidentLedgerRow[];
  totalDebits: number;
  totalCredits: number;
}

import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import { defaultStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';

export class LedgerApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = defaultStayRepository
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
  }

  public getStayRepository(): StayRepository {
    return this.stayRepository;
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

  /**
   * Application Use Case: Compile complete chronological Resident Ledger View Model for a stay.
   * Calculates chronological running balances, total debits/credits, and outstanding/advance metrics.
   */
  public getResidentLedgerViewModel(
    stayId: string,
    residentInfo?: { fullName: string; residentCode: string }
  ): ResidentLedgerViewModel {
    if (!stayId || stayId.trim() === '') {
      return {
        residentName: residentInfo?.fullName || 'N/A',
        residentCode: residentInfo?.residentCode || 'N/A',
        stayId: 'N/A',
        currentOutstandingBalance: 0,
        currentAdvanceBalance: 0,
        rows: [],
        totalDebits: 0,
        totalCredits: 0,
      };
    }

    const bills = this.repository.getBillsByStayId(stayId);
    const payments = this.repository.getPaymentsByStayId(stayId);
    const balances = balanceEngine.calculateStayBalances(stayId);

    const rawRows: Omit<ResidentLedgerRow, 'runningBalance'>[] = [];

    // Map Bills
    bills.forEach((b) => {
      let typeName = 'Bill';
      if (b.billType === 'MONTHLY_RENT') typeName = 'Monthly Rent';
      else if (b.billType === 'RECURRING_CHARGE') typeName = 'Recurring Charge';
      else if (b.billType === 'ONE_TIME_CHARGE') {
        const desc = (b.lineItems?.[0]?.description || '').toLowerCase();
        if (desc.includes('laundry')) typeName = 'Laundry Charge';
        else if (desc.includes('electricity')) typeName = 'Electricity Charge';
        else if (desc.includes('deposit')) typeName = 'Security Deposit';
        else typeName = 'One-Time Charge';
      }


      rawRows.push({
        id: b.id,
        date: b.issueDate || b.createdAt.split('T')[0],
        referenceNumber: b.billNumber,
        transactionType: typeName,
        description: b.lineItems?.[0]?.description || b.remarks || `${typeName} Bill`,
        debit: b.totalAmount,
        credit: 0,
        status: b.status,
        createdAt: b.createdAt,
      });
    });

    // Map Payments
    payments.forEach((p) => {
      rawRows.push({
        id: p.id,
        date: p.paymentDate || p.createdAt.split('T')[0],
        referenceNumber: p.paymentNumber,
        transactionType: 'Payment Received',
        description: `Payment via ${p.paymentMethod}${p.referenceNumber ? ` (Ref: ${p.referenceNumber})` : ''}${p.remarks ? ` - ${p.remarks}` : ''}`,
        debit: 0,
        credit: p.amount,
        status: 'PAID',
        createdAt: p.createdAt,
      });
    });

    // Map any standalone LedgerEntries not linked to bills or payments
    const knownRefIds = new Set([...bills.map((b) => b.id), ...payments.map((p) => p.id)]);
    const ledgerEntries = this.getEntriesForStay(stayId);
    const standaloneEntries = ledgerEntries.filter(
      (e) => e.account === AccountType.ACCOUNTS_RECEIVABLE && !knownRefIds.has(e.referenceId)
    );

    standaloneEntries.forEach((e) => {
      rawRows.push({
        id: e.id,
        date: e.effectiveDate || e.postingDate,
        referenceNumber: `LED-${e.id.slice(-6)}`,
        transactionType: e.referenceType === 'REVERSAL' ? 'Adjustment (Reversal)' : 'Adjustment',
        description: e.remarks || 'Ledger Entry',
        debit: e.debit || 0,
        credit: e.credit || 0,
        status: 'POSTED',
        createdAt: e.createdAt,
      });
    });

    // Sort chronologically (oldest first)
    rawRows.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.createdAt.localeCompare(b.createdAt);
    });

    // Calculate running balance and totals in chronological order (oldest to newest)
    let running = 0;
    let totalDebits = 0;
    let totalCredits = 0;

    const rows: ResidentLedgerRow[] = rawRows.map((r) => {
      running += r.debit - r.credit;
      totalDebits += r.debit;
      totalCredits += r.credit;
      return {
        ...r,
        runningBalance: Math.round(running * 100) / 100,
      };
    });

    return {
      residentName: residentInfo?.fullName || 'Resident',
      residentCode: residentInfo?.residentCode || 'RES-0000',
      stayId,
      currentOutstandingBalance: balances.receivableBalance,
      currentAdvanceBalance: balances.advanceCreditBalance,
      rows,
      totalDebits: Math.round(totalDebits * 100) / 100,
      totalCredits: Math.round(totalCredits * 100) / 100,
    };
  }
}

export const ledgerService = new LedgerApplicationService();

