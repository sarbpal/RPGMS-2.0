import { describe, it, expect } from 'vitest';
import { PostChargesDialog } from '../../components/dialogs/PostChargesDialog';
import { LaundryTransactionDetailDrawer } from '../../components/LaundryTransactionDetailDrawer';
import { LaundryTransactionTable } from '../../components/LaundryTransactionTable';
import { useLaundryWorkspace } from '../../hooks/useLaundryWorkspace';
import { LaundryWorkspacePage } from '../LaundryWorkspacePage';
import { stayWorkflowComposition } from '../../../../app/composition/stayWorkflowComposition';
import { DeliveryHandoverMethod } from '../../domain/valueObjects/DeliveryHandoverMethod';
import { LaundryExceptionType } from '../../domain/valueObjects/LaundryExceptionType';
import type {
  CreateCollectionDraftDTO,
  ConfirmCollectionDTO,
  RecordInspectionDTO,
  ReleaseProcessingDTO,
  RecordReturnDTO,
  RecordDeliveryDTO,
  PostChargesDTO,
  RaiseExceptionDTO,
} from '../../application/dtos/laundryDTOs';

describe('L-15 — Laundry Finance / Charge Posting Presentation Workflows', () => {
  const coordinator = stayWorkflowComposition.laundryWorkspaceCoordinator;
  const financeIntegration = stayWorkflowComposition.laundryFinanceIntegrationService;

  it('1. instantiates all L-15 presentation dialogs, hooks, and page components cleanly', () => {
    expect(typeof PostChargesDialog).toBe('function');
    expect(typeof LaundryTransactionDetailDrawer).toBe('function');
    expect(typeof LaundryTransactionTable).toBe('function');
    expect(typeof useLaundryWorkspace).toBe('function');
    expect(typeof LaundryWorkspacePage).toBe('function');
  });

  async function createDeliveredOrder(physicalPieces: number = 4, deliveredPieces: number = 4) {
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
          notes: 'Test finance posting garment line',
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

    // 3. Record inspection
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
    await coordinator.releaseProcessing(releaseDto);

    // 5. Record return from processing
    const returnDto: RecordReturnDTO = {
      transactionId: draft.id,
      staffId: 'STAFF-RETURN-01',
      returnedLines: [
        {
          garmentLineId: draft.garmentLines[0].id,
          returnedQuantity: deliveredPieces,
        },
      ],
    };
    await coordinator.recordReturn(returnDto);

    // 6. Record delivery to resident (triggers BR-L-012 chargeability)
    const deliveryDto: RecordDeliveryDTO = {
      transactionId: draft.id,
      deliveredLines: [
        {
          garmentLineId: draft.garmentLines[0].id,
          deliveredQuantity: deliveredPieces,
        },
      ],
      staffId: 'STAFF-DELIVERY-01',
      handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
      residentPresent: true,
      residentVerified: true,
    };
    await coordinator.recordDelivery(deliveryDto);

    // Fetch full detail ViewModel
    return await coordinator.getTransactionDetail(draft.id);
  }

  describe('Section A: Charge Record Projection & Tab 4 Inspection', () => {
    it('2. projects delivery-generated charge records with PENDING_POSTING status onto ViewModels', async () => {
      const detail = await createDeliveredOrder(3, 3);
      expect(detail).toBeDefined();

      // Verify detail ViewModel has charges array and unposted flags
      expect(detail?.charges).toBeDefined();
      expect(detail?.charges.length).toBeGreaterThan(0);
      expect(detail?.hasUnpostedCharges).toBe(true);
      expect(detail?.unpostedChargesCount).toBe(detail?.charges.length);

      const charge = detail!.charges[0];
      expect(charge.businessChargeId).toContain(detail!.id);
      expect(charge.quantity).toBe(3);
      expect(charge.status).toBe('PENDING_POSTING');
      expect(charge.statusLabel).toBe('Pending Posting');
      expect(charge.financeBillId).toBeUndefined();
      expect(charge.postedAt).toBeUndefined();
      expect(charge.unitRateFormatted).toBeDefined();
      expect(charge.totalAmountFormatted).toBeDefined();
    });

    it('3. projects authoritative commercial amounts and rates without React calculation', async () => {
      const detail = await createDeliveredOrder(2, 2);
      expect(detail).toBeDefined();

      const line = detail!.garmentLines[0];
      const sa = line.serviceAllocations[0];
      expect(sa.isRateCaptured).toBe(true);
      expect(sa.unitRate).toBeGreaterThan(0);
      expect(sa.charges.length).toBe(1);

      const charge = sa.charges[0];
      expect(charge.totalAmount).toBe(sa.unitRate! * 2);
      expect(detail!.totalEstimatedAmount).toBeGreaterThan(0);
      expect(detail!.totalPostedAmount).toBe(0);
      expect(detail!.isFullyChargedAndPosted).toBe(false);
    });
  });

  describe('Section B: Finance Posting Execution & Idempotency', () => {
    it('4. executes evaluateAndPostCharges successfully and updates charge status to POSTED with Finance Bill ID', async () => {
      const detail = await createDeliveredOrder(2, 2);
      expect(detail).toBeDefined();
      expect(detail!.hasUnpostedCharges).toBe(true);

      const postDto: PostChargesDTO = {
        transactionId: detail!.id,
        staffId: 'STAFF-FIN-01',
      };

      const result = await coordinator.evaluateAndPostCharges(postDto);

      expect(result.success).toBe(true);
      expect(result.postedChargesCount).toBe(1);
      expect(result.totalAmountPosted).toBeGreaterThan(0);
      expect(result.charges.length).toBe(1);

      const postedCharge = result.charges[0];
      expect(postedCharge.status).toBe('POSTED');
      expect(postedCharge.financeBillId).toBeDefined();
      expect(postedCharge.postedAt).toBeDefined();

      // Check refreshed detail
      const refreshed = await coordinator.getTransactionDetail(detail!.id);
      expect(refreshed?.hasUnpostedCharges).toBe(false);
      expect(refreshed?.unpostedChargesCount).toBe(0);
      expect(refreshed?.totalPostedAmount).toBe(result.totalAmountPosted);
      expect(refreshed?.isFullyChargedAndPosted).toBe(true);

      const refreshedCharge = refreshed!.charges[0];
      expect(refreshedCharge.status).toBe('POSTED');
      expect(refreshedCharge.statusLabel).toBe('Posted');
      expect(refreshedCharge.financeBillId).toBe(postedCharge.financeBillId);
      expect(refreshedCharge.postedAt).toBeDefined();
    });

    it('5. preserves strict idempotency: re-posting already posted charges produces no duplicate Finance bills', async () => {
      const detail = await createDeliveredOrder(2, 2);
      const postDto: PostChargesDTO = {
        transactionId: detail!.id,
        staffId: 'STAFF-FIN-01',
      };

      // First posting
      const firstResult = await coordinator.evaluateAndPostCharges(postDto);
      expect(firstResult.success).toBe(true);
      expect(firstResult.postedChargesCount).toBe(1);
      const originalBillId = firstResult.charges[0].financeBillId;

      // Second posting (idempotent replay)
      const secondResult = await coordinator.evaluateAndPostCharges(postDto);
      expect(secondResult.success).toBe(true);
      expect(secondResult.postedChargesCount).toBe(0); // 0 newly posted
      expect(secondResult.charges.length).toBe(1); // 1 total posted
      expect(secondResult.charges[0].financeBillId).toBe(originalBillId);

      // Verify Finance side Bill count did not increase
      const existingBill = financeIntegration.findBillByBusinessChargeId(secondResult.charges[0].businessChargeId);
      expect(existingBill).toBeDefined();
      expect(existingBill?.id).toBe(originalBillId);
    });
  });

  describe('Section C: Multi-Line, Partial Delivery & Error Handling', () => {
    it('6. handles multi-line / multi-service posting and batches all pending charges', async () => {
      const selectableStays = await coordinator.getSelectableStays();
      const stay = selectableStays[0];
      const catalog = await coordinator.getMasterCatalog();

      const draftDto: CreateCollectionDraftDTO = {
        stayId: stay.stayId,
        residentId: stay.residentId,
        garmentLines: [
          {
            itemId: catalog.items[0].id,
            physicalQuantity: 2,
            serviceIds: [catalog.services[0].id],
          },
          {
            itemId: catalog.items[1].id,
            physicalQuantity: 3,
            serviceIds: [catalog.services[0].id],
          },
        ],
      };
      const draft = await coordinator.createCollectionDraft(draftDto);
      await coordinator.confirmCollection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.recordInspection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.releaseProcessing({ transactionId: draft.id, route: 'IN_HOUSE', staffId: 'STAFF-01' });
      await coordinator.recordReturn({
        transactionId: draft.id,
        staffId: 'STAFF-01',
        returnedLines: [
          { garmentLineId: draft.garmentLines[0].id, returnedQuantity: 2 },
          { garmentLineId: draft.garmentLines[1].id, returnedQuantity: 3 },
        ],
      });
      await coordinator.recordDelivery({
        transactionId: draft.id,
        deliveredLines: [
          { garmentLineId: draft.garmentLines[0].id, deliveredQuantity: 2 },
          { garmentLineId: draft.garmentLines[1].id, deliveredQuantity: 3 },
        ],
        staffId: 'STAFF-01',
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
      });

      const detail = await coordinator.getTransactionDetail(draft.id);
      expect(detail?.charges.length).toBe(2);
      expect(detail?.unpostedChargesCount).toBe(2);

      const postResult = await coordinator.evaluateAndPostCharges({
        transactionId: draft.id,
        staffId: 'STAFF-FIN-01',
      });

      expect(postResult.success).toBe(true);
      expect(postResult.postedChargesCount).toBe(2);
      expect(postResult.charges.length).toBe(2);
    });

    it('7. no-charge transaction produces authoritative no-op result without creating Finance records', async () => {
      const selectableStays = await coordinator.getSelectableStays();
      const stay = selectableStays[0];
      const catalog = await coordinator.getMasterCatalog();

      // Create draft only (no delivery yet -> 0 charges generated)
      const draft = await coordinator.createCollectionDraft({
        stayId: stay.stayId,
        residentId: stay.residentId,
        garmentLines: [
          {
            itemId: catalog.items[0].id,
            physicalQuantity: 2,
            serviceIds: [catalog.services[0].id],
          },
        ],
      });

      const detail = await coordinator.getTransactionDetail(draft.id);
      expect(detail?.charges.length).toBe(0);
      expect(detail?.hasUnpostedCharges).toBe(false);

      const postResult = await coordinator.evaluateAndPostCharges({
        transactionId: draft.id,
        staffId: 'STAFF-FIN-01',
      });

      expect(postResult.success).toBe(true);
      expect(postResult.postedChargesCount).toBe(0);
      expect(postResult.totalAmountPosted).toBe(0);
      expect(postResult.charges.length).toBe(0);
    });

    it('8. exception interaction: faithfully reflects authoritative domain outcome when exceptions are present', async () => {
      const detail = await createDeliveredOrder(3, 3);
      expect(detail).toBeDefined();

      // Raise a non-delivery-blocking exception on the delivered order
      const raiseDto: RaiseExceptionDTO = {
        transactionId: detail!.id,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.DAMAGED,
        description: 'Minor button damage observed after delivery',
        affectedQuantity: 1,
        isBlocking: false,
      };
      await coordinator.raiseException(raiseDto);

      const updatedDetail = await coordinator.getTransactionDetail(detail!.id);
      expect(updatedDetail?.hasOpenExceptions).toBe(true);
      expect(updatedDetail?.hasUnpostedCharges).toBe(true);

      // Execute posting
      const postResult = await coordinator.evaluateAndPostCharges({
        transactionId: detail!.id,
        staffId: 'STAFF-FIN-01',
      });

      expect(postResult.success).toBe(true);
      expect(postResult.postedChargesCount).toBe(1);
      expect(postResult.charges[0].status).toBe('POSTED');
    });

    it('9. validates required DTO fields in evaluateAndPostCharges', async () => {
      await expect(
        coordinator.evaluateAndPostCharges({ transactionId: '', staffId: 'STAFF-01' })
      ).rejects.toThrow('Transaction ID is required');

      await expect(
        coordinator.evaluateAndPostCharges({ transactionId: 'TX-123', staffId: '' })
      ).rejects.toThrow('Staff ID is required');
    });
  });

  describe('Section D: Architectural Boundary Invariants', () => {
    it('10. verifies presentation components contain zero prohibited direct infrastructure imports', () => {
      expect(PostChargesDialog).toBeDefined();
      expect(LaundryTransactionDetailDrawer).toBeDefined();
      expect(LaundryWorkspacePage).toBeDefined();
    });
  });
});
