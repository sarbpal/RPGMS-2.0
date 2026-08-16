import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Typography,
  Tooltip,
} from '@mui/material';
import { VisibilityOutlined, HistoryEduOutlined, ReplayOutlined } from '@mui/icons-material';
import type { BillingRunSummaryViewModel } from '../application/models/BillingWorkspaceViewModel';

interface BillingRunsTableProps {
  readonly runs: readonly BillingRunSummaryViewModel[];
  readonly onViewDetails: (runId: string) => void;
  readonly onOpenRetryModal?: (runId: string) => void;
  readonly onCreateFirstRun: () => void;
}

export function BillingRunsTable({
  runs,
  onViewDetails,
  onOpenRetryModal,
  onCreateFirstRun,
}: BillingRunsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PARTIALLY_COMPLETED':
      case 'STOPPING':
        return 'warning';
      case 'FAILED':
        return 'error';
      case 'PROCESSING':
        return 'primary';
      case 'CONFIRMED':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!runs || runs.length === 0) {
    return (
      <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2 }} variant="outlined">
        <HistoryEduOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
        <Typography variant="h6" gutterBottom>
          No Billing Runs Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          There are no historical or in-flight billing runs recorded yet. Generate a preview to begin a billing cycle.
        </Typography>
        <Button variant="contained" onClick={onCreateFirstRun}>
          Create First Billing Run
        </Button>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell>Run ID</TableCell>
            <TableCell>Period</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="right">Total Billed</TableCell>
            <TableCell align="center">Operations</TableCell>
            <TableCell>Operator</TableCell>
            <TableCell>Created At</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {runs.map((run) => (
            <TableRow key={run.id} hover>
              <TableCell sx={{ fontWeight: 600 }}>
                {run.id}
                {run.retryOfRunId && (
                  <Tooltip title={`Retry of original run: ${run.retryOfRunId}`} arrow>
                    <Chip
                      label="Retry"
                      size="small"
                      variant="outlined"
                      color="info"
                      sx={{ ml: 1, height: 20, cursor: 'help' }}
                    />
                  </Tooltip>
                )}
              </TableCell>
              <TableCell>{run.periodStart} → {run.periodEnd}</TableCell>
              <TableCell align="center">
                <Chip label={run.status} color={getStatusColor(run.status)} size="small" sx={{ fontWeight: 600 }} />
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: run.totalAmount > 0 ? 'success.main' : 'text.primary' }}>
                ₹{run.totalAmount.toLocaleString('en-IN')}
              </TableCell>
              <TableCell align="center">
                <Typography variant="body2">
                  <span style={{ color: '#2e7d32', fontWeight: 600 }}>{run.successfulOperationsCount} ✓</span>
                  {run.failedOperationsCount > 0 && <span style={{ color: '#d32f2f', marginLeft: 8 }}>{run.failedOperationsCount} ✗</span>}
                  {run.recoveryRequiredOperationsCount > 0 && <span style={{ color: '#ed6c02', marginLeft: 8 }}>{run.recoveryRequiredOperationsCount} ⚠</span>}
                  {run.notProcessedOperationsCount > 0 && <span style={{ color: '#757575', marginLeft: 8 }}>{run.notProcessedOperationsCount} ⏸</span>}
                </Typography>
              </TableCell>
              <TableCell>{run.operatorId}</TableCell>
              <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                {new Date(run.createdAt).toLocaleString('en-IN')}
              </TableCell>
              <TableCell align="right">
                <Button
                  size="small"
                  startIcon={<VisibilityOutlined />}
                  onClick={() => onViewDetails(run.id)}
                  sx={{ mr: onOpenRetryModal ? 0.5 : 0 }}
                >
                  Details
                </Button>
                {onOpenRetryModal &&
                  (run.status === 'PARTIALLY_COMPLETED' || run.status === 'FAILED') && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      startIcon={<ReplayOutlined />}
                      onClick={() => onOpenRetryModal(run.id)}
                    >
                      Retry
                    </Button>
                  )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
