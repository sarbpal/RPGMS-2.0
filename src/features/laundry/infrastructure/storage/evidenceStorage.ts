import type { LaundryTransaction } from '../../domain/entities/LaundryTransaction';

export const EVIDENCE_STORAGE_PREFIX = 'rpgms_laundry_evidence_';

export interface StoredEvidenceRecord {
  uri: string;
  data: string;
  capturedAt: string;
  metadata?: Record<string, any>;
}

const memoryEvidenceStore = new Map<string, StoredEvidenceRecord>();

function getStorageKey(uri: string): string {
  return `${EVIDENCE_STORAGE_PREFIX}${uri}`;
}

function getItem(key: string): string | null {
  if (typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      // Fallback
    }
  }
  return null;
}

function setItem(key: string, value: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Fallback
    }
  }
}

function removeItem(key: string): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
    } catch {
      // Fallback
    }
  }
}

/**
 * evidenceStorage manages transient collection photographs and operational evidence.
 *
 * Ephemeral Evidence Boundaries (LAUNDRY_SPECIFICATION.md Section 181):
 * - Collection photographs are temporary operational evidence.
 * - Evidence is retained client-side until physical completion (Collected - Delivered - Resolved = 0).
 * - Where an unresolved Exception exists, retention remains sufficient to support investigation and resolution.
 * - Isolated from regular transaction storage; no cloud/backend migration.
 */
export const evidenceStorage = {
  /**
   * Save ephemeral evidence by URI/key.
   */
  saveEvidence(uri: string, data: string, metadata?: Record<string, any>): void {
    if (!uri || uri.trim() === '') {
      throw new Error('Evidence URI cannot be empty.');
    }
    const cleanUri = uri.trim();
    const record: StoredEvidenceRecord = {
      uri: cleanUri,
      data,
      capturedAt: new Date().toISOString(),
      metadata,
    };

    memoryEvidenceStore.set(cleanUri, record);
    setItem(getStorageKey(cleanUri), JSON.stringify(record));
  },

  /**
   * Retrieve ephemeral evidence by URI/key.
   */
  getEvidence(uri: string): StoredEvidenceRecord | null {
    if (!uri) return null;
    const cleanUri = uri.trim();
    const mem = memoryEvidenceStore.get(cleanUri);
    if (mem) return mem;

    try {
      const raw = getItem(getStorageKey(cleanUri));
      if (raw) {
        const parsed = JSON.parse(raw) as StoredEvidenceRecord;
        memoryEvidenceStore.set(cleanUri, parsed);
        return parsed;
      }
    } catch {
      // Corrupt or inaccessible
    }
    return null;
  },

  /**
   * Check if evidence exists in storage.
   */
  hasEvidence(uri: string): boolean {
    return this.getEvidence(uri) !== null;
  },

  /**
   * Remove a specific evidence item.
   */
  removeEvidence(uri: string): void {
    if (!uri) return;
    const cleanUri = uri.trim();
    memoryEvidenceStore.delete(cleanUri);
    removeItem(getStorageKey(cleanUri));
  },

  /**
   * Clean up evidence for a transaction if it has reached physical completion
   * and has no unresolved/active exceptions (LAUNDRY_SPECIFICATION.md Section 181).
   *
   * @param transaction - LaundryTransaction aggregate or structural representation
   * @returns Array of cleaned URI keys
   */
  cleanupEvidenceForCompletedTransaction(
    transaction: Pick<LaundryTransaction, 'status' | 'collectionEvidence' | 'exceptions'> & {
      totalCollectedPieces?: number;
      totalOutstandingPhysicalPieces?: number;
      conditionObservations?: readonly { evidenceUris?: readonly string[] | string[] }[];
      deliveries?: readonly { evidenceUris?: readonly string[] | string[] }[];
    }
  ): string[] {
    const isCompleted =
      transaction.status === 'COMPLETED' ||
      (typeof transaction.totalCollectedPieces === 'number' &&
        transaction.totalCollectedPieces > 0 &&
        typeof transaction.totalOutstandingPhysicalPieces === 'number' &&
        transaction.totalOutstandingPhysicalPieces === 0);

    const hasUnresolvedExceptions = (transaction.exceptions || []).some(
      (e) => e.status === 'OPEN' || e.status === 'UNDER_INVESTIGATION'
    );

    if (!isCompleted || hasUnresolvedExceptions) {
      return [];
    }

    const urisToClean: string[] = [];

    // 1. Collection photo URIs
    if (transaction.collectionEvidence?.photoUris) {
      urisToClean.push(...transaction.collectionEvidence.photoUris);
    }

    // 2. Condition observation URIs
    if (transaction.conditionObservations) {
      for (const obs of transaction.conditionObservations) {
        if (obs.evidenceUris) {
          urisToClean.push(...obs.evidenceUris);
        }
      }
    }

    // 3. Delivery evidence URIs
    if (transaction.deliveries) {
      for (const del of transaction.deliveries) {
        if (del.evidenceUris) {
          urisToClean.push(...del.evidenceUris);
        }
      }
    }

    // 4. Resolved exception evidence URIs (if resolution reached and exception closed)
    if (transaction.exceptions) {
      for (const exc of transaction.exceptions) {
        if (exc.status === 'RESOLVED' && exc.evidenceUris) {
          urisToClean.push(...exc.evidenceUris);
        }
      }
    }

    const uniqueUris = Array.from(new Set(urisToClean));
    for (const uri of uniqueUris) {
      this.removeEvidence(uri);
    }

    return uniqueUris;
  },

  /**
   * Clears all ephemeral evidence from memory and localStorage.
   */
  clearAllEvidence(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(EVIDENCE_STORAGE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        for (const k of keysToRemove) {
          localStorage.removeItem(k);
        }
      } catch {
        // Fallback
      }
    }
    memoryEvidenceStore.clear();
  },

  /**
   * Reset in-memory evidence store (for testing).
   */
  resetMemoryStore(): void {
    memoryEvidenceStore.clear();
  },
};
