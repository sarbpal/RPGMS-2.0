import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  AlertTitle,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { Reservation } from '../domain/entities/Reservation';

interface CancelReservationModalProps {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onConfirmCancel: (id: string, reason?: string) => void;
}

export const CancelReservationModal: React.FC<CancelReservationModalProps> = ({
  open,
  onClose,
  reservation,
  onConfirmCancel,
}) => {
  const [reason, setReason] = useState('');

  if (!reservation) return null;

  const handleConfirm = () => {
    onConfirmCancel(reservation.id, reason.trim() || undefined);
    setReason('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1, color: '#dc2626' }}>
        Cancel Reservation ({reservation.reservationNumber})
      </DialogTitle>
      <DialogContent dividers>
        {/* Clear Warning Banner (Refinement #4) */}
        <Alert severity="error" icon={<WarningAmberIcon />} sx={{ mb: 2, borderRadius: 2 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Permanent Action Warning</AlertTitle>
          Cancelling this reservation will make it <strong>permanently read-only</strong> and cannot be undone.
        </Alert>

        <Typography variant="body2" sx={{ color: '#334155', mb: 2 }}>
          Prospect: <strong>{reservation.prospectName}</strong> ({reservation.mobileNumber})
        </Typography>

        <TextField
          label="Cancellation Reason (Optional)"
          placeholder="E.g., Found alternative PG, Joined another branch..."
          multiline
          rows={2}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Keep Reservation
        </Button>
        <Button onClick={handleConfirm} variant="contained" color="error" sx={{ fontWeight: 700, px: 3 }}>
          Confirm Cancellation
        </Button>
      </DialogActions>
    </Dialog>
  );
};
