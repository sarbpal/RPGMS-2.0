import { describe, it, expect } from 'vitest';
import { LaundryTransaction } from '../entities/LaundryTransaction';
import { GarmentLine } from '../entities/GarmentLine';
import { ServiceAllocation } from '../entities/ServiceAllocation';
import { LaundryTransactionStatus } from '../valueObjects/LaundryTransactionStatus';
import { RateSnapshot } from '../valueObjects/RateSnapshot';

describe('Laundry Transaction Aggregate Root & Service Allocation Core (L-02)', () => {
  describe('LaundryTransaction Entity', () => {
    it('successfully creates a new LaundryTransaction in DRAFT status', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-2026-0001',
        stayId: 'STAY-101',
        residentId: 'RES-201',
        notes: 'Initial collection intake',
      });

      expect(tx.id).toBe('LTX-2026-0001');
      expect(tx.stayId).toBe('STAY-101');
      expect(tx.residentId).toBe('RES-201');
      expect(tx.status).toBe(LaundryTransactionStatus.DRAFT);
      expect(tx.notes).toBe('Initial collection intake');
      expect(tx.garmentLines).toHaveLength(0);
      expect(tx.totalPhysicalPieces).toBe(0);
    });

    it('rejects empty id, stayId, or residentId', () => {
      expect(
        () =>
          new LaundryTransaction({
            id: '',
            stayId: 'STAY-101',
            residentId: 'RES-201',
          })
      ).toThrow('LaundryTransaction ID cannot be empty.');

      expect(
        () =>
          new LaundryTransaction({
            id: 'LTX-001',
            stayId: '   ',
            residentId: 'RES-201',
          })
      ).toThrow('LaundryTransaction stayId cannot be empty.');

      expect(
        () =>
          new LaundryTransaction({
            id: 'LTX-001',
            stayId: 'STAY-101',
            residentId: '',
          })
      ).toThrow('LaundryTransaction residentId cannot be empty.');
    });

    it('records LaundryTransactionCreated as the initial business event on creation', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-2026-0001',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });

      const events = tx.businessEvents;
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('LaundryTransactionCreated');
      expect(events[0].transactionId).toBe('LTX-2026-0001');
      expect(events[0].metadata).toEqual({
        stayId: 'STAY-101',
        residentId: 'RES-201',
        initialStatus: 'DRAFT',
        initialGarmentLineCount: 0,
      });
    });

    it('protects child collections from external direct mutation (encapsulation)', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-2026-0001',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });

      const line = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-2026-0001',
        itemId: 'LITM-001',
        physicalQuantity: 3,
        createdAt: '2026-08-20T10:00:00.000Z',
      });

      // Modifying the returned array copy does NOT mutate internal aggregate state
      const lines = tx.garmentLines as GarmentLine[];
      lines.push(line);
      expect(tx.garmentLines).toHaveLength(0);

      // Mutating via domain method works properly
      tx.addGarmentLine(line);
      expect(tx.garmentLines).toHaveLength(1);
    });

    it('enforces aggregate ownership boundary on GarmentLines (mismatched transactionId rejected)', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-2026-0001',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });

      const foreignLine = new GarmentLine({
        id: 'GL-999',
        transactionId: 'LTX-DIFFERENT',
        itemId: 'LITM-001',
        physicalQuantity: 2,
        createdAt: '2026-08-20T10:00:00.000Z',
      });

      expect(() => tx.addGarmentLine(foreignLine)).toThrow(
        'does not match LaundryTransaction ID (LTX-2026-0001).'
      );
    });

    it('rejects duplicate GarmentLine ID on the same transaction', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-2026-0001',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });

      const line1 = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-2026-0001',
        itemId: 'LITM-001',
        physicalQuantity: 2,
        createdAt: '2026-08-20T10:00:00.000Z',
      });

      const line2 = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-2026-0001',
        itemId: 'LITM-002',
        physicalQuantity: 1,
        createdAt: '2026-08-20T10:00:00.000Z',
      });

      tx.addGarmentLine(line1);
      expect(() => tx.addGarmentLine(line2)).toThrow('GarmentLine with ID (GL-001) already exists');
    });
  });

  describe('GarmentLine & ServiceAllocation Core Semantics', () => {
    it('creates a valid GarmentLine with physical piece quantity', () => {
      const line = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-001',
        itemId: 'LITM-001',
        itemName: 'Shirt',
        physicalQuantity: 4,
        createdAt: '2026-08-20T10:00:00.000Z',
      });

      expect(line.id).toBe('GL-001');
      expect(line.transactionId).toBe('LTX-001');
      expect(line.itemId).toBe('LITM-001');
      expect(line.itemName).toBe('Shirt');
      expect(line.physicalQuantity).toBe(4);
      expect(line.serviceAllocations).toHaveLength(0);
    });

    it('validates physical quantity strictly (> 0 and integer)', () => {
      expect(
        () =>
          new GarmentLine({
            id: 'GL-001',
            transactionId: 'LTX-001',
            itemId: 'LITM-001',
            physicalQuantity: 0,
            createdAt: '2026-08-20',
          })
      ).toThrow('GarmentLine physicalQuantity must be a positive integer.');

      expect(
        () =>
          new GarmentLine({
            id: 'GL-001',
            transactionId: 'LTX-001',
            itemId: 'LITM-001',
            physicalQuantity: -2,
            createdAt: '2026-08-20',
          })
      ).toThrow('GarmentLine physicalQuantity must be a positive integer.');

      expect(
        () =>
          new GarmentLine({
            id: 'GL-001',
            transactionId: 'LTX-001',
            itemId: 'LITM-001',
            physicalQuantity: 2.5,
            createdAt: '2026-08-20',
          })
      ).toThrow('GarmentLine physicalQuantity must be a positive integer.');
    });

    it('creates a valid ServiceAllocation child entity', () => {
      const allocation = new ServiceAllocation({
        id: 'SA-001',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-001',
        serviceName: 'Cleaning (Wash & Fold)',
        requestedQuantity: 4,
        createdAt: '2026-08-20T10:00:00.000Z',
      });

      expect(allocation.id).toBe('SA-001');
      expect(allocation.garmentLineId).toBe('GL-001');
      expect(allocation.serviceId).toBe('LSRV-001');
      expect(allocation.serviceName).toBe('Cleaning (Wash & Fold)');
      expect(allocation.requestedQuantity).toBe(4);
      expect(allocation.fulfillmentStatus).toBe('PENDING');
      expect(allocation.rateSnapshot).toBeUndefined();
    });

    it('validates ServiceAllocation requestedQuantity strictly (> 0 and integer)', () => {
      expect(
        () =>
          new ServiceAllocation({
            id: 'SA-001',
            garmentLineId: 'GL-001',
            serviceId: 'LSRV-001',
            requestedQuantity: 0,
            createdAt: '2026-08-20',
          })
      ).toThrow('ServiceAllocation requestedQuantity must be a positive integer.');

      expect(
        () =>
          new ServiceAllocation({
            id: 'SA-001',
            garmentLineId: 'GL-001',
            serviceId: 'LSRV-001',
            requestedQuantity: -1,
            createdAt: '2026-08-20',
          })
      ).toThrow('ServiceAllocation requestedQuantity must be a positive integer.');
    });

    it('rejects ServiceAllocation when requestedQuantity exceeds GarmentLine physicalQuantity', () => {
      const line = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-001',
        itemId: 'LITM-001',
        physicalQuantity: 3,
        createdAt: '2026-08-20',
      });

      const excessAllocation = new ServiceAllocation({
        id: 'SA-001',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-001',
        requestedQuantity: 4, // 4 > 3
        createdAt: '2026-08-20',
      });

      expect(() => line.addServiceAllocation(excessAllocation)).toThrow(
        'ServiceAllocation requestedQuantity (4) cannot exceed GarmentLine physicalQuantity (3).'
      );
    });

    it('rejects duplicate ServiceAllocation for the same service on the same GarmentLine', () => {
      const line = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-001',
        itemId: 'LITM-001',
        physicalQuantity: 3,
        createdAt: '2026-08-20',
      });

      const alloc1 = new ServiceAllocation({
        id: 'SA-001',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-001',
        requestedQuantity: 3,
        createdAt: '2026-08-20',
      });

      const duplicateAlloc = new ServiceAllocation({
        id: 'SA-002',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-001', // same service
        requestedQuantity: 3,
        createdAt: '2026-08-20',
      });

      line.addServiceAllocation(alloc1);
      expect(() => line.addServiceAllocation(duplicateAlloc)).toThrow(
        'Duplicate service allocation for service (LSRV-001) on GarmentLine (GL-001).'
      );
    });

    it('enforces ownership boundary on ServiceAllocation (mismatched garmentLineId rejected)', () => {
      const line = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-001',
        itemId: 'LITM-001',
        physicalQuantity: 3,
        createdAt: '2026-08-20',
      });

      const foreignAlloc = new ServiceAllocation({
        id: 'SA-999',
        garmentLineId: 'GL-DIFFERENT',
        serviceId: 'LSRV-001',
        requestedQuantity: 3,
        createdAt: '2026-08-20',
      });

      expect(() => line.addServiceAllocation(foreignAlloc)).toThrow(
        'does not match GarmentLine ID (GL-001).'
      );
    });

    it('supports attaching RateSnapshot to ServiceAllocation', () => {
      const alloc = new ServiceAllocation({
        id: 'SA-001',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-001',
        requestedQuantity: 3,
        createdAt: '2026-08-20',
      });

      const snapshot = new RateSnapshot({
        unitRate: 20,
        capturedAt: '2026-08-20T10:00:00.000Z',
        chargeMasterRateId: 'LRATE-001',
      });

      alloc.attachRateSnapshot(snapshot);
      expect(alloc.rateSnapshot).toBeDefined();
      expect(alloc.rateSnapshot?.unitRate).toBe(20);
      expect(alloc.rateSnapshot?.chargeMasterRateId).toBe('LRATE-001');
    });
  });

  describe('Critical Physical vs Service Quantity Separation Invariant', () => {
    it('PROVES that multiple services on one garment line DO NOT increase physical garment piece count', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-2026-0001',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });

      // Resident has 5 shirts (LITM-001) requesting both Cleaning (LSRV-001) AND Ironing (LSRV-002)
      const shirtLine = new GarmentLine({
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
        serviceName: 'Cleaning (Wash & Fold)',
        requestedQuantity: 5,
        createdAt: '2026-08-20T10:00:00.000Z',
      });

      const ironingAlloc = new ServiceAllocation({
        id: 'SA-002',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-002',
        serviceName: 'Ironing / Pressing',
        requestedQuantity: 5,
        createdAt: '2026-08-20T10:00:00.000Z',
      });

      shirtLine.addServiceAllocation(cleaningAlloc);
      shirtLine.addServiceAllocation(ironingAlloc);
      tx.addGarmentLine(shirtLine);

      // Invariant assertion:
      // Physical piece count is exactly 5, NOT 10 (even though 2 services × 5 requested = 10 service operations)
      expect(shirtLine.physicalQuantity).toBe(5);
      expect(shirtLine.serviceAllocations).toHaveLength(2);
      expect(tx.totalPhysicalPieces).toBe(5);
    });

    it('correctly aggregates physical pieces across multiple mixed garment lines', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-2026-0001',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });

      // Line 1: 3 Shirts with Cleaning + Ironing (3 pieces)
      const line1 = new GarmentLine({
        id: 'GL-001',
        transactionId: 'LTX-2026-0001',
        itemId: 'LITM-001',
        itemName: 'Shirt',
        physicalQuantity: 3,
        createdAt: '2026-08-20',
      });
      line1.addServiceAllocation(
        new ServiceAllocation({
          id: 'SA-001',
          garmentLineId: 'GL-001',
          serviceId: 'LSRV-001',
          requestedQuantity: 3,
          createdAt: '2026-08-20',
        })
      );
      line1.addServiceAllocation(
        new ServiceAllocation({
          id: 'SA-002',
          garmentLineId: 'GL-001',
          serviceId: 'LSRV-002',
          requestedQuantity: 3,
          createdAt: '2026-08-20',
        })
      );

      // Line 2: 2 Trousers with Cleaning only (2 pieces)
      const line2 = new GarmentLine({
        id: 'GL-002',
        transactionId: 'LTX-2026-0001',
        itemId: 'LITM-002',
        itemName: 'Trouser',
        physicalQuantity: 2,
        createdAt: '2026-08-20',
      });
      line2.addServiceAllocation(
        new ServiceAllocation({
          id: 'SA-003',
          garmentLineId: 'GL-002',
          serviceId: 'LSRV-001',
          requestedQuantity: 2,
          createdAt: '2026-08-20',
        })
      );

      // Line 3: 1 Blanket with Dry Cleaning (1 piece)
      const line3 = new GarmentLine({
        id: 'GL-003',
        transactionId: 'LTX-2026-0001',
        itemId: 'LITM-005',
        itemName: 'Blanket',
        physicalQuantity: 1,
        createdAt: '2026-08-20',
      });
      line3.addServiceAllocation(
        new ServiceAllocation({
          id: 'SA-004',
          garmentLineId: 'GL-003',
          serviceId: 'LSRV-003',
          requestedQuantity: 1,
          createdAt: '2026-08-20',
        })
      );

      tx.addGarmentLine(line1);
      tx.addGarmentLine(line2);
      tx.addGarmentLine(line3);

      // Total physical garments = 3 + 2 + 1 = 6 pieces
      expect(tx.totalPhysicalPieces).toBe(6);
      expect(tx.garmentLines).toHaveLength(3);
    });
  });

  describe('Architectural Boundary Protection (No Premature L-05+ Workflows)', () => {
    it('confirms aggregate does not expose premature L-05+ workflow operations', () => {
      const tx = new LaundryTransaction({
        id: 'LTX-2026-0001',
        stayId: 'STAY-101',
        residentId: 'RES-201',
      });

      const alloc = new ServiceAllocation({
        id: 'SA-001',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-001',
        requestedQuantity: 3,
        createdAt: '2026-08-20',
      });

      // Verify L-05+ concepts do NOT exist prematurely on ServiceAllocation or LaundryTransaction
      expect((tx as any).processingRoute).toBeUndefined();
      expect((tx as any).returns).toBeUndefined();
      expect((tx as any).exceptions).toBeUndefined();
      expect((tx as any).releaseProcessing).toBeUndefined();
      expect((tx as any).recordReturn).toBeUndefined();
      expect((alloc as any).vendorBatchId).toBeUndefined();
    });
  });
});
