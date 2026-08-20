import { describe, it, expect, beforeEach } from 'vitest';
import { LaundryTransaction } from '../entities/LaundryTransaction';
import { GarmentLine } from '../entities/GarmentLine';
import { ServiceAllocation } from '../entities/ServiceAllocation';
import { LaundryItem } from '../entities/LaundryItem';
import { LaundryService } from '../entities/LaundryService';
import { LaundryChargeRate } from '../entities/LaundryChargeRate';
import { ReturnLine } from '../entities/ReturnLine';
import { LaundryReturn } from '../entities/LaundryReturn';
import { ProcessingRoute } from '../valueObjects/ProcessingRoute';
import { InMemoryLaundryMasterRepository } from '../../infrastructure/repositories/InMemoryLaundryMasterRepository';
import { LaundryTransactionStatus } from '../valueObjects/LaundryTransactionStatus';

describe('Laundry Returns, Physical Receipt & Custody Reconciliation (L-06)', () => {
  let masterRepo: InMemoryLaundryMasterRepository;

  beforeEach(() => {
    masterRepo = new InMemoryLaundryMasterRepository([], [], []);

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

    masterRepo.saveItem(
      new LaundryItem({
        id: 'LITM-002',
        code: 'TROUSER',
        name: 'Trouser',
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

    masterRepo.saveRate(
      new LaundryChargeRate({
        id: 'LRATE-001',
        itemId: 'LITM-001',
        serviceId: 'LSRV-001',
        rate: 30,
        effectiveFrom: '2026-08-01T00:00:00.000Z',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      })
    );

    masterRepo.saveRate(
      new LaundryChargeRate({
        id: 'LRATE-002',
        itemId: 'LITM-002',
        serviceId: 'LSRV-001',
        rate: 40,
        effectiveFrom: '2026-08-01T00:00:00.000Z',
        isActive: true,
        createdAt: '2026-08-01T00:00:00.000Z',
      })
    );
  });

  function createInProcessTransaction(): {
    tx: LaundryTransaction;
    shirtLine: GarmentLine;
    trouserLine: GarmentLine;
  } {
    const tx = new LaundryTransaction({
      id: 'LTX-2026-0006',
      stayId: 'STAY-106',
      residentId: 'RES-206',
    });

    const shirtLine = new GarmentLine({
      id: 'GL-SHIRT',
      transactionId: 'LTX-2026-0006',
      itemId: 'LITM-001',
      itemName: 'Shirt',
      physicalQuantity: 6,
      createdAt: '2026-08-20T10:00:00.000Z',
    });
    const shirtAlloc = new ServiceAllocation({
      id: 'SA-SHIRT',
      garmentLineId: 'GL-SHIRT',
      serviceId: 'LSRV-001',
      requestedQuantity: 6,
      createdAt: '2026-08-20T10:00:00.000Z',
    });
    shirtLine.addServiceAllocation(shirtAlloc);

    const trouserLine = new GarmentLine({
      id: 'GL-TROUSER',
      transactionId: 'LTX-2026-0006',
      itemId: 'LITM-002',
      itemName: 'Trouser',
      physicalQuantity: 4,
      createdAt: '2026-08-20T10:00:00.000Z',
    });
    const trouserAlloc = new ServiceAllocation({
      id: 'SA-TROUSER',
      garmentLineId: 'GL-TROUSER',
      serviceId: 'LSRV-001',
      requestedQuantity: 4,
      createdAt: '2026-08-20T10:00:00.000Z',
    });
    trouserLine.addServiceAllocation(trouserAlloc);

    tx.addGarmentLine(shirtLine);
    tx.addGarmentLine(trouserLine);

    // Collection (10 total physical pieces)
    tx.confirmCollection({
      masterRepository: masterRepo,
      collectedByStaffId: 'STAFF-COLLECT-01',
      collectionTimestamp: '2026-08-20T10:30:00.000Z',
    });

    // Inspection
    tx.completeInspection({
      inspectedByStaffId: 'STAFF-INSPECT-01',
      inspectedAt: '2026-08-20T11:00:00.000Z',
    });

    // Processing Release
    tx.releaseProcessing({
      route: ProcessingRoute.EXTERNAL_VENDOR,
      vendorId: 'VEND-QUICKCLEAN',
      releasedByStaffId: 'STAFF-RELEASE-01',
      releasedAt: '2026-08-20T11:30:00.000Z',
    });

    return { tx, shirtLine, trouserLine };
  }

  describe('Mandatory Test Matrix', () => {
    it('Test 1 — Invalid Lifecycle Return is rejected before processing release', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-DRAFT',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });
      const line = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-DRAFT',
        itemId: 'LITM-001',
        physicalQuantity: 5,
        createdAt: '2026-08-20',
      });
      tx.addGarmentLine(line);

      // Attempt return on DRAFT transaction
      expect(() =>
        tx.recordReturn({
          returnedLines: [{ garmentLineId: 'GL-001', returnedQuantity: 5 }],
          returnedByStaffId: 'STAFF-RECEIVE-01',
        })
      ).toThrow('Return can only be recorded after processing release');

      expect(tx.returns).toHaveLength(0);
      expect(line.returnedQuantity).toBe(0);
    });

    it('Test 2 — Successful Full Return records receipt, updates status to RETURNED_FULL and reconciles to 0 outstanding', () => {
      const { tx, shirtLine, trouserLine } = createInProcessTransaction();
      expect(tx.totalCollectedPieces).toBe(10);
      expect(tx.status).toBe(LaundryTransactionStatus.IN_PROCESS);

      const ret = tx.recordReturn({
        returnId: 'RET-001',
        returnedLines: [
          { garmentLineId: 'GL-SHIRT', returnedQuantity: 6 },
          { garmentLineId: 'GL-TROUSER', returnedQuantity: 4 },
        ],
        returnedByStaffId: 'STAFF-RECEIVE-01',
        returnedAt: '2026-08-21T09:00:00.000Z',
        vendorId: 'VEND-QUICKCLEAN',
        notes: 'All 10 items received in crisp condition',
      });

      expect(ret).toBeInstanceOf(LaundryReturn);
      expect(ret.totalReturnedQuantity).toBe(10);
      expect(tx.status).toBe(LaundryTransactionStatus.RETURNED_FULL);
      expect(shirtLine.returnedQuantity).toBe(6);
      expect(trouserLine.returnedQuantity).toBe(4);
      expect(tx.totalReturnedPieces).toBe(10);
      expect(tx.totalOutstandingReturnPieces).toBe(0);

      const reconciliation = tx.reconcileCustody();
      expect(reconciliation.isFullyReconciled).toBe(true);
      expect(reconciliation.hasDiscrepancy).toBe(false);
      expect(reconciliation.status).toBe('FULLY_RECONCILED');
      expect(reconciliation.totalOutstanding).toBe(0);

      // Verify canonical event
      const returnEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryReturned');
      expect(returnEvents).toHaveLength(1);
      expect(returnEvents[0].metadata).toEqual({
        stayId: 'STAY-106',
        residentId: 'RES-206',
        returnId: 'RET-001',
        returnedByStaffId: 'STAFF-RECEIVE-01',
        returnedAt: '2026-08-21T09:00:00.000Z',
        returnedPiecesInThisReceipt: 10,
        cumulativeReturnedPieces: 10,
        totalCollectedPieces: 10,
        outstandingPieces: 0,
        isFullyReturned: true,
        vendorId: 'VEND-QUICKCLEAN',
      });
    });

    it('Test 3 — Partial Return updates status to RETURNED_PARTIAL and records outstanding pieces', () => {
      const { tx, shirtLine, trouserLine } = createInProcessTransaction();

      const ret = tx.recordReturn({
        returnId: 'RET-PARTIAL-1',
        returnedLines: [
          { garmentLineId: 'GL-SHIRT', returnedQuantity: 6 },
          // 0 Trousers returned
        ],
        returnedByStaffId: 'STAFF-RECEIVE-01',
        returnedAt: '2026-08-21T09:00:00.000Z',
      });

      expect(ret.totalReturnedQuantity).toBe(6);
      expect(tx.status).toBe(LaundryTransactionStatus.RETURNED_PARTIAL);
      expect(shirtLine.returnedQuantity).toBe(6);
      expect(trouserLine.returnedQuantity).toBe(0);
      expect(tx.totalReturnedPieces).toBe(6);
      expect(tx.totalOutstandingReturnPieces).toBe(4);

      const reconciliation = tx.reconcileCustody();
      expect(reconciliation.isFullyReconciled).toBe(false);
      expect(reconciliation.hasDiscrepancy).toBe(true);
      expect(reconciliation.status).toBe('PARTIALLY_RECONCILED');
      expect(reconciliation.totalOutstanding).toBe(4);
    });

    it('Test 4 — Multiple Partial Returns reconcile cumulatively and preserve distinct historical receipts', () => {
      const { tx, shirtLine, trouserLine } = createInProcessTransaction();

      // Return #1: 6 Shirts
      tx.recordReturn({
        returnId: 'RET-01',
        returnedLines: [{ garmentLineId: 'GL-SHIRT', returnedQuantity: 6 }],
        returnedByStaffId: 'STAFF-01',
        returnedAt: '2026-08-21T09:00:00.000Z',
      });
      expect(tx.status).toBe(LaundryTransactionStatus.RETURNED_PARTIAL);
      expect(tx.totalReturnedPieces).toBe(6);

      // Return #2: 2 Trousers
      tx.recordReturn({
        returnId: 'RET-02',
        returnedLines: [{ garmentLineId: 'GL-TROUSER', returnedQuantity: 2 }],
        returnedByStaffId: 'STAFF-02',
        returnedAt: '2026-08-21T12:00:00.000Z',
      });
      expect(tx.status).toBe(LaundryTransactionStatus.RETURNED_PARTIAL);
      expect(tx.totalReturnedPieces).toBe(8);

      // Return #3: remaining 2 Trousers
      tx.recordReturn({
        returnId: 'RET-03',
        returnedLines: [{ garmentLineId: 'GL-TROUSER', returnedQuantity: 2 }],
        returnedByStaffId: 'STAFF-03',
        returnedAt: '2026-08-21T15:00:00.000Z',
      });
      expect(tx.status).toBe(LaundryTransactionStatus.RETURNED_FULL);
      expect(tx.totalReturnedPieces).toBe(10);
      expect(tx.totalOutstandingReturnPieces).toBe(0);

      // All 3 separate receipts are preserved
      expect(tx.returns).toHaveLength(3);
      expect(tx.returns[0].id).toBe('RET-01');
      expect(tx.returns[1].id).toBe('RET-02');
      expect(tx.returns[2].id).toBe('RET-03');

      expect(shirtLine.returnedQuantity).toBe(6);
      expect(trouserLine.returnedQuantity).toBe(4);
    });

    it('Test 5 — Under-Return records discrepancy domain fact without creating Exception entity', () => {
      const { tx } = createInProcessTransaction();

      tx.recordReturn({
        returnId: 'RET-01',
        returnedLines: [
          { garmentLineId: 'GL-SHIRT', returnedQuantity: 6 },
          { garmentLineId: 'GL-TROUSER', returnedQuantity: 2 }, // 2 trousers missing
        ],
        returnedByStaffId: 'STAFF-01',
      });

      const reconciliation = tx.reconcileCustody();
      expect(reconciliation.totalCollected).toBe(10);
      expect(reconciliation.totalReturned).toBe(8);
      expect(reconciliation.totalOutstanding).toBe(2);
      expect(reconciliation.hasDiscrepancy).toBe(true);

      // Boundary check: No Exception entities or workflows created in L-06
      expect((tx as any).exceptions).toBeUndefined();
    });

    it('Test 6 — Over-Return is rejected and does not silently clamp quantity', () => {
      const { tx, shirtLine } = createInProcessTransaction();
      expect(shirtLine.physicalQuantity).toBe(6);

      // Attempt to return 7 shirts (expected 6)
      expect(() =>
        tx.recordReturn({
          returnId: 'RET-EXCESS',
          returnedLines: [{ garmentLineId: 'GL-SHIRT', returnedQuantity: 7 }],
          returnedByStaffId: 'STAFF-01',
        })
      ).toThrow('would exceed expected physical quantity (6)');

      expect(shirtLine.returnedQuantity).toBe(0);
      expect(tx.returns).toHaveLength(0);
    });

    it('Test 7 — Duplicate Return Identity is rejected and prevents duplicate custody counts', () => {
      const { tx } = createInProcessTransaction();

      tx.recordReturn({
        returnId: 'RET-DUP-01',
        returnedLines: [{ garmentLineId: 'GL-SHIRT', returnedQuantity: 3 }],
        returnedByStaffId: 'STAFF-01',
      });
      expect(tx.totalReturnedPieces).toBe(3);

      // Duplicate submission with same returnId
      expect(() =>
        tx.recordReturn({
          returnId: 'RET-DUP-01',
          returnedLines: [{ garmentLineId: 'GL-SHIRT', returnedQuantity: 3 }],
          returnedByStaffId: 'STAFF-01',
        })
      ).toThrow('Return with ID (RET-DUP-01) has already been recorded');

      expect(tx.totalReturnedPieces).toBe(3);
      expect(tx.returns).toHaveLength(1);
    });

    it('Test 8 — Return Immutability is enforced at runtime', () => {
      const { tx } = createInProcessTransaction();

      const ret = tx.recordReturn({
        returnId: 'RET-IMMUTABLE',
        returnedLines: [new ReturnLine({ garmentLineId: 'GL-SHIRT', returnedQuantity: 4 })],
        returnedByStaffId: 'STAFF-01',
      });

      expect(Object.isFrozen(ret)).toBe(true);
      expect(Object.isFrozen(ret.returnedLines)).toBe(true);
      expect(Object.isFrozen(ret.returnedLines[0])).toBe(true);

      expect(() => {
        (ret as any).returnedByStaffId = 'STAFF-HACK';
      }).toThrow();
      expect(() => {
        (ret.returnedLines[0] as any).returnedQuantity = 99;
      }).toThrow();

      expect(ret.returnedByStaffId).toBe('STAFF-01');
      expect(ret.returnedLines[0].returnedQuantity).toBe(4);
    });

    it('Test 9 — Reconciliation Derivation is dynamically computed from physical facts', () => {
      const { tx } = createInProcessTransaction();

      const initialReconciliation = tx.reconcileCustody();
      expect(initialReconciliation.totalCollected).toBe(10);
      expect(initialReconciliation.totalReturned).toBe(0);
      expect(initialReconciliation.totalOutstanding).toBe(10);
      expect(initialReconciliation.status).toBe('PENDING_RETURN');

      tx.recordReturn({
        returnedLines: [
          { garmentLineId: 'GL-SHIRT', returnedQuantity: 6 },
          { garmentLineId: 'GL-TROUSER', returnedQuantity: 4 },
        ],
        returnedByStaffId: 'STAFF-01',
      });

      const updatedReconciliation = tx.reconcileCustody();
      expect(updatedReconciliation.totalReturned).toBe(10);
      expect(updatedReconciliation.totalOutstanding).toBe(0);
      expect(updatedReconciliation.status).toBe('FULLY_RECONCILED');
    });

    it('Test 10 — Return Evidence and notes metadata are preserved immutably', () => {
      const { tx } = createInProcessTransaction();

      const ret = tx.recordReturn({
        returnId: 'RET-EVIDENCE',
        returnedLines: [{ garmentLineId: 'GL-SHIRT', returnedQuantity: 6 }],
        returnedByStaffId: 'STAFF-01',
        vendorId: 'VEND-QUICKCLEAN',
        notes: 'Handed over by driver in sealed polybag #9021',
      });

      expect(ret.notes).toBe('Handed over by driver in sealed polybag #9021');
      expect(ret.vendorId).toBe('VEND-QUICKCLEAN');
    });

    it('Test 11 — L-05 Compatibility: inspection, ConditionObservation and ProcessingRoute remain unchanged', () => {
      const { tx } = createInProcessTransaction();
      expect(tx.isInspected).toBe(true);
      expect(tx.processingRoute).toBe('EXTERNAL_VENDOR');
      expect(tx.processingVendorId).toBe('VEND-QUICKCLEAN');

      tx.recordReturn({
        returnedLines: [{ garmentLineId: 'GL-SHIRT', returnedQuantity: 6 }],
        returnedByStaffId: 'STAFF-01',
      });

      expect(tx.isInspected).toBe(true);
      expect(tx.processingRoute).toBe('EXTERNAL_VENDOR');
      expect(tx.processingVendorId).toBe('VEND-QUICKCLEAN');
    });

    it('Test 12 — L-04 Compatibility: RateSnapshot, CollectionEvidence and collectedAt remain unchanged', () => {
      const { tx, shirtLine } = createInProcessTransaction();
      const shirtAlloc = shirtLine.getServiceAllocation('LSRV-001')!;
      expect(shirtAlloc.rateSnapshot?.unitRate).toBe(30);
      expect(tx.collectedAt).toBe('2026-08-20T10:30:00.000Z');

      tx.recordReturn({
        returnedLines: [{ garmentLineId: 'GL-SHIRT', returnedQuantity: 6 }],
        returnedByStaffId: 'STAFF-01',
      });

      expect(shirtAlloc.rateSnapshot?.unitRate).toBe(30);
      expect(tx.collectedAt).toBe('2026-08-20T10:30:00.000Z');
      expect(tx.collectionEvidence).toBeDefined();
    });

    it('Test 13 — L-03 Compatibility: BR-L-012, deliveredQuantity and charge records remain unchanged by return', () => {
      const { tx, shirtLine } = createInProcessTransaction();
      expect(shirtLine.deliveredQuantity).toBe(0);
      expect(tx.charges).toHaveLength(0);

      tx.recordReturn({
        returnedLines: [
          { garmentLineId: 'GL-SHIRT', returnedQuantity: 6 },
          { garmentLineId: 'GL-TROUSER', returnedQuantity: 4 },
        ],
        returnedByStaffId: 'STAFF-01',
      });

      // Return alone does NOT increase deliveredQuantity or create charges
      expect(shirtLine.deliveredQuantity).toBe(0);
      expect(tx.charges).toHaveLength(0);
    });

    it('Test 14 — No Delivery: deliveredQuantity strictly remains unchanged and no Delivery workflow is created', () => {
      const { tx, shirtLine } = createInProcessTransaction();

      tx.recordReturn({
        returnedLines: [{ garmentLineId: 'GL-SHIRT', returnedQuantity: 6 }],
        returnedByStaffId: 'STAFF-01',
      });

      expect(shirtLine.deliveredQuantity).toBe(0);
      expect(tx.businessEvents.filter((e) => e.eventType === 'LaundryDelivered')).toHaveLength(0);
    });

    it('Test 15 — No Exception Workflow: Under-return produces reconciliation fact only, not Exception entities', () => {
      const { tx } = createInProcessTransaction();

      tx.recordReturn({
        returnedLines: [{ garmentLineId: 'GL-SHIRT', returnedQuantity: 4 }], // 2 shirts missing
        returnedByStaffId: 'STAFF-01',
      });

      const reconciliation = tx.reconcileCustody();
      expect(reconciliation.totalOutstanding).toBe(6);
      expect(reconciliation.hasDiscrepancy).toBe(true);

      // Verify no Exception business events emitted in L-06
      expect(tx.businessEvents.filter((e) => e.eventType === 'LaundryExceptionRaised')).toHaveLength(0);
    });

    it('Test 16 — No Finance: No Finance bill or ledger activity occurs upon physical return', () => {
      const { tx } = createInProcessTransaction();

      tx.recordReturn({
        returnedLines: [{ garmentLineId: 'GL-SHIRT', returnedQuantity: 6 }],
        returnedByStaffId: 'STAFF-01',
      });

      expect(tx.charges).toHaveLength(0);
    });
  });
});
