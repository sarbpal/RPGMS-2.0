import type { LedgerEntry, Bill, Payment, Settlement, DepositTransaction } from '../types';

export const STORAGE_KEYS = {
  LEDGER_ENTRIES: 'rpgms_ledger_entries',
  BILLS: 'rpgms_bills',
  PAYMENTS: 'rpgms_payments',
  SETTLEMENTS: 'rpgms_settlements',
  DEPOSIT_TRANSACTIONS: 'rpgms_deposit_transactions',
} as const;

const memoryStore = new Map<string, string>();

function getItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      // fallback
    }
  }
  return memoryStore.get(key) ?? null;
}

function setItem(key: string, value: string): void {
  memoryStore.set(key, value);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // fallback
    }
  }
}

export const financeStorage = {
  /**
   * Initialize finance storage keys if not present in storage.
   */
  initializeFinanceStorage(): void {
    try {
      if (!getItem(STORAGE_KEYS.LEDGER_ENTRIES)) {
        setItem(STORAGE_KEYS.LEDGER_ENTRIES, JSON.stringify([]));
      }
      if (!getItem(STORAGE_KEYS.BILLS)) {
        setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
      }
      if (!getItem(STORAGE_KEYS.PAYMENTS)) {
        setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
      }
      if (!getItem(STORAGE_KEYS.SETTLEMENTS)) {
        setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify([]));
      }
      if (!getItem(STORAGE_KEYS.DEPOSIT_TRANSACTIONS)) {
        setItem(STORAGE_KEYS.DEPOSIT_TRANSACTIONS, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Failed to initialize finance storage:', error);
    }
  },

  /**
   * Read raw ledger entries array from storage.
   */
  getStoredLedgerEntries(): LedgerEntry[] {
    try {
      const saved = getItem(STORAGE_KEYS.LEDGER_ENTRIES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist ledger entries array to storage.
   */
  saveStoredLedgerEntries(entries: LedgerEntry[]): void {
    try {
      setItem(STORAGE_KEYS.LEDGER_ENTRIES, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save ledger entries:', error);
    }
  },

  /**
   * Read raw bills array from storage.
   */
  getStoredBills(): Bill[] {
    try {
      const saved = getItem(STORAGE_KEYS.BILLS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist bills array to storage.
   */
  saveStoredBills(bills: Bill[]): void {
    try {
      setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    } catch (error) {
      console.error('Failed to save bills:', error);
    }
  },

  /**
   * Read raw payments array from storage.
   */
  getStoredPayments(): Payment[] {
    try {
      const saved = getItem(STORAGE_KEYS.PAYMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist payments array to storage.
   */
  saveStoredPayments(payments: Payment[]): void {
    try {
      setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch (error) {
      console.error('Failed to save payments:', error);
    }
  },

  /**
   * Read raw settlements array from storage.
   */
  getStoredSettlements(): Settlement[] {
    try {
      const saved = getItem(STORAGE_KEYS.SETTLEMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist settlements array to storage.
   */
  saveStoredSettlements(settlements: Settlement[]): void {
    try {
      setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
    } catch (error) {
      console.error('Failed to save settlements:', error);
    }
  },

  /**
   * Read raw deposit transactions array from storage.
   */
  getStoredDepositTransactions(): DepositTransaction[] {
    try {
      const saved = getItem(STORAGE_KEYS.DEPOSIT_TRANSACTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist deposit transactions array to storage.
   */
  saveStoredDepositTransactions(transactions: DepositTransaction[]): void {
    try {
      setItem(STORAGE_KEYS.DEPOSIT_TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Failed to save deposit transactions:', error);
    }
  },
};

