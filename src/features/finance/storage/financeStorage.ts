import type { LedgerEntry, Bill, Payment, Settlement } from '../types';

export const STORAGE_KEYS = {
  LEDGER_ENTRIES: 'rpgms_ledger_entries',
  BILLS: 'rpgms_bills',
  PAYMENTS: 'rpgms_payments',
  SETTLEMENTS: 'rpgms_settlements',
} as const;

export const financeStorage = {
  /**
   * Initialize finance storage keys if not present in localStorage.
   */
  initializeFinanceStorage(): void {
    try {
      if (!localStorage.getItem(STORAGE_KEYS.LEDGER_ENTRIES)) {
        localStorage.setItem(STORAGE_KEYS.LEDGER_ENTRIES, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.BILLS)) {
        localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.PAYMENTS)) {
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SETTLEMENTS)) {
        localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Failed to initialize finance storage:', error);
    }
  },

  /**
   * Read raw ledger entries array from localStorage.
   */
  getStoredLedgerEntries(): LedgerEntry[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEDGER_ENTRIES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist ledger entries array to localStorage.
   */
  saveStoredLedgerEntries(entries: LedgerEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEDGER_ENTRIES, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save ledger entries:', error);
    }
  },

  /**
   * Read raw bills array from localStorage.
   */
  getStoredBills(): Bill[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist bills array to localStorage.
   */
  saveStoredBills(bills: Bill[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
    } catch (error) {
      console.error('Failed to save bills:', error);
    }
  },

  /**
   * Read raw payments array from localStorage.
   */
  getStoredPayments(): Payment[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist payments array to localStorage.
   */
  saveStoredPayments(payments: Payment[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch (error) {
      console.error('Failed to save payments:', error);
    }
  },

  /**
   * Read raw settlements array from localStorage.
   */
  getStoredSettlements(): Settlement[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTLEMENTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },

  /**
   * Persist settlements array to localStorage.
   */
  saveStoredSettlements(settlements: Settlement[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements));
    } catch (error) {
      console.error('Failed to save settlements:', error);
    }
  },
};
