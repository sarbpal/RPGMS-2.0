import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { evidenceStorage, EVIDENCE_STORAGE_PREFIX } from '../storage/evidenceStorage';
import { laundryStorage } from '../storage/laundryStorage';
import { LaundryTransaction } from '../../domain/entities/LaundryTransaction';
import { LaundryTransactionStatus } from '../../domain/valueObjects/LaundryTransactionStatus';
import { LaundryExceptionType } from '../../domain/valueObjects/LaundryExceptionType';
import { LaundryExceptionStatus } from '../../domain/valueObjects/LaundryExceptionStatus';
import { ResolutionOutcome } from '../../domain/valueObjects/ResolutionOutcome';

// In-memory mock for localStorage in test environments
function createMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe('evidenceStorage (Ephemeral Evidence Storage)', () => {
  beforeEach(() => {
    globalThis.localStorage = createMockStorage();
    evidenceStorage.clearAllEvidence();
    laundryStorage.clearStoredTransactions();
  });

  afterEach(() => {
    evidenceStorage.clearAllEvidence();
    laundryStorage.clearStoredTransactions();
  });

  it('Test 13 — Evidence Store: saves and retrieves ephemeral evidence within retention boundary', () => {
    const photoUri = 'evidence://photo-collection-001.jpg';
    const photoData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQE...';

    evidenceStorage.saveEvidence(photoUri, photoData, { staffId: 'STAFF-001', bagCount: 2 });

    expect(evidenceStorage.hasEvidence(photoUri)).toBe(true);

    const record = evidenceStorage.getEvidence(photoUri);
    expect(record).not.toBeNull();
    expect(record?.uri).toBe(photoUri);
    expect(record?.data).toBe(photoData);
    expect(record?.metadata?.staffId).toBe('STAFF-001');
    expect(record?.metadata?.bagCount).toBe(2);

    evidenceStorage.removeEvidence(photoUri);
    expect(evidenceStorage.hasEvidence(photoUri)).toBe(false);
    expect(evidenceStorage.getEvidence(photoUri)).toBeNull();
  });

  it('Test 14 — Evidence Isolation: evidence storage does not pollute normal transaction storage', () => {
    evidenceStorage.saveEvidence('evidence://photo-isolated.jpg', 'base64data');

    // Normal laundry transaction storage must remain completely separate and unpolluted
    const storedTransactions = laundryStorage.getStoredTransactions();
    expect(storedTransactions).toEqual([]);

    // Check localStorage keys
    if (typeof localStorage !== 'undefined') {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) keys.push(k);
      }
      const evidenceKeys = keys.filter((k) => k.startsWith(EVIDENCE_STORAGE_PREFIX));
      expect(evidenceKeys).toContain(`${EVIDENCE_STORAGE_PREFIX}evidence://photo-isolated.jpg`);
      expect(localStorage.getItem('rpgms_laundry_transactions')).toBeNull();
    }
  });

  it('Test 15 — Evidence Cleanup: cleans up evidence for completed transactions with no unresolved exceptions', () => {
    const photo1 = 'evidence://photo-c1.jpg';
    const photo2 = 'evidence://photo-c2.jpg';
    const excPhoto = 'evidence://photo-exc1.jpg';

    evidenceStorage.saveEvidence(photo1, 'data1');
    evidenceStorage.saveEvidence(photo2, 'data2');
    evidenceStorage.saveEvidence(excPhoto, 'dataExc');

    // Case A: Transaction is IN_PROCESS -> should NOT clean up
    const activeTx = new LaundryTransaction({
      id: 'LTX-ACT-1',
      stayId: 'STAY-01',
      residentId: 'RES-01',
      status: LaundryTransactionStatus.IN_PROCESS,
      collectionEvidence: {
        photoUris: [photo1],
        collectedByStaffId: 'STAFF-001',
        capturedAt: '2026-08-15T09:00:00.000Z',
      },
    });

    const cleanedActive = evidenceStorage.cleanupEvidenceForCompletedTransaction(activeTx);
    expect(cleanedActive).toEqual([]);
    expect(evidenceStorage.hasEvidence(photo1)).toBe(true);

    // Case B: Transaction is COMPLETED but has OPEN exception -> should NOT clean up
    const completedWithOpenExc = new LaundryTransaction({
      id: 'LTX-COMP-OPEN',
      stayId: 'STAY-01',
      residentId: 'RES-01',
      status: LaundryTransactionStatus.COMPLETED,
      collectionEvidence: {
        photoUris: [photo1],
        collectedByStaffId: 'STAFF-001',
        capturedAt: '2026-08-15T09:00:00.000Z',
      },
      exceptions: [
        {
          id: 'EXC-1',
          transactionId: 'LTX-COMP-OPEN',
          type: LaundryExceptionType.DAMAGED,
          description: 'Damaged hem',
          affectedQuantity: 1,
          status: LaundryExceptionStatus.UNDER_INVESTIGATION,
          raisedByStaffId: 'STAFF-001',
          raisedAt: '2026-08-15T10:00:00.000Z',
          evidenceUris: [excPhoto],
        },
      ],
    });

    const cleanedUnresolved = evidenceStorage.cleanupEvidenceForCompletedTransaction(completedWithOpenExc);
    expect(cleanedUnresolved).toEqual([]);
    expect(evidenceStorage.hasEvidence(photo1)).toBe(true);
    expect(evidenceStorage.hasEvidence(excPhoto)).toBe(true);

    // Case C: Transaction is COMPLETED and has RESOLVED exception -> SHOULD clean up
    const fullyCompleted = new LaundryTransaction({
      id: 'LTX-COMP-OK',
      stayId: 'STAY-01',
      residentId: 'RES-01',
      status: LaundryTransactionStatus.COMPLETED,
      collectionEvidence: {
        photoUris: [photo1, photo2],
        collectedByStaffId: 'STAFF-001',
        capturedAt: '2026-08-15T09:00:00.000Z',
      },
      exceptions: [
        {
          id: 'EXC-1',
          transactionId: 'LTX-COMP-OK',
          type: LaundryExceptionType.MISSING,
          description: 'Missing item resolved',
          affectedQuantity: 1,
          status: LaundryExceptionStatus.RESOLVED,
          raisedByStaffId: 'STAFF-001',
          raisedAt: '2026-08-15T10:00:00.000Z',
          resolution: {
            id: 'RES-1',
            exceptionId: 'EXC-1',
            outcome: ResolutionOutcome.PERMANENTLY_LOST,
            resolverStaffId: 'STAFF-001',
            resolvedAt: '2026-08-15T12:00:00.000Z',
            resolvedQuantity: 1,
          },
          evidenceUris: [excPhoto],
        },
      ],
    });

    const cleanedCompleted = evidenceStorage.cleanupEvidenceForCompletedTransaction(fullyCompleted);
    expect(cleanedCompleted).toContain(photo1);
    expect(cleanedCompleted).toContain(photo2);
    expect(cleanedCompleted).toContain(excPhoto);

    expect(evidenceStorage.hasEvidence(photo1)).toBe(false);
    expect(evidenceStorage.hasEvidence(photo2)).toBe(false);
    expect(evidenceStorage.hasEvidence(excPhoto)).toBe(false);
  });
});
