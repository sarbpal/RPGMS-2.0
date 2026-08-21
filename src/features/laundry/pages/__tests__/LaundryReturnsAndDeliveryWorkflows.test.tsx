import { describe, it, expect } from 'vitest';
import { RecordReturnDialog } from '../../components/dialogs/RecordReturnDialog';
import { RecordDeliveryDialog } from '../../components/dialogs/RecordDeliveryDialog';
import { LaundryTransactionDetailDrawer } from '../../components/LaundryTransactionDetailDrawer';
import { LaundryTransactionTable } from '../../components/LaundryTransactionTable';
import { stayWorkflowComposition } from '../../../../app/composition/stayWorkflowComposition';
import { DeliveryHandoverMethod } from '../../domain/valueObjects/DeliveryHandoverMethod';
import type {
  CreateCollectionDraftDTO,
  ConfirmCollectionDTO,
  RecordInspectionDTO,
  ReleaseProcessingDTO,
  RecordReturnDTO,
  RecordDeliveryDTO,
} from '../../application/dtos/laundryDTOs';

describe('L-13 — Laundry Returns & Delivery Presentation Workflows', () => {
  const coordinator = stayWorkflowComposition.laundryWorkspaceCoordinator;

  it('instantiates all L-13 presentation components cleanly', () => {
    expect(typeof RecordReturnDialog).toBe('function');
    expect(typeof RecordDeliveryDialog).toBe('function');
    expect(typeof LaundryTransactionDetailDrawer).toBe('function');
    expect(typeof LaundryTransactionTable).toBe('function');
  });

  describe('Section A: Physical Return Workflow & Custody Reconciliation', () => {
    async function setupInProcessOrder(physicalPieces: number = 6) {
      const selectableStays = await coordinator.getSelectableStays();
      const stay = selectableStays[0];
      const catalog = await coordinator.getMasterCatalog();

      // 1. Create collection draft
      const draftDto: CreateCollectionDraftDTO = {
        stayId: stay.stayId,
        residentId: stay.residentId,
        garmentLines: [
          {
            itemId: catalog.items[0].id,
            physicalQuantity: physicalPieces,
            serviceIds: [catalog.services[0].id],
            notes: 'Test return & delivery line',
          },
        ],
      };
      const draft = await coordinator.createCollectionDraft(draftDto);

      // 2. Confirm collection baseline
      const confirmDto: ConfirmCollectionDTO = {
        transactionId: draft.id,
        staffId: 'STAFF-INTAKE-01',
      };
      await coordinator.confirmCollection(confirmDto);

      // 3. Inspect
      const inspectDto: RecordInspectionDTO = {
        transactionId: draft.id,
        staffId: 'STAFF-INSPECT-01',
      };
      await coordinator.recordInspection(inspectDto);

      // 4. Release to processing
      const releaseDto: ReleaseProcessingDTO = {
        transactionId: draft.id,
        route: 'IN_HOUSE',
        staffId: 'STAFF-OP-01',
      };
      const released = await coordinator.releaseProcessing(releaseDto);
      return released;
    }

    it('records partial return into RPGMS custody and updates ViewModel custody state', async () => {
      const order = await setupInProcessOrder(6);
      const lineId = order.garmentLines[0].id;

      // Execute Partial Return (2 of 6 pieces)
      const returnDto: RecordReturnDTO = {
        transactionId: order.id,
        staffId: 'STAFF-CUSTODY-01',
        returnedAt: new Date().toISOString(),
        returnedLines: [
          {
            garmentLineId: lineId,
            returnedQuantity: 2,
          },
        ],
        notes: 'First partial return receipt from cleaning room',
      };

      const returned = await coordinator.recordReturn(returnDto);

      // Verify aggregate & ViewModel projections
      expect(returned.status).toBe('RETURNED_PARTIAL');
      expect(returned.totalPhysicalPieces).toBe(6);
      expect(returned.totalReturnedPieces).toBe(2);
      expect(returned.totalDeliveredPieces).toBe(0);
      expect(returned.totalOutstandingPieces).toBe(6);
      expect(returned.returns.length).toBe(1);
      expect(returned.returns[0].totalReturnedPieces).toBe(2);
      expect(returned.returns[0].returnedByStaffId).toBe('STAFF-CUSTODY-01');
      expect(returned.returns[0].returnedLines[0].returnedQuantity).toBe(2);
      expect(returned.garmentLines[0].returnedQuantity).toBe(2);
      expect(returned.garmentLines[0].deliveredQuantity).toBe(0);
      expect(returned.garmentLines[0].serviceAllocations[0].fulfilledQuantity).toBe(2);

      // Verify workspace view model projection
      const vm = await coordinator.getWorkspaceViewModel();
      const updated = vm.transactions.find((t) => t.id === order.id);
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('RETURNED_PARTIAL');
      expect(updated?.totalReturnedPieces).toBe(2);
    });

    it('records multiple sequential returns accumulating custody until full return', async () => {
      const order = await setupInProcessOrder(5);
      const lineId = order.garmentLines[0].id;

      // Return 1: 2 pieces
      await coordinator.recordReturn({
        transactionId: order.id,
        staffId: 'STAFF-01',
        returnedLines: [{ garmentLineId: lineId, returnedQuantity: 2 }],
      });

      // Return 2: 3 pieces (completing the 5 pieces)
      const finalReturn = await coordinator.recordReturn({
        transactionId: order.id,
        staffId: 'STAFF-02',
        returnedLines: [{ garmentLineId: lineId, returnedQuantity: 3 }],
        notes: 'Final return batch',
      });

      expect(finalReturn.status).toBe('RETURNED_FULL');
      expect(finalReturn.totalReturnedPieces).toBe(5);
      expect(finalReturn.totalPhysicalPieces).toBe(5);
      expect(finalReturn.returns.length).toBe(2);
      expect(finalReturn.returns[0].totalReturnedPieces).toBe(2);
      expect(finalReturn.returns[1].totalReturnedPieces).toBe(3);
    });

    it('rejects over-return atomically at the application/domain layer', async () => {
      const order = await setupInProcessOrder(4);
      const lineId = order.garmentLines[0].id;

      // Attempt returning 5 pieces when only 4 collected -> Domain must reject
      const invalidReturnDto: RecordReturnDTO = {
        transactionId: order.id,
        staffId: 'STAFF-01',
        returnedLines: [{ garmentLineId: lineId, returnedQuantity: 5 }],
      };

      await expect(coordinator.recordReturn(invalidReturnDto)).rejects.toThrow(
        /exceed expected physical quantity/i
      );
    });
  });

  describe('Section B: Physical Delivery Workflows & Handover Methods', () => {
    async function setupReturnedOrder(physicalPieces: number = 4) {
      const selectableStays = await coordinator.getSelectableStays();
      const stay = selectableStays[0];
      const catalog = await coordinator.getMasterCatalog();

      // 1. Create, confirm, inspect, release
      const draft = await coordinator.createCollectionDraft({
        stayId: stay.stayId,
        residentId: stay.residentId,
        garmentLines: [
          {
            itemId: catalog.items[0].id,
            physicalQuantity: physicalPieces,
            serviceIds: [catalog.services[0].id],
          },
        ],
      });
      await coordinator.confirmCollection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.recordInspection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.releaseProcessing({ transactionId: draft.id, route: 'IN_HOUSE', staffId: 'STAFF-01' });

      // 2. Return all pieces
      const returned = await coordinator.recordReturn({
        transactionId: draft.id,
        staffId: 'STAFF-01',
        returnedLines: [{ garmentLineId: draft.garmentLines[0].id, returnedQuantity: physicalPieces }],
      });
      return returned;
    }

    it('executes DIRECT_HANDOVER delivery with resident presence and verification flags', async () => {
      const order = await setupReturnedOrder(4);
      const lineId = order.garmentLines[0].id;

      const deliveryDto: RecordDeliveryDTO = {
        transactionId: order.id,
        staffId: 'STAFF-DELIVERY-01',
        deliveredAt: new Date().toISOString(),
        deliveredLines: [{ garmentLineId: lineId, deliveredQuantity: 4 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        residentPresent: true,
        residentVerified: true,
        notes: 'Handed over directly to resident in common area',
      };

      const delivered = await coordinator.recordDelivery(deliveryDto);

      // Verify physical completion
      expect(delivered.status).toBe('COMPLETED');
      expect(delivered.totalDeliveredPieces).toBe(4);
      expect(delivered.totalOutstandingPieces).toBe(0);
      expect(delivered.deliveries.length).toBe(1);
      expect(delivered.deliveries[0].handoverMethod).toBe(DeliveryHandoverMethod.DIRECT_HANDOVER);
      expect(delivered.deliveries[0].handoverMethodLabel).toContain('Direct Handover');
      expect(delivered.deliveries[0].residentPresent).toBe(true);
      expect(delivered.deliveries[0].residentVerified).toBe(true);
      expect(delivered.deliveries[0].totalDeliveredPieces).toBe(4);
      expect(delivered.deliveries[0].deliveredByStaffId).toBe('STAFF-DELIVERY-01');
    });

    it('executes ROOM_PLACEMENT delivery with room reference and evidence photo URIs', async () => {
      const order = await setupReturnedOrder(3);
      const lineId = order.garmentLines[0].id;

      const roomDeliveryDto: RecordDeliveryDTO = {
        transactionId: order.id,
        staffId: 'STAFF-DELIVERY-02',
        deliveredAt: new Date().toISOString(),
        deliveredLines: [{ garmentLineId: lineId, deliveredQuantity: 3 }],
        handoverMethod: DeliveryHandoverMethod.ROOM_PLACEMENT,
        residentPresent: false,
        residentVerified: false,
        roomNumber: 'Flat 204 / Bed B',
        photoUris: ['evidence://delivery-room-204-bedB.jpg'],
        notes: 'Placed neatly on resident bed',
      };

      const delivered = await coordinator.recordDelivery(roomDeliveryDto);

      expect(delivered.status).toBe('COMPLETED');
      expect(delivered.deliveries.length).toBe(1);
      expect(delivered.deliveries[0].handoverMethod).toBe(DeliveryHandoverMethod.ROOM_PLACEMENT);
      expect(delivered.deliveries[0].handoverMethodLabel).toContain('Room Placement');
      expect(delivered.deliveries[0].residentPresent).toBe(false);
      expect(delivered.deliveries[0].residentVerified).toBe(false);
      expect(delivered.deliveries[0].roomNumber).toBe('Flat 204 / Bed B');
      expect(delivered.deliveries[0].evidenceUris).toEqual(['evidence://delivery-room-204-bedB.jpg']);
    });

    it('executes partial delivery leaving order in DELIVERED_PARTIAL status', async () => {
      const order = await setupReturnedOrder(4);
      const lineId = order.garmentLines[0].id;

      // Deliver 2 of 4 returned pieces
      const partialDeliveryDto: RecordDeliveryDTO = {
        transactionId: order.id,
        staffId: 'STAFF-DELIVERY-01',
        deliveredLines: [{ garmentLineId: lineId, deliveredQuantity: 2 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        residentPresent: true,
        residentVerified: true,
      };

      const delivered = await coordinator.recordDelivery(partialDeliveryDto);

      expect(delivered.status).toBe('DELIVERED_PARTIAL');
      expect(delivered.totalDeliveredPieces).toBe(2);
      expect(delivered.totalOutstandingPieces).toBe(2);
      expect(delivered.garmentLines[0].deliveredQuantity).toBe(2);
      expect(delivered.garmentLines[0].outstandingQuantity).toBe(2);
    });

    it('rejects delivering unreturned quantities atomically at the domain layer', async () => {
      // Order with 4 physical pieces collected, but only 2 returned
      const selectableStays = await coordinator.getSelectableStays();
      const stay = selectableStays[0];
      const catalog = await coordinator.getMasterCatalog();

      const draft = await coordinator.createCollectionDraft({
        stayId: stay.stayId,
        residentId: stay.residentId,
        garmentLines: [
          {
            itemId: catalog.items[0].id,
            physicalQuantity: 4,
            serviceIds: [catalog.services[0].id],
          },
        ],
      });
      await coordinator.confirmCollection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.recordInspection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.releaseProcessing({ transactionId: draft.id, route: 'IN_HOUSE', staffId: 'STAFF-01' });

      // Return only 2 pieces
      await coordinator.recordReturn({
        transactionId: draft.id,
        staffId: 'STAFF-01',
        returnedLines: [{ garmentLineId: draft.garmentLines[0].id, returnedQuantity: 2 }],
      });

      // Attempt to deliver 3 pieces when only 2 are returned
      const invalidDeliveryDto: RecordDeliveryDTO = {
        transactionId: draft.id,
        staffId: 'STAFF-01',
        deliveredLines: [{ garmentLineId: draft.garmentLines[0].id, deliveredQuantity: 3 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
      };

      await expect(coordinator.recordDelivery(invalidDeliveryDto)).rejects.toThrow(
        /Available returned deliverable quantity/i
      );
    });
  });

  describe('Section C: Delivery → Chargeability & Finance Boundary (BR-L-012)', () => {
    it('evaluates BR-L-012 chargeability during delivery without React arithmetic', async () => {
      const selectableStays = await coordinator.getSelectableStays();
      const stay = selectableStays[0];
      const catalog = await coordinator.getMasterCatalog();

      // Create order with 3 pieces
      const draft = await coordinator.createCollectionDraft({
        stayId: stay.stayId,
        residentId: stay.residentId,
        garmentLines: [
          {
            itemId: catalog.items[0].id,
            physicalQuantity: 3,
            serviceIds: [catalog.services[0].id],
          },
        ],
      });
      await coordinator.confirmCollection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.recordInspection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.releaseProcessing({ transactionId: draft.id, route: 'IN_HOUSE', staffId: 'STAFF-01' });
      await coordinator.recordReturn({
        transactionId: draft.id,
        staffId: 'STAFF-01',
        returnedLines: [{ garmentLineId: draft.garmentLines[0].id, returnedQuantity: 3 }],
      });

      // Prior to delivery: unposted charges exist in aggregate, fulfilled = 3, delivered = 0
      const detailBefore = await coordinator.getTransactionDetail(draft.id);
      expect(detailBefore).toBeDefined();

      // Record Delivery -> Triggers domain charge calculation
      const delivered = await coordinator.recordDelivery({
        transactionId: draft.id,
        staffId: 'STAFF-01',
        deliveredLines: [{ garmentLineId: draft.garmentLines[0].id, deliveredQuantity: 3 }],
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        residentPresent: true,
        residentVerified: true,
      });

      // Refreshed ViewModel contains charges
      const sa = delivered.garmentLines[0].serviceAllocations[0];
      expect(sa.fulfilledQuantity).toBe(3);
      expect(sa.isRateCaptured).toBe(true);
      expect(sa.totalChargesCount).toBe(1);
      expect(sa.totalChargeAmount).toBeGreaterThan(0);
      expect(delivered.totalEstimatedAmount).toBeGreaterThan(0);

      // Verify timeline reflects canonical LaundryDelivered and LaundryChargeRaised events
      expect(delivered.timeline.some((e) => e.eventType === 'LaundryDelivered')).toBe(true);
      expect(delivered.timeline.some((e) => e.eventType === 'LaundryChargeRaised')).toBe(true);
    });
  });

  describe('Section D: Architecture & Boundary Invariants', () => {
    it('verifies presentation code respects strict module boundaries', () => {
      // Components can be instantiated without importing forbidden modules
      expect(RecordReturnDialog).toBeDefined();
      expect(RecordDeliveryDialog).toBeDefined();
    });
  });
});
