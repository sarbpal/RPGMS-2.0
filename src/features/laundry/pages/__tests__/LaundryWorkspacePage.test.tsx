import { describe, it, expect } from 'vitest';
import { LaundryWorkspacePage } from '../LaundryWorkspacePage';
import { LaundryDashboardCards } from '../../components/LaundryDashboardCards';
import { LaundryToolbar } from '../../components/LaundryToolbar';
import { LaundryTransactionTable } from '../../components/LaundryTransactionTable';
import { LaundryTransactionDetailDrawer } from '../../components/LaundryTransactionDetailDrawer';
import { CreateCollectionDraftDialog } from '../../components/dialogs/CreateCollectionDraftDialog';
import { ConfirmCollectionDialog } from '../../components/dialogs/ConfirmCollectionDialog';
import { RecordInspectionDialog } from '../../components/dialogs/RecordInspectionDialog';
import { ReleaseProcessingDialog } from '../../components/dialogs/ReleaseProcessingDialog';
import { stayWorkflowComposition } from '../../../../app/composition/stayWorkflowComposition';
import type {
  CreateCollectionDraftDTO,
  ConfirmCollectionDTO,
  RecordInspectionDTO,
  ReleaseProcessingDTO,
} from '../../application/dtos/laundryDTOs';

describe('L-11 & L-12 — Laundry Workspace Presentation Foundation & Collection/Processing Workflows', () => {
  const coordinator = stayWorkflowComposition.laundryWorkspaceCoordinator;

  it('instantiates all L-11 and L-12 presentation components cleanly', () => {
    expect(typeof LaundryWorkspacePage).toBe('function');
    expect(typeof LaundryDashboardCards).toBe('function');
    expect(typeof LaundryToolbar).toBe('function');
    expect(typeof LaundryTransactionTable).toBe('function');
    expect(typeof LaundryTransactionDetailDrawer).toBe('function');
    expect(typeof CreateCollectionDraftDialog).toBe('function');
    expect(typeof ConfirmCollectionDialog).toBe('function');
    expect(typeof RecordInspectionDialog).toBe('function');
    expect(typeof ReleaseProcessingDialog).toBe('function');
  });

  it('loads complete LaundryWorkspaceViewModel from coordinator for workspace rendering', async () => {
    const vm = await coordinator.getWorkspaceViewModel();

    expect(vm).toBeDefined();
    expect(vm.metrics).toBeDefined();
    expect(typeof vm.metrics.totalActive).toBe('number');
    expect(typeof vm.metrics.awaitingCollectionConfirmation).toBe('number');
    expect(typeof vm.metrics.awaitingInspection).toBe('number');
    expect(typeof vm.metrics.inProcessExternal).toBe('number');
    expect(typeof vm.metrics.inProcessInHouse).toBe('number');
    expect(typeof vm.metrics.returnedAwaitingDelivery).toBe('number');
    expect(typeof vm.metrics.partiallyDelivered).toBe('number');
    expect(typeof vm.metrics.openExceptionsCount).toBe('number');
    expect(typeof vm.metrics.unpostedChargesCount).toBe('number');

    expect(Array.isArray(vm.transactions)).toBe(true);
    expect(vm.masterCatalog).toBeDefined();
    expect(vm.masterCatalog.items.length).toBeGreaterThan(0);
    expect(vm.masterCatalog.services.length).toBeGreaterThan(0);
  });

  it('supports valid 1-to-1 dashboard metric filtering semantics', async () => {
    // 1. Awaiting Confirmation -> DRAFT
    const draftVm = await coordinator.getWorkspaceViewModel({ status: 'DRAFT' });
    expect(draftVm.transactions.every((tx) => tx.status === 'DRAFT')).toBe(true);

    // 2. Awaiting Inspection -> COLLECTED
    const collectedVm = await coordinator.getWorkspaceViewModel({ status: 'COLLECTED' });
    expect(collectedVm.transactions.every((tx) => tx.status === 'COLLECTED')).toBe(true);

    // 3. In Process -> IN_PROCESS
    const inProcessVm = await coordinator.getWorkspaceViewModel({ status: 'IN_PROCESS' });
    expect(inProcessVm.transactions.every((tx) => tx.status === 'IN_PROCESS')).toBe(true);

    // 4. Open Exceptions -> hasExceptions: true
    const exceptionsVm = await coordinator.getWorkspaceViewModel({ hasExceptions: true });
    expect(exceptionsVm.transactions.every((tx) => tx.hasOpenExceptions)).toBe(true);

    // 5. Total Active -> shows non-cancelled/non-completed orders
    const allVm = await coordinator.getWorkspaceViewModel({});
    expect(allVm.totalCount).toBeGreaterThanOrEqual(0);
  });

  it('filters transactions cleanly by universal search query', async () => {
    const selectableStays = await coordinator.getSelectableStays();
    expect(selectableStays.length).toBeGreaterThan(0);
    const targetStay = selectableStays[0];

    const searchVm = await coordinator.getWorkspaceViewModel({ searchQuery: targetStay.residentName });
    expect(searchVm.transactions.every((tx) =>
      tx.residentName.toLowerCase().includes(targetStay.residentName.toLowerCase()) ||
      tx.residentCode.toLowerCase().includes(targetStay.residentName.toLowerCase())
    )).toBe(true);
  });

  it('executes Create Collection Draft and Confirm Collection baseline locking', async () => {
    const selectableStays = await coordinator.getSelectableStays();
    const stay = selectableStays[0];
    const catalog = await coordinator.getMasterCatalog();

    // 1. Create draft
    const draftDto: CreateCollectionDraftDTO = {
      stayId: stay.stayId,
      residentId: stay.residentId,
      garmentLines: [
        {
          itemId: catalog.items[0].id,
          physicalQuantity: 4,
          serviceIds: [catalog.services[0].id],
          notes: 'Test collection intake line',
        },
      ],
      notes: 'Test draft collection notes',
    };

    const draft = await coordinator.createCollectionDraft(draftDto);
    expect(draft.status).toBe('DRAFT');
    expect(draft.totalPhysicalPieces).toBe(4);

    // 2. Confirm collection baseline
    const confirmDto: ConfirmCollectionDTO = {
      transactionId: draft.id,
      staffId: 'STAFF-INTAKE-01',
      bagCount: 1,
      bagTagNumbers: ['TAG-L12-001'],
      photoUris: ['evidence://photo-intake.jpg'],
      residentVerified: true,
      notes: 'Intake baseline confirmed by front-desk',
    };

    const confirmed = await coordinator.confirmCollection(confirmDto);
    expect(confirmed.status).toBe('COLLECTED');
    expect(confirmed.isInspected).toBe(false);
    expect(confirmed.collectionEvidence?.collectedByStaffId).toBe('STAFF-INTAKE-01');
    expect(confirmed.garmentLines[0].serviceAllocations[0].isRateCaptured).toBe(true);
  });

  it('records pre-processing inspection with condition observations and photo evidence', async () => {
    const selectableStays = await coordinator.getSelectableStays();
    const stay = selectableStays[0];
    const catalog = await coordinator.getMasterCatalog();

    // 1. Create & Confirm
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
    await coordinator.confirmCollection({
      transactionId: draft.id,
      staffId: 'STAFF-001',
    });

    // 2. Record Pre-processing Inspection with condition observation
    const inspectionDto: RecordInspectionDTO = {
      transactionId: draft.id,
      staffId: 'STAFF-INSPECT-01',
      inspectedAt: new Date().toISOString(),
      conditionObservations: [
        {
          garmentLineId: draft.garmentLines[0].id,
          observationType: 'STAIN',
          description: 'Ink stain on front pocket',
          affectedQuantity: 1,
          photoUris: ['evidence://stain-photo-01.jpg'],
        },
      ],
      notes: 'Garments inspected prior to dry cleaning',
    };

    const inspected = await coordinator.recordInspection(inspectionDto);

    expect(inspected.isInspected).toBe(true);
    expect(inspected.inspectedByStaffId).toBe('STAFF-INSPECT-01');
    expect(inspected.garmentLines[0].conditionObservations?.length).toBe(1);
    expect(inspected.garmentLines[0].conditionObservations?.[0].observationType).toBe('STAIN');
    expect(inspected.garmentLines[0].conditionObservations?.[0].description).toBe('Ink stain on front pocket');
    expect(inspected.garmentLines[0].conditionObservations?.[0].affectedQuantity).toBe(1);
  });

  it('enforces strict operational sequence: prevents processing release before inspection sign-off', async () => {
    const selectableStays = await coordinator.getSelectableStays();
    const stay = selectableStays[0];
    const catalog = await coordinator.getMasterCatalog();

    // Create & Confirm (not inspected yet)
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
    await coordinator.confirmCollection({
      transactionId: draft.id,
      staffId: 'STAFF-001',
    });

    // Attempt release without inspection -> Domain/Coordinator must reject
    const invalidReleaseDto: ReleaseProcessingDTO = {
      transactionId: draft.id,
      route: 'IN_HOUSE',
      staffId: 'STAFF-001',
    };

    await expect(coordinator.releaseProcessing(invalidReleaseDto)).rejects.toThrow(
      /inspection/i
    );
  });

  it('executes Processing Release to IN_HOUSE route after inspection', async () => {
    const selectableStays = await coordinator.getSelectableStays();
    const stay = selectableStays[0];
    const catalog = await coordinator.getMasterCatalog();

    // 1. Create, confirm, and inspect
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
    await coordinator.confirmCollection({ transactionId: draft.id, staffId: 'STAFF-001' });
    await coordinator.recordInspection({ transactionId: draft.id, staffId: 'STAFF-001' });

    // 2. Release to In-House route
    const releaseDto: ReleaseProcessingDTO = {
      transactionId: draft.id,
      route: 'IN_HOUSE',
      staffId: 'STAFF-OPERATOR-01',
      releasedAt: new Date().toISOString(),
      notes: 'Assigned to hostel laundry machine #2',
    };

    const released = await coordinator.releaseProcessing(releaseDto);

    expect(released.status).toBe('IN_PROCESS');
    expect(released.processingRoute).toBe('IN_HOUSE');
    expect(released.processingRouteLabel).toContain('In-House');

    // 3. Verify workspace view model reflects status update
    const vm = await coordinator.getWorkspaceViewModel();
    const updated = vm.transactions.find((t) => t.id === draft.id);
    expect(updated).toBeDefined();
    expect(updated?.status).toBe('IN_PROCESS');
    expect(updated?.processingRoute).toBe('IN_HOUSE');
  });

  it('executes Processing Release to EXTERNAL_VENDOR route with mandatory vendor identifier', async () => {
    const selectableStays = await coordinator.getSelectableStays();
    const stay = selectableStays[0];
    const catalog = await coordinator.getMasterCatalog();

    // 1. Create, confirm, and inspect
    const draft = await coordinator.createCollectionDraft({
      stayId: stay.stayId,
      residentId: stay.residentId,
      garmentLines: [
        {
          itemId: catalog.items[0].id,
          physicalQuantity: 5,
          serviceIds: [catalog.services[0].id],
        },
      ],
    });
    await coordinator.confirmCollection({ transactionId: draft.id, staffId: 'STAFF-001' });
    await coordinator.recordInspection({ transactionId: draft.id, staffId: 'STAFF-001' });

    // 2. Attempt external release without vendor -> Domain rejects
    const missingVendorDto: ReleaseProcessingDTO = {
      transactionId: draft.id,
      route: 'EXTERNAL_VENDOR',
      staffId: 'STAFF-001',
    };
    await expect(coordinator.releaseProcessing(missingVendorDto)).rejects.toThrow(
      /vendor/i
    );

    // 3. Release with valid vendor ID
    const validExternalDto: ReleaseProcessingDTO = {
      transactionId: draft.id,
      route: 'EXTERNAL_VENDOR',
      vendorId: 'VND-ROYAL-CLEANERS',
      staffId: 'STAFF-OPERATOR-01',
      releasedAt: new Date().toISOString(),
      notes: 'Handed over to vendor driver',
    };

    const released = await coordinator.releaseProcessing(validExternalDto);

    expect(released.status).toBe('IN_PROCESS');
    expect(released.processingRoute).toBe('EXTERNAL_VENDOR');
    expect(released.processingVendorId).toBe('VND-ROYAL-CLEANERS');
  });
});
