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
import { Payments } from '@mui/icons-material';

import type { Resident } from '../../resident';
import type { Flat } from '../../accommodation/types';
import type { PaymentMethod, StayBalance } from '../domain';
import { paymentService } from '../services/paymentService';
import { formatCurrency } from '../utils/currencyFormatters';

export interface ReceivePaymentModalProps {
  open: boolean;
  onClose: () => void;
  resident: Resident;
  selectedFlat?: Flat | null;
  stayId?: string;
  balances: StayBalance;
  currentMonthCharges: number;
  lastPaymentDateText: string;
  onSuccess: (message: string) => void;
}

export function ReceivePaymentModal({
  open,
  onClose,
  resident,
  selectedFlat,
  stayId,
  balances,
  currentMonthCharges,
  lastPaymentDateText,
  onSuccess,
}: ReceivePaymentModalProps) {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const outstandingAmount = balances.receivableBalance;

  // Form states
  const [paymentAmountStr, setPaymentAmountStr] = useState<string>(
    outstandingAmount > 0 ? String(outstandingAmount) : '0'
  );
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const bedLabel = useMemo(() => {
    const res = resident as Resident & { allocatedBedIds?: string[] };
    if (!res.allocatedBedIds || res.allocatedBedIds.length === 0) {
      return 'No Bed Allocated';
    }
    return res.allocatedBedIds
      .map((bId: string) => {
        const match = bId.match(/[^-]+$/);
        return match ? match[0] : bId;
      })
      .join(', ');
  }, [resident]);

  // Numerical payment amount evaluation
  const parsedAmount = parseFloat(paymentAmountStr);
  const numericAmount = isNaN(parsedAmount) ? 0 : parsedAmount;

  // Amount validation logic
  const isNoOutstanding = outstandingAmount <= 0;
  const isAmountZeroOrNegative = numericAmount <= 0;
  const isAmountExceedingOutstanding = numericAmount > outstandingAmount;
  const isRefNumberMissing =
    paymentMethod !== 'CASH' && (!referenceNumber || referenceNumber.trim() === '');

  const isFormValid =
    Boolean(stayId) &&
    !isNoOutstanding &&
    !isAmountZeroOrNegative &&
    !isAmountExceedingOutstanding &&
    !isRefNumberMissing;

  const handleSubmit = () => {
    if (!stayId || !isFormValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = paymentService.recordPayment({
        stayId,
        amount: numericAmount,
        paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      if (result.success && result.payment) {
        onSuccess(
          `Payment Received Successfully! Amount: ${formatCurrency(
            result.payment.amount
          )} | Receipt: #${result.payment.paymentNumber} | Resident: ${
            resident.fullName
          }`
        );
        onClose();
      } else {
        setErrorMessage(
          result.errors.length > 0
            ? result.errors.join(', ')
            : 'Failed to record payment.'
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
        <Payments color="success" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Receive Resident Payment
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Record payment, generate double-entry receipt ledger entries, and update dues.
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ my: 1 }}>
        <Stack spacing={2.5}>
          {/* Target Resident & Outstanding Dues Summary */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}
            >
              Resident Account Snapshot
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
                  Flat & Bed
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {selectedFlat ? `Flat ${selectedFlat.name}` : 'No Flat'} • Bed {bedLabel}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Outstanding Balance
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: outstandingAmount > 0 ? 'error.main' : 'success.main',
                  }}
                >
                  {formatCurrency(outstandingAmount)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Current Month Charges
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {formatCurrency(currentMonthCharges)}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Last Payment Received
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {lastPaymentDateText}
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

          {/* Zero Dues Alert */}
          {isNoOutstanding && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                No Outstanding Balance
              </Typography>
              This resident currently has no pending dues balance. Payment collection is disabled.
            </Alert>
          )}

          {/* Payment Form Controls */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Payment Amount (₹)"
                type="number"
                value={paymentAmountStr}
                onChange={(e) => {
                  setPaymentAmountStr(e.target.value);
                  setErrorMessage(null);
                }}
                fullWidth
                disabled={isSubmitting || isNoOutstanding}
                error={isAmountZeroOrNegative || isAmountExceedingOutstanding}
                helperText={
                  isAmountExceedingOutstanding
                    ? `Cannot exceed outstanding balance (${formatCurrency(outstandingAmount)})`
                    : isAmountZeroOrNegative && paymentAmountStr !== ''
                    ? 'Payment amount must be greater than zero'
                    : `Max payable: ${formatCurrency(outstandingAmount)}`
                }
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Payment Date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={isSubmitting || isNoOutstanding}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Payment Mode"
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value as PaymentMethod);
                  setErrorMessage(null);
                }}
                fullWidth
                disabled={isSubmitting || isNoOutstanding}
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={
                  paymentMethod === 'CASH'
                    ? 'Reference Number (Optional)'
                    : 'Reference Number / Transaction ID *'
                }
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                fullWidth
                disabled={isSubmitting || isNoOutstanding}
                error={isRefNumberMissing}
                helperText={
                  isRefNumberMissing
                    ? 'Required for non-cash payments (UPI / Bank Transfer)'
                    : paymentMethod === 'CASH'
                    ? 'Optional receipt or note ID'
                    : 'e.g. UTR / UPI Ref ID'
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Optional Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                fullWidth
                disabled={isSubmitting || isNoOutstanding}
                placeholder="e.g. Paid via PhonePe / Rent payment"
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
          color="success"
          disabled={!isFormValid || isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Payments />
            )
          }
        >
          {isSubmitting ? 'Processing...' : 'Confirm Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
