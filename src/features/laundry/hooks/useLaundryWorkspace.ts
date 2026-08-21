import { useState, useEffect, useCallback, useMemo } from 'react';
import { stayWorkflowComposition } from '../../../app/composition/stayWorkflowComposition';
import type {
  LaundryWorkspaceViewModel,
  LaundryTransactionSummaryViewModel,
  LaundryTransactionDetailViewModel,
  SelectableLaundryStayItem,
  LaundryMasterCatalogViewModel,
  ExceptionViewModel,
  PostChargesResultViewModel,
} from '../application/models/LaundryWorkspaceViewModel';
import type {
  LaundryWorkspaceFilters,
  CreateCollectionDraftDTO,
  ConfirmCollectionDTO,
  RecordInspectionDTO,
  ReleaseProcessingDTO,
  RecordReturnDTO,
  RecordDeliveryDTO,
  RaiseExceptionDTO,
  RecordInvestigationDTO,
  ResolveExceptionDTO,
  PostChargesDTO,
} from '../application/dtos/laundryDTOs';

export type LaundryModalType =
  | 'CREATE_DRAFT'
  | 'CONFIRM_COLLECTION'
  | 'RECORD_INSPECTION'
  | 'RELEASE_PROCESSING'
  | 'RECORD_RETURN'
  | 'RECORD_DELIVERY'
  | 'RAISE_EXCEPTION'
  | 'RECORD_INVESTIGATION'
  | 'RESOLVE_EXCEPTION'
  | 'POST_CHARGES'
  | null;

export interface UseLaundryWorkspaceReturn {
  viewModel: LaundryWorkspaceViewModel | null;
  selectedTransactionId: string | null;
  selectedDetail: LaundryTransactionDetailViewModel | null;
  filters: LaundryWorkspaceFilters;
  activeDialog: LaundryModalType;
  targetTransaction: LaundryTransactionSummaryViewModel | null;
  targetException: ExceptionViewModel | null;
  selectableStays: readonly SelectableLaundryStayItem[];
  masterCatalog: LaundryMasterCatalogViewModel | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  error: string | null;
  snackbar: {
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  };

  // Filter Actions
  setSearchQuery: (searchQuery: string) => void;
  setStatusFilter: (status?: string) => void;
  setHasExceptionsFilter: (hasExceptions?: boolean) => void;
  setMetricFilter: (metricKey: string) => void;
  resetFilters: () => void;

  // Selection Actions
  selectTransaction: (id: string | null) => void;

  // Dialog Actions
  openCreateDraftDialog: () => void;
  openConfirmCollectionDialog: (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => void;
  openRecordInspectionDialog: (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => Promise<void>;
  openReleaseProcessingDialog: (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => Promise<void>;
  openRecordReturnDialog: (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => Promise<void>;
  openRecordDeliveryDialog: (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => Promise<void>;
  openRaiseExceptionDialog: (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => Promise<void>;
  openRecordInvestigationDialog: (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel, exception: ExceptionViewModel) => Promise<void>;
  openResolveExceptionDialog: (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel, exception: ExceptionViewModel) => Promise<void>;
  openPostChargesDialog: (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => Promise<void>;
  closeDialogs: () => void;

  // Command Handlers
  handleCreateDraftSubmit: (dto: CreateCollectionDraftDTO) => Promise<LaundryTransactionDetailViewModel>;
  handleConfirmCollectionSubmit: (dto: ConfirmCollectionDTO) => Promise<LaundryTransactionDetailViewModel>;
  handleRecordInspectionSubmit: (dto: RecordInspectionDTO) => Promise<LaundryTransactionDetailViewModel>;
  handleReleaseProcessingSubmit: (dto: ReleaseProcessingDTO) => Promise<LaundryTransactionDetailViewModel>;
  handleRecordReturnSubmit: (dto: RecordReturnDTO) => Promise<LaundryTransactionDetailViewModel>;
  handleRecordDeliverySubmit: (dto: RecordDeliveryDTO) => Promise<LaundryTransactionDetailViewModel>;
  handleRaiseExceptionSubmit: (dto: RaiseExceptionDTO) => Promise<LaundryTransactionDetailViewModel>;
  handleRecordInvestigationSubmit: (dto: RecordInvestigationDTO) => Promise<LaundryTransactionDetailViewModel>;
  handleResolveExceptionSubmit: (dto: ResolveExceptionDTO) => Promise<LaundryTransactionDetailViewModel>;
  handlePostChargesSubmit: (dto: PostChargesDTO) => Promise<PostChargesResultViewModel>;

  // Notification Actions
  closeSnackbar: () => void;
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'info' | 'warning') => void;

  // Lifecycle
  refresh: () => Promise<void>;
}

export function useLaundryWorkspace(): UseLaundryWorkspaceReturn {
  const coordinator = useMemo(() => stayWorkflowComposition.laundryWorkspaceCoordinator, []);

  const [viewModel, setViewModel] = useState<LaundryWorkspaceViewModel | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<LaundryTransactionDetailViewModel | null>(null);
  const [filters, setFilters] = useState<LaundryWorkspaceFilters>({});
  const [activeDialog, setActiveDialog] = useState<LaundryModalType>(null);
  const [targetTransaction, setTargetTransaction] = useState<LaundryTransactionSummaryViewModel | null>(null);
  const [targetException, setTargetException] = useState<ExceptionViewModel | null>(null);
  const [selectableStays, setSelectableStays] = useState<readonly SelectableLaundryStayItem[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<LaundryMasterCatalogViewModel | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Fetch selectable stays and master catalog for dialogs
  const loadSupportingData = useCallback(async () => {
    try {
      const [stays, catalog] = await Promise.all([
        coordinator.getSelectableStays(),
        coordinator.getMasterCatalog(),
      ]);
      setSelectableStays(stays);
      setMasterCatalog(catalog);
    } catch (err: any) {
      console.error('Failed to load supporting laundry data:', err);
    }
  }, [coordinator]);

  // Load workspace ViewModel based on current filters
  const loadWorkspace = useCallback(async (currentFilters: LaundryWorkspaceFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const vm = await coordinator.getWorkspaceViewModel(currentFilters);
      setViewModel(vm);
    } catch (err: any) {
      setError(err?.message || 'Failed to load laundry workspace');
      showSnackbar(err?.message || 'Failed to load laundry workspace', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [coordinator, showSnackbar]);

  // Load detail ViewModel when a transaction is selected
  const loadDetail = useCallback(async (id: string | null) => {
    if (!id) {
      setSelectedDetail(null);
      return;
    }
    setIsDetailLoading(true);
    try {
      const detail = await coordinator.getTransactionDetail(id);
      setSelectedDetail(detail);
    } catch (err: any) {
      showSnackbar(err?.message || `Failed to load details for transaction ${id}`, 'error');
    } finally {
      setIsDetailLoading(false);
    }
  }, [coordinator, showSnackbar]);

  // Initial load and filter change trigger
  useEffect(() => {
    loadWorkspace(filters);
    loadSupportingData();
  }, [loadWorkspace, loadSupportingData, filters]);

  // Detail load trigger
  useEffect(() => {
    loadDetail(selectedTransactionId);
  }, [loadDetail, selectedTransactionId]);

  // Public Refresh
  const refresh = useCallback(async () => {
    await Promise.all([
      loadWorkspace(filters),
      loadSupportingData(),
      selectedTransactionId ? loadDetail(selectedTransactionId) : Promise.resolve(),
    ]);
  }, [loadWorkspace, loadSupportingData, loadDetail, filters, selectedTransactionId]);

  // Filter setters
  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: searchQuery || undefined }));
  }, []);

  const setStatusFilter = useCallback((status?: string) => {
    setFilters((prev) => ({
      ...prev,
      status: status && status !== 'ALL' ? status : undefined,
      hasExceptions: undefined,
    }));
  }, []);

  const setHasExceptionsFilter = useCallback((hasExceptions?: boolean) => {
    setFilters((prev) => ({
      ...prev,
      hasExceptions: hasExceptions ? true : undefined,
      status: undefined,
    }));
  }, []);

  const setMetricFilter = useCallback((metricKey: string) => {
    switch (metricKey) {
      case 'AWAITING_CONFIRMATION':
        setStatusFilter('DRAFT');
        break;
      case 'AWAITING_INSPECTION':
        setStatusFilter('COLLECTED');
        break;
      case 'IN_PROCESS':
        setStatusFilter('IN_PROCESS');
        break;
      case 'OPEN_EXCEPTIONS':
        setHasExceptionsFilter(true);
        break;
      case 'TOTAL_ACTIVE':
      default:
        setFilters((prev) => ({ ...prev, status: undefined, hasExceptions: undefined }));
        break;
    }
  }, [setStatusFilter, setHasExceptionsFilter]);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Selection
  const selectTransaction = useCallback((id: string | null) => {
    setSelectedTransactionId(id);
  }, []);

  // Dialog management
  const openCreateDraftDialog = useCallback(() => {
    setActiveDialog('CREATE_DRAFT');
    setTargetTransaction(null);
    setTargetException(null);
  }, []);

  const openConfirmCollectionDialog = useCallback((transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => {
    setTargetTransaction(transaction as LaundryTransactionSummaryViewModel);
    setTargetException(null);
    setActiveDialog('CONFIRM_COLLECTION');
  }, []);

  const openRecordInspectionDialog = useCallback(async (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => {
    setSelectedTransactionId(transaction.id);
    setTargetException(null);
    if (!selectedDetail || selectedDetail.id !== transaction.id) {
      await loadDetail(transaction.id);
    }
    setActiveDialog('RECORD_INSPECTION');
  }, [selectedDetail, loadDetail]);

  const openReleaseProcessingDialog = useCallback(async (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => {
    setSelectedTransactionId(transaction.id);
    setTargetException(null);
    if (!selectedDetail || selectedDetail.id !== transaction.id) {
      await loadDetail(transaction.id);
    }
    setActiveDialog('RELEASE_PROCESSING');
  }, [selectedDetail, loadDetail]);

  const openRecordReturnDialog = useCallback(async (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => {
    setSelectedTransactionId(transaction.id);
    setTargetException(null);
    if (!selectedDetail || selectedDetail.id !== transaction.id) {
      await loadDetail(transaction.id);
    }
    setActiveDialog('RECORD_RETURN');
  }, [selectedDetail, loadDetail]);

  const openRecordDeliveryDialog = useCallback(async (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => {
    setSelectedTransactionId(transaction.id);
    setTargetException(null);
    if (!selectedDetail || selectedDetail.id !== transaction.id) {
      await loadDetail(transaction.id);
    }
    setActiveDialog('RECORD_DELIVERY');
  }, [selectedDetail, loadDetail]);

  const openRaiseExceptionDialog = useCallback(async (transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel) => {
    setSelectedTransactionId(transaction.id);
    setTargetException(null);
    if (!selectedDetail || selectedDetail.id !== transaction.id) {
      await loadDetail(transaction.id);
    }
    setActiveDialog('RAISE_EXCEPTION');
  }, [selectedDetail, loadDetail]);

  const openRecordInvestigationDialog = useCallback(async (
    transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel,
    exception: ExceptionViewModel
  ) => {
    setSelectedTransactionId(transaction.id);
    setTargetException(exception);
    if (!selectedDetail || selectedDetail.id !== transaction.id) {
      await loadDetail(transaction.id);
    }
    setActiveDialog('RECORD_INVESTIGATION');
  }, [selectedDetail, loadDetail]);

  const openResolveExceptionDialog = useCallback(async (
    transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel,
    exception: ExceptionViewModel
  ) => {
    setSelectedTransactionId(transaction.id);
    setTargetException(exception);
    if (!selectedDetail || selectedDetail.id !== transaction.id) {
      await loadDetail(transaction.id);
    }
    setActiveDialog('RESOLVE_EXCEPTION');
  }, [selectedDetail, loadDetail]);

  const openPostChargesDialog = useCallback(async (
    transaction: LaundryTransactionSummaryViewModel | LaundryTransactionDetailViewModel
  ) => {
    setSelectedTransactionId(transaction.id);
    setTargetException(null);
    if (!selectedDetail || selectedDetail.id !== transaction.id) {
      await loadDetail(transaction.id);
    }
    setActiveDialog('POST_CHARGES');
  }, [selectedDetail, loadDetail]);

  const closeDialogs = useCallback(() => {
    setActiveDialog(null);
    setTargetTransaction(null);
    setTargetException(null);
  }, []);

  // Command handlers
  const handleCreateDraftSubmit = useCallback(async (dto: CreateCollectionDraftDTO) => {
    try {
      const created = await coordinator.createCollectionDraft(dto);
      showSnackbar(`Collection Draft created for ${created.residentName} (${created.id})`, 'success');
      closeDialogs();
      await refresh();
      setSelectedTransactionId(created.id);
      return created;
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to create collection draft', 'error');
      throw err;
    }
  }, [coordinator, showSnackbar, closeDialogs, refresh]);

  const handleConfirmCollectionSubmit = useCallback(async (dto: ConfirmCollectionDTO) => {
    try {
      const confirmed = await coordinator.confirmCollection(dto);
      showSnackbar(`Collection confirmed for transaction ${confirmed.id}`, 'success');
      closeDialogs();
      await refresh();
      return confirmed;
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to confirm collection', 'error');
      throw err;
    }
  }, [coordinator, showSnackbar, closeDialogs, refresh]);

  const handleRecordInspectionSubmit = useCallback(async (dto: RecordInspectionDTO) => {
    try {
      const inspected = await coordinator.recordInspection(dto);
      showSnackbar(`Pre-processing inspection recorded for transaction ${inspected.id}`, 'success');
      closeDialogs();
      await refresh();
      return inspected;
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to record inspection', 'error');
      throw err;
    }
  }, [coordinator, showSnackbar, closeDialogs, refresh]);

  const handleReleaseProcessingSubmit = useCallback(async (dto: ReleaseProcessingDTO) => {
    try {
      const released = await coordinator.releaseProcessing(dto);
      showSnackbar(`Transaction ${released.id} released to ${released.processingRouteLabel || released.processingRoute}`, 'success');
      closeDialogs();
      await refresh();
      return released;
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to release processing', 'error');
      throw err;
    }
  }, [coordinator, showSnackbar, closeDialogs, refresh]);

  const handleRecordReturnSubmit = useCallback(async (dto: RecordReturnDTO) => {
    try {
      const returned = await coordinator.recordReturn(dto);
      showSnackbar(`Return recorded for transaction ${returned.id} (${returned.totalReturnedPieces} total pcs returned)`, 'success');
      closeDialogs();
      await refresh();
      return returned;
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to record return', 'error');
      throw err;
    }
  }, [coordinator, showSnackbar, closeDialogs, refresh]);

  const handleRecordDeliverySubmit = useCallback(async (dto: RecordDeliveryDTO) => {
    try {
      const delivered = await coordinator.recordDelivery(dto);
      showSnackbar(`Delivery handover recorded for transaction ${delivered.id} (${delivered.totalDeliveredPieces} total pcs delivered)`, 'success');
      closeDialogs();
      await refresh();
      return delivered;
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to record delivery', 'error');
      throw err;
    }
  }, [coordinator, showSnackbar, closeDialogs, refresh]);

  const handleRaiseExceptionSubmit = useCallback(async (dto: RaiseExceptionDTO) => {
    try {
      const updated = await coordinator.raiseException(dto);
      showSnackbar(`Operational exception raised for transaction ${updated.id}`, 'warning');
      closeDialogs();
      await refresh();
      setSelectedDetail(updated);
      return updated;
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to raise exception', 'error');
      throw err;
    }
  }, [coordinator, showSnackbar, closeDialogs, refresh]);

  const handleRecordInvestigationSubmit = useCallback(async (dto: RecordInvestigationDTO) => {
    try {
      const updated = await coordinator.recordInvestigation(dto);
      showSnackbar(`Investigation recorded for exception ${dto.exceptionId}`, 'info');
      closeDialogs();
      await refresh();
      setSelectedDetail(updated);
      return updated;
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to record investigation', 'error');
      throw err;
    }
  }, [coordinator, showSnackbar, closeDialogs, refresh]);

  const handleResolveExceptionSubmit = useCallback(async (dto: ResolveExceptionDTO) => {
    try {
      const updated = await coordinator.resolveException(dto);
      showSnackbar(`Exception ${dto.exceptionId} resolved (${dto.outcome})`, 'success');
      closeDialogs();
      await refresh();
      setSelectedDetail(updated);
      return updated;
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to resolve exception', 'error');
      throw err;
    }
  }, [coordinator, showSnackbar, closeDialogs, refresh]);

  const handlePostChargesSubmit = useCallback(async (dto: PostChargesDTO) => {
    try {
      const result = await coordinator.evaluateAndPostCharges(dto);
      if (result.success) {
        showSnackbar(`Finance posting successful: ${result.postedChargesCount} charge(s) posted (${result.totalAmountPostedFormatted})`, 'success');
      } else {
        showSnackbar(result.failureReason || 'Finance posting completed with errors', 'error');
      }
      await refresh();
      if (selectedTransactionId) {
        await loadDetail(selectedTransactionId);
      }
      return result;
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to post charges to Finance', 'error');
      throw err;
    }
  }, [coordinator, showSnackbar, refresh, selectedTransactionId, loadDetail]);

  return {
    viewModel,
    selectedTransactionId,
    selectedDetail,
    filters,
    activeDialog,
    targetTransaction,
    targetException,
    selectableStays,
    masterCatalog,
    isLoading,
    isDetailLoading,
    error,
    snackbar,
    setSearchQuery,
    setStatusFilter,
    setHasExceptionsFilter,
    setMetricFilter,
    resetFilters,
    selectTransaction,
    openCreateDraftDialog,
    openConfirmCollectionDialog,
    openRecordInspectionDialog,
    openReleaseProcessingDialog,
    openRecordReturnDialog,
    openRecordDeliveryDialog,
    openRaiseExceptionDialog,
    openRecordInvestigationDialog,
    openResolveExceptionDialog,
    openPostChargesDialog,
    closeDialogs,
    handleCreateDraftSubmit,
    handleConfirmCollectionSubmit,
    handleRecordInspectionSubmit,
    handleReleaseProcessingSubmit,
    handleRecordReturnSubmit,
    handleRecordDeliverySubmit,
    handleRaiseExceptionSubmit,
    handleRecordInvestigationSubmit,
    handleResolveExceptionSubmit,
    handlePostChargesSubmit,
    closeSnackbar,
    showSnackbar,
    refresh,
  };
}
