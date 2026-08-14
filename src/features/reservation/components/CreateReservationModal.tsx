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
  Box,
  Typography,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { Reservation } from '../domain/entities/Reservation';
import type { ReservationDraft } from '../application/models/ReservationDraft';
import { validateReservationDraft } from '../domain/rules/reservationRules';

interface CreateReservationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (draft: ReservationDraft, reservationToEdit?: Reservation) => void;
  onCheckDuplicate: (mobileNumber: string) => {
    hasDuplicate: boolean;
    existingReservation?: Reservation;
    warning?: string;
  };
  onOpenExisting: (existingReservation: Reservation) => void;
  reservationToEdit?: Reservation | null;
}

export const CreateReservationModal: React.FC<CreateReservationModalProps> = ({
  open,
  onClose,
  onSave,
  onCheckDuplicate,
  onOpenExisting,
  reservationToEdit,
}) => {
  const [prospectName, setProspectName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [expectedJoiningDate, setExpectedJoiningDate] = useState('');
  const [accommodationPreference, setAccommodationPreference] = useState('');
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [tokenReceivedOn, setTokenReceivedOn] = useState('');
  const [tokenRemarks, setTokenRemarks] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<{ prospectName?: string; mobileNumber?: string; expectedJoiningDate?: string }>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [existingReservation, setExistingReservation] = useState<Reservation | null>(null);
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);

  useEffect(() => {
    if (reservationToEdit) {
      setProspectName(reservationToEdit.prospectName);
      setMobileNumber(reservationToEdit.mobileNumber);
      setExpectedJoiningDate(reservationToEdit.expectedJoiningDate);
      setAccommodationPreference(reservationToEdit.accommodationPreference || '');
      setTokenAmount(reservationToEdit.tokenAmount !== undefined ? String(reservationToEdit.tokenAmount) : '');
      setTokenReceivedOn(reservationToEdit.tokenReceivedOn || '');
      setTokenRemarks(reservationToEdit.tokenRemarks || '');
      setNotes(reservationToEdit.notes || '');
      setDuplicateWarning(null);
      setExistingReservation(null);
    } else {
      setProspectName('');
      setMobileNumber('');
      setExpectedJoiningDate(new Date().toISOString().split('T')[0]);
      setAccommodationPreference('');
      setTokenAmount('');
      setTokenReceivedOn(new Date().toISOString().split('T')[0]);
      setTokenRemarks('');
      setNotes('');
      setErrors({});
      setDuplicateWarning(null);
      setExistingReservation(null);
      setOverrideDuplicate(false);
    }
  }, [reservationToEdit, open]);

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMobileNumber(val);
    setOverrideDuplicate(false);

    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length === 10 && !reservationToEdit) {
      const check = onCheckDuplicate(cleaned);
      if (check.hasDuplicate && check.warning && check.existingReservation) {
        setDuplicateWarning(check.warning);
        setExistingReservation(check.existingReservation);
      } else {
        setDuplicateWarning(null);
        setExistingReservation(null);
      }
    } else {
      setDuplicateWarning(null);
      setExistingReservation(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateReservationDraft(prospectName, mobileNumber, expectedJoiningDate);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const draft: ReservationDraft = {
      id: reservationToEdit?.id,
      prospectName: prospectName.trim(),
      mobileNumber: mobileNumber.trim().replace(/\D/g, ''),
      expectedJoiningDate,
      accommodationPreference: accommodationPreference.trim() || undefined,
      tokenAmount: tokenAmount !== '' ? Number(tokenAmount) : undefined,
      tokenReceivedOn: tokenReceivedOn || undefined,
      tokenRemarks: tokenRemarks.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(draft, reservationToEdit || undefined);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {reservationToEdit ? `Edit Reservation (${reservationToEdit.reservationNumber})` : 'New Reservation (< 1 min Entry)'}
        </DialogTitle>
        <DialogContent dividers>
          {duplicateWarning && !overrideDuplicate && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{ mb: 3, borderRadius: 2 }}
              action={
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {existingReservation && (
                    <Button
                      size="small"
                      variant="contained"
                      color="warning"
                      onClick={() => {
                        onClose();
                        onOpenExisting(existingReservation);
                      }}
                    >
                      Open Existing
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    color="warning"
                    onClick={() => setOverrideDuplicate(true)}
                  >
                    Create Anyway
                  </Button>
                </Box>
              }
            >
              <AlertTitle sx={{ fontWeight: 700 }}>Duplicate Mobile Number Warning</AlertTitle>
              {duplicateWarning}
            </Alert>
          )}

          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
            Required Prospect Details
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <TextField
              label="Prospect Name *"
              fullWidth
              value={prospectName}
              onChange={(e) => setProspectName(e.target.value)}
              error={Boolean(errors.prospectName)}
              helperText={errors.prospectName}
              slotProps={{
                input: {
                  startAdornment: <PersonIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} />,
                },
              }}
            />

            <TextField
              label="Mobile Number *"
              fullWidth
              value={mobileNumber}
              onChange={handleMobileChange}
              error={Boolean(errors.mobileNumber)}
              helperText={errors.mobileNumber}
              slotProps={{
                htmlInput: { maxLength: 10 },
                input: {
                  startAdornment: <LocalPhoneIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} />,
                },
              }}
            />

            <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
              <TextField
                label="Expected Joining Date *"
                type="date"
                fullWidth
                value={expectedJoiningDate}
                onChange={(e) => setExpectedJoiningDate(e.target.value)}
                error={Boolean(errors.expectedJoiningDate)}
                helperText={errors.expectedJoiningDate}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    startAdornment: <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} />,
                  },
                }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', mb: 1.5, display: 'block' }}>
            Optional Preferences & Token Details
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                label="Accommodation Preference"
                placeholder="E.g., Double Sharing, 1st Floor, Near Window"
                fullWidth
                value={accommodationPreference}
                onChange={(e) => setAccommodationPreference(e.target.value)}
              />
            </Box>

            <TextField
              label="Token Amount (₹)"
              type="number"
              fullWidth
              placeholder="0 if waived"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
            />

            <TextField
              label="Token Received Date"
              type="date"
              fullWidth
              value={tokenReceivedOn}
              onChange={(e) => setTokenReceivedOn(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                label="Token Remarks"
                placeholder="E.g., Received via GPay / Cash"
                fullWidth
                value={tokenRemarks}
                onChange={(e) => setTokenRemarks(e.target.value)}
              />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                label="Notes / Remarks"
                multiline
                rows={2}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" sx={{ fontWeight: 700, px: 3 }}>
            {reservationToEdit ? 'Save Changes' : 'Create Reservation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
