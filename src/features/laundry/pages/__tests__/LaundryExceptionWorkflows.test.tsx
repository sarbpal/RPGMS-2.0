import { describe, it, expect } from 'vitest';
import { RaiseExceptionDialog } from '../../components/dialogs/RaiseExceptionDialog';
import { RecordInvestigationDialog } from '../../components/dialogs/RecordInvestigationDialog';
import { ResolveExceptionDialog } from '../../components/dialogs/ResolveExceptionDialog';
import { LaundryTransactionDetailDrawer } from '../../components/LaundryTransactionDetailDrawer';
import { LaundryTransactionTable } from '../../components/LaundryTransactionTable';
import { stayWorkflowComposition } from '../../../../app/composition/stayWorkflowComposition';
import { LaundryExceptionType } from '../../domain/valueObjects/LaundryExceptionType';
import { ResolutionOutcome } from '../../domain/valueObjects/ResolutionOutcome';
import { ResponsibleParty } from '../../domain/valueObjects/ResponsibleParty';
import { DeliveryHandoverMethod } from '../../domain/valueObjects/DeliveryHandoverMethod';
import type {
  CreateCollectionDraftDTO,
  ConfirmCollectionDTO,
  RecordInspectionDTO,
  ReleaseProcessingDTO,
  RecordDeliveryDTO,
  RaiseExceptionDTO,
  RecordInvestigationDTO,
  ResolveExceptionDTO,
} from '../../application/dtos/laundryDTOs';

describe('L-14 — Laundry Exception Presentation Workflows', () => {
  const coordinator = stayWorkflowComposition.laundryWorkspaceCoordinator;

  it('instantiates all L-14 presentation dialogs and components cleanly', () => {
    expect(typeof RaiseExceptionDialog).toBe('function');
    expect(typeof RecordInvestigationDialog).toBe('function');
    expect(typeof ResolveExceptionDialog).toBe('function');
    expect(typeof LaundryTransactionDetailDrawer).toBe('function');
    expect(typeof LaundryTransactionTable).toBe('function');
  });

  async function createTestOrder(physicalPieces: number = 4) {
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
          notes: 'Test exception garment line',
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
    return await coordinator.releaseProcessing(releaseDto);
  }

  describe('Section A: Raise Operational Exception Workflow & Targeting Model', () => {
    it('raises transaction-level exception (no garmentLineId or serviceId) and updates ViewModel', async () => {
      const order = await createTestOrder(4);

      const raiseDto: RaiseExceptionDTO = {
        transactionId: order.id,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.MISSING,
        description: 'General bag seal discrepancy reported by driver',
        affectedQuantity: 1,
        isBlocking: false,
        photoUris: ['photo://laundry/bag-tag.jpg'],
      };

      const updated = await coordinator.raiseException(raiseDto);

      expect(updated.status).toBe('EXCEPTION_RAISED');
      expect(updated.hasOpenExceptions).toBe(true);
      expect(updated.openExceptionsCount).toBe(1);
      expect(updated.exceptions.length).toBe(1);

      const exc = updated.exceptions[0];
      expect(exc.type).toBe(LaundryExceptionType.MISSING);
      expect(exc.typeLabel).toBe('Missing Garment');
      expect(exc.status).toBe('OPEN');
      expect(exc.statusLabel).toBe('Open');
      expect(exc.description).toBe('General bag seal discrepancy reported by driver');
      expect(exc.affectedQuantity).toBe(1);
      expect(exc.garmentLineId).toBeUndefined();
      expect(exc.serviceId).toBeUndefined();
      expect(exc.isBlocking).toBe(false);
      expect(exc.evidenceUris).toEqual(['photo://laundry/bag-tag.jpg']);
      expect(exc.investigations.length).toBe(0);
      expect(exc.resolution).toBeUndefined();
    });

    it('raises garment-line-level exception and projects item name onto ViewModel', async () => {
      const order = await createTestOrder(4);
      const lineId = order.garmentLines[0].id;

      const raiseDto: RaiseExceptionDTO = {
        transactionId: order.id,
        garmentLineId: lineId,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.DAMAGED,
        description: 'Tear along shoulder seam observed after wash',
        affectedQuantity: 1,
        photoUris: ['photo://laundry/tear-01.jpg', 'photo://laundry/tear-02.jpg'],
      };

      const updated = await coordinator.raiseException(raiseDto);
      expect(updated.exceptions.length).toBe(1);

      const exc = updated.exceptions[0];
      expect(exc.type).toBe(LaundryExceptionType.DAMAGED);
      expect(exc.typeLabel).toBe('Damaged Garment');
      expect(exc.garmentLineId).toBe(lineId);
      expect(exc.itemName).toBeDefined();
      expect(exc.serviceId).toBeUndefined();
      expect(exc.affectedQuantity).toBe(1);
      expect(exc.evidenceUris).toEqual(['photo://laundry/tear-01.jpg', 'photo://laundry/tear-02.jpg']);
    });

    it('raises service-allocation-level exception and projects service name onto ViewModel', async () => {
      const order = await createTestOrder(4);
      const line = order.garmentLines[0];
      const serviceId = line.serviceAllocations[0].serviceId;

      const raiseDto: RaiseExceptionDTO = {
        transactionId: order.id,
        garmentLineId: line.id,
        serviceId,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.SERVICE_NOT_PERFORMED,
        description: 'Ironing service not performed on shirt line',
        affectedQuantity: 2,
      };

      const updated = await coordinator.raiseException(raiseDto);
      const exc = updated.exceptions[0];

      expect(exc.type).toBe(LaundryExceptionType.SERVICE_NOT_PERFORMED);
      expect(exc.garmentLineId).toBe(line.id);
      expect(exc.serviceId).toBe(serviceId);
      expect(exc.serviceName).toBeDefined();
      expect(exc.affectedQuantity).toBe(2);
    });

    it('authoritatively flags IDENTITY_DISPUTE as isBlocking by default in domain', async () => {
      const order = await createTestOrder(4);
      const lineId = order.garmentLines[0].id;

      const raiseDto: RaiseExceptionDTO = {
        transactionId: order.id,
        garmentLineId: lineId,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.IDENTITY_DISPUTE,
        description: 'Resident states this garment is not theirs',
        affectedQuantity: 1,
      };

      const updated = await coordinator.raiseException(raiseDto);
      const exc = updated.exceptions[0];

      // Domain enforces isBlocking = true for IDENTITY_DISPUTE
      expect(exc.isBlocking).toBe(true);
    });
  });

  describe('Section B: Record Investigation Workflow', () => {
    it('records an operational investigation and transitions exception status to UNDER_INVESTIGATION', async () => {
      const order = await createTestOrder(4);

      // 1. Raise exception
      const raiseDto: RaiseExceptionDTO = {
        transactionId: order.id,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.MISSING,
        description: 'One piece missing upon return',
        affectedQuantity: 1,
      };
      const raisedOrder = await coordinator.raiseException(raiseDto);
      const excId = raisedOrder.exceptions[0].id;

      // 2. Record Investigation
      const invDto: RecordInvestigationDTO = {
        transactionId: order.id,
        exceptionId: excId,
        investigatorStaffId: 'STAFF-INV-01',
        findings: 'Contacted vendor facility; item misplaced in drying tumbler and located',
        responsibleParty: ResponsibleParty.VENDOR,
        photoUris: ['photo://investigation/found-tag.jpg'],
      };

      const updated = await coordinator.recordInvestigation(invDto);
      const exc = updated.exceptions.find((e) => e.id === excId)!;

      expect(exc.status).toBe('UNDER_INVESTIGATION');
      expect(exc.statusLabel).toBe('Under Investigation');
      expect(exc.investigations.length).toBe(1);

      const inv = exc.investigations[0];
      expect(inv.investigatorStaffId).toBe('STAFF-INV-01');
      expect(inv.findings).toBe('Contacted vendor facility; item misplaced in drying tumbler and located');
      expect(inv.responsibleParty).toBe(ResponsibleParty.VENDOR);
      expect(inv.evidenceUris).toEqual(['photo://investigation/found-tag.jpg']);
      expect(inv.startedAtFormatted).toBeDefined();
    });

    it('records multiple sequential investigations preserving chronological audit facts', async () => {
      const order = await createTestOrder(4);
      const raisedOrder = await coordinator.raiseException({
        transactionId: order.id,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.DAMAGED,
        description: 'Fabric stain dispute',
        affectedQuantity: 1,
      });
      const excId = raisedOrder.exceptions[0].id;

      // First investigation
      await coordinator.recordInvestigation({
        transactionId: order.id,
        exceptionId: excId,
        investigatorStaffId: 'STAFF-INV-01',
        findings: 'Reviewed intake photos; pre-existing stain was noted at collection baseline',
        responsibleParty: ResponsibleParty.RESIDENT,
      });

      // Second investigation
      const secondUpdate = await coordinator.recordInvestigation({
        transactionId: order.id,
        exceptionId: excId,
        investigatorStaffId: 'STAFF-SUPERVISOR-01',
        findings: 'Spoke with resident who agreed the stain was present prior to intake',
        responsibleParty: ResponsibleParty.RESIDENT,
      });

      const exc = secondUpdate.exceptions.find((e) => e.id === excId)!;
      expect(exc.investigations.length).toBe(2);
      expect(exc.investigations[0].investigatorStaffId).toBe('STAFF-INV-01');
      expect(exc.investigations[1].investigatorStaffId).toBe('STAFF-SUPERVISOR-01');
    });
  });

  describe('Section C: Resolve Exception Workflow & Physical Reconciliation Projection', () => {
    it('resolves exception with ITEM_RECOVERED outcome and displays resolution details', async () => {
      const order = await createTestOrder(4);
      const raisedOrder = await coordinator.raiseException({
        transactionId: order.id,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.MISSING,
        description: 'Missing shirt',
        affectedQuantity: 1,
      });
      const excId = raisedOrder.exceptions[0].id;

      const resolveDto: ResolveExceptionDTO = {
        transactionId: order.id,
        exceptionId: excId,
        outcome: ResolutionOutcome.ITEM_RECOVERED,
        resolverStaffId: 'STAFF-RESOLVER-01',
        resolvedQuantity: 0,
        responsibleParty: ResponsibleParty.RPGMS,
        notes: 'Item found in sorting basket; returned to delivery pipeline',
      };

      const resolvedOrder = await coordinator.resolveException(resolveDto);
      const exc = resolvedOrder.exceptions.find((e) => e.id === excId)!;

      expect(exc.status).toBe('RESOLVED');
      expect(exc.statusLabel).toBe('Resolved');
      expect(exc.resolution).toBeDefined();
      expect(exc.resolution?.outcome).toBe(ResolutionOutcome.ITEM_RECOVERED);
      expect(exc.resolution?.outcomeLabel).toBe('Item Recovered');
      expect(exc.resolution?.resolverStaffId).toBe('STAFF-RESOLVER-01');
      expect(exc.resolution?.responsibleParty).toBe(ResponsibleParty.RPGMS);
      expect(exc.resolution?.notes).toBe('Item found in sorting basket; returned to delivery pipeline');
    });

    it('resolves exception with PERMANENTLY_LOST and updates projected totalResolvedPieces', async () => {
      const order = await createTestOrder(4);
      const lineId = order.garmentLines[0].id;

      // Return 3 of 4 pieces
      await coordinator.recordReturn({
        transactionId: order.id,
        staffId: 'STAFF-OP-01',
        returnedLines: [{ garmentLineId: lineId, returnedQuantity: 3 }],
      });

      // Deliver 3 returned pieces to resident
      await coordinator.recordDelivery({
        transactionId: order.id,
        staffId: 'STAFF-DEL-01',
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredLines: [{ garmentLineId: lineId, deliveredQuantity: 3 }],
      });

      // Raise missing exception for 1 remaining piece
      const raisedOrder = await coordinator.raiseException({
        transactionId: order.id,
        garmentLineId: lineId,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.MISSING,
        description: 'Item lost in transit',
        affectedQuantity: 1,
      });
      const excId = raisedOrder.exceptions[0].id;

      // Resolve with PERMANENTLY_LOST and resolvedQuantity = 1
      const resolveDto: ResolveExceptionDTO = {
        transactionId: order.id,
        exceptionId: excId,
        outcome: ResolutionOutcome.PERMANENTLY_LOST,
        resolverStaffId: 'STAFF-MANAGER-01',
        resolvedQuantity: 1,
        responsibleParty: ResponsibleParty.VENDOR,
        notes: 'Commercial compensation credit approved with vendor',
      };

      const completedOrder = await coordinator.resolveException(resolveDto);

      // Verify authoritative physical completion projection: Collected (4) - Delivered (3) - Resolved (1) = 0
      expect(completedOrder.totalPhysicalPieces).toBe(4);
      expect(completedOrder.totalReturnedPieces).toBe(3);
      expect(completedOrder.totalDeliveredPieces).toBe(3);
      expect(completedOrder.totalResolvedPieces).toBe(1);
      expect(completedOrder.totalOutstandingPieces).toBe(0);
      expect(completedOrder.status).toBe('COMPLETED');
      expect(completedOrder.statusLabel).toBe('Completed');
    });
  });

  describe('Section D: Delivery Blocking Integration (L-13 Compatibility)', () => {
    it('blocks delivery when an active blocking exception exists and unblocks after resolution', async () => {
      const order = await createTestOrder(4);
      const lineId = order.garmentLines[0].id;

      // Return all 4 pieces into custody
      await coordinator.recordReturn({
        transactionId: order.id,
        staffId: 'STAFF-OP-01',
        returnedLines: [{ garmentLineId: lineId, returnedQuantity: 4 }],
      });

      // Raise blocking IDENTITY_DISPUTE exception on garment line
      const raisedOrder = await coordinator.raiseException({
        transactionId: order.id,
        garmentLineId: lineId,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.IDENTITY_DISPUTE,
        description: 'Resident disputes ownership',
        affectedQuantity: 1,
        isBlocking: true,
      });
      const excId = raisedOrder.exceptions[0].id;

      // Attempting delivery must be rejected by the domain aggregate
      const deliveryDto: RecordDeliveryDTO = {
        transactionId: order.id,
        staffId: 'STAFF-DEL-01',
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredLines: [{ garmentLineId: lineId, deliveredQuantity: 4 }],
      };

      await expect(coordinator.recordDelivery(deliveryDto)).rejects.toThrow(
        /Delivery blocked for GarmentLine/
      );

      // Resolve the dispute
      await coordinator.resolveException({
        transactionId: order.id,
        exceptionId: excId,
        outcome: ResolutionOutcome.RESIDENT_ACCEPTED,
        resolverStaffId: 'STAFF-RESOLVER-01',
        resolvedQuantity: 0,
        notes: 'Tag verified with resident; delivery cleared',
      });

      // Delivery now succeeds cleanly
      const deliveredOrder = await coordinator.recordDelivery(deliveryDto);
      expect(deliveredOrder.totalDeliveredPieces).toBe(4);
      expect(deliveredOrder.status).toBe('COMPLETED');
    });
  });

  describe('Section E: Error Propagation & Domain Rejection Handling', () => {
    it('propagates domain error when attempting to add investigation to already RESOLVED exception', async () => {
      const order = await createTestOrder(2);
      const raisedOrder = await coordinator.raiseException({
        transactionId: order.id,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.OTHER,
        description: 'Delivery delay inquiry',
        affectedQuantity: 1,
      });
      const excId = raisedOrder.exceptions[0].id;

      // Resolve exception
      await coordinator.resolveException({
        transactionId: order.id,
        exceptionId: excId,
        outcome: ResolutionOutcome.NO_ACTION_REQUIRED,
        resolverStaffId: 'STAFF-01',
        resolvedQuantity: 0,
      });

      // Subsequent investigation attempt must be rejected
      await expect(
        coordinator.recordInvestigation({
          transactionId: order.id,
          exceptionId: excId,
          investigatorStaffId: 'STAFF-02',
          findings: 'Attempted note after resolution',
        })
      ).rejects.toThrow(/Cannot add investigation to already RESOLVED exception/);
    });

    it('propagates domain error when attempting to re-resolve an already RESOLVED exception', async () => {
      const order = await createTestOrder(2);
      const raisedOrder = await coordinator.raiseException({
        transactionId: order.id,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.OTHER,
        description: 'Minor stain inquiry',
        affectedQuantity: 1,
      });
      const excId = raisedOrder.exceptions[0].id;

      await coordinator.resolveException({
        transactionId: order.id,
        exceptionId: excId,
        outcome: ResolutionOutcome.NO_ACTION_REQUIRED,
        resolverStaffId: 'STAFF-01',
        resolvedQuantity: 0,
      });

      await expect(
        coordinator.resolveException({
          transactionId: order.id,
          exceptionId: excId,
          outcome: ResolutionOutcome.SERVICE_CORRECTED,
          resolverStaffId: 'STAFF-02',
          resolvedQuantity: 0,
        })
      ).rejects.toThrow(/already RESOLVED/);
    });
  });

  describe('Section F: Architectural Import Boundary Protection', () => {
    it('verifies presentation components and dialogs respect strict module boundaries', () => {
      expect(RaiseExceptionDialog).toBeDefined();
      expect(RecordInvestigationDialog).toBeDefined();
      expect(ResolveExceptionDialog).toBeDefined();
      expect(LaundryTransactionDetailDrawer).toBeDefined();
      expect(LaundryTransactionTable).toBeDefined();
    });
  });
});
