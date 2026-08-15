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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import NotesIcon from '@mui/icons-material/Notes';
import type { Reservation } from '../domain/entities/Reservation';
import type { ReservationDraft } from '../application/models/ReservationDraft';
import { normalizeProspectName, validateReservationDraft } from '../domain/rules/reservationRules';

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
  const [expectedMonthlyRent, setExpectedMonthlyRent] = useState<string>('');
  const [expectedSecurityDeposit, setExpectedSecurityDeposit] = useState<string>('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<{ prospectName?: string; mobileNumber?: string; expectedJoiningDate?: string }>({});
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [existingReservation, setExistingReservation] = useState<Reservation | null>(null);
  const [overrideDuplicate, setOverrideDuplicate] = useState(false);

  useEffect(() => {
    if (reservationToEdit) {
      setProspectName(reservationToEdit.prospectName || '');
      setMobileNumber(reservationToEdit.mobileNumber || '');
      setExpectedJoiningDate(reservationToEdit.expectedJoiningDate || '');
      setAccommodationPreference(reservationToEdit.accommodationPreference || '');
      setTokenAmount(reservationToEdit.tokenAmount !== undefined ? String(reservationToEdit.tokenAmount) : '');
      setTokenReceivedOn(reservationToEdit.tokenReceivedOn || '');
      setTokenRemarks(reservationToEdit.tokenRemarks || '');
      setExpectedMonthlyRent(
        reservationToEdit.expectedMonthlyRent !== undefined ? String(reservationToEdit.expectedMonthlyRent) : ''
      );
      setExpectedSecurityDeposit(
        reservationToEdit.expectedSecurityDeposit !== undefined ? String(reservationToEdit.expectedSecurityDeposit) : ''
      );
      setNotes(reservationToEdit.notes || '');
      setDuplicateWarning(null);
      setExistingReservation(null);
      setOverrideDuplicate(false);
      setErrors({});
    } else {
      setProspectName('');
      setMobileNumber('');
      setExpectedJoiningDate(new Date().toISOString().split('T')[0]);
      setAccommodationPreference('');
      setTokenAmount('');
      setTokenReceivedOn(new Date().toISOString().split('T')[0]);
      setTokenRemarks('');
      setExpectedMonthlyRent('');
      setExpectedSecurityDeposit('');
      setNotes('');
      setErrors({});
      setDuplicateWarning(null);
      setExistingReservation(null);
      setOverrideDuplicate(false);
    }
  }, [reservationToEdit, open]);

  const handleProspectNameBlur = () => {
    if (prospectName) {
      setProspectName(normalizeProspectName(prospectName));
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMobileNumber(val);
    setOverrideDuplicate(false);

    if (errors.mobileNumber) {
      setErrors((prev) => ({ ...prev, mobileNumber: undefined }));
    }

    const trimmed = val.trim();
    if (trimmed.length === 10 && /^\d{10}$/.test(trimmed) && !reservationToEdit) {
      const check = onCheckDuplicate(trimmed);
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

    const normalizedName = normalizeProspectName(prospectName);
    const validation = validateReservationDraft(normalizedName, mobileNumber, expectedJoiningDate);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    const draft: ReservationDraft = {
      id: reservationToEdit?.id,
      prospectName: normalizedName,
      mobileNumber: mobileNumber.trim(),
      expectedJoiningDate,
      accommodationPreference: accommodationPreference.trim() || undefined,
      tokenAmount: tokenAmount !== '' && !isNaN(Number(tokenAmount)) ? Number(tokenAmount) : undefined,
      tokenReceivedOn: tokenReceivedOn || undefined,
      tokenRemarks: tokenRemarks.trim() || undefined,
      expectedMonthlyRent: expectedMonthlyRent !== '' && !isNaN(Number(expectedMonthlyRent)) ? Number(expectedMonthlyRent) : undefined,
      expectedSecurityDeposit: expectedSecurityDeposit !== '' && !isNaN(Number(expectedSecurityDeposit)) ? Number(expectedSecurityDeposit) : undefined,
      notes: notes.trim() || undefined,
    };

    onSave(draft, reservationToEdit || undefined);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: '90vh' } } }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          {reservationToEdit ? `Edit Reservation (${reservationToEdit.reservationNumber})` : 'New Reservation'}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 400 }}>
            Capture prospect details, intake timing, and commercial expectations.
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          <Stack spacing={2.5}>
            {/* Reactive Duplicate Mobile Warning */}
            {duplicateWarning && !overrideDuplicate && (
              <Alert
                severity="warning"
                icon={<WarningAmberIcon />}
                sx={{ borderRadius: 2 }}
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

            {/* 1. Prospect Identity & Contact */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 1.5,
                  display: 'block',
                }}
              >
                Prospect Identity & Contact
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Prospect Name *"
                  fullWidth
                  size="small"
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  onBlur={handleProspectNameBlur}
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
                  size="small"
                  placeholder="10-digit mobile number"
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
              </Box>
            </Box>

            <Divider />

            {/* 2. Stay Intent & Preference */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 1.5,
                  display: 'block',
                }}
              >
                Stay Intent & Preference
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Expected Joining Date *"
                  type="date"
                  fullWidth
                  size="small"
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

                <TextField
                  label="Accommodation Preference"
                  placeholder="E.g., Double Sharing, 1st Floor"
                  fullWidth
                  size="small"
                  value={accommodationPreference}
                  onChange={(e) => setAccommodationPreference(e.target.value)}
                  helperText="Advisory preference only; bed allocation occurs during Admission."
                />
              </Box>
            </Box>

            <Divider />

            {/* 3. Commercial Expectations (Optional) */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  mb: 0.5,
                  display: 'block',
                }}
              >
                Commercial Expectations (Optional)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Agreed intake terms. Financial obligations and ledger accounts are initialized during Admission.
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Token Amount (₹)"
                  type="number"
                  fullWidth
                  size="small"
                  placeholder="0 if waived"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                />

                <TextField
                  label="Token Received Date"
                  type="date"
                  fullWidth
                  size="small"
                  value={tokenReceivedOn}
                  onChange={(e) => setTokenReceivedOn(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />

                <TextField
                  label="Expected Monthly Rent (₹)"
                  type="number"
                  fullWidth
                  size="small"
                  placeholder="E.g., 12000"
                  value={expectedMonthlyRent}
                  onChange={(e) => setExpectedMonthlyRent(e.target.value)}
                />

                <TextField
                  label="Expected Security Deposit (₹)"
                  type="number"
                  fullWidth
                  size="small"
                  placeholder="E.g., 24000"
                  value={expectedSecurityDeposit}
                  onChange={(e) => setExpectedSecurityDeposit(e.target.value)}
                />

                <Box sx={{ gridColumn: '1 / -1' }}>
                  <TextField
                    label="Token Remarks"
                    placeholder="E.g., Received via GPay / Cash reference"
                    fullWidth
                    size="small"
                    value={tokenRemarks}
                    onChange={(e) => setTokenRemarks(e.target.value)}
                  />
                </Box>
              </Box>
            </Box>

            {/* 4. Progressive Disclosure: Additional Information */}
            <Accordion
              elevation={0}
              disableGutters
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                '&::before': { display: 'none' },
                '&.Mui-expanded': { borderRadius: 2 },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{ minHeight: 44, px: 2 }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <NotesIcon fontSize="small" color="action" />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Additional Notes & Special Requests
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
                <TextField
                  label="Notes / Special Requests"
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  placeholder="Enter any special requests, diet preferences, or intake notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </AccordionDetails>
            </Accordion>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" sx={{ fontWeight: 700, px: 3, borderRadius: 1.5 }}>
            {reservationToEdit ? 'Save Changes' : 'Create Reservation'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
