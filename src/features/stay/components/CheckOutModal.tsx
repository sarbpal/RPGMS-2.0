import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  Alert,
  Box,
  Divider,
} from '@mui/material';
import type { Stay } from '../domain/entities/Stay';
import type { ProcessCheckoutInput } from '../application/coordinator/StayCheckoutCoordinator';
import type { StaySummaryViewModel } from '../application/models/StayWorkspaceViewModel';

export interface CheckOutModalProps {
  open: boolean;
  stay: Stay;
  summary?: StaySummaryViewModel;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onCheckout: (input: ProcessCheckoutInput) => void;
}

export function CheckOutModal({
  open,
  stay,
  summary,
  onClose,
  onSuccess,
  onCheckout,
}: CheckOutModalProps) {
  const todayIso = new Date().toISOString().split('T')[0];

  const [actualCheckoutDate, setActualCheckoutDate] = useState(todayIso);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!actualCheckoutDate) {
      setError('Please provide an actual checkout date.');
      return;
    }
    if (actualCheckoutDate < stay.checkInDate) {
      setError(`Actual checkout date (${actualCheckoutDate}) cannot precede check-in date (${stay.checkInDate}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      onCheckout({
        stayId: stay.id,
        actualCheckoutDate,
        reason: reason.trim() || undefined,
      });
      onSuccess(`Operational Checkout completed successfully on ${actualCheckoutDate}. Physical bed released.`);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete operational checkout.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Operational Checkout</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body2" color="text.secondary">
            Complete operational departure for Stay <strong>{stay.id}</strong>. Physical accommodation beds will be released to <strong>VACANT</strong>.
          </Typography>

          {summary && (
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1.5, border: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Current Stay Summary
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {summary.bedAllocation}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Check-in: {stay.checkInDate} | Duration: {summary.occupancyDuration} | Status: {stay.status}
              </Typography>
              {stay.expectedCheckoutDate && (
                <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
                  Notice Recorded: Expected Checkout {stay.expectedCheckoutDate}
                </Typography>
              )}
            </Box>
          )}

          <Divider />

          <TextField
            label="Actual Checkout Date"
            type="date"
            value={actualCheckoutDate}
            onChange={(e) => setActualCheckoutDate(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            required
            helperText={`Check-in Date: ${stay.checkInDate}`}
          />

          <TextField
            label="Departure Reason / Notes"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. End of tenancy, job relocation, completed course"
            fullWidth
            multiline
            rows={3}
            size="small"
          />

          <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
            <strong>Note:</strong> Operational checkout releases physical occupancy. Financial settlement and deposit refund can be processed post-checkout via the Finance Workspace.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          sx={{ fontWeight: 600 }}
        >
          Confirm Checkout
        </Button>
      </DialogActions>
    </Dialog>
  );
}
