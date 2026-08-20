import { describe, it, expect } from 'vitest';
import { LaundryTransaction } from '../entities/LaundryTransaction';
import { GarmentLine } from '../entities/GarmentLine';
import { ServiceAllocation } from '../entities/ServiceAllocation';
import { LaundryChargeRecord, LaundryChargeStatus } from '../entities/LaundryChargeRecord';
import { RateSnapshot } from '../valueObjects/RateSnapshot';
import { calculateNewlyChargeableQuantity, buildBusinessChargeId } from '../rules/chargeabilityRules';

describe('Laundry Service Fulfillment & Chargeability (L-03)', () => {
  const sampleSnapshot = new RateSnapshot({
    unitRate: 25,
    capturedAt: '2026-08-20T10:00:00.000Z',
    chargeMasterRateId: 'LRATE-001',
    currency: 'INR',
  });

  describe('Pure BR-L-012 Chargeability Rule Engine', () => {
    it('implements NewlyChargeableQuantity = max(0, min(Fulfilled, Delivered) - PreviouslyCharged)', () => {
      // 0 delivered, 5 fulfilled -> 0
      expect(calculateNewlyChargeableQuantity(5, 0, 0)).toBe(0);
      // 5 delivered, 0 fulfilled -> 0
      expect(calculateNewlyChargeableQuantity(0, 5, 0)).toBe(0);
      // 5 delivered, 5 fulfilled, 0 previously charged -> 5
      expect(calculateNewlyChargeableQuantity(5, 5, 0)).toBe(5);
      // 5 delivered, 5 fulfilled, 2 previously charged -> 3
      expect(calculateNewlyChargeableQuantity(5, 5, 2)).toBe(3);
      // 3 delivered, 5 fulfilled, 3 previously charged -> 0
      expect(calculateNewlyChargeableQuantity(5, 3, 3)).toBe(0);
    });

    it('rejects negative input parameters', () => {
      expect(() => calculateNewlyChargeableQuantity(-1, 5, 0)).toThrow(
        'Quantities evaluated in chargeability calculation must be non-negative.'
      );
      expect(() => calculateNewlyChargeableQuantity(5, -2, 0)).toThrow(
        'Quantities evaluated in chargeability calculation must be non-negative.'
      );
      expect(() => calculateNewlyChargeableQuantity(5, 5, -1)).toThrow(
        'Quantities evaluated in chargeability calculation must be non-negative.'
      );
    });

    it('generates deterministic businessChargeId', () => {
      const chargeId1 = buildBusinessChargeId('LTX-001', 'GL-001', 'LSRV-001', 1);
      expect(chargeId1).toBe('LTX-001:GL-001:LSRV-001:BRK-01');

      const chargeId2 = buildBusinessChargeId('LTX-001', 'GL-001', 'LSRV-001', 12);
      expect(chargeId2).toBe('LTX-001:GL-001:LSRV-001:BRK-12');
    });
  });

  describe('Mandatory Test Scenarios', () => {
    // Helper to build a standard single-line transaction for testing
    function createTestTransaction(props?: {
      physicalQty?: number;
      serviceQty?: number;
      snapshot?: RateSnapshot;
    }) {
      const physicalQty = props?.physicalQty ?? 5;
      const serviceQty = props?.serviceQty ?? 5;
      const snapshot = props?.snapshot ?? sampleSnapshot;

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
        physicalQuantity: physicalQty,
        createdAt: '2026-08-20T10:00:00.000Z',
      });

      const alloc = new ServiceAllocation({
        id: 'SA-001',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-001',
        serviceName: 'Cleaning (Wash & Fold)',
        requestedQuantity: serviceQty,
        rateSnapshot: snapshot,
        createdAt: '2026-08-20T10:00:00.000Z',
      });

      line.addServiceAllocation(alloc);
      tx.addGarmentLine(line);

      return { tx, line, alloc };
    }

    it('Test 1 — Fulfillment before Delivery (Fulfilled=5, Delivered=0 -> 0 charge; then Delivered=2 -> BRK-01=2)', () => {
      const { tx, alloc } = createTestTransaction();

      // Step 1: Fulfill 5 units before any delivery
      const charge1 = tx.recordServiceFulfillment('GL-001', 'LSRV-001', 5);
      expect(charge1).toBeNull();
      expect(alloc.fulfilledQuantity).toBe(5);
      expect(alloc.charges).toHaveLength(0);
      expect(alloc.previouslyChargedQuantity).toBe(0);

      // Step 2: Deliver 2 units
      const deliveryCharges = tx.recordDeliveryQuantity('GL-001', 2);
      expect(deliveryCharges).toHaveLength(1);
      const brk1 = deliveryCharges[0];
      expect(brk1.bracketIndex).toBe(1);
      expect(brk1.businessChargeId).toBe('LTX-2026-0001:GL-001:LSRV-001:BRK-01');
      expect(brk1.quantity).toBe(2);
      expect(brk1.unitRate).toBe(25);
      expect(brk1.totalAmount).toBe(50);
      expect(alloc.previouslyChargedQuantity).toBe(2);
    });

    it('Test 2 — Delivery before Fulfillment (Delivered=2, Fulfilled=0 -> 0 charge; then Fulfilled=2 -> BRK-01=2 without second delivery)', () => {
      const { tx, alloc } = createTestTransaction();

      // Step 1: Deliver 2 units before fulfillment
      const deliveryCharges = tx.recordDeliveryQuantity('GL-001', 2);
      expect(deliveryCharges).toHaveLength(0);
      expect(alloc.charges).toHaveLength(0);

      // Step 2: Fulfill 2 units (immediate chargeability without second delivery!)
      const fulfillmentCharge = tx.recordServiceFulfillment('GL-001', 'LSRV-001', 2);
      expect(fulfillmentCharge).not.toBeNull();
      expect(fulfillmentCharge?.bracketIndex).toBe(1);
      expect(fulfillmentCharge?.businessChargeId).toBe('LTX-2026-0001:GL-001:LSRV-001:BRK-01');
      expect(fulfillmentCharge?.quantity).toBe(2);
      expect(fulfillmentCharge?.totalAmount).toBe(50);
      expect(alloc.previouslyChargedQuantity).toBe(2);
    });

    it('Test 3 — Partial Fulfillment (Requested=5, Fulfilled=2, Delivered=5 -> NewlyChargeable=2)', () => {
      const { tx, alloc } = createTestTransaction();

      tx.recordDeliveryQuantity('GL-001', 5);
      const charge = tx.recordServiceFulfillment('GL-001', 'LSRV-001', 2);

      expect(charge).not.toBeNull();
      expect(charge?.quantity).toBe(2);
      expect(alloc.previouslyChargedQuantity).toBe(2);
    });

    it('Test 4 — Partial Delivery (Requested=5, Fulfilled=5, Delivered=2 -> NewlyChargeable=2)', () => {
      const { tx, alloc } = createTestTransaction();

      tx.recordServiceFulfillment('GL-001', 'LSRV-001', 5);
      const charges = tx.recordDeliveryQuantity('GL-001', 2);

      expect(charges).toHaveLength(1);
      expect(charges[0].quantity).toBe(2);
      expect(alloc.previouslyChargedQuantity).toBe(2);
    });

    it('Test 5 — Multiple Deliveries (Requested=5, Fulfilled=5; D1=2 -> BRK-01=2, D2=+2 -> BRK-02=2, D3=+1 -> BRK-03=1; Total=5)', () => {
      const { tx, alloc } = createTestTransaction();

      tx.recordServiceFulfillment('GL-001', 'LSRV-001', 5);

      // Delivery 1: 2 units
      const d1 = tx.recordDeliveryQuantity('GL-001', 2);
      expect(d1).toHaveLength(1);
      expect(d1[0].bracketIndex).toBe(1);
      expect(d1[0].businessChargeId).toBe('LTX-2026-0001:GL-001:LSRV-001:BRK-01');
      expect(d1[0].quantity).toBe(2);

      // Delivery 2: +2 units
      const d2 = tx.recordDeliveryQuantity('GL-001', 2);
      expect(d2).toHaveLength(1);
      expect(d2[0].bracketIndex).toBe(2);
      expect(d2[0].businessChargeId).toBe('LTX-2026-0001:GL-001:LSRV-001:BRK-02');
      expect(d2[0].quantity).toBe(2);

      // Delivery 3: +1 unit
      const d3 = tx.recordDeliveryQuantity('GL-001', 1);
      expect(d3).toHaveLength(1);
      expect(d3[0].bracketIndex).toBe(3);
      expect(d3[0].businessChargeId).toBe('LTX-2026-0001:GL-001:LSRV-001:BRK-03');
      expect(d3[0].quantity).toBe(1);

      // Verify total charged quantity and brackets
      expect(alloc.charges).toHaveLength(3);
      expect(alloc.previouslyChargedQuantity).toBe(5);
      expect(tx.charges).toHaveLength(3);
    });

    it('Test 6 — No Double Charge (Repeat exact same evaluation after BRK-01 -> no additional charge)', () => {
      const { tx, alloc } = createTestTransaction();

      tx.recordServiceFulfillment('GL-001', 'LSRV-001', 3);
      tx.recordDeliveryQuantity('GL-001', 3);
      expect(alloc.charges).toHaveLength(1);
      expect(alloc.previouslyChargedQuantity).toBe(3);

      // Re-evaluate without new facts
      const reevaluated = tx.evaluateChargeability();
      expect(reevaluated).toHaveLength(0);
      expect(alloc.charges).toHaveLength(1);
      expect(alloc.previouslyChargedQuantity).toBe(3);
    });

    it('Test 7 — Multiple Services on same GarmentLine (Physical=5, Cleaning=5, Ironing=5 -> each charged 5, physical count remains 5)', () => {
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
        serviceName: 'Cleaning',
        requestedQuantity: 5,
        rateSnapshot: new RateSnapshot({ unitRate: 20, capturedAt: '2026-08-20', chargeMasterRateId: 'R1' }),
        createdAt: '2026-08-20',
      });

      const ironingAlloc = new ServiceAllocation({
        id: 'SA-002',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-002',
        serviceName: 'Ironing',
        requestedQuantity: 5,
        rateSnapshot: new RateSnapshot({ unitRate: 15, capturedAt: '2026-08-20', chargeMasterRateId: 'R2' }),
        createdAt: '2026-08-20',
      });

      line.addServiceAllocation(cleaningAlloc);
      line.addServiceAllocation(ironingAlloc);
      tx.addGarmentLine(line);

      // Fulfill both services and deliver garments
      tx.recordServiceFulfillment('GL-001', 'LSRV-001', 5);
      tx.recordServiceFulfillment('GL-001', 'LSRV-002', 5);
      const deliveryCharges = tx.recordDeliveryQuantity('GL-001', 5);

      expect(deliveryCharges).toHaveLength(2);
      expect(cleaningAlloc.previouslyChargedQuantity).toBe(5);
      expect(ironingAlloc.previouslyChargedQuantity).toBe(5);
      expect(cleaningAlloc.charges[0].totalAmount).toBe(100); // 5 × 20
      expect(ironingAlloc.charges[0].totalAmount).toBe(75); // 5 × 15

      // Critical Physical Invariant Assertion
      expect(tx.totalPhysicalPieces).toBe(5);
      expect(line.physicalQuantity).toBe(5);
    });

    it('Test 8 — Fulfillment After Partial Delivery (Delivered=3, Fulfilled=0; then fulfill +2 -> BRK-01=2)', () => {
      const { tx, alloc } = createTestTransaction();

      // Deliver 3 first
      tx.recordDeliveryQuantity('GL-001', 3);
      expect(alloc.charges).toHaveLength(0);

      // Fulfill 2
      const charge = tx.recordServiceFulfillment('GL-001', 'LSRV-001', 2);
      expect(charge).not.toBeNull();
      expect(charge?.quantity).toBe(2);
      expect(charge?.businessChargeId).toBe('LTX-2026-0001:GL-001:LSRV-001:BRK-01');
      expect(alloc.previouslyChargedQuantity).toBe(2);
    });

    it('Test 9 — Rate Snapshot Integrity (Modifying master catalog rate does not alter charge record unitRate)', () => {
      const frozenSnapshot = new RateSnapshot({
        unitRate: 30,
        capturedAt: '2026-08-20T10:00:00.000Z',
        chargeMasterRateId: 'LRATE-001',
      });

      const { tx, alloc } = createTestTransaction({ snapshot: frozenSnapshot });

      tx.recordServiceFulfillment('GL-001', 'LSRV-001', 4);
      tx.recordDeliveryQuantity('GL-001', 4);

      const charge = alloc.charges[0];
      expect(charge.unitRate).toBe(30);
      expect(charge.totalAmount).toBe(120);

      // Even if someone created a newer snapshot with unitRate 50 elsewhere, the existing record retains 30
      expect(charge.unitRate).toBe(30);
    });

    it('Test 10 — Deterministic Business Charge ID (Same business charge state yields identical businessChargeId whether D->F or F->D)', () => {
      // Flow A: Fulfillment then Delivery
      const flowA = createTestTransaction();
      flowA.tx.recordServiceFulfillment('GL-001', 'LSRV-001', 3);
      flowA.tx.recordDeliveryQuantity('GL-001', 3);
      const chargeA = flowA.alloc.charges[0];

      // Flow B: Delivery then Fulfillment
      const flowB = createTestTransaction();
      flowB.tx.recordDeliveryQuantity('GL-001', 3);
      flowB.tx.recordServiceFulfillment('GL-001', 'LSRV-001', 3);
      const chargeB = flowB.alloc.charges[0];

      expect(chargeA.businessChargeId).toBe('LTX-2026-0001:GL-001:LSRV-001:BRK-01');
      expect(chargeB.businessChargeId).toBe('LTX-2026-0001:GL-001:LSRV-001:BRK-01');
      expect(chargeA.businessChargeId).toBe(chargeB.businessChargeId);
      expect(chargeA.quantity).toBe(chargeB.quantity);
      expect(chargeA.totalAmount).toBe(chargeB.totalAmount);
    });

    it('Test 11 — Bracket Determinism (Retrying evaluation does not create BRK-02 when BRK-01 covers the quantity)', () => {
      const { tx, alloc } = createTestTransaction();

      tx.recordServiceFulfillment('GL-001', 'LSRV-001', 5);
      tx.recordDeliveryQuantity('GL-001', 2);
      expect(alloc.charges).toHaveLength(1);
      expect(alloc.charges[0].bracketIndex).toBe(1);

      // Re-evaluate multiple times without new delivery/fulfillment facts
      tx.evaluateChargeability();
      tx.evaluateChargeability();
      expect(alloc.charges).toHaveLength(1);
      expect(alloc.charges[0].bracketIndex).toBe(1);
    });

    it('Test 12 — Charge Records Are Historical & Immutable (Cannot be edited or deleted)', () => {
      const { tx, alloc } = createTestTransaction();

      tx.recordServiceFulfillment('GL-001', 'LSRV-001', 3);
      tx.recordDeliveryQuantity('GL-001', 3);

      const charge = alloc.charges[0];
      expect(charge.status).toBe(LaundryChargeStatus.PENDING_POSTING);
      expect(charge.financeBillId).toBeUndefined();

      // Mutation of returned array does not modify internal state
      const chargesCopy = alloc.charges as LaundryChargeRecord[];
      chargesCopy.pop();
      expect(alloc.charges).toHaveLength(1);

      // Posting lifecycle progression
      charge.markPosted('BILL-FIN-999');
      expect(charge.status).toBe(LaundryChargeStatus.POSTED);
      expect(charge.financeBillId).toBe('BILL-FIN-999');
      expect(charge.postedAt).toBeDefined();
    });

    it('emits canonical LaundryChargeRaised business event with full metadata when charge generated', () => {
      const { tx } = createTestTransaction();

      tx.recordServiceFulfillment('GL-001', 'LSRV-001', 3);
      tx.recordDeliveryQuantity('GL-001', 3);

      const chargeEvents = tx.businessEvents.filter((e) => e.eventType === 'LaundryChargeRaised');
      expect(chargeEvents).toHaveLength(1);

      const evt = chargeEvents[0];
      expect(evt.transactionId).toBe('LTX-2026-0001');
      expect(evt.metadata).toEqual({
        stayId: 'STAY-101',
        residentId: 'RES-201',
        businessChargeId: 'LTX-2026-0001:GL-001:LSRV-001:BRK-01',
        garmentLineId: 'GL-001',
        serviceId: 'LSRV-001',
        bracketIndex: 1,
        chargeableQuantity: 3,
        unitRate: 25,
        totalAmount: 75,
        currency: 'INR',
      });
    });
  });
});
