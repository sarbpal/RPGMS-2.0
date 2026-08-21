import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Typography,
  Paper,
  Alert,
  Divider,
  CircularProgress,
  Box,
  Chip,
} from '@mui/material';
import { WarningAmber, Cancel } from '@mui/icons-material';
import type { LaundryTransactionDetailViewModel } from '../../application/models/LaundryWorkspaceViewModel';
import type { CancelCollectionDTO } from '../../application/dtos/laundryDTOs';

interface CancelCollectionDialogProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  onClose: () => void;
  onSubmit: (dto: CancelCollectionDTO) => Promise<any>;
}

export function CancelCollectionDialog({
  open,
  detail,
  onClose,
  onSubmit,
}: CancelCollectionDialogProps) {
  const [staffId, setStaffId] = useState<string>('STAFF-001');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStaffId('STAFF-001');
      setReason('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  if (!detail) {
    return null;
  }

  const handleSubmit = async () => {
    if (!staffId.trim()) {
      setError('Authorizing Staff ID is required to cancel collection.');
      return;
    }
    if (!reason.trim()) {
      setError('A cancellation reason is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        transactionId: detail.id,
        staffId: staffId.trim(),
        reason: reason.trim(),
        cancelledAt: new Date().toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel collection.');
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <Cancel color="error" /> Cancel Laundry Collection
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* 1. Transaction Context Summary Card */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Stack spacing={1}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Order {detail.id}
                </Typography>
                <Chip
                  label={detail.statusLabel}
                  size="small"
                  color={detail.status === 'COLLECTED' ? 'info' : 'default'}
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Divider />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Resident
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {detail.residentName} ({detail.residentCode})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {detail.locationSummary}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Physical Pieces
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {detail.totalPhysicalPieces} piece(s)
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Paper>

          {/* 2. Warning Banner */}
          <Alert severity="warning" icon={<WarningAmber fontSize="inherit" />}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Pre-Release Cancellation Notice (Section 15):
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              • The physical laundry items must be handed back to the resident immediately.
              <br />
              • Cancellation is permanent and non-reversible. The transaction will be marked as Cancelled in the historical audit log.
            </Typography>
          </Alert>

          {/* 3. Authorizing Staff ID Input */}
          <TextField
            label="Authorizing Staff ID"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            disabled={isSubmitting}
            required
            fullWidth
            size="small"
            helperText="Staff member recording the physical return of laundry to resident"
          />

          {/* 4. Cancellation Reason Input */}
          <TextField
            label="Cancellation Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isSubmitting}
            required
            fullWidth
            multiline
            rows={3}
            size="small"
            placeholder="e.g. Resident requested clothes back before processing release / duplicate intake draft created..."
            helperText="State the operational reason for cancellation"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Close
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !staffId.trim() || !reason.trim()}
          variant="contained"
          color="error"
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <Cancel />}
          sx={{ fontWeight: 700, textTransform: 'none' }}
        >
          {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
