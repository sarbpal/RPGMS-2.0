import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MonetizationOn } from '@mui/icons-material';

import type { Resident } from '../../residents/types';
import type { Flat } from '../../accommodation/types';
import { billingService } from '../services/billingService';
import { formatCurrency } from '../utils/currencyFormatters';

export interface GenerateRentModalProps {
  open: boolean;
  onClose: () => void;
  resident: Resident;
  selectedFlat?: Flat | null;
  stayId?: string;
  onSuccess: (message: string) => void;
}

export function GenerateRentModal({
  open,
  onClose,
  resident,
  selectedFlat,
  stayId,
  onSuccess,
}: GenerateRentModalProps) {
  // Current month string YYYY-MM
  const defaultPeriod = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [billingPeriod, setBillingPeriod] = useState<string>(defaultPeriod);
  const [dueDate, setDueDate] = useState<string>(`${defaultPeriod}-07`);
  const [remarks, setRemarks] = useState<string>(`Monthly Rent for ${defaultPeriod}`);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Generate selectable periods (current month, past 2 months, next 2 months)
  const availablePeriods = useMemo(() => {
    const periods: string[] = [];
    const now = new Date();
    for (let offset = -2; offset <= 3; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const periodStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      periods.push(periodStr);
    }
    return Array.from(new Set(periods)).sort();
  }, []);

  // Update due date and remarks when billing period changes
  const handlePeriodChange = (newPeriod: string) => {
    setBillingPeriod(newPeriod);
    setDueDate(`${newPeriod}-07`);
    setRemarks(`Monthly Rent for ${newPeriod}`);
    setErrorMessage(null);
  };

  // Check duplicate rent bill via billingService (delegates to domain rule hasDuplicateRentBill)
  const isDuplicate = useMemo(() => {
    if (!stayId || !billingPeriod) return false;
    return billingService.checkDuplicateMonthlyRentBill(stayId, billingPeriod);
  }, [stayId, billingPeriod]);

  // Existing bill details if duplicate exists
  const existingBill = useMemo(() => {
    if (!isDuplicate || !stayId) return null;
    const bills = billingService.getBillsByStayId(stayId);
    return bills.find((b) => b.period === billingPeriod && b.billType === 'MONTHLY_RENT') || null;
  }, [isDuplicate, stayId, billingPeriod]);

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

  const isFormValid = Boolean(stayId) && !isDuplicate && resident.agreedRent > 0;

  const handleSubmit = () => {
    if (!stayId || !isFormValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = billingService.generateMonthlyRentBill(
        stayId,
        billingPeriod,
        remarks,
        dueDate
      );

      if (result.success && result.bill) {
        onSuccess(
          `Monthly Rent Invoice #${result.bill.billNumber} (${formatCurrency(
            result.bill.totalAmount
          )}) successfully generated for ${billingPeriod}!`
        );
        onClose();
      } else {
        setErrorMessage(
          result.errors.length > 0
            ? result.errors.join(', ')
            : 'Failed to generate monthly rent bill.'
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
        <MonetizationOn color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Generate Monthly Rent
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Issue monthly rent invoice and post balanced double-entry ledger entries.
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ my: 1 }}>
        <Stack spacing={2.5}>
          {/* Target Resident & Stay Context Summary */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}
            >
              Resident Stay Context
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

                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, fontFamily: 'monospace' }}
                >
                  {stayId || 'No active stay'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Flat Number
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedFlat ? `Flat ${selectedFlat.name}` : 'Not Allocated'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Allocated Bed
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Bed {bedLabel}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Validation Error Message */}
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {/* Duplicate Rent Warning Alert */}
          {isDuplicate && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Monthly Rent Already Generated
              </Typography>
              Monthly rent for <strong>{billingPeriod}</strong> has already been issued for this resident
              {existingBill ? ` (Invoice #${existingBill.billNumber})` : ''}. Duplicate rent generation is prevented by domain rules.
            </Alert>
          )}

          {/* No Active Stay Warning */}
          {!stayId && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              No active stay record found for {resident.fullName}. Cannot generate rent.
            </Alert>
          )}

          {/* Bill Generation Form Controls */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Billing Month"
                value={billingPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                fullWidth
                disabled={isSubmitting}
              >
                {availablePeriods.map((period) => (
                  <MenuItem key={period} value={period}>
                    {period}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Monthly Rent Amount"
                value={formatCurrency(resident.agreedRent)}
                fullWidth
                disabled
                helperText="Auto-populated from stay contract"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Invoice Due Date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={isSubmitting || isDuplicate}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Optional Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                fullWidth
                disabled={isSubmitting || isDuplicate}
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
              <MonetizationOn />
            )
          }
        >
          {isSubmitting ? 'Generating...' : 'Generate Rent'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
