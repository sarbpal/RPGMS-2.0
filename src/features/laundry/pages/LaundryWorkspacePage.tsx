import {
  Container,
  Stack,
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LocalLaundryService, Add } from '@mui/icons-material';
import { useLaundryWorkspace } from '../hooks/useLaundryWorkspace';
import { LaundryDashboardCards } from '../components/LaundryDashboardCards';
import { LaundryToolbar } from '../components/LaundryToolbar';
import { LaundryTransactionTable } from '../components/LaundryTransactionTable';
import { LaundryTransactionDetailDrawer } from '../components/LaundryTransactionDetailDrawer';
import { CreateCollectionDraftDialog } from '../components/dialogs/CreateCollectionDraftDialog';
import { ConfirmCollectionDialog } from '../components/dialogs/ConfirmCollectionDialog';
import { RecordInspectionDialog } from '../components/dialogs/RecordInspectionDialog';
import { ReleaseProcessingDialog } from '../components/dialogs/ReleaseProcessingDialog';
import { RecordReturnDialog } from '../components/dialogs/RecordReturnDialog';
import { RecordDeliveryDialog } from '../components/dialogs/RecordDeliveryDialog';
import { RaiseExceptionDialog } from '../components/dialogs/RaiseExceptionDialog';
import { RecordInvestigationDialog } from '../components/dialogs/RecordInvestigationDialog';
import { ResolveExceptionDialog } from '../components/dialogs/ResolveExceptionDialog';
import { PostChargesDialog } from '../components/dialogs/PostChargesDialog';

export function LaundryWorkspacePage() {
  const {
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
  } = useLaundryWorkspace();

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 6 }}>
      <Stack spacing={3}>
        {/* 1. Page Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
          }}
        >
          <Box>
            <Typography
              variant="h4"
              color="text.primary"
              sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <LocalLaundryService color="primary" fontSize="large" /> Laundry Operations Workspace
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Operational tracking of resident laundry collection, garment processing, delivery handovers, and commercial chargeability.
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={openCreateDraftDialog}
            sx={{ fontWeight: 700, textTransform: 'none', px: 2.5 }}
          >
            New Collection Draft
          </Button>
        </Stack>

        {/* 2. Operational Dashboard Metrics */}
        <LaundryDashboardCards
          metrics={viewModel?.metrics}
          filters={filters}
          onSelectMetric={setMetricFilter}
        />

        {/* 3. Search & Operational Filter Toolbar */}
        <LaundryToolbar
          filters={filters}
          onSearchChange={setSearchQuery}
          onStatusChange={setStatusFilter}
          onHasExceptionsChange={setHasExceptionsFilter}
          onResetFilters={resetFilters}
        />

        {/* 4. Transactions List / Table */}
        {isLoading && !viewModel ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <LaundryTransactionTable
            transactions={viewModel?.transactions || []}
            selectedTransactionId={selectedTransactionId}
            onSelectTransaction={selectTransaction}
            onConfirmCollection={openConfirmCollectionDialog}
            onRecordInspection={openRecordInspectionDialog}
            onReleaseProcessing={openReleaseProcessingDialog}
            onRecordReturn={openRecordReturnDialog}
            onRecordDelivery={openRecordDeliveryDialog}
            onOpenCreateDraft={openCreateDraftDialog}
          />
        )}

        {/* 5. Detailed Transaction Inspector Drawer */}
        <LaundryTransactionDetailDrawer
          open={Boolean(selectedTransactionId)}
          detail={selectedDetail}
          isLoading={isDetailLoading}
          onClose={() => selectTransaction(null)}
          onConfirmCollection={(detail) => {
            const summary = viewModel?.transactions.find((t) => t.id === detail.id);
            if (summary) {
              openConfirmCollectionDialog(summary);
            }
          }}
          onRecordInspection={openRecordInspectionDialog}
          onReleaseProcessing={openReleaseProcessingDialog}
          onRecordReturn={openRecordReturnDialog}
          onRecordDelivery={openRecordDeliveryDialog}
          onRaiseException={openRaiseExceptionDialog}
          onRecordInvestigation={openRecordInvestigationDialog}
          onResolveException={openResolveExceptionDialog}
          onPostCharges={openPostChargesDialog}
        />

        {/* 6. Command Dialog — Create Collection Draft */}
        <CreateCollectionDraftDialog
          open={activeDialog === 'CREATE_DRAFT'}
          selectableStays={selectableStays}
          masterCatalog={masterCatalog}
          onClose={closeDialogs}
          onSubmit={handleCreateDraftSubmit}
        />

        {/* 7. Command Dialog — Confirm Collection */}
        <ConfirmCollectionDialog
          open={activeDialog === 'CONFIRM_COLLECTION'}
          transaction={targetTransaction}
          onClose={closeDialogs}
          onSubmit={handleConfirmCollectionSubmit}
        />

        {/* 8. Command Dialog — Pre-Processing Inspection */}
        <RecordInspectionDialog
          open={activeDialog === 'RECORD_INSPECTION'}
          detail={selectedDetail}
          onClose={closeDialogs}
          onSubmit={handleRecordInspectionSubmit}
        />

        {/* 9. Command Dialog — Route & Release Processing */}
        <ReleaseProcessingDialog
          open={activeDialog === 'RELEASE_PROCESSING'}
          detail={selectedDetail}
          onClose={closeDialogs}
          onSubmit={handleReleaseProcessingSubmit}
        />

        {/* 10. Command Dialog — Record Return from Processing */}
        <RecordReturnDialog
          open={activeDialog === 'RECORD_RETURN'}
          detail={selectedDetail}
          onClose={closeDialogs}
          onSubmit={handleRecordReturnSubmit}
        />

        {/* 11. Command Dialog — Record Resident Delivery Handover */}
        <RecordDeliveryDialog
          open={activeDialog === 'RECORD_DELIVERY'}
          detail={selectedDetail}
          onClose={closeDialogs}
          onSubmit={handleRecordDeliverySubmit}
        />

        {/* 12. Command Dialog — Raise Operational Exception */}
        <RaiseExceptionDialog
          open={activeDialog === 'RAISE_EXCEPTION'}
          detail={selectedDetail}
          onClose={closeDialogs}
          onSubmit={handleRaiseExceptionSubmit}
        />

        {/* 13. Command Dialog — Record Exception Investigation */}
        <RecordInvestigationDialog
          open={activeDialog === 'RECORD_INVESTIGATION'}
          detail={selectedDetail}
          exception={targetException}
          onClose={closeDialogs}
          onSubmit={handleRecordInvestigationSubmit}
        />

        {/* 14. Command Dialog — Resolve Operational Exception */}
        <ResolveExceptionDialog
          open={activeDialog === 'RESOLVE_EXCEPTION'}
          detail={selectedDetail}
          exception={targetException}
          onClose={closeDialogs}
          onSubmit={handleResolveExceptionSubmit}
        />

        {/* 15. Command Dialog — Post Charges to Finance */}
        <PostChargesDialog
          open={activeDialog === 'POST_CHARGES'}
          detail={selectedDetail}
          onClose={closeDialogs}
          onSubmit={handlePostChargesSubmit}
        />

        {/* 10. Global Feedback Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Stack>
    </Container>
  );
}

export default LaundryWorkspacePage;
