import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import type { BillingRunDetailViewModel } from '../application/models/BillingWorkspaceViewModel';

interface RunDetailsModalProps {
  readonly open: boolean;
  readonly runDetails: BillingRunDetailViewModel | null;
  readonly onClose: () => void;
}

export function RunDetailsModal({ open, runDetails, onClose }: RunDetailsModalProps) {
  if (!runDetails) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'success';
      case 'PARTIALLY_COMPLETED':
      case 'STOPPING':
        return 'warning';
      case 'FAILED':
      case 'CLAIM_FAILED':
        return 'error';
      case 'RECOVERY_REQUIRED':
        return 'error';
      case 'PROCESSING':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Billing Run Details</span>
        <Chip label={runDetails.status} color={getStatusColor(runDetails.status)} sx={{ fontWeight: 600 }} />
      </DialogTitle>

      <DialogContent dividers>
        {/* Metadata summary */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Run ID</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>{runDetails.id}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Billing Period</Typography>
            <Typography variant="body1">{runDetails.periodStart} to {runDetails.periodEnd}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Total Billed</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
              ₹{runDetails.totalAmount.toLocaleString('en-IN')}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Operator</Typography>
            <Typography variant="body1">{runDetails.operatorId}</Typography>
          </Grid>
        </Grid>

        {/* Retry Lineage Badge (Read-only) */}
        {runDetails.retryOfRunId && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This run is an immutable <strong>Retry of Run: {runDetails.retryOfRunId}</strong>.
          </Alert>
        )}

        {/* Recovery Warning (Read-only indication) */}
        {runDetails.recoveryRequiredOperationsCount > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>{runDetails.recoveryRequiredOperationsCount} operation(s) require human recovery investigation.</strong> Automatic retries are blocked until financial commitment is established.
          </Alert>
        )}

        {/* Operations Breakdown */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Operations by Stay ({runDetails.operations.length})
        </Typography>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell>Stay ID</TableCell>
                <TableCell>Resident</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Finance Bill Reference</TableCell>
                <TableCell>Outcome Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {runDetails.operations.map((op) => (
                <TableRow key={op.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{op.stayId}</TableCell>
                  <TableCell>{op.residentName} ({op.residentCode})</TableCell>
                  <TableCell align="center">
                    <Chip label={op.status} size="small" color={getStatusColor(op.status)} variant="outlined" />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    ₹{op.totalAmount.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    {op.financialBillId ? (
                      <Chip label={op.financialBillId} size="small" color="primary" variant="filled" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {op.failureReason ? (
                      <Typography variant="caption" color="error.main">{op.failureReason}</Typography>
                    ) : op.recoveryNotes ? (
                      <Typography variant="caption" color="warning.main">{op.recoveryNotes}</Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">Success</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
