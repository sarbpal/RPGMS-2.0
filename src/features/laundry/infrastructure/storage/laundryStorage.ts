import type { LaundryTransactionProps } from '../../domain/entities/LaundryTransaction';
import { LaundryTransaction } from '../../domain/entities/LaundryTransaction';

export const LAUNDRY_STORAGE_KEYS = {
  TRANSACTIONS: 'rpgms_laundry_transactions',
} as const;

const memoryStore = new Map<string, string>();

function getItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      // Fallback to memory store if localStorage is disabled or throws
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
      // In-memory fallback
    }
  }
}

function removeItem(key: string): void {
  memoryStore.delete(key);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {
      // In-memory fallback
    }
  }
}

export const laundryStorage = {
  /**
   * Initialize laundry storage keys if not already present in storage.
   */
  initializeLaundryStorage(): void {
    try {
      if (!getItem(LAUNDRY_STORAGE_KEYS.TRANSACTIONS)) {
        setItem(LAUNDRY_STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      }
    } catch (error) {
      console.error('Failed to initialize laundry storage:', error);
    }
  },

  /**
   * Read raw serialized LaundryTransactionProps array from storage.
   * Returns empty array if storage is empty, inaccessible, or contains malformed data.
   */
  getStoredTransactions(): LaundryTransactionProps[] {
    try {
      const saved = getItem(LAUNDRY_STORAGE_KEYS.TRANSACTIONS);
      if (!saved) {
        return [];
      }
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  },

  /**
   * Persist LaundryTransaction instances or raw props array to storage.
   */
  saveStoredTransactions(transactions: (LaundryTransactionProps | LaundryTransaction)[]): void {
    try {
      const serialized = transactions.map((t) => (t instanceof LaundryTransaction ? t.toJSON() : t));
      setItem(LAUNDRY_STORAGE_KEYS.TRANSACTIONS, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to save laundry transactions to storage:', error);
    }
  },

  /**
   * Clear stored laundry transactions from localStorage and memory fallback.
   */
  clearStoredTransactions(): void {
    try {
      removeItem(LAUNDRY_STORAGE_KEYS.TRANSACTIONS);
    } catch (error) {
      console.error('Failed to clear laundry transactions:', error);
    }
  },

  /**
   * Reset the memory store (primarily used in test environments).
   */
  resetMemoryStore(): void {
    memoryStore.clear();
  },
};
