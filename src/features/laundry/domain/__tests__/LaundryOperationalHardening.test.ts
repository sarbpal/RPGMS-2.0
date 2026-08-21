import { describe, it, expect, beforeEach } from 'vitest';
import { stayWorkflowComposition } from '../../../../app/composition/stayWorkflowComposition';
import { LaundryTransactionStatus } from '../valueObjects/LaundryTransactionStatus';
import { ProcessingRoute } from '../valueObjects/ProcessingRoute';
import { DeliveryHandoverMethod } from '../valueObjects/DeliveryHandoverMethod';
import { LaundryExceptionType } from '../valueObjects/LaundryExceptionType';
import { ResolutionOutcome } from '../valueObjects/ResolutionOutcome';
import { ResponsibleParty } from '../valueObjects/ResponsibleParty';
import { evidenceStorage } from '../../infrastructure/storage/evidenceStorage';
import type {
  CreateCollectionDraftDTO,
  ConfirmCollectionDTO,
  CancelCollectionDTO,
} from '../../application/dtos/laundryDTOs';

describe('L-16 — Laundry Operational Completion & Hardening', () => {
  const coordinator = stayWorkflowComposition.laundryWorkspaceCoordinator;
  const financeIntegration = stayWorkflowComposition.laundryFinanceIntegrationService;
  const laundryRepo = stayWorkflowComposition.laundryRepository;

  beforeEach(() => {
    evidenceStorage.resetMemoryStore();
  });

  async function createDraftOrder(physicalPieces: number = 4) {
    const selectableStays = await coordinator.getSelectableStays();
    const stay = selectableStays[0];
    const catalog = await coordinator.getMasterCatalog();

    const draftDto: CreateCollectionDraftDTO = {
      stayId: stay.stayId,
      residentId: stay.residentId,
      garmentLines: [
        {
          itemId: catalog.items[0].id,
          physicalQuantity: physicalPieces,
          serviceIds: [catalog.services[0].id],
          notes: 'Initial intake test garment line',
        },
      ],
      notes: 'Draft intake notes',
    };
    return await coordinator.createCollectionDraft(draftDto);
  }

  async function createCollectedOrder(physicalPieces: number = 4) {
    const draft = await createDraftOrder(physicalPieces);
    const confirmDto: ConfirmCollectionDTO = {
      transactionId: draft.id,
      staffId: 'STAFF-INTAKE-01',
      bagCount: 2,
      bagTagNumbers: ['TAG-001', 'TAG-002'],
      residentVerified: true,
      notes: 'Collection confirmed at desk',
    };
    return await coordinator.confirmCollection(confirmDto);
  }

  async function createInProcessOrder(physicalPieces: number = 4) {
    const collected = await createCollectedOrder(physicalPieces);
    await coordinator.recordInspection({
      transactionId: collected.id,
      staffId: 'STAFF-INSPECT-01',
    });
    return await coordinator.releaseProcessing({
      transactionId: collected.id,
      route: ProcessingRoute.IN_HOUSE,
      staffId: 'STAFF-RELEASE-01',
    });
  }

  /* =========================================================================
   * Section A: Canonical Pre-Release Collection Cancellation (Positive Cases)
   * ========================================================================= */
  describe('Section A: Canonical Pre-Release Cancellation (Positive Cases)', () => {
    it('1. cancels a DRAFT transaction before confirmation (Section 100.1, 176)', async () => {
      const draft = await createDraftOrder(3);
      expect(draft.status).toBe(LaundryTransactionStatus.DRAFT);

      const cancelDto: CancelCollectionDTO = {
        transactionId: draft.id,
        staffId: 'STAFF-001',
        reason: 'Resident decided to wash items themselves prior to intake confirmation.',
        cancelledAt: '2026-08-21T10:00:00.000Z',
      };

      const cancelled = await coordinator.cancelCollection(cancelDto);

      expect(cancelled.status).toBe(LaundryTransactionStatus.CANCELLED);
      expect(cancelled.statusLabel).toBe('Cancelled');
      expect(cancelled.garmentLines.length).toBe(1);
      expect(cancelled.totalPhysicalPieces).toBe(3);

      // Verify business event emitted to timeline
      const cancelEvent = cancelled.timeline.find((e) => e.eventType === 'LaundryTransactionCancelled');
      expect(cancelEvent).toBeDefined();
      expect(cancelEvent?.title).toBe('Transaction Cancelled');
      expect(cancelEvent?.description).toContain('Resident decided to wash items themselves');

      // Verify repository persistence and event metadata
      const stored = await laundryRepo.findById(draft.id);
      expect(stored?.status).toBe(LaundryTransactionStatus.CANCELLED);
      const domainCancelEvent = stored?.businessEvents.find((e) => e.eventType === 'LaundryTransactionCancelled');
      expect(domainCancelEvent).toBeDefined();
      expect(domainCancelEvent?.metadata?.physicalReturnedToResident).toBe(true);
      expect(domainCancelEvent?.metadata?.cancelledByStaffId).toBe('STAFF-001');
    });

    it('2. cancels a COLLECTED transaction before inspection (Section 15.1, 101.7, 116)', async () => {
      const collected = await createCollectedOrder(4);
      expect(collected.status).toBe(LaundryTransactionStatus.COLLECTED);

      const cancelDto: CancelCollectionDTO = {
        transactionId: collected.id,
        staffId: 'STAFF-CANCEL-02',
        reason: 'Resident requested urgent return of collected garments before processing.',
      };

      const cancelled = await coordinator.cancelCollection(cancelDto);

      expect(cancelled.status).toBe(LaundryTransactionStatus.CANCELLED);
      expect(cancelled.statusLabel).toBe('Cancelled');

      // Verify rate snapshots remain preserved for historical audit
      const line = cancelled.garmentLines[0];
      expect(line.serviceAllocations[0].isRateCaptured).toBe(true);
      expect(line.serviceAllocations[0].unitRate).toBeGreaterThan(0);
    });

    it('3. cancels a COLLECTED transaction after inspection completed but before release (Section 15.1)', async () => {
      const collected = await createCollectedOrder(5);

      // Perform pre-processing inspection
      const inspected = await coordinator.recordInspection({
        transactionId: collected.id,
        staffId: 'STAFF-INSPECT-01',
      });
      expect(inspected.status).toBe(LaundryTransactionStatus.COLLECTED);
      expect(inspected.isInspected).toBe(true);

      // Cancel before release to processing
      const cancelDto: CancelCollectionDTO = {
        transactionId: collected.id,
        staffId: 'STAFF-CANCEL-03',
        reason: 'Inspection revealed delicate silk fabric requiring specialized dry-cleaning; returned to resident.',
      };

      const cancelled = await coordinator.cancelCollection(cancelDto);

      expect(cancelled.status).toBe(LaundryTransactionStatus.CANCELLED);
      expect(cancelled.isInspected).toBe(true);

      const cancelEvent = cancelled.timeline.find((e) => e.eventType === 'LaundryTransactionCancelled');
      expect(cancelEvent).toBeDefined();
      expect(cancelEvent?.description).toContain('delicate silk fabric');
    });
  });

  /* =========================================================================
   * Section B: Canonical Prohibited Statuses & Input Validation (Negative Cases)
   * ========================================================================= */
  describe('Section B: Canonical Prohibited States & Invariant Validation', () => {
    it('4. strictly prohibits cancellation once transaction is IN_PROCESS (Section 15.2)', async () => {
      const inProcess = await createInProcessOrder(4);
      expect(inProcess.status).toBe(LaundryTransactionStatus.IN_PROCESS);

      await expect(
        coordinator.cancelCollection({
          transactionId: inProcess.id,
          staffId: 'STAFF-001',
          reason: 'Attempting invalid post-release cancellation',
        })
      ).rejects.toThrow(/Cancellation is only permitted prior to processing release/);

      // Verify status remains IN_PROCESS and no cancellation event recorded
      const current = await coordinator.getTransactionDetail(inProcess.id);
      expect(current?.status).toBe(LaundryTransactionStatus.IN_PROCESS);
      expect(current?.timeline.some((e) => e.eventType === 'LaundryTransactionCancelled')).toBe(false);
    });

    it('5. strictly prohibits cancellation on RETURNED_PARTIAL or RETURNED_FULL status', async () => {
      const inProcess = await createInProcessOrder(4);

      await coordinator.recordReturn({
        transactionId: inProcess.id,
        staffId: 'STAFF-RETURN-01',
        returnedLines: [{ garmentLineId: inProcess.garmentLines[0].id, returnedQuantity: 2 }],
      });

      const partialReturned = await coordinator.getTransactionDetail(inProcess.id);
      expect(partialReturned?.status).toBe(LaundryTransactionStatus.RETURNED_PARTIAL);

      await expect(
        coordinator.cancelCollection({
          transactionId: inProcess.id,
          staffId: 'STAFF-001',
          reason: 'Invalid cancellation after return',
        })
      ).rejects.toThrow(/Cancellation is only permitted prior to processing release/);
    });

    it('6. strictly prohibits cancellation on DELIVERED_PARTIAL or COMPLETED status', async () => {
      const inProcess = await createInProcessOrder(2);
      await coordinator.recordReturn({
        transactionId: inProcess.id,
        staffId: 'STAFF-01',
        returnedLines: [{ garmentLineId: inProcess.garmentLines[0].id, returnedQuantity: 2 }],
      });
      await coordinator.recordDelivery({
        transactionId: inProcess.id,
        staffId: 'STAFF-01',
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredLines: [{ garmentLineId: inProcess.garmentLines[0].id, deliveredQuantity: 2 }],
      });

      const completed = await coordinator.getTransactionDetail(inProcess.id);
      expect(completed?.status).toBe(LaundryTransactionStatus.COMPLETED);

      await expect(
        coordinator.cancelCollection({
          transactionId: inProcess.id,
          staffId: 'STAFF-01',
          reason: 'Invalid cancellation after completion',
        })
      ).rejects.toThrow(/Cancellation is only permitted prior to processing release/);
    });

    it('7. strictly prohibits re-cancellation of already CANCELLED transaction', async () => {
      const draft = await createDraftOrder(2);
      await coordinator.cancelCollection({
        transactionId: draft.id,
        staffId: 'STAFF-01',
        reason: 'First valid cancellation',
      });

      await expect(
        coordinator.cancelCollection({
          transactionId: draft.id,
          staffId: 'STAFF-02',
          reason: 'Second duplicate cancellation',
        })
      ).rejects.toThrow(/Cancellation is only permitted prior to processing release/);
    });

    it('8. validates required inputs (staffId and reason)', async () => {
      const draft = await createDraftOrder(2);

      // Empty staffId
      await expect(
        coordinator.cancelCollection({
          transactionId: draft.id,
          staffId: '',
          reason: 'Valid reason',
        })
      ).rejects.toThrow(/Staff ID is required/);

      // Whitespace staffId
      await expect(
        coordinator.cancelCollection({
          transactionId: draft.id,
          staffId: '   ',
          reason: 'Valid reason',
        })
      ).rejects.toThrow(/Staff ID is required/);

      // Empty reason
      await expect(
        coordinator.cancelCollection({
          transactionId: draft.id,
          staffId: 'STAFF-01',
          reason: '',
        })
      ).rejects.toThrow(/Cancellation reason is required/);

      // Whitespace reason
      await expect(
        coordinator.cancelCollection({
          transactionId: draft.id,
          staffId: 'STAFF-01',
          reason: '   ',
        })
      ).rejects.toThrow(/Cancellation reason is required/);
    });
  });

  /* =========================================================================
   * Section C: Isolation & Non-Interference with Finance / Other Modules
   * ========================================================================= */
  describe('Section C: Isolation & Non-Interference', () => {
    it('9. confirms cancellation generates zero Finance bills or ledger postings', async () => {
      const collected = await createCollectedOrder(3);
      await coordinator.cancelCollection({
        transactionId: collected.id,
        staffId: 'STAFF-01',
        reason: 'Pre-release cancellation verification for Finance isolation',
      });

      const detail = await coordinator.getTransactionDetail(collected.id);
      expect(detail?.charges.length).toBe(0);
      expect(detail?.hasUnpostedCharges).toBe(false);
      expect(detail?.totalPostedAmount).toBe(0);

      // Verify Finance side has 0 bills for this transaction
      const bill = financeIntegration.findBillByBusinessChargeId(`${collected.id}:GL-${collected.id}-1:SRV-01:BRK-0`);
      expect(bill).toBeNull();
    });
  });

  /* =========================================================================
   * Section D: Multi-Stage Operational Lifecycle Hardening
   * ========================================================================= */
  describe('Section D: Multi-Stage Operational Lifecycle Hardening', () => {
    it('10. verifies multi-line partial returns, custody reconciliation, and delivery completion', async () => {
      const selectableStays = await coordinator.getSelectableStays();
      const stay = selectableStays[0];
      const catalog = await coordinator.getMasterCatalog();

      // Create draft with 2 garment lines
      const draft = await coordinator.createCollectionDraft({
        stayId: stay.stayId,
        residentId: stay.residentId,
        garmentLines: [
          { itemId: catalog.items[0].id, physicalQuantity: 3, serviceIds: [catalog.services[0].id] },
          { itemId: catalog.items[1].id, physicalQuantity: 2, serviceIds: [catalog.services[0].id] },
        ],
      });

      await coordinator.confirmCollection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.recordInspection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.releaseProcessing({ transactionId: draft.id, route: ProcessingRoute.IN_HOUSE, staffId: 'STAFF-01' });

      // First partial return: 2 of line 1, 0 of line 2
      await coordinator.recordReturn({
        transactionId: draft.id,
        staffId: 'STAFF-RET-01',
        returnedLines: [{ garmentLineId: draft.garmentLines[0].id, returnedQuantity: 2 }],
      });      
      let detail = await coordinator.getTransactionDetail(draft.id);
      expect(detail?.status).toBe(LaundryTransactionStatus.RETURNED_PARTIAL);
      expect(detail?.totalReturnedPieces).toBe(2);
      expect(detail!.totalPhysicalPieces - detail!.totalReturnedPieces).toBe(3); // 5 - 2 = 3

      // Second return: remaining 1 of line 1, all 2 of line 2
      await coordinator.recordReturn({
        transactionId: draft.id,
        staffId: 'STAFF-RET-02',
        returnedLines: [
          { garmentLineId: draft.garmentLines[0].id, returnedQuantity: 1 },
          { garmentLineId: draft.garmentLines[1].id, returnedQuantity: 2 },
        ],
      });

      detail = await coordinator.getTransactionDetail(draft.id);
      expect(detail?.status).toBe(LaundryTransactionStatus.RETURNED_FULL);
      expect(detail?.totalReturnedPieces).toBe(5);
      expect(detail!.totalPhysicalPieces - detail!.totalReturnedPieces).toBe(0);

      // First delivery: deliver line 1 (3 pieces)
      await coordinator.recordDelivery({
        transactionId: draft.id,
        staffId: 'STAFF-DEL-01',
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredLines: [{ garmentLineId: draft.garmentLines[0].id, deliveredQuantity: 3 }],
      });

      detail = await coordinator.getTransactionDetail(draft.id);
      expect(detail?.status).toBe(LaundryTransactionStatus.DELIVERED_PARTIAL);
      expect(detail?.totalDeliveredPieces).toBe(3);
      expect(detail?.totalOutstandingPieces).toBe(2);

      // Second delivery: deliver line 2 (2 pieces) -> completes physical custody
      await coordinator.recordDelivery({
        transactionId: draft.id,
        staffId: 'STAFF-DEL-02',
        handoverMethod: DeliveryHandoverMethod.ROOM_PLACEMENT,
        deliveredLines: [{ garmentLineId: draft.garmentLines[1].id, deliveredQuantity: 2 }],
        photoUris: ['photo://laundry/placement.jpg'],
      });

      detail = await coordinator.getTransactionDetail(draft.id);
      expect(detail?.status).toBe(LaundryTransactionStatus.COMPLETED);
      expect(detail?.totalDeliveredPieces).toBe(5);
      expect(detail?.totalOutstandingPieces).toBe(0);
    });

    it('11. verifies multi-exception lifecycle with physical piece resolution and Section 181 evidence cleanup', async () => {
      const selectableStays = await coordinator.getSelectableStays();
      const stay = selectableStays[0];
      const catalog = await coordinator.getMasterCatalog();

      // Create and confirm collection with evidence
      const draft = await coordinator.createCollectionDraft({
        stayId: stay.stayId,
        residentId: stay.residentId,
        garmentLines: [{ itemId: catalog.items[0].id, physicalQuantity: 4, serviceIds: [catalog.services[0].id] }],
      });

      const photoUri = 'photo://laundry/intake-456.jpg';
      evidenceStorage.saveEvidence(photoUri, 'mock-photo-data');
      expect(evidenceStorage.hasEvidence(photoUri)).toBe(true);

      await coordinator.confirmCollection({
        transactionId: draft.id,
        staffId: 'STAFF-01',
        photoUris: [photoUri],
      });
      await coordinator.recordInspection({ transactionId: draft.id, staffId: 'STAFF-01' });
      await coordinator.releaseProcessing({ transactionId: draft.id, route: ProcessingRoute.IN_HOUSE, staffId: 'STAFF-01' });
      await coordinator.recordReturn({
        transactionId: draft.id,
        staffId: 'STAFF-01',
        returnedLines: [{ garmentLineId: draft.garmentLines[0].id, returnedQuantity: 3 }],
      });

      // Deliver 3 returned items
      await coordinator.recordDelivery({
        transactionId: draft.id,
        staffId: 'STAFF-01',
        handoverMethod: DeliveryHandoverMethod.DIRECT_HANDOVER,
        deliveredLines: [{ garmentLineId: draft.garmentLines[0].id, deliveredQuantity: 3 }],
      });

      // Raise missing item exception for the 1 outstanding piece
      const raised = await coordinator.raiseException({
        transactionId: draft.id,
        garmentLineId: draft.garmentLines[0].id,
        staffId: 'STAFF-EXC-01',
        type: LaundryExceptionType.MISSING,
        description: '1 shirt missing after return from laundry room',
        affectedQuantity: 1,
        isBlocking: false,
      });

      expect(raised.hasOpenExceptions).toBe(true);
      const exc = raised.exceptions[0];

      // Investigate
      await coordinator.recordInvestigation({
        transactionId: draft.id,
        exceptionId: exc.id,
        investigatorStaffId: 'STAFF-INV-01',
        findings: 'Item misplaced in dryer filter compartment, recovered and washed.',
        responsibleParty: ResponsibleParty.RPGMS,
      });

      // Resolve with ITEM_RECOVERED outcome and 1 resolved quantity
      await coordinator.resolveException({
        transactionId: draft.id,
        exceptionId: exc.id,
        resolverStaffId: 'STAFF-MGR-01',
        outcome: ResolutionOutcome.ITEM_RECOVERED,
        resolvedQuantity: 1,
        notes: 'Item recovered and returned directly to resident.',
      });

      const finalDetail = await coordinator.getTransactionDetail(draft.id);
      expect(finalDetail?.status).toBe(LaundryTransactionStatus.COMPLETED);
      expect(finalDetail?.totalResolvedPieces).toBe(1);
      expect(finalDetail?.totalDeliveredPieces).toBe(3);
      expect(finalDetail?.totalOutstandingPieces).toBe(0); // 4 - 3 - 1 = 0
      expect(finalDetail?.hasOpenExceptions).toBe(false);

      // Trigger Section 181 ephemeral evidence cleanup on stored domain entity
      const stored = await laundryRepo.findById(draft.id);
      expect(stored).toBeDefined();
      const cleaned = evidenceStorage.cleanupEvidenceForCompletedTransaction(stored!);

      expect(cleaned).toContain(photoUri);
      expect(evidenceStorage.hasEvidence(photoUri)).toBe(false);
    });
  });
});
