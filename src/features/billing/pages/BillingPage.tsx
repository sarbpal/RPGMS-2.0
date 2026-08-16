import {
  Box,
  Typography,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import { AddCircleOutlined, RefreshOutlined } from '@mui/icons-material';
import { useBillingWorkspace } from '../hooks/useBillingWorkspace';
import { BillingSummaryCards } from '../components/BillingSummaryCards';
import { ActiveRunBanner } from '../components/ActiveRunBanner';
import { BillingRunsTable } from '../components/BillingRunsTable';
import { CreateRunModal } from '../components/CreateRunModal';
import { PreviewConfirmationModal } from '../components/PreviewConfirmationModal';
import { RunDetailsModal } from '../components/RunDetailsModal';

export function BillingPage() {
  const {
    summary,
    preview,
    selectedRunDetails,
    isLoading,
    isSubmitting,
    error,
    successMessage,
    isCreateModalOpen,
    isPreviewModalOpen,
    isDetailsModalOpen,
    refreshSummary,
    openCreateModal,
    closeCreateModal,
    closePreviewModal,
    openDetailsModal,
    closeDetailsModal,
    generatePreview,
    revalidatePreview,
    confirmAndStartRun,
    requestStop,
    clearMessages,
  } = useBillingWorkspace();

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* 1. Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Billing Workspace
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supervise billing cycles, inspect previews, execute runs, and audit financial dispatch
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Workspace">
            <IconButton onClick={refreshSummary} disabled={isLoading}>
              <RefreshOutlined />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlined />}
            onClick={openCreateModal}
            disabled={summary?.activeRun !== null && (summary?.activeRun?.status === 'PROCESSING' || summary?.activeRun?.status === 'STOPPING')}
            sx={{ fontWeight: 600 }}
          >
            New Billing Run
          </Button>
        </Box>
      </Box>

      {/* 2. Feedback Snackbars */}
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={clearMessages}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={clearMessages} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={clearMessages}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={clearMessages} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* 3. Active Run Banner (when in processing or stopping) */}
      <ActiveRunBanner
        activeRun={summary?.activeRun || null}
        isSubmitting={isSubmitting}
        onStop={requestStop}
      />

      {/* 4. KPI Summary Cards */}
      <BillingSummaryCards summary={summary} />

      {/* 5. Historical Billing Runs */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
          Billing Runs History
        </Typography>
        <BillingRunsTable
          runs={summary?.recentRuns || []}
          onViewDetails={openDetailsModal}
          onCreateFirstRun={openCreateModal}
        />
      </Box>

      {/* 6. Modals */}
      <CreateRunModal
        open={isCreateModalOpen}
        isSubmitting={isSubmitting}
        onClose={closeCreateModal}
        onGeneratePreview={generatePreview}
      />

      <PreviewConfirmationModal
        open={isPreviewModalOpen}
        preview={preview}
        isSubmitting={isSubmitting}
        onClose={closePreviewModal}
        onRevalidate={revalidatePreview}
        onConfirmAndStart={confirmAndStartRun}
      />

      <RunDetailsModal
        open={isDetailsModalOpen}
        runDetails={selectedRunDetails}
        onClose={closeDetailsModal}
      />
    </Box>
  );
}

export default BillingPage;
