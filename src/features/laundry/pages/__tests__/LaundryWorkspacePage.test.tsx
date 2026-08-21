import { describe, it, expect } from 'vitest';
import { LaundryWorkspacePage } from '../LaundryWorkspacePage';
import { LaundryDashboardCards } from '../../components/LaundryDashboardCards';
import { LaundryToolbar } from '../../components/LaundryToolbar';
import { LaundryTransactionTable } from '../../components/LaundryTransactionTable';
import { LaundryTransactionDetailDrawer } from '../../components/LaundryTransactionDetailDrawer';
import { CreateCollectionDraftDialog } from '../../components/dialogs/CreateCollectionDraftDialog';
import { ConfirmCollectionDialog } from '../../components/dialogs/ConfirmCollectionDialog';
import { stayWorkflowComposition } from '../../../../app/composition/stayWorkflowComposition';
import type { CreateCollectionDraftDTO, ConfirmCollectionDTO } from '../../application/dtos/laundryDTOs';

describe('L-11 — Laundry Workspace Presentation Foundation Integration Suite', () => {
  const coordinator = stayWorkflowComposition.laundryWorkspaceCoordinator;

  it('instantiates all L-11 presentation components cleanly', () => {
    expect(typeof LaundryWorkspacePage).toBe('function');
    expect(typeof LaundryDashboardCards).toBe('function');
    expect(typeof LaundryToolbar).toBe('function');
    expect(typeof LaundryTransactionTable).toBe('function');
    expect(typeof LaundryTransactionDetailDrawer).toBe('function');
    expect(typeof CreateCollectionDraftDialog).toBe('function');
    expect(typeof ConfirmCollectionDialog).toBe('function');
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

  it('loads and renders complete detail ViewModel when a transaction is selected', async () => {
    const vm = await coordinator.getWorkspaceViewModel();
    if (vm.transactions.length > 0) {
      const targetId = vm.transactions[0].id;
      const detail = await coordinator.getTransactionDetail(targetId);

      expect(detail).not.toBeNull();
      expect(detail?.id).toBe(targetId);
      expect(detail?.residentName).toBeDefined();
      expect(detail?.locationSummary).toBeDefined();
      expect(Array.isArray(detail?.garmentLines)).toBe(true);
      expect(Array.isArray(detail?.returns)).toBe(true);
      expect(Array.isArray(detail?.deliveries)).toBe(true);
      expect(Array.isArray(detail?.exceptions)).toBe(true);
      expect(Array.isArray(detail?.timeline)).toBe(true);
      expect(detail?.timeline.length).toBeGreaterThan(0);
    }
  });

  it('executes Create Collection Draft command and updates workspace ViewModel', async () => {
    const selectableStays = await coordinator.getSelectableStays();
    expect(selectableStays.length).toBeGreaterThan(0);
    const stay = selectableStays[0];

    const catalog = await coordinator.getMasterCatalog();
    expect(catalog.items.length).toBeGreaterThan(0);
    expect(catalog.services.length).toBeGreaterThan(0);

    const dto: CreateCollectionDraftDTO = {
      stayId: stay.stayId,
      residentId: stay.residentId,
      garmentLines: [
        {
          itemId: catalog.items[0].id,
          physicalQuantity: 3,
          serviceIds: [catalog.services[0].id],
          notes: 'Test presentation draft line',
        },
      ],
      notes: 'Test draft intake notes',
    };

    const created = await coordinator.createCollectionDraft(dto);

    expect(created).toBeDefined();
    expect(created.id).toMatch(/^LTX-/);
    expect(created.status).toBe('DRAFT');
    expect(created.residentName).toBe(stay.residentName);
    expect(created.totalPhysicalPieces).toBe(3);
    expect(created.garmentLines.length).toBe(1);
    expect(created.garmentLines[0].physicalQuantity).toBe(3);

    // Verify workspace query now lists this transaction
    const updatedVm = await coordinator.getWorkspaceViewModel();
    const foundInList = updatedVm.transactions.find((t) => t.id === created.id);
    expect(foundInList).toBeDefined();
    expect(foundInList?.status).toBe('DRAFT');
  });

  it('executes Confirm Collection command and captures immutable RateSnapshots', async () => {
    const selectableStays = await coordinator.getSelectableStays();
    const stay = selectableStays[0];
    const catalog = await coordinator.getMasterCatalog();

    // 1. Create draft
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

    expect(draft.status).toBe('DRAFT');

    // 2. Confirm collection
    const confirmDto: ConfirmCollectionDTO = {
      transactionId: draft.id,
      staffId: 'STAFF-PRES-001',
      bagCount: 1,
      bagTagNumbers: ['TAG-PRES-101'],
      photoUris: ['evidence://photo-test-01.jpg'],
      residentVerified: true,
      notes: 'Physical intake confirmed by presentation layer',
    };

    const confirmed = await coordinator.confirmCollection(confirmDto);

    expect(confirmed.status).toBe('COLLECTED');
    expect(confirmed.collectionEvidence).toBeDefined();
    expect(confirmed.collectionEvidence?.collectedByStaffId).toBe('STAFF-PRES-001');
    expect(confirmed.collectionEvidence?.bagCount).toBe(1);
    expect(confirmed.collectionEvidence?.bagTagNumbers).toContain('TAG-PRES-101');
    expect(confirmed.collectionEvidence?.residentVerified).toBe(true);

    // Verify rate snapshots were locked
    expect(confirmed.garmentLines[0].serviceAllocations[0].isRateCaptured).toBe(true);
    expect(confirmed.garmentLines[0].serviceAllocations[0].unitRate).toBeGreaterThan(0);
  });
});
