import { useState, useEffect } from 'react';
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
  TextField,
  CircularProgress,
  Box,
} from '@mui/material';
import { ReplayOutlined } from '@mui/icons-material';
import type {
  RetryRunScopeViewModel,
  RetryStayScopeItem,
} from '../application/models/BillingWorkspaceViewModel';

interface CreateRetryRunModalProps {
  readonly open: boolean;
  readonly originalRunId: string;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onGetRetryScope: (originalRunId: string) => Promise<RetryRunScopeViewModel>;
  readonly onCreateRetryRun: (
    originalRunId: string,
    operatorId: string,
    notes?: string
  ) => Promise<void>;
}

export function CreateRetryRunModal({
  open,
  originalRunId,
  isSubmitting,
  onClose,
  onGetRetryScope,
  onCreateRetryRun,
}: CreateRetryRunModalProps) {
  const [scope, setScope] = useState<RetryRunScopeViewModel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorId, setOperatorId] = useState<string>('OPERATOR');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (open && originalRunId) {
      setLoading(true);
      setError(null);
      onGetRetryScope(originalRunId)
        .then((s) => {
          setScope(s);
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        });
    } else {
      setScope(null);
    }
  }, [open, originalRunId, onGetRetryScope]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalRunId || !operatorId.trim() || !scope?.canCreateRetry) return;
    await onCreateRetryRun(originalRunId, operatorId.trim(), notes.trim() || undefined);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Create Retry Billing Run</span>
          <Chip label={`Original: ${originalRunId}`} size="small" variant="outlined" />
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : scope ? (
            <>
              {/* Unresolved Recovery Warning */}
              {scope.hasUnresolvedRecovery && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Retry Creation Blocked
                  </Typography>
                  {scope.blockingReason}
                </Alert>
              )}

              {/* Scope KPI Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Retry Eligible Stays
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {scope.eligibleStaysCount}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Excluded Stays
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      {scope.excludedStaysCount}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Total Stays in Original Run
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      {scope.totalStaysInOriginalRun}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Breakdown Table */}
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Stay Scope Breakdown
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ mb: 3, maxHeight: 240 }}>
                <Table size="small" stickyHeader>
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Resident / Stay</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Original Outcome</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Retry Inclusion</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Reason / Note</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scope.stays.map((s: RetryStayScopeItem) => (
                      <TableRow key={s.stayId}>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {s.residentName} ({s.stayId})
                        </TableCell>
                        <TableCell>
                          <Chip label={s.originalStatus} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={s.isEligible ? 'ELIGIBLE' : 'EXCLUDED'}
                            size="small"
                            color={s.isEligible ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                          {s.exclusionReason || 'Will be discovered and claimed afresh'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Form Inputs */}
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Operator ID"
                    fullWidth
                    required
                    value={operatorId}
                    onChange={(e) => setOperatorId(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Retry Run Notes (Optional)"
                    fullWidth
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Second attempt after resolving errors"
                  />
                </Grid>
              </Grid>
            </>
          ) : null}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<ReplayOutlined />}
            disabled={!scope?.canCreateRetry || isSubmitting || !operatorId.trim()}
          >
            {isSubmitting ? 'Generating Retry Preview...' : 'Generate Retry Preview'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
