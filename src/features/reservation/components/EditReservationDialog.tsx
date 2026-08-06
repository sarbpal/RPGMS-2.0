import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  Typography,
  Stack,
} from '@mui/material';
import type { Reservation } from '../domain/entities/Reservation';
import type { UpdateReservationDTO } from '../application/dtos/UpdateReservationDTO';
import { validateReservationDraft } from '../domain/rules/reservationRules';

interface EditReservationDialogProps {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onSave: (id: string, dto: UpdateReservationDTO) => void;
}

export const EditReservationDialog: React.FC<EditReservationDialogProps> = ({
  open,
  onClose,
  reservation,
  onSave,
}) => {
  const [prospectName, setProspectName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [expectedJoiningDate, setExpectedJoiningDate] = useState('');
  const [expectedMonthlyRent, setExpectedMonthlyRent] = useState<string>('');
  const [expectedSecurityDeposit, setExpectedSecurityDeposit] = useState<string>('');
  const [accommodationPreference, setAccommodationPreference] = useState('');
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [tokenReceivedOn, setTokenReceivedOn] = useState('');
  const [tokenRemarks, setTokenRemarks] = useState('');
  const [notes, setNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (reservation) {
      setProspectName(reservation.prospectName || '');
      setMobileNumber(reservation.mobileNumber || '');
      setExpectedJoiningDate(reservation.expectedJoiningDate || '');
      setExpectedMonthlyRent(
        reservation.expectedMonthlyRent !== undefined ? String(reservation.expectedMonthlyRent) : ''
      );
      setExpectedSecurityDeposit(
        reservation.expectedSecurityDeposit !== undefined ? String(reservation.expectedSecurityDeposit) : ''
      );
      setAccommodationPreference(reservation.accommodationPreference || '');
      setTokenAmount(reservation.tokenAmount !== undefined ? String(reservation.tokenAmount) : '');
      setTokenReceivedOn(reservation.tokenReceivedOn || '');
      setTokenRemarks(reservation.tokenRemarks || '');
      setNotes(reservation.notes || '');
      setErrorMessage(null);
    }
  }, [reservation, open]);

  if (!reservation) return null;

  const handleSave = () => {
    const validation = validateReservationDraft(prospectName, mobileNumber, expectedJoiningDate);
    if (!validation.isValid) {
      setErrorMessage(Object.values(validation.errors).join(' '));
      return;
    }

    const dto: UpdateReservationDTO = {
      prospectName: prospectName.trim(),
      mobileNumber: mobileNumber.trim(),
      expectedJoiningDate,
      expectedMonthlyRent: expectedMonthlyRent ? Number(expectedMonthlyRent) : undefined,
      expectedSecurityDeposit: expectedSecurityDeposit ? Number(expectedSecurityDeposit) : undefined,
      accommodationPreference: accommodationPreference.trim() || undefined,
      tokenAmount: tokenAmount ? Number(tokenAmount) : undefined,
      tokenReceivedOn: tokenReceivedOn || undefined,
      tokenRemarks: tokenRemarks.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(reservation.id, dto);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: '90vh' } } }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        Edit Reservation ({reservation.reservationNumber})
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700 }}>
            Prospect Identity & Contact
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Prospect Name *"
                fullWidth
                size="small"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Mobile Number *"
                fullWidth
                size="small"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="10-digit mobile number"
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, pt: 1 }}>
            Reservation Details & Preferences
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Expected Joining Date *"
                type="date"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={expectedJoiningDate}
                onChange={(e) => setExpectedJoiningDate(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Expected Monthly Rent (₹)"
                type="number"
                fullWidth
                size="small"
                value={expectedMonthlyRent}
                onChange={(e) => setExpectedMonthlyRent(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Expected Deposit (₹)"
                type="number"
                fullWidth
                size="small"
                value={expectedSecurityDeposit}
                onChange={(e) => setExpectedSecurityDeposit(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Accommodation Preference"
                placeholder="E.g. Double Sharing, 1st Floor, quiet area"
                fullWidth
                size="small"
                value={accommodationPreference}
                onChange={(e) => setAccommodationPreference(e.target.value)}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, pt: 1 }}>
            Token Information
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Token Amount (₹)"
                type="number"
                fullWidth
                size="small"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Token Received Date"
                type="date"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={tokenReceivedOn}
                onChange={(e) => setTokenReceivedOn(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Token Remarks / Mode"
                placeholder="E.g. GPay, Cash, Ref #1234"
                fullWidth
                size="small"
                value={tokenRemarks}
                onChange={(e) => setTokenRemarks(e.target.value)}
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 700, pt: 1 }}>
            Notes & Remarks
          </Typography>

          <TextField
            label="Operator Remarks"
            multiline
            rows={2}
            fullWidth
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary" sx={{ fontWeight: 700, px: 3 }}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};
