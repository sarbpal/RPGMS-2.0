import React, { useState, useEffect } from 'react';
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
  Stack,
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { Reservation, TokenCancellationDisposition } from '../domain/entities/Reservation';

interface CancelReservationModalProps {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onConfirmCancel: (id: string, reason: string, tokenDisposition?: TokenCancellationDisposition) => void;
}

export const CancelReservationModal: React.FC<CancelReservationModalProps> = ({
  open,
  onClose,
  reservation,
  onConfirmCancel,
}) => {
  const [reason, setReason] = useState('');
  const [tokenDisposition, setTokenDisposition] = useState<TokenCancellationDisposition | ''>('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setReason('');
      setTokenDisposition('');
      setTouched(false);
    }
  }, [open, reservation]);

  if (!reservation) return null;

  const hasToken = typeof reservation.tokenAmount === 'number' && reservation.tokenAmount > 0;
  const isReasonValid = reason.trim().length > 0;
  const isDispositionValid = !hasToken || tokenDisposition !== '';

  const reasonError = touched && !isReasonValid ? 'Cancellation reason is required.' : '';
  const dispositionError = touched && hasToken && !tokenDisposition ? 'Please select what should happen to the token.' : '';

  const handleConfirm = () => {
    setTouched(true);
    if (!isReasonValid || !isDispositionValid) {
      return;
    }

    onConfirmCancel(
      reservation.id,
      reason.trim(),
      hasToken ? (tokenDisposition as TokenCancellationDisposition) : undefined
    );
    onClose();
  };

  const formattedToken = hasToken ? `₹${reservation.tokenAmount!.toLocaleString('en-IN')}` : '';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1, color: 'error.main' }}>
        Cancel Reservation ({reservation.reservationNumber})
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Warning Banner */}
          <Alert severity="error" icon={<WarningAmberIcon />} sx={{ borderRadius: 2 }}>
            <AlertTitle sx={{ fontWeight: 700 }}>Permanent Action Warning</AlertTitle>
            Cancelling this reservation will make it <strong>permanently read-only</strong> and cannot be undone.
          </Alert>

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Prospect: <strong>{reservation.prospectName}</strong> ({reservation.mobileNumber})
          </Typography>

          {/* Cancellation Reason */}
          <TextField
            label="Cancellation Reason"
            placeholder="E.g., Found alternative PG, Joined another branch, No-show..."
            multiline
            rows={2}
            fullWidth
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={Boolean(reasonError)}
            helperText={reasonError || 'Reason for cancelling the reservation.'}
          />

          {/* Token Disposition Section (Only if token > 0) */}
          {hasToken && (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: dispositionError ? 'error.main' : 'divider',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                Token received: {formattedToken}
              </Typography>
              <FormControl component="fieldset" error={Boolean(dispositionError)} sx={{ width: '100%', mt: 1 }}>
                <FormLabel component="legend" sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.secondary' }}>
                  Token disposition *
                </FormLabel>
                <RadioGroup
                  value={tokenDisposition}
                  onChange={(e) => setTokenDisposition(e.target.value as TokenCancellationDisposition)}
                  sx={{ mt: 0.5 }}
                >
                  <FormControlLabel
                    value="REFUND"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Refund {formattedToken}
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value="FORFEIT"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Forfeit {formattedToken}
                      </Typography>
                    }
                  />
                </RadioGroup>
                {dispositionError && (
                  <FormHelperText sx={{ fontWeight: 500 }}>{dispositionError}</FormHelperText>
                )}
              </FormControl>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Keep Reservation
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="error"
          sx={{ fontWeight: 700, px: 3 }}
        >
          Cancel Reservation
        </Button>
      </DialogActions>
    </Dialog>
  );
};
