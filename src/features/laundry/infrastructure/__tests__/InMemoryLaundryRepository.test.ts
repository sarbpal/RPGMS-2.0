import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InMemoryLaundryRepository } from '../repositories/InMemoryLaundryRepository';
import { laundryStorage, LAUNDRY_STORAGE_KEYS } from '../storage/laundryStorage';
import { LaundryTransaction } from '../../domain/entities/LaundryTransaction';
import { GarmentLine } from '../../domain/entities/GarmentLine';
import { ServiceAllocation } from '../../domain/entities/ServiceAllocation';
import { RateSnapshot } from '../../domain/valueObjects/RateSnapshot';
import { LaundryTransactionStatus } from '../../domain/valueObjects/LaundryTransactionStatus';
import { ProcessingRoute } from '../../domain/valueObjects/ProcessingRoute';
import { DeliveryHandoverMethod } from '../../domain/valueObjects/DeliveryHandoverMethod';
import { LaundryExceptionType } from '../../domain/valueObjects/LaundryExceptionType';
import { LaundryExceptionStatus } from '../../domain/valueObjects/LaundryExceptionStatus';
import { ResolutionOutcome } from '../../domain/valueObjects/ResolutionOutcome';
import { defaultLaundryMasterRepository } from '../repositories/InMemoryLaundryMasterRepository';

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

describe('InMemoryLaundryRepository & laundryStorage', () => {
  beforeEach(() => {
    globalThis.localStorage = createMockStorage();
    laundryStorage.clearStoredTransactions();
    laundryStorage.resetMemoryStore();
  });

  afterEach(() => {
    laundryStorage.clearStoredTransactions();
    laundryStorage.resetMemoryStore();
    vi.restoreAllMocks();
  });

  // --- REPOSITORY TESTS ---

  describe('Repository Operations', () => {
    it('Test 1 — Save / Find: saves and finds a transaction by ID', async () => {
      const repo = new InMemoryLaundryRepository([], false);

      const tx = new LaundryTransaction({
        id: 'LTX-TEST-001',
        stayId: 'STAY-TEST-01',
        residentId: 'RES-TEST-01',
        status: LaundryTransactionStatus.DRAFT,
      });

      await repo.save(tx);

      const foundAsync = await repo.findById('LTX-TEST-001');
      expect(foundAsync).not.toBeNull();
      expect(foundAsync?.id).toBe('LTX-TEST-001');
      expect(foundAsync?.stayId).toBe('STAY-TEST-01');
      expect(foundAsync?.residentId).toBe('RES-TEST-01');

      const foundSync = repo.findByIdSync('LTX-TEST-001');
      expect(foundSync).not.toBeNull();
      expect(foundSync?.id).toBe('LTX-TEST-001');

      const notFound = repo.findByIdSync('NON-EXISTENT');
      expect(notFound).toBeNull();
    });

    it('Test 2 — Find By Stay: filters transactions by stayId and residentId', async () => {
      const repo = new InMemoryLaundryRepository([], false);

      const tx1 = new LaundryTransaction({
        id: 'LTX-STAY1-A',
        stayId: 'STAY-100',
        residentId: 'RES-100',
      });
      const tx2 = new LaundryTransaction({
        id: 'LTX-STAY1-B',
        stayId: 'STAY-100',
        residentId: 'RES-100',
      });
      const tx3 = new LaundryTransaction({
        id: 'LTX-STAY2-A',
        stayId: 'STAY-200',
        residentId: 'RES-200',
      });

      repo.saveSync(tx1);
      repo.saveSync(tx2);
      repo.saveSync(tx3);

      const stay1Transactions = await repo.findByStayId('STAY-100');
      expect(stay1Transactions).toHaveLength(2);
      expect(stay1Transactions.map((t) => t.id)).toEqual(['LTX-STAY1-A', 'LTX-STAY1-B']);

      const resident2Transactions = await repo.findByResidentId('RES-200');
      expect(resident2Transactions).toHaveLength(1);
      expect(resident2Transactions[0].id).toBe('LTX-STAY2-A');
    });

    it('Test 3 — Get All: returns all persisted transactions', async () => {
      const repo = new InMemoryLaundryRepository([], false);

      expect(repo.getAllSync()).toHaveLength(0);

      repo.saveSync(
        new LaundryTransaction({
          id: 'LTX-ALL-1',
          stayId: 'STAY-01',
          residentId: 'RES-01',
        })
      );
      repo.saveSync(
        new LaundryTransaction({
          id: 'LTX-ALL-2',
          stayId: 'STAY-02',
          residentId: 'RES-02',
        })
      );

      const all = await repo.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((t) => t.id)).toEqual(['LTX-ALL-1', 'LTX-ALL-2']);
    });

    it('Test 4 — Update: updates existing transaction state when saved again', async () => {
      const repo = new InMemoryLaundryRepository([], false);

      const tx = new LaundryTransaction({
        id: 'LTX-MUTATE-1',
        stayId: 'STAY-01',
        residentId: 'RES-01',
      });
      tx.addGarmentLine(
        new GarmentLine({
          id: 'GL-M-1',
          transactionId: 'LTX-MUTATE-1',
          itemId: 'LITM-001',
          physicalQuantity: 1,
          createdAt: '2026-08-15T09:00:00.000Z',
          serviceAllocations: [
            new ServiceAllocation({
              id: 'SA-M-1',
              garmentLineId: 'GL-M-1',
              serviceId: 'LSRV-001',
              requestedQuantity: 1,
              createdAt: '2026-08-15T09:00:00.000Z',
            }),
          ],
        })
      );

      repo.saveSync(tx);

      // Mutate aggregate state via domain method
      tx.confirmCollection({
        masterRepository: defaultLaundryMasterRepository,
        collectedByStaffId: 'STAFF-001',
        collectionTimestamp: '2026-08-15T10:00:00.000Z',
      });

      expect(tx.status).toBe(LaundryTransactionStatus.COLLECTED);

      repo.saveSync(tx);

      const reloaded = repo.findByIdSync('LTX-MUTATE-1');
      expect(reloaded?.status).toBe(LaundryTransactionStatus.COLLECTED);
      expect(reloaded?.collectedAt).toBe('2026-08-15T10:00:00.000Z');
      expect(repo.getAllSync()).toHaveLength(1);
    });

    it('Test 5 — Delete / Removal: removes transaction from repository', async () => {
      const repo = new InMemoryLaundryRepository([], false);

      const tx = new LaundryTransaction({
        id: 'LTX-DEL-1',
        stayId: 'STAY-01',
        residentId: 'RES-01',
      });
      repo.saveSync(tx);
      expect(repo.findByIdSync('LTX-DEL-1')).not.toBeNull();

      await repo.delete('LTX-DEL-1');
      expect(repo.findByIdSync('LTX-DEL-1')).toBeNull();
      expect(repo.getAllSync()).toHaveLength(0);
    });
  });

  // --- STORAGE TESTS ---

  describe('Storage & Fallback Integration', () => {
    it('Test 6 — localStorage Persistence: saves data and restores in new repository instance', () => {
      const repo1 = new InMemoryLaundryRepository([], true);

      const tx = new LaundryTransaction({
        id: 'LTX-PERSIST-1',
        stayId: 'STAY-P-01',
        residentId: 'RES-P-01',
      });
      repo1.saveSync(tx);

      // Create brand new repository instance reading from storage
      const repo2 = new InMemoryLaundryRepository();
      const restored = repo2.findByIdSync('LTX-PERSIST-1');

      expect(restored).not.toBeNull();
      expect(restored?.id).toBe('LTX-PERSIST-1');
      expect(restored?.stayId).toBe('STAY-P-01');
      expect(restored instanceof LaundryTransaction).toBe(true);
    });

    it('Test 7 — Memory Fallback: continues functioning when localStorage is unavailable or throws', () => {
      // Mock localStorage failure
      vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: localStorage is disabled');
      });
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new Error('SecurityError: localStorage is disabled');
      });

      const repo = new InMemoryLaundryRepository([], true);
      const tx = new LaundryTransaction({
        id: 'LTX-FALLBACK-1',
        stayId: 'STAY-FB-01',
        residentId: 'RES-FB-01',
      });

      // Should save safely to in-memory fallback without crashing
      expect(() => repo.saveSync(tx)).not.toThrow();

      const retrieved = repo.findByIdSync('LTX-FALLBACK-1');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe('LTX-FALLBACK-1');
    });

    it('Test 8 — Malformed Storage: safely handles malformed JSON without crashing', () => {
      localStorage.setItem(LAUNDRY_STORAGE_KEYS.TRANSACTIONS, '{ invalid_json_syntax: true');

      // getStoredTransactions should gracefully return empty array
      const stored = laundryStorage.getStoredTransactions();
      expect(stored).toEqual([]);

      // Repository constructor should gracefully fall back to seed data
      const repo = new InMemoryLaundryRepository();
      expect(repo.getAllSync().length).toBeGreaterThan(0);
    });

    it('Test 9 — Empty Storage: initializes with seed data on first run', () => {
      laundryStorage.clearStoredTransactions();
      expect(laundryStorage.getStoredTransactions()).toEqual([]);

      const repo = new InMemoryLaundryRepository();
      expect(repo.getAllSync().length).toBeGreaterThan(0);
    });
  });

  // --- HYDRATION TESTS ---

  describe('Domain Hydration & Invariant Integrity', () => {
    it('Test 10 — Date Restoration: dates survive serialization and reload', () => {
      const repo = new InMemoryLaundryRepository([], true);

      const testDate = '2026-08-15T09:45:00.000Z';
      const tx = new LaundryTransaction({
        id: 'LTX-DATE-1',
        stayId: 'STAY-01',
        residentId: 'RES-01',
        createdAt: testDate,
        collectedAt: testDate,
      });

      repo.saveSync(tx);

      const repoReloaded = new InMemoryLaundryRepository();
      const loaded = repoReloaded.findByIdSync('LTX-DATE-1');

      expect(loaded?.createdAt).toBe(testDate);
      expect(loaded?.collectedAt).toBe(testDate);
      expect(new Date(loaded!.createdAt).toISOString()).toBe(testDate);
    });

    it('Test 11 — Aggregate Behavior Restoration: hydrated instance executes domain methods', () => {
      const repo1 = new InMemoryLaundryRepository([], true);

      const tx = new LaundryTransaction({
        id: 'LTX-BEHAVE-1',
        stayId: 'STAY-01',
        residentId: 'RES-01',
        status: LaundryTransactionStatus.COLLECTED,
        isInspected: true,
        inspectedAt: '2026-08-15T10:00:00.000Z',
        inspectedByStaffId: 'STAFF-001',
        processingRoute: ProcessingRoute.IN_HOUSE,
        garmentLines: [
          new GarmentLine({
            id: 'GL-B-1',
            transactionId: 'LTX-BEHAVE-1',
            itemId: 'LITM-001',
            physicalQuantity: 2,
            createdAt: '2026-08-15T09:00:00.000Z',
            serviceAllocations: [
              new ServiceAllocation({
                id: 'SA-B-1',
                garmentLineId: 'GL-B-1',
                serviceId: 'LSRV-001',
                requestedQuantity: 2,
                rateSnapshot: new RateSnapshot({
                  unitRate: 20,
                  capturedAt: '2026-08-15T09:00:00.000Z',
                  chargeMasterRateId: 'LRATE-001',
                  currency: 'INR',
                }),
                createdAt: '2026-08-15T09:00:00.000Z',
              }),
            ],
          }),
        ],
      });

      repo1.saveSync(tx);

      // Hydrate via fresh repository instance
      const repo2 = new InMemoryLaundryRepository();
      const reloaded = repo2.findByIdSync('LTX-BEHAVE-1')!;

      expect(reloaded instanceof LaundryTransaction).toBe(true);

      // Execute domain methods on reloaded instance
      expect(() => {
        reloaded.releaseProcessing({
          releasedByStaffId: 'STAFF-001',
          releasedAt: '2026-08-15T11:00:00.000Z',
        });
      }).not.toThrow();

      expect(reloaded.status).toBe(LaundryTransactionStatus.IN_PROCESS);
      expect(reloaded.processingReleasedByStaffId).toBe('STAFF-001');

      // Record return
      const ret = reloaded.recordReturn({
        returnedLines: [{ garmentLineId: 'GL-B-1', returnedQuantity: 2 }],
        returnedByStaffId: 'STAFF-002',
        returnedAt: '2026-08-15T14:00:00.000Z',
      });
      expect(ret.totalReturnedQuantity).toBe(2);
      expect(reloaded.status).toBe(LaundryTransactionStatus.RETURNED_FULL);

      // Reconcile custody domain method
      const reconciliation = reloaded.reconcileCustody();
      expect(reconciliation.totalCollected).toBe(2);
      expect(reconciliation.totalReturned).toBe(2);
      expect(reconciliation.isFullyReconciled).toBe(true);
    });

    it('Test 12 — Nested Aggregate Restoration: child entities and value objects survive persistence', () => {
      const repo1 = new InMemoryLaundryRepository([], true);

      const tx = new LaundryTransaction({
        id: 'LTX-NESTED-1',
        stayId: 'STAY-N-01',
        residentId: 'RES-N-01',
        status: LaundryTransactionStatus.DELIVERED_PARTIAL,
        garmentLines: [
          new GarmentLine({
            id: 'GL-N-1',
            transactionId: 'LTX-NESTED-1',
            itemId: 'LITM-002',
            physicalQuantity: 2,
            returnedQuantity: 2,
            deliveredQuantity: 1,
            createdAt: '2026-08-15T09:00:00.000Z',
            serviceAllocations: [
              new ServiceAllocation({
                id: 'SA-N-1',
                garmentLineId: 'GL-N-1',
                serviceId: 'LSRV-001',
                requestedQuantity: 2,
                fulfilledQuantity: 2,
                fulfillmentStatus: 'FULFILLED',
                rateSnapshot: new RateSnapshot({
                  unitRate: 25,
                  capturedAt: '2026-08-15T09:00:00.000Z',
                  chargeMasterRateId: 'LRATE-004',
                  currency: 'INR',
                }),
                createdAt: '2026-08-15T09:00:00.000Z',
              }),
            ],
          }),
        ],
      });

      repo1.saveSync(tx);

      const repo2 = new InMemoryLaundryRepository();
      const reloaded = repo2.findByIdSync('LTX-NESTED-1')!;

      expect(reloaded.garmentLines).toHaveLength(1);
      const line = reloaded.garmentLines[0];
      expect(line.id).toBe('GL-N-1');
      expect(line.physicalQuantity).toBe(2);
      expect(line.returnedQuantity).toBe(2);
      expect(line.deliveredQuantity).toBe(1);

      expect(line.serviceAllocations).toHaveLength(1);
      const alloc = line.serviceAllocations[0];
      expect(line instanceof GarmentLine).toBe(true);
      expect(alloc instanceof ServiceAllocation).toBe(true);
      expect(alloc.rateSnapshot instanceof RateSnapshot).toBe(true);
      expect(Object.isFrozen(alloc.rateSnapshot)).toBe(true);
      expect(alloc.rateSnapshot?.unitRate).toBe(25);
      expect(alloc.rateSnapshot?.capturedAt).toBe('2026-08-15T09:00:00.000Z');
      expect(alloc.rateSnapshot?.chargeMasterRateId).toBe('LRATE-004');
    });

    it('Test 12B — Comprehensive Aggregate Tree Hydration: all 11 child/value entities reconstructed as domain classes', () => {
      const repo1 = new InMemoryLaundryRepository([], true);

      const comprehensiveTx = new LaundryTransaction({
        id: 'LTX-FULL-TREE',
        stayId: 'STAY-FT-01',
        residentId: 'RES-FT-01',
        status: LaundryTransactionStatus.COMPLETED,
        collectedAt: '2026-08-15T09:00:00.000Z',
        collectionEvidence: {
          photoUris: ['evidence://photo1.jpg'],
          collectedByStaffId: 'STAFF-001',
          bagCount: 1,
          bagTagNumbers: ['TAG-001'],
          residentVerified: true,
          capturedAt: '2026-08-15T09:00:00.000Z',
        },
        isInspected: true,
        inspectedAt: '2026-08-15T09:30:00.000Z',
        inspectedByStaffId: 'STAFF-001',
        processingRoute: ProcessingRoute.EXTERNAL_VENDOR,
        processingVendorId: 'VND-001',
        processingReleasedAt: '2026-08-15T10:00:00.000Z',
        processingReleasedByStaffId: 'STAFF-001',
        garmentLines: [
          {
            id: 'GL-FT-1',
            transactionId: 'LTX-FULL-TREE',
            itemId: 'LITM-001',
            itemName: 'Shirt',
            physicalQuantity: 2,
            returnedQuantity: 2,
            deliveredQuantity: 2,
            createdAt: '2026-08-15T09:00:00.000Z',
            serviceAllocations: [
              {
                id: 'SA-FT-1',
                garmentLineId: 'GL-FT-1',
                serviceId: 'LSRV-001',
                requestedQuantity: 2,
                fulfilledQuantity: 2,
                fulfillmentStatus: 'FULFILLED',
                rateSnapshot: {
                  unitRate: 20,
                  capturedAt: '2026-08-15T09:00:00.000Z',
                  chargeMasterRateId: 'LRATE-001',
                  currency: 'INR',
                },
                charges: [
                  {
                    businessChargeId: 'LTX-FULL-TREE:GL-FT-1:LSRV-001:BRK-01',
                    transactionId: 'LTX-FULL-TREE',
                    garmentLineId: 'GL-FT-1',
                    serviceId: 'LSRV-001',
                    bracketIndex: 1,
                    quantity: 2,
                    unitRate: 20,
                    totalAmount: 40,
                    currency: 'INR',
                    calculatedAt: '2026-08-15T16:00:00.000Z',
                    status: 'POSTED',
                    financeBillId: 'bill-123',
                  },
                ],
                createdAt: '2026-08-15T09:00:00.000Z',
              },
            ],
            conditionObservations: [
              {
                id: 'OBS-FT-1',
                garmentLineId: 'GL-FT-1',
                observationType: 'STAIN',
                description: 'Small ink spot',
                affectedQuantity: 1,
                observedByStaffId: 'STAFF-001',
                observedAt: '2026-08-15T09:30:00.000Z',
              },
            ],
          },
        ],
        returns: [
          {
            id: 'RET-FT-1',
            transactionId: 'LTX-FULL-TREE',
            returnedLines: [
              {
                garmentLineId: 'GL-FT-1',
                returnedQuantity: 2,
              },
            ],
            returnedByStaffId: 'STAFF-002',
            returnedAt: '2026-08-15T14:00:00.000Z',
          },
        ],
        deliveries: [
          {
            id: 'DEL-FT-1',
            transactionId: 'LTX-FULL-TREE',
            deliveredLines: [
              {
                garmentLineId: 'GL-FT-1',
                deliveredQuantity: 2,
              },
            ],
            handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
            deliveredByStaffId: 'STAFF-001',
            deliveredAt: '2026-08-15T16:00:00.000Z',
          },
        ],
        exceptions: [
          {
            id: 'EXC-FT-1',
            transactionId: 'LTX-FULL-TREE',
            type: LaundryExceptionType.OTHER,
            description: 'Temporary delivery delay',
            affectedQuantity: 1,
            status: LaundryExceptionStatus.RESOLVED,
            raisedByStaffId: 'STAFF-001',
            raisedAt: '2026-08-15T12:00:00.000Z',
            investigations: [
              {
                id: 'INV-FT-1',
                exceptionId: 'EXC-FT-1',
                investigatorStaffId: 'STAFF-001',
                startedAt: '2026-08-15T12:30:00.000Z',
                findings: 'Traffic delay confirmed',
                completedAt: '2026-08-15T13:00:00.000Z',
              },
            ],
            resolution: {
              id: 'RES-FT-1',
              exceptionId: 'EXC-FT-1',
              outcome: ResolutionOutcome.NO_ACTION_REQUIRED,
              resolverStaffId: 'STAFF-001',
              resolvedAt: '2026-08-15T13:30:00.000Z',
            },
          },
        ],
      });

      repo1.saveSync(comprehensiveTx);

      const repo2 = new InMemoryLaundryRepository();
      const hydrated = repo2.findByIdSync('LTX-FULL-TREE')!;

      // Aggregate root
      expect(hydrated instanceof LaundryTransaction).toBe(true);
      expect(hydrated.collectionEvidence).toBeDefined();

      // Child entities
      expect(hydrated.garmentLines[0]).toBeDefined();
      expect(hydrated.garmentLines[0].serviceAllocations[0]).toBeDefined();
      expect(hydrated.garmentLines[0].serviceAllocations[0].rateSnapshot instanceof RateSnapshot).toBe(true);
      expect(Object.isFrozen(hydrated.garmentLines[0].serviceAllocations[0].rateSnapshot)).toBe(true);
      expect(hydrated.garmentLines[0].serviceAllocations[0].charges[0]).toBeDefined();
      expect(hydrated.garmentLines[0].conditionObservations[0]).toBeDefined();
      expect(hydrated.returns[0]).toBeDefined();
      expect(hydrated.returns[0].returnedLines[0]).toBeDefined();
      expect(hydrated.deliveries[0]).toBeDefined();
      expect(hydrated.deliveries[0].deliveredLines[0]).toBeDefined();
      expect(hydrated.exceptions[0]).toBeDefined();
      expect(hydrated.exceptions[0].investigations[0]).toBeDefined();
      expect(hydrated.exceptions[0].resolution).toBeDefined();
      expect(hydrated.businessEvents.length).toBeGreaterThan(0);
    });
  });
});
