import { describe, it, expect, beforeEach } from 'vitest';
import { LaundryTransaction } from '../entities/LaundryTransaction';
import { GarmentLine } from '../entities/GarmentLine';
import { ServiceAllocation } from '../entities/ServiceAllocation';
import { LaundryItem } from '../entities/LaundryItem';
import { LaundryService } from '../entities/LaundryService';
import { LaundryChargeRate } from '../entities/LaundryChargeRate';
import { InMemoryLaundryMasterRepository } from '../../infrastructure/repositories/InMemoryLaundryMasterRepository';
import { LaundryTransactionStatus } from '../valueObjects/LaundryTransactionStatus';

describe('Laundry Collection Confirmation & Rate Snapshot (L-04)', () => {
  let masterRepo: InMemoryLaundryMasterRepository;

  beforeEach(() => {
    masterRepo = new InMemoryLaundryMasterRepository();

    // Setup basic master catalog
    masterRepo.saveItem(
      new LaundryItem({
        id: 'LITM-001',
        code: 'SHIRT',
        name: 'Shirt',
        category: 'CLOTHING',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      })
    );

    masterRepo.saveService(
      new LaundryService({
        id: 'LSRV-001',
        code: 'CLEANING',
        name: 'Wash & Fold Cleaning',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      })
    );

    masterRepo.saveService(
      new LaundryService({
        id: 'LSRV-002',
        code: 'IRONING',
        name: 'Steam Press / Ironing',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      })
    );

    // Rate: Shirt Cleaning = ₹25
    masterRepo.saveRate(
      new LaundryChargeRate({
        id: 'LRATE-001',
        itemId: 'LITM-001',
        serviceId: 'LSRV-001',
        rate: 25,
        effectiveFrom: '2026-08-01T00:00:00.000Z',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      })
    );

    // Rate: Shirt Ironing = ₹15
    masterRepo.saveRate(
      new LaundryChargeRate({
        id: 'LRATE-002',
        itemId: 'LITM-001',
        serviceId: 'LSRV-002',
        rate: 15,
        effectiveFrom: '2026-08-01T00:00:00.000Z',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      })
    );
  });

  function createDraftTransaction(): {
    tx: LaundryTransaction;
    line: GarmentLine;
    cleaningAlloc: ServiceAllocation;
    ironingAlloc: ServiceAllocation;
  } {
    const tx = new LaundryTransaction({
      id: 'LTX-2026-0001',
      stayId: 'STAY-101',
      residentId: 'RES-201',
    });

    const line = new GarmentLine({
      id: 'GL-001',
      transactionId: 'LTX-2026-0001',
      itemId: 'LITM-001',
      itemName: 'Shirt',
      physicalQuantity: 5,
      createdAt: '2026-08-20T10:00:00.000Z',
    });

    const cleaningAlloc = new ServiceAllocation({
      id: 'SA-001',
      garmentLineId: 'GL-001',
      serviceId: 'LSRV-001',
      serviceName: 'Wash & Fold Cleaning',
      requestedQuantity: 5,
      createdAt: '2026-08-20T10:00:00.000Z',
    });

    const ironingAlloc = new ServiceAllocation({
      id: 'SA-002',
      garmentLineId: 'GL-001',
      serviceId: 'LSRV-002',
      serviceName: 'Steam Press / Ironing',
      requestedQuantity: 5,
      createdAt: '2026-08-20T10:00:00.000Z',
    });

    line.addServiceAllocation(cleaningAlloc);
    line.addServiceAllocation(ironingAlloc);
    tx.addGarmentLine(line);

    return { tx, line, cleaningAlloc, ironingAlloc };
  }

  describe('Mandatory Test Matrix', () => {
    it('Test 1 — Successful Collection Confirmation captures RateSnapshots and emits event', () => {
      const { tx, cleaningAlloc, ironingAlloc } = createDraftTransaction();
      expect(tx.status).toBe(LaundryTransactionStatus.DRAFT);
      expect(cleaningAlloc.rateSnapshot).toBeUndefined();

      tx.confirmCollection({
        masterRepository: masterRepo,
        collectedByStaffId: 'STAFF-007',
        collectionTimestamp: '2026-08-20T12:00:00.000Z',
        photoUris: ['https://storage.rpgms.internal/laundry/photo-01.jpg'],
        bagCount: 1,
        bagTagNumbers: ['BAG-101'],
        residentVerified: true,
        notes: '5 formal shirts received in good order',
      });

      expect(tx.status).toBe(LaundryTransactionStatus.COLLECTED);
      expect(tx.collectedAt).toBe('2026-08-20T12:00:00.000Z');
      expect(tx.collectionEvidence).toBeDefined();
      expect(tx.collectionEvidence?.collectedByStaffId).toBe('STAFF-007');
      expect(tx.collectionEvidence?.photoUris).toEqual(['https://storage.rpgms.internal/laundry/photo-01.jpg']);
      expect(tx.collectionEvidence?.residentVerified).toBe(true);

      // Verify RateSnapshots
      expect(cleaningAlloc.rateSnapshot).toBeDefined();
      expect(cleaningAlloc.rateSnapshot?.unitRate).toBe(25);
      expect(cleaningAlloc.rateSnapshot?.chargeMasterRateId).toBe('LRATE-001');

      expect(ironingAlloc.rateSnapshot).toBeDefined();
      expect(ironingAlloc.rateSnapshot?.unitRate).toBe(15);
      expect(ironingAlloc.rateSnapshot?.chargeMasterRateId).toBe('LRATE-002');

      // Verify Canonical Event
      const collectionEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryCollectionConfirmed');
      expect(collectionEvents).toHaveLength(1);
      expect(collectionEvents[0].transactionId).toBe('LTX-2026-0001');
      expect(collectionEvents[0].metadata).toEqual({
        stayId: 'STAY-101',
        residentId: 'RES-201',
        collectedAt: '2026-08-20T12:00:00.000Z',
        collectedByStaffId: 'STAFF-007',
        totalPhysicalPieces: 5,
        garmentLineCount: 1,
        hasPhotoEvidence: true,
        residentVerified: true,
      });
    });

    it('Test 2 — No Effective Rate rejects collection confirmation and leaves transaction in DRAFT', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-2026-0002',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });

      const line = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-2026-0002',
        itemId: 'LITM-UNKNOWN', // Non-existent rate
        physicalQuantity: 2,
        createdAt: '2026-08-20',
      });

      const alloc = new ServiceAllocation({
        id: 'SA-001',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-001',
        requestedQuantity: 2,
        createdAt: '2026-08-20',
      });

      line.addServiceAllocation(alloc);
      tx.addGarmentLine(line);

      expect(() =>
        tx.confirmCollection({
          masterRepository: masterRepo,
          collectedByStaffId: 'STAFF-007',
        })
      ).toThrow('No active effective LaundryChargeRate found for Item (LITM-UNKNOWN)');

      expect(tx.status).toBe(LaundryTransactionStatus.DRAFT);
      expect(tx.collectedAt).toBeUndefined();
      expect(alloc.rateSnapshot).toBeUndefined();
      expect(tx.businessEvents.filter((e) => e.eventType === 'LaundryCollectionConfirmed')).toHaveLength(0);
    });

    it('Test 3 — Historical Rate Selection captures rate effective at collection time', () => {
      // Create isolated repository for historical rate test
      const testRepo = new InMemoryLaundryMasterRepository([], [], []);
      testRepo.saveItem(
        new LaundryItem({
          id: 'LITM-001',
          code: 'SHIRT',
          name: 'Shirt',
          category: 'CLOTHING',
          isActive: true,
          createdAt: '2026-08-01T00:00:00.000Z',
        })
      );
      testRepo.saveService(
        new LaundryService({
          id: 'LSRV-001',
          code: 'CLEANING',
          name: 'Wash & Fold Cleaning',
          isActive: true,
          createdAt: '2026-08-01T00:00:00.000Z',
        })
      );

      // Historical rate timeline:
      // T1 (2026-08-01 to 2026-08-15) = ₹100
      // T2 (2026-08-16 onwards) = ₹120
      testRepo.saveRate(
        new LaundryChargeRate({
          id: 'LRATE-HIST-1',
          itemId: 'LITM-001',
          serviceId: 'LSRV-001',
          rate: 100,
          effectiveFrom: '2026-08-01T00:00:00.000Z',
          effectiveUntil: '2026-08-15T23:59:59.999Z',
          isActive: true,
          createdAt: '2026-08-01T00:00:00.000Z',
        })
      );

      testRepo.saveRate(
        new LaundryChargeRate({
          id: 'LRATE-HIST-2',
          itemId: 'LITM-001',
          serviceId: 'LSRV-001',
          rate: 120,
          effectiveFrom: '2026-08-16T00:00:00.000Z',
          isActive: true,
          createdAt: '2026-08-01T00:00:00.000Z',
        })
      );

      // Transaction A collected on 2026-08-10 (during T1)
      const txA = new LaundryTransaction({ id: 'LTX-A', stayId: 'STAY-1', residentId: 'RES-1' });
      const lineA = new GarmentLine({ id: 'GL-A', transactionId: 'LTX-A', itemId: 'LITM-001', physicalQuantity: 1, createdAt: '2026-08-10' });
      const allocA = new ServiceAllocation({ id: 'SA-A', garmentLineId: 'GL-A', serviceId: 'LSRV-001', requestedQuantity: 1, createdAt: '2026-08-10' });
      lineA.addServiceAllocation(allocA);
      txA.addGarmentLine(lineA);

      txA.confirmCollection({
        masterRepository: testRepo,
        collectedByStaffId: 'STAFF-1',
        collectionTimestamp: '2026-08-10T10:00:00.000Z',
      });
      expect(allocA.rateSnapshot?.unitRate).toBe(100);

      // Transaction B collected on 2026-08-20 (during T2)
      const txB = new LaundryTransaction({ id: 'LTX-B', stayId: 'STAY-1', residentId: 'RES-1' });
      const lineB = new GarmentLine({ id: 'GL-B', transactionId: 'LTX-B', itemId: 'LITM-001', physicalQuantity: 1, createdAt: '2026-08-20' });
      const allocB = new ServiceAllocation({ id: 'SA-B', garmentLineId: 'GL-B', serviceId: 'LSRV-001', requestedQuantity: 1, createdAt: '2026-08-20' });
      lineB.addServiceAllocation(allocB);
      txB.addGarmentLine(lineB);

      txB.confirmCollection({
        masterRepository: testRepo,
        collectedByStaffId: 'STAFF-1',
        collectionTimestamp: '2026-08-20T10:00:00.000Z',
      });
      expect(allocB.rateSnapshot?.unitRate).toBe(120);
    });

    it('Test 4 — Rate Change After Collection does not alter captured RateSnapshot', () => {
      const { tx, cleaningAlloc } = createDraftTransaction();

      tx.confirmCollection({
        masterRepository: masterRepo,
        collectedByStaffId: 'STAFF-007',
        collectionTimestamp: '2026-08-20T10:00:00.000Z',
      });
      expect(cleaningAlloc.rateSnapshot?.unitRate).toBe(25);

      // Update master catalog to ₹50
      masterRepo.saveRate(
        new LaundryChargeRate({
          id: 'LRATE-001',
          itemId: 'LITM-001',
          serviceId: 'LSRV-001',
          rate: 50,
          effectiveFrom: '2026-08-20T12:00:00.000Z',
          isActive: true,
          createdAt: '2026-08-20T12:00:00.000Z',
        })
      );

      // Transaction snapshot remains permanently ₹25
      expect(cleaningAlloc.rateSnapshot?.unitRate).toBe(25);
    });

    it('Test 5 — Multiple Services on one line preserve independent rates', () => {
      const { tx, cleaningAlloc, ironingAlloc } = createDraftTransaction();

      tx.confirmCollection({
        masterRepository: masterRepo,
        collectedByStaffId: 'STAFF-007',
      });

      expect(cleaningAlloc.rateSnapshot?.unitRate).toBe(25); // Cleaning = ₹25
      expect(ironingAlloc.rateSnapshot?.unitRate).toBe(15);  // Ironing = ₹15
    });

    it('Test 6 — Snapshot Immutability runtime enforcement', () => {
      const { tx, cleaningAlloc } = createDraftTransaction();

      tx.confirmCollection({
        masterRepository: masterRepo,
        collectedByStaffId: 'STAFF-007',
      });

      const snapshot = cleaningAlloc.rateSnapshot!;
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(() => {
        (snapshot as any).unitRate = 999;
      }).toThrow();
      expect(snapshot.unitRate).toBe(25);
    });

    it('Test 7 — Duplicate Collection is rejected', () => {
      const { tx } = createDraftTransaction();

      tx.confirmCollection({
        masterRepository: masterRepo,
        collectedByStaffId: 'STAFF-007',
      });

      expect(() =>
        tx.confirmCollection({
          masterRepository: masterRepo,
          collectedByStaffId: 'STAFF-007',
        })
      ).toThrow('Collection can only be confirmed from DRAFT status.');

      expect(tx.businessEvents.filter((e) => e.eventType === 'LaundryCollectionConfirmed')).toHaveLength(1);
    });

    it('Test 8 — Collection Does Not Mean Fulfillment (fulfilledQuantity remains 0)', () => {
      const { tx, cleaningAlloc, ironingAlloc } = createDraftTransaction();

      tx.confirmCollection({
        masterRepository: masterRepo,
        collectedByStaffId: 'STAFF-007',
      });

      expect(cleaningAlloc.fulfilledQuantity).toBe(0);
      expect(ironingAlloc.fulfilledQuantity).toBe(0);
      expect(cleaningAlloc.fulfillmentStatus).toBe('PENDING');
      expect(ironingAlloc.fulfillmentStatus).toBe('PENDING');
    });

    it('Test 9 — Collection Does Not Mean Delivery (deliveredQuantity remains 0)', () => {
      const { tx, line } = createDraftTransaction();

      tx.confirmCollection({
        masterRepository: masterRepo,
        collectedByStaffId: 'STAFF-007',
      });

      expect(line.deliveredQuantity).toBe(0);
    });

    it('Test 10 — Collection Does Not Mean Charge (zero charges generated upon collection alone)', () => {
      const { tx } = createDraftTransaction();

      tx.confirmCollection({
        masterRepository: masterRepo,
        collectedByStaffId: 'STAFF-007',
      });

      expect(tx.charges).toHaveLength(0);
      expect(tx.businessEvents.filter((e) => e.eventType === 'LaundryChargeRaised')).toHaveLength(0);
    });

    it('Test 11 — Existing L-03 Chargeability Regression with L-04 snapshot', () => {
      const { tx, cleaningAlloc } = createDraftTransaction();

      tx.confirmCollection({
        masterRepository: masterRepo,
        collectedByStaffId: 'STAFF-007',
      });

      // Fulfill 3 Cleaning units and deliver 3 garments
      tx.recordServiceFulfillment('GL-001', 'LSRV-001', 3);
      const charges = tx.recordDeliveryQuantity('GL-001', 3);

      expect(charges).toHaveLength(1);
      expect(charges[0].bracketIndex).toBe(1);
      expect(charges[0].businessChargeId).toBe('LTX-2026-0001:GL-001:LSRV-001:BRK-01');
      expect(charges[0].quantity).toBe(3);
      expect(charges[0].unitRate).toBe(25);
      expect(charges[0].totalAmount).toBe(75); // 3 × 25
      expect(cleaningAlloc.previouslyChargedQuantity).toBe(3);
    });

    it('Test 12 — Existing Charge Uses Snapshot rate, not modified master rate', () => {
      const { tx } = createDraftTransaction();

      // Confirmed at rate ₹25
      tx.confirmCollection({
        masterRepository: masterRepo,
        collectedByStaffId: 'STAFF-007',
      });

      // Master rate later updated to ₹100
      masterRepo.saveRate(
        new LaundryChargeRate({
          id: 'LRATE-001',
          itemId: 'LITM-001',
          serviceId: 'LSRV-001',
          rate: 100,
          effectiveFrom: '2026-08-25T00:00:00.000Z',
          isActive: true,
          createdAt: '2026-08-25T00:00:00.000Z',
        })
      );

      // Charge generated after master rate changed
      tx.recordServiceFulfillment('GL-001', 'LSRV-001', 4);
      const charges = tx.recordDeliveryQuantity('GL-001', 4);

      expect(charges).toHaveLength(1);
      // Must use captured snapshot rate ₹25, NOT ₹100
      expect(charges[0].unitRate).toBe(25);
      expect(charges[0].totalAmount).toBe(100); // 4 × 25 = 100
    });
  });
});
