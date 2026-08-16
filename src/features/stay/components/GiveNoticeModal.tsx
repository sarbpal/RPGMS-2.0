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
} from '@mui/material';
import type { Stay } from '../domain/entities/Stay';
import type { GiveNoticeInput } from '../application/coordinator/StayNoticeCoordinator';

export interface GiveNoticeModalProps {
  open: boolean;
  stay: Stay;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onGiveNotice: (input: GiveNoticeInput) => void;
}

export function GiveNoticeModal({
  open,
  stay,
  onClose,
  onSuccess,
  onGiveNotice,
}: GiveNoticeModalProps) {
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];
  const defaultCheckout = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [noticeDate, setNoticeDate] = useState(todayIso);
  const [expectedCheckoutDate, setExpectedCheckoutDate] = useState(defaultCheckout);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!noticeDate) {
      setError('Please provide a notice date.');
      return;
    }
    if (!expectedCheckoutDate) {
      setError('Please provide the expected checkout date.');
      return;
    }
    if (expectedCheckoutDate < noticeDate) {
      setError('Expected checkout date cannot be earlier than notice date.');
      return;
    }

    try {
      setError(null);
      onGiveNotice({
        stayId: stay.id,
        noticeDate,
        expectedCheckoutDate,
        reason: reason.trim() || undefined,
      });
      onSuccess(`Stay placed on notice until ${expectedCheckoutDate}.`);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record notice.';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Record Vacating Notice</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body2" color="text.secondary">
            Place stay <strong>{stay.id}</strong> on notice. The stay status will transition to <strong>ON_NOTICE</strong>.
          </Typography>

          <TextField
            label="Notice Date"
            type="date"
            value={noticeDate}
            onChange={(e) => setNoticeDate(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            required
          />

          <TextField
            label="Expected Checkout Date"
            type="date"
            value={expectedCheckoutDate}
            onChange={(e) => setExpectedCheckoutDate(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="Default notice period is 30 days"
            required
          />

          <TextField
            label="Reason for Vacating"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            placeholder="Optional reason provided by resident"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="warning">
          Record Notice
        </Button>
      </DialogActions>
    </Dialog>
  );
}
