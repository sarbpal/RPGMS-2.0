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
import type { TransferBedInput } from '../application/coordinator/StayAccommodationCoordinator';

export interface TransferBedModalProps {
  open: boolean;
  stay: Stay;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onTransferBed: (input: TransferBedInput) => void;
}

export function TransferBedModal({
  open,
  stay,
  onClose,
  onSuccess,
  onTransferBed,
}: TransferBedModalProps) {
  const currentBedId = stay.activeBedAllocations[0]?.bedId || stay.allocatedBedIds[0] || '';
  const todayIso = new Date().toISOString().split('T')[0];

  const [fromBedId, setFromBedId] = useState(currentBedId);
  const [toBedId, setToBedId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(todayIso);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!toBedId.trim()) {
      setError('Please provide the destination Bed ID.');
      return;
    }
    if (toBedId.trim() === fromBedId) {
      setError('Destination Bed must be different from current Bed.');
      return;
    }

    try {
      setError(null);
      onTransferBed({
        stayId: stay.id,
        fromBedId: fromBedId.trim(),
        toBedId: toBedId.trim(),
        effectiveDate,
        reason: reason.trim() || undefined,
      });
      onSuccess(`Bed successfully transferred from ${fromBedId} to ${toBedId}.`);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to transfer bed.';
      setError(message);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Transfer Bed</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Typography variant="body2" color="text.secondary">
            Move resident to a different bed within Flat {stay.flatId}.
          </Typography>

          <TextField
            label="Current Bed ID"
            value={fromBedId}
            onChange={(e) => setFromBedId(e.target.value)}
            fullWidth
            size="small"
            helperText="Current active bed allocation for this stay"
          />

          <TextField
            label="Destination Bed ID"
            value={toBedId}
            onChange={(e) => setToBedId(e.target.value)}
            fullWidth
            size="small"
            placeholder="e.g. BED-102-B"
            required
          />

          <TextField
            label="Effective Date"
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Transfer Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            placeholder="Optional reason for bed transfer"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained">
          Confirm Transfer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
