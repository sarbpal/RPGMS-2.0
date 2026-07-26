import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LocalLaundryService } from '@mui/icons-material';

import type { Resident } from '../../residents/types';
import type { Flat } from '../../accommodation/types';
import type { StayBalance } from '../domain';
import { billingService } from '../services/billingService';
import { formatCurrency } from '../utils/currencyFormatters';

export interface AddLaundryModalProps {
  open: boolean;
  onClose: () => void;
  resident: Resident;
  selectedFlat?: Flat | null;
  stayId?: string;
  balances: StayBalance;
  onSuccess: (message: string) => void;
}

const PRESET_DESCRIPTIONS = [
  'Weekly Laundry',
  'Extra Laundry',
  'Blanket Washing',
  'Uniform Washing',
];

export function AddLaundryModal({
  open,
  onClose,
  resident,
  selectedFlat,
  stayId,
  balances,
  onSuccess,
}: AddLaundryModalProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Form states
  const [amountStr, setAmountStr] = useState<string>('');
  const [chargeDate, setChargeDate] = useState<string>(todayStr);
  const [description, setDescription] = useState<string>('Weekly Laundry');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bedLabel = useMemo(() => {
    if (!resident.allocatedBedIds || resident.allocatedBedIds.length === 0) {
      return 'No Bed Allocated';
    }
    return resident.allocatedBedIds
      .map((bId) => {
        const match = bId.match(/[^-]+$/);
        return match ? match[0] : bId;
      })
      .join(', ');
  }, [resident.allocatedBedIds]);

  const parsedAmount = parseFloat(amountStr);
  const numericAmount = isNaN(parsedAmount) ? 0 : parsedAmount;

  const isAmountZeroOrNegative = numericAmount <= 0;
  const isFormValid = Boolean(stayId) && !isAmountZeroOrNegative;

  const handleSubmit = () => {
    if (!stayId || !isFormValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = billingService.generateLaundryChargeBill(
        stayId,
        numericAmount,
        chargeDate,
        description.trim() || undefined,
        remarks.trim() || undefined
      );

      if (result.success && result.bill) {
        onSuccess(
          `Laundry Charge Added Successfully! Amount: ${formatCurrency(
            result.bill.totalAmount
          )} | Invoice #${result.bill.billNumber} | Resident: ${resident.fullName}`
        );
        onClose();
      } else {
        setErrorMessage(
          result.errors.length > 0
            ? result.errors.join(', ')
            : 'Failed to add laundry charge.'
        );
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1 } },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <LocalLaundryService color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Add Laundry Charge
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Post an ancillary laundry service bill to the resident ledger and balance.
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ my: 1 }}>
        <Stack spacing={2.5}>
          {/* Target Resident & Account Summary */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}
            >
              Resident Context Details
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Resident Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {resident.fullName} ({resident.residentCode})
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Stay ID
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                  {stayId || 'No active stay'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Flat & Bed
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedFlat ? `Flat ${selectedFlat.name}` : 'No Flat'} • Bed {bedLabel}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Current Outstanding Balance
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: balances.receivableBalance > 0 ? 'error.main' : 'success.main',
                  }}
                >
                  {formatCurrency(balances.receivableBalance)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Error Alert */}
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {/* No Active Stay Alert */}
          {!stayId && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              No active stay record found for {resident.fullName}. Cannot post laundry charge.
            </Alert>
          )}

          {/* Form Inputs */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Charge Amount (₹) *"
                type="number"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setErrorMessage(null);
                }}
                fullWidth
                disabled={isSubmitting || !stayId}
                error={isAmountZeroOrNegative && amountStr !== ''}
                helperText={
                  isAmountZeroOrNegative && amountStr !== ''
                    ? 'Charge amount must be greater than zero'
                    : 'Enter laundry fee amount'
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Charge Date *"
                type="date"
                value={chargeDate}
                onChange={(e) => setChargeDate(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={isSubmitting || !stayId}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                disabled={isSubmitting || !stayId}
                placeholder="e.g. Weekly Laundry / Blanket Washing"
              />

              {/* Preset Description Chips */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {PRESET_DESCRIPTIONS.map((preset) => (
                  <Chip
                    key={preset}
                    label={preset}
                    size="small"
                    variant={description === preset ? 'filled' : 'outlined'}
                    color={description === preset ? 'primary' : 'default'}
                    onClick={() => setDescription(preset)}
                    disabled={isSubmitting || !stayId}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Optional Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                fullWidth
                disabled={isSubmitting || !stayId}
                placeholder="e.g. Special steam press / express service"
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} disabled={isSubmitting} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!isFormValid || isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <LocalLaundryService />
            )
          }
        >
          {isSubmitting ? 'Posting Charge...' : 'Add Laundry Charge'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
