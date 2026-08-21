import { evidenceStorage, type StoredEvidenceRecord } from '../../infrastructure/storage/evidenceStorage';
import type { LaundryTransaction } from '../../domain/entities/LaundryTransaction';

export interface LaundryEvidenceItem {
  uri: string;
  data: string;
  capturedAt: string;
  metadata?: Record<string, any>;
}

/**
 * LaundryEvidenceService is the application-level gateway for ephemeral operational evidence.
 *
 * It enforces the Section 181 boundary (LAUNDRY_SPECIFICATION.md):
 * - Collection photographs and operational evidence are transient client-side artifacts.
 * - Evidence remains accessible while physical operations are ongoing (Collected - Delivered - Resolved != 0)
 *   or while unresolved Exceptions exist.
 * - Evidence is cleaned up upon physical completion.
 * - Completely shields the UI and application coordinators from storage keys and storage adapters.
 */
export class LaundryEvidenceService {
  /**
   * Saves a transient evidence record.
   */
  public saveEvidence(uri: string, data: string, metadata?: Record<string, any>): void {
    evidenceStorage.saveEvidence(uri, data, metadata);
  }

  /**
   * Retrieves a transient evidence record by URI.
   */
  public getEvidence(uri: string): LaundryEvidenceItem | null {
    const record: StoredEvidenceRecord | null = evidenceStorage.getEvidence(uri);
    if (!record) return null;
    return {
      uri: record.uri,
      data: record.data,
      capturedAt: record.capturedAt,
      metadata: record.metadata,
    };
  }

  /**
   * Checks whether an evidence record exists for the given URI.
   */
  public hasEvidence(uri: string): boolean {
    return evidenceStorage.hasEvidence(uri);
  }

  /**
   * Removes a transient evidence record.
   */
  public removeEvidence(uri: string): void {
    evidenceStorage.removeEvidence(uri);
  }

  /**
   * Cleans up evidence for a transaction if physical completion has occurred
   * and no active/unresolved exceptions exist.
   *
   * @param transaction - Domain transaction aggregate
   * @returns Array of cleaned URI keys
   */
  public cleanupEvidenceForCompletedTransaction(
    transaction: Pick<LaundryTransaction, 'status' | 'collectionEvidence' | 'exceptions'> & {
      totalCollectedPieces?: number;
      totalOutstandingPhysicalPieces?: number;
      conditionObservations?: readonly { evidenceUris?: readonly string[] | string[] }[];
      deliveries?: readonly { evidenceUris?: readonly string[] | string[] }[];
    }
  ): string[] {
    return evidenceStorage.cleanupEvidenceForCompletedTransaction(transaction);
  }

  /**
   * Clears all transient evidence (for testing/cleanup).
   */
  public clearAll(): void {
    evidenceStorage.clearAllEvidence();
  }
}

export const defaultLaundryEvidenceService = new LaundryEvidenceService();
