import { describe, it, expect, beforeEach } from 'vitest';
import { LaundryTransaction } from '../entities/LaundryTransaction';
import { GarmentLine } from '../entities/GarmentLine';
import { ServiceAllocation } from '../entities/ServiceAllocation';
import { LaundryItem } from '../entities/LaundryItem';
import { LaundryService } from '../entities/LaundryService';
import { LaundryChargeRate } from '../entities/LaundryChargeRate';
import { DeliveryLine } from '../entities/DeliveryLine';
import { LaundryDelivery } from '../entities/LaundryDelivery';
import { DeliveryHandoverMethod } from '../valueObjects/DeliveryHandoverMethod';
import { LaundryExceptionType } from '../valueObjects/LaundryExceptionType';
import { LaundryExceptionStatus } from '../valueObjects/LaundryExceptionStatus';
import { ResolutionOutcome } from '../valueObjects/ResolutionOutcome';
import { ResponsibleParty } from '../valueObjects/ResponsibleParty';
import { ProcessingRoute } from '../valueObjects/ProcessingRoute';
import { InMemoryLaundryMasterRepository } from '../../infrastructure/repositories/InMemoryLaundryMasterRepository';
import { LaundryTransactionStatus } from '../valueObjects/LaundryTransactionStatus';

describe('Laundry Delivery + Exceptions / Investigations / Resolutions (L-07)', () => {
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

  function createReturnedTransaction(): {
    tx: LaundryTransaction;
    shirtLine: GarmentLine;
    trouserLine: GarmentLine;
    shirtAlloc: ServiceAllocation;
    trouserAlloc: ServiceAllocation;
  } {
    const tx = new LaundryTransaction({
      id: 'LTX-2026-0007',
      stayId: 'STAY-107',
      residentId: 'RES-207',
    });

    const shirtLine = new GarmentLine({
      id: 'GL-SHIRT',
      transactionId: 'LTX-2026-0007',
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
      transactionId: 'LTX-2026-0007',
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
      route: ProcessingRoute.IN_HOUSE,
      releasedByStaffId: 'STAFF-RELEASE-01',
      releasedAt: '2026-08-20T11:30:00.000Z',
    });

    // Fulfillment (6 shirts, 4 trousers)
    tx.recordServiceFulfillment('GL-SHIRT', 'LSRV-001', 6, 'FULFILLED');
    tx.recordServiceFulfillment('GL-TROUSER', 'LSRV-001', 4, 'FULFILLED');

    // Physical Return (All 10 pieces returned)
    tx.recordReturn({
      returnId: 'RET-001',
      returnedLines: [
        { garmentLineId: 'GL-SHIRT', returnedQuantity: 6 },
        { garmentLineId: 'GL-TROUSER', returnedQuantity: 4 },
      ],
      returnedByStaffId: 'STAFF-RECEIVE-01',
      returnedAt: '2026-08-21T09:00:00.000Z',
    });

    return { tx, shirtLine, trouserLine, shirtAlloc, trouserAlloc };
  }

  describe('Delivery Tests', () => {
    it('Test 1 — Invalid Delivery State is rejected on DRAFT or COLLECTED transaction', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-DRAFT',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });
      const line = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-DRAFT',
        itemId: 'LITM-001',
        physicalQuantity: 2,
        createdAt: '2026-08-20',
      });
      tx.addGarmentLine(line);

      expect(() =>
        tx.recordDelivery({
          deliveredLines: [{ garmentLineId: 'GL-001', deliveredQuantity: 2 }],
          handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
          deliveredByStaffId: 'STAFF-01',
        })
      ).toThrow('Delivery can only be recorded for returned laundry');

      expect(tx.deliveries).toHaveLength(0);
      expect(line.deliveredQuantity).toBe(0);
    });

    it('Test 2 — Valid Delivery records receipt, updates pieces, and emits LaundryDelivered event', () => {
      const { tx, shirtLine, trouserLine } = createReturnedTransaction();

      const delivery = tx.recordDelivery({
        deliveryId: 'DEL-001',
        deliveredLines: [
          { garmentLineId: 'GL-SHIRT', deliveredQuantity: 6 },
          { garmentLineId: 'GL-TROUSER', deliveredQuantity: 4 },
        ],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-DELIVER-01',
        deliveredAt: '2026-08-21T10:00:00.000Z',
        residentPresent: true,
        residentVerified: true,
        notes: 'Handed over directly to resident in room 302',
      });

      expect(delivery).toBeInstanceOf(LaundryDelivery);
      expect(delivery.totalDeliveredQuantity).toBe(10);
      expect(shirtLine.deliveredQuantity).toBe(6);
      expect(trouserLine.deliveredQuantity).toBe(4);
      expect(tx.totalDeliveredPieces).toBe(10);
      expect(tx.status).toBe(LaundryTransactionStatus.COMPLETED);

      const delEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryDelivered');
      expect(delEvents).toHaveLength(1);
      expect(delEvents[0].metadata).toEqual({
        stayId: 'STAY-107',
        residentId: 'RES-207',
        deliveryId: 'DEL-001',
        handoverMethod: 'DIRECT_HANDOVER',
        deliveredByStaffId: 'STAFF-DELIVER-01',
        deliveredAt: '2026-08-21T10:00:00.000Z',
        deliveredPiecesInThisDelivery: 10,
        cumulativeDeliveredPieces: 10,
        totalCollectedPieces: 10,
        outstandingPieces: 0,
        residentVerified: true,
        roomNumber: undefined,
      });

      // Also verify LaundryTransactionCompleted is emitted
      const compEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryTransactionCompleted');
      expect(compEvents).toHaveLength(1);
    });

    it('Test 3 — Partial Delivery preserves first delivery and updates deliverable remaining pieces', () => {
      const { tx, shirtLine, trouserLine } = createReturnedTransaction();

      const delivery = tx.recordDelivery({
        deliveryId: 'DEL-PARTIAL-1',
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 6 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      expect(delivery.totalDeliveredQuantity).toBe(6);
      expect(shirtLine.deliveredQuantity).toBe(6);
      expect(trouserLine.deliveredQuantity).toBe(0);
      expect(tx.totalDeliveredPieces).toBe(6);
      expect(tx.status).toBe(LaundryTransactionStatus.DELIVERED_PARTIAL);
    });

    it('Test 4 — Multiple Deliveries cumulate to total delivered pieces and preserve distinct historical receipts', () => {
      const { tx, shirtLine, trouserLine } = createReturnedTransaction();

      tx.recordDelivery({
        deliveryId: 'DEL-01',
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 6 }],
        handoverMethod: DeliveryHandoverMethod.ROOM_PLACEMENT,
        deliveredByStaffId: 'STAFF-01',
        roomNumber: '302',
      });

      tx.recordDelivery({
        deliveryId: 'DEL-02',
        deliveredLines: [{ garmentLineId: 'GL-TROUSER', deliveredQuantity: 4 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-02',
        residentVerified: true,
      });

      expect(tx.deliveries).toHaveLength(2);
      expect(tx.deliveries[0].id).toBe('DEL-01');
      expect(tx.deliveries[1].id).toBe('DEL-02');
      expect(tx.totalDeliveredPieces).toBe(10);
      expect(shirtLine.deliveredQuantity).toBe(6);
      expect(trouserLine.deliveredQuantity).toBe(4);
      expect(tx.status).toBe(LaundryTransactionStatus.COMPLETED);
    });

    it('Test 5 — Over-Delivery is rejected atomically and does not silently clamp quantity', () => {
      const { tx, shirtLine } = createReturnedTransaction();
      expect(shirtLine.returnedQuantity).toBe(6);

      // Attempt to deliver 7 shirts when only 6 were returned
      expect(() =>
        tx.recordDelivery({
          deliveryId: 'DEL-EXCESS',
          deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 7 }],
          handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
          deliveredByStaffId: 'STAFF-01',
        })
      ).toThrow('Available returned deliverable quantity is 6');

      expect(shirtLine.deliveredQuantity).toBe(0);
      expect(tx.deliveries).toHaveLength(0);
    });

    it('Test 6 — Duplicate Delivery ID is rejected and prevents duplicate delivery counts', () => {
      const { tx } = createReturnedTransaction();

      tx.recordDelivery({
        deliveryId: 'DEL-DUP-01',
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 3 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      expect(() =>
        tx.recordDelivery({
          deliveryId: 'DEL-DUP-01',
          deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 3 }],
          handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
          deliveredByStaffId: 'STAFF-01',
        })
      ).toThrow('Delivery with ID (DEL-DUP-01) has already been recorded');

      expect(tx.deliveries).toHaveLength(1);
      expect(tx.totalDeliveredPieces).toBe(3);
    });

    it('Test 7 — Handover Method accepts DIRECT_HANDOVER and ROOM_PLACEMENT, rejects invalid', () => {
      const { tx } = createReturnedTransaction();

      expect(() =>
        tx.recordDelivery({
          deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 2 }],
          handoverMethod: 'MAIL_DISPATCH' as any,
          deliveredByStaffId: 'STAFF-01',
        })
      ).toThrow('Invalid handoverMethod (MAIL_DISPATCH)');

      const delRoom = tx.recordDelivery({
        deliveryId: 'DEL-ROOM',
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 2 }],
        handoverMethod: DeliveryHandoverMethod.ROOM_PLACEMENT,
        deliveredByStaffId: 'STAFF-01',
        roomNumber: '302',
      });
      expect(delRoom.handoverMethod).toBe('ROOM_PLACEMENT');
      expect(delRoom.roomNumber).toBe('302');
    });

    it('Test 8 — Resident Verification is captured separately and supports unverified Room Placement', () => {
      const { tx } = createReturnedTransaction();

      const del = tx.recordDelivery({
        deliveryId: 'DEL-ROOM-UNVERIFIED',
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 3 }],
        handoverMethod: DeliveryHandoverMethod.ROOM_PLACEMENT,
        deliveredByStaffId: 'STAFF-01',
        residentPresent: false,
        residentVerified: false,
      });

      expect(del.residentPresent).toBe(false);
      expect(del.residentVerified).toBe(false);
      expect(del.totalDeliveredQuantity).toBe(3);
    });

    it('Test 9 — Delivery Evidence URIs are preserved immutably', () => {
      const { tx } = createReturnedTransaction();

      const del = tx.recordDelivery({
        deliveryId: 'DEL-EVIDENCE',
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 2 }],
        handoverMethod: DeliveryHandoverMethod.ROOM_PLACEMENT,
        deliveredByStaffId: 'STAFF-01',
        evidenceUris: ['https://storage.rpgms.internal/laundry/del-302.jpg'],
      });

      expect(del.evidenceUris).toEqual(['https://storage.rpgms.internal/laundry/del-302.jpg']);
      expect(Object.isFrozen(del.evidenceUris)).toBe(true);
    });

    it('Test 10 — Delivery Immutability is enforced at runtime', () => {
      const { tx } = createReturnedTransaction();

      const del = tx.recordDelivery({
        deliveryId: 'DEL-IMMUTABLE',
        deliveredLines: [new DeliveryLine({ garmentLineId: 'GL-SHIRT', deliveredQuantity: 2 })],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      expect(Object.isFrozen(del)).toBe(true);
      expect(Object.isFrozen(del.deliveredLines)).toBe(true);
      expect(Object.isFrozen(del.deliveredLines[0])).toBe(true);

      expect(() => {
        (del as any).deliveredByStaffId = 'STAFF-TAMPER';
      }).toThrow();
      expect(() => {
        (del.deliveredLines[0] as any).deliveredQuantity = 99;
      }).toThrow();
    });
  });

  describe('Chargeability Tests', () => {
    it('Test 11 — Delivery Creates Physical Delivery Fact on GarmentLine', () => {
      const { tx, shirtLine } = createReturnedTransaction();
      expect(shirtLine.deliveredQuantity).toBe(0);

      tx.recordDelivery({
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 4 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      expect(shirtLine.deliveredQuantity).toBe(4);
    });

    it('Test 12 — BR-L-012 Reconciliation evaluates chargeability with delivery fact and emits LaundryChargeRaised', () => {
      const { tx } = createReturnedTransaction();
      expect(tx.charges).toHaveLength(0);

      // Fulfill 6, Deliver 4 -> 4 become chargeable at ₹30 = ₹120
      tx.recordDelivery({
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 4 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      expect(tx.charges).toHaveLength(1);
      const charge = tx.charges[0];
      expect(charge.quantity).toBe(4);
      expect(charge.unitRate).toBe(30);
      expect(charge.totalAmount).toBe(120);
      expect(charge.businessChargeId).toBe('LTX-2026-0007:GL-SHIRT:LSRV-001:BRK-01');

      const chargeEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryChargeRaised');
      expect(chargeEvents).toHaveLength(1);
      expect(chargeEvents[0].metadata?.totalAmount).toBe(120);
    });

    it('Test 13 — No Finance Posting: delivery alone does not create Finance bills or ledger entries', () => {
      const { tx } = createReturnedTransaction();

      tx.recordDelivery({
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 6 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      // Verify charge records are in PENDING_POSTING status (no Finance integration in L-07)
      for (const charge of tx.charges) {
        expect(charge.status).toBe('PENDING_POSTING');
        expect(charge.financeBillId).toBeUndefined();
      }
    });
  });

  describe('Exception Tests', () => {
    it('Test 14 — Create Canonical Exception records exception and emits LaundryExceptionRaised event', () => {
      const { tx } = createReturnedTransaction();

      const exc = tx.raiseException({
        exceptionId: 'EXC-001',
        garmentLineId: 'GL-SHIRT',
        type: LaundryExceptionType.DAMAGED,
        description: 'Torn collar discovered after processing',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-EXC-01',
        raisedAt: '2026-08-21T10:00:00.000Z',
      });

      expect(exc.id).toBe('EXC-001');
      expect(exc.type).toBe('DAMAGED');
      expect(exc.status).toBe(LaundryExceptionStatus.OPEN);
      expect(exc.affectedQuantity).toBe(1);
      expect(tx.exceptions).toHaveLength(1);

      const excEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryExceptionRaised');
      expect(excEvents).toHaveLength(1);
      expect(excEvents[0].metadata).toEqual({
        stayId: 'STAY-107',
        residentId: 'RES-207',
        exceptionId: 'EXC-001',
        garmentLineId: 'GL-SHIRT',
        serviceId: undefined,
        exceptionType: 'DAMAGED',
        description: 'Torn collar discovered after processing',
        affectedQuantity: 1,
        isBlocking: false,
        raisedByStaffId: 'STAFF-EXC-01',
        raisedAt: '2026-08-21T10:00:00.000Z',
      });
    });

    it('Test 15 — Invalid Exception Type is rejected', () => {
      const { tx } = createReturnedTransaction();

      expect(() =>
        tx.raiseException({
          type: 'INVALID_TYPE_XYZ' as any,
          description: 'Invalid',
          affectedQuantity: 1,
          raisedByStaffId: 'STAFF-01',
        })
      ).toThrow('Invalid LaundryExceptionType (INVALID_TYPE_XYZ)');
    });

    it('Test 16 — Exception Lifecycle follows OPEN -> UNDER_INVESTIGATION -> RESOLVED', () => {
      const { tx } = createReturnedTransaction();

      const exc = tx.raiseException({
        exceptionId: 'EXC-LIFE',
        type: LaundryExceptionType.MISSING,
        description: '1 missing trouser',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-01',
      });
      expect(exc.status).toBe(LaundryExceptionStatus.OPEN);

      tx.addInvestigation('EXC-LIFE', {
        investigatorStaffId: 'STAFF-INV-01',
        findings: 'Searching dry cleaning conveyor',
      });
      expect(exc.status).toBe(LaundryExceptionStatus.UNDER_INVESTIGATION);

      tx.resolveException('EXC-LIFE', {
        outcome: ResolutionOutcome.ITEM_RECOVERED,
        resolverStaffId: 'STAFF-MGR-01',
        notes: 'Item found on rack #4',
      });
      expect(exc.status).toBe(LaundryExceptionStatus.RESOLVED);
    });

    it('Test 17 — Blocking Exception (IDENTITY_DISPUTE) blocks delivery of affected line', () => {
      const { tx } = createReturnedTransaction();

      tx.raiseException({
        exceptionId: 'EXC-DISPUTE',
        garmentLineId: 'GL-SHIRT',
        type: LaundryExceptionType.IDENTITY_DISPUTE,
        description: 'Resident says blue shirt is not theirs',
        affectedQuantity: 1,
        isBlocking: true,
        raisedByStaffId: 'STAFF-01',
      });

      // Attempt to deliver GL-SHIRT while blocking exception is active
      expect(() =>
        tx.recordDelivery({
          deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 1 }],
          handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
          deliveredByStaffId: 'STAFF-01',
        })
      ).toThrow('Delivery blocked for GarmentLine (GL-SHIRT): An active blocking exception exists');

      // However, delivering GL-TROUSER (which has no blocking exception) succeeds
      const trouserDel = tx.recordDelivery({
        deliveredLines: [{ garmentLineId: 'GL-TROUSER', deliveredQuantity: 4 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });
      expect(trouserDel.totalDeliveredQuantity).toBe(4);
    });

    it('Test 18 — Non-Blocking Exception (DAMAGED) allows delivery while exception remains open', () => {
      const { tx, shirtLine } = createReturnedTransaction();

      tx.raiseException({
        exceptionId: 'EXC-DAMAGE',
        garmentLineId: 'GL-SHIRT',
        type: LaundryExceptionType.DAMAGED,
        description: 'Loose button on shirt #2',
        affectedQuantity: 1,
        isBlocking: false,
        raisedByStaffId: 'STAFF-01',
      });

      const del = tx.recordDelivery({
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 6 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      expect(del.totalDeliveredQuantity).toBe(6);
      expect(shirtLine.deliveredQuantity).toBe(6);
      expect(tx.exceptions[0].status).toBe(LaundryExceptionStatus.OPEN);
    });

    it('Test 19 — Discrepancy Does Not Automatically Become Exception in L-06/L-07', () => {
      const { tx } = createReturnedTransaction();
      expect(tx.exceptions).toHaveLength(0);

      const reconciliation = tx.reconcileCustody();
      expect(reconciliation.hasDiscrepancy).toBe(false);

      // Pure custody facts do not spawn Exception entities without explicit operator action
      expect(tx.exceptions).toHaveLength(0);
    });
  });

  describe('Investigation Tests', () => {
    it('Test 20 — Investigation Creation adds investigation fact to exception', () => {
      const { tx } = createReturnedTransaction();

      const exc = tx.raiseException({
        exceptionId: 'EXC-INV',
        type: LaundryExceptionType.DAMAGED,
        description: 'Stain on sleeve',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-01',
      });

      const inv = tx.addInvestigation('EXC-INV', {
        investigatorStaffId: 'STAFF-INV-01',
        findings: 'Stain matches ink from marker',
        evidenceUris: ['https://storage.rpgms.internal/laundry/inv-stain.jpg'],
        responsibleParty: ResponsibleParty.RPGMS,
      });

      expect(inv.findings).toBe('Stain matches ink from marker');
      expect(inv.responsibleParty).toBe('RPGMS');
      expect(exc.investigations).toHaveLength(1);
      expect(exc.status).toBe(LaundryExceptionStatus.UNDER_INVESTIGATION);
    });

    it('Test 21 — Investigation History preserves multiple investigation findings', () => {
      const { tx } = createReturnedTransaction();

      const exc = tx.raiseException({
        exceptionId: 'EXC-HIST',
        type: LaundryExceptionType.MISSING,
        description: 'Missing item',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-01',
      });

      tx.addInvestigation('EXC-HIST', {
        investigationId: 'INV-01',
        investigatorStaffId: 'STAFF-INV-01',
        findings: 'First check of laundry room negative',
      });

      tx.addInvestigation('EXC-HIST', {
        investigationId: 'INV-02',
        investigatorStaffId: 'STAFF-INV-02',
        findings: 'Second check of iron station negative',
      });

      expect(exc.investigations).toHaveLength(2);
      expect(exc.investigations[0].id).toBe('INV-01');
      expect(exc.investigations[1].id).toBe('INV-02');
    });

    it('Test 22 — Investigation Invalid Transition rejects adding investigation to RESOLVED exception', () => {
      const { tx } = createReturnedTransaction();

      tx.raiseException({
        exceptionId: 'EXC-RESOLVED',
        type: LaundryExceptionType.QUALITY_ISSUE,
        description: 'Wrinkled shirt',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-01',
      });

      tx.resolveException('EXC-RESOLVED', {
        outcome: ResolutionOutcome.SERVICE_CORRECTED,
        resolverStaffId: 'STAFF-MGR',
      });

      expect(() =>
        tx.addInvestigation('EXC-RESOLVED', {
          investigatorStaffId: 'STAFF-02',
          findings: 'Attempt investigation after resolution',
        })
      ).toThrow('Cannot add investigation to already RESOLVED exception');
    });

    it('Test 23 — Investigation != Resolution: completing investigation does not resolve or close exception', () => {
      const { tx } = createReturnedTransaction();

      const exc = tx.raiseException({
        exceptionId: 'EXC-DIFF',
        type: LaundryExceptionType.MISSING,
        description: 'Missing shirt',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-01',
      });

      tx.addInvestigation('EXC-DIFF', {
        investigatorStaffId: 'STAFF-INV',
        findings: 'Investigation complete: item not found in facility',
        completedAt: '2026-08-21T11:00:00.000Z',
      });

      expect(exc.status).toBe(LaundryExceptionStatus.UNDER_INVESTIGATION);
      expect(exc.resolution).toBeUndefined();
    });
  });

  describe('Resolution Tests', () => {
    it('Test 24 — Valid Resolution records formal outcome and emits LaundryExceptionResolved event', () => {
      const { tx } = createReturnedTransaction();

      const exc = tx.raiseException({
        exceptionId: 'EXC-RES-01',
        type: LaundryExceptionType.SERVICE_NOT_PERFORMED,
        description: 'Ironing omitted',
        affectedQuantity: 2,
        raisedByStaffId: 'STAFF-01',
      });

      const res = tx.resolveException('EXC-RES-01', {
        resolutionId: 'RES-01',
        outcome: ResolutionOutcome.SERVICE_CORRECTED,
        resolverStaffId: 'STAFF-MGR-01',
        resolvedAt: '2026-08-21T12:00:00.000Z',
        responsibleParty: ResponsibleParty.RPGMS,
        notes: 'Ironing performed by head dry cleaner',
      });

      expect(res.outcome).toBe('SERVICE_CORRECTED');
      expect(exc.status).toBe(LaundryExceptionStatus.RESOLVED);
      expect(exc.resolution).toBeDefined();

      const resEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryExceptionResolved');
      expect(resEvents).toHaveLength(1);
      expect(resEvents[0].metadata).toEqual({
        stayId: 'STAY-107',
        residentId: 'RES-207',
        exceptionId: 'EXC-RES-01',
        outcome: 'SERVICE_CORRECTED',
        resolverStaffId: 'STAFF-MGR-01',
        resolvedAt: '2026-08-21T12:00:00.000Z',
        resolvedQuantity: undefined,
        responsibleParty: 'RPGMS',
      });
    });

    it('Test 25 — Resolution Record is preserved immutably', () => {
      const { tx } = createReturnedTransaction();

      tx.raiseException({
        exceptionId: 'EXC-IMMUTABLE-RES',
        type: LaundryExceptionType.OTHER,
        description: 'Minor dispute',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-01',
      });

      const res = tx.resolveException('EXC-IMMUTABLE-RES', {
        outcome: ResolutionOutcome.NO_ACTION_REQUIRED,
        resolverStaffId: 'STAFF-MGR',
      });

      expect(Object.isFrozen(res)).toBe(true);
      expect(() => {
        (res as any).outcome = 'PERMANENTLY_LOST';
      }).toThrow();
    });

    it('Test 26 — Invalid Resolution: cannot resolve an already resolved exception', () => {
      const { tx } = createReturnedTransaction();

      tx.raiseException({
        exceptionId: 'EXC-DOUBLE-RES',
        type: LaundryExceptionType.DAMAGED,
        description: 'Button',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-01',
      });

      tx.resolveException('EXC-DOUBLE-RES', {
        outcome: ResolutionOutcome.RESIDENT_ACCEPTED,
        resolverStaffId: 'STAFF-MGR',
      });

      expect(() =>
        tx.resolveException('EXC-DOUBLE-RES', {
          outcome: ResolutionOutcome.OTHER,
          resolverStaffId: 'STAFF-MGR',
        })
      ).toThrow('is already RESOLVED');
    });

    it('Test 27 — Exception Closure: PERMANENTLY_LOST contributes to resolved pieces and achieves completion', () => {
      const { tx } = createReturnedTransaction();

      // Deliver 6 shirts and 3 trousers (1 trouser missing)
      tx.recordDelivery({
        deliveryId: 'DEL-01',
        deliveredLines: [
          { garmentLineId: 'GL-SHIRT', deliveredQuantity: 6 },
          { garmentLineId: 'GL-TROUSER', deliveredQuantity: 3 },
        ],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      expect(tx.totalDeliveredPieces).toBe(9);
      expect(tx.totalOutstandingPhysicalPieces).toBe(1);
      expect(tx.status).toBe(LaundryTransactionStatus.DELIVERED_PARTIAL);

      // Raise missing exception for the 1 missing trouser
      tx.raiseException({
        exceptionId: 'EXC-LOST',
        garmentLineId: 'GL-TROUSER',
        type: LaundryExceptionType.MISSING,
        description: '1 trouser lost during delivery transit',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-01',
      });

      // Resolve exception as PERMANENTLY_LOST with resolvedQuantity = 1
      tx.resolveException('EXC-LOST', {
        outcome: ResolutionOutcome.PERMANENTLY_LOST,
        resolvedQuantity: 1,
        resolverStaffId: 'STAFF-MGR-01',
        responsibleParty: ResponsibleParty.RPGMS,
        notes: 'Item deemed unrecoverable',
      });

      expect(tx.totalResolvedPieces).toBe(1);
      expect(tx.totalOutstandingPhysicalPieces).toBe(0); // 10 - 9 - 1 = 0
      expect(tx.status).toBe(LaundryTransactionStatus.COMPLETED);

      const compEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryTransactionCompleted');
      expect(compEvents).toHaveLength(1);
    });

    it('Test 28 — No Finance: resolution does not create Finance bills or ledger postings', () => {
      const { tx } = createReturnedTransaction();

      tx.raiseException({
        exceptionId: 'EXC-NO-FIN',
        type: LaundryExceptionType.DAMAGED,
        description: 'Tear',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-01',
      });

      tx.resolveException('EXC-NO-FIN', {
        outcome: ResolutionOutcome.PERMANENTLY_LOST,
        resolvedQuantity: 1,
        resolverStaffId: 'STAFF-MGR',
      });

      expect(tx.charges).toHaveLength(0);
    });
  });

  describe('Cross-Boundary Tests', () => {
    it('Test 29 — Return != Delivery: physical return does NOT set deliveredQuantity', () => {
      const { shirtLine, trouserLine } = createReturnedTransaction();

      // Return #1 occurred in createReturnedTransaction(), but deliveredQuantity remains 0
      expect(shirtLine.returnedQuantity).toBe(6);
      expect(shirtLine.deliveredQuantity).toBe(0);
      expect(trouserLine.returnedQuantity).toBe(4);
      expect(trouserLine.deliveredQuantity).toBe(0);
    });

    it('Test 30 — RateSnapshot Integrity: RateSnapshot remains unchanged after delivery and exceptions', () => {
      const { tx, shirtAlloc } = createReturnedTransaction();
      const initialSnapshot = shirtAlloc.rateSnapshot;

      tx.recordDelivery({
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 6 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      tx.raiseException({
        type: LaundryExceptionType.QUALITY_ISSUE,
        description: 'Wrinkle',
        affectedQuantity: 1,
        raisedByStaffId: 'STAFF-01',
      });

      expect(shirtAlloc.rateSnapshot).toBe(initialSnapshot);
      expect(shirtAlloc.rateSnapshot?.unitRate).toBe(30);
    });

    it('Test 31 — ConditionObservation Integrity: condition observations remain unchanged', () => {
      const { tx } = createReturnedTransaction();

      tx.recordDelivery({
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 6 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      expect(tx.conditionObservations).toHaveLength(0);
    });

    it('Test 32 — ProcessingRoute Integrity: ProcessingRoute remains unchanged', () => {
      const { tx } = createReturnedTransaction();
      expect(tx.processingRoute).toBe('IN_HOUSE');

      tx.recordDelivery({
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 6 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      expect(tx.processingRoute).toBe('IN_HOUSE');
    });

    it('Test 33 — No L-08: zero Finance implementation exists in domain', () => {
      const { tx } = createReturnedTransaction();

      tx.recordDelivery({
        deliveredLines: [{ garmentLineId: 'GL-SHIRT', deliveredQuantity: 6 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredByStaffId: 'STAFF-01',
      });

      expect((tx as any).postToFinance).toBeUndefined();
      expect((tx as any).financeBill).toBeUndefined();
    });
  });
});
