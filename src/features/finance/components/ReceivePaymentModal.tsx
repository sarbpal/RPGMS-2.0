import { useEffect, useMemo, useState } from 'react';
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
import { Payments, InfoOutlined } from '@mui/icons-material';

import type { Resident } from '../../resident';
import type { Flat } from '../../accommodation/types';
import type { StayBalance } from '../domain';
import { PaymentMethod } from '../domain';
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

export function generatePaymentIdempotencyKey(stayId?: string): string {
  const prefix = stayId ? `pay_idem_${stayId}` : 'pay_idem';
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
  const existingAdvanceCredit = balances.advanceCreditBalance || 0;

  // Form states
  const [paymentAmountStr, setPaymentAmountStr] = useState<string>(
    outstandingAmount > 0 ? String(outstandingAmount) : ''
  );
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    generatePaymentIdempotencyKey(stayId)
  );

  // Reset form states when modal opens or stayId changes
  useEffect(() => {
    if (open) {
      setPaymentAmountStr(outstandingAmount > 0 ? String(outstandingAmount) : '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod(PaymentMethod.CASH);
      setReferenceNumber('');
      setRemarks('');
      setIsSubmitting(false);
      setErrorMessage(null);
      setIdempotencyKey(generatePaymentIdempotencyKey(stayId));
    }
  }, [open, stayId, outstandingAmount]);

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
  const isAmountZeroOrNegative = numericAmount <= 0;
  const isCash = paymentMethod === PaymentMethod.CASH;
  const isRefNumberMissing =
    !isCash && (!referenceNumber || referenceNumber.trim() === '');

  const isFormValid =
    Boolean(stayId) &&
    !isAmountZeroOrNegative &&
    !isRefNumberMissing;

  // Presentation-only Estimated Allocation Preview (Non-authoritative)
  const duesPortionPreview = Math.min(numericAmount, Math.max(0, outstandingAmount));
  const advancePortionPreview = Math.max(
    0,
    Math.round((numericAmount - duesPortionPreview) * 100) / 100
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaymentAmountStr(e.target.value);
    setErrorMessage(null);
  };

  const handleMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMethod = e.target.value as PaymentMethod;
    setPaymentMethod(newMethod);
    setErrorMessage(null);
    if (newMethod === PaymentMethod.CASH) {
      setReferenceNumber('');
    }
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReferenceNumber(e.target.value);
    setErrorMessage(null);
  };

  const handleSubmit = () => {
    if (!stayId || !isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = paymentService.recordPayment({
        stayId,
        amount: numericAmount,
        paymentDate,
        paymentMethod,
        referenceNumber: referenceNumber.trim() || undefined,
        idempotencyKey,
        remarks: remarks.trim() || undefined,
      });

      if (result.success && result.payment) {
        const totalAllocated = (result.payment.allocations || []).reduce(
          (sum, a) => sum + a.amount,
          0
        );
        const advanceCreated = Math.max(
          0,
          Math.round((result.payment.amount - totalAllocated) * 100) / 100
        );

        let successMessage = `Payment Received Successfully! Amount: ${formatCurrency(
          result.payment.amount
        )} | Receipt: #${result.payment.paymentNumber} | Resident: ${
          resident.fullName
        }`;

        if (advanceCreated > 0) {
          successMessage += ` | Advance Credit Created: ${formatCurrency(advanceCreated)}`;
        }

        onSuccess(successMessage);
        onClose();
      } else {
        setErrorMessage(
          result.errors && result.errors.length > 0
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
            Record payment, generate double-entry receipt ledger entries, and allocate dues or advance credits.
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
                  Existing Advance Credit
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: existingAdvanceCredit > 0 ? 'info.main' : 'text.secondary',
                  }}
                >
                  {formatCurrency(existingAdvanceCredit)}
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

              <Grid size={{ xs: 6 }}>
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

          {/* Zero Dues Context Banner */}
          {outstandingAmount <= 0 && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                No Outstanding Dues
              </Typography>
              This resident has zero pending dues. Any payment recorded will be credited 100% to Advance Credit liability.
            </Alert>
          )}

          {/* Payment Form Controls */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Payment Amount (₹)"
                type="number"
                value={paymentAmountStr}
                onChange={handleAmountChange}
                fullWidth
                autoFocus
                disabled={isSubmitting}
                error={isAmountZeroOrNegative && paymentAmountStr !== ''}
                helperText={
                  isAmountZeroOrNegative && paymentAmountStr !== ''
                    ? 'Payment amount must be greater than zero'
                    : outstandingAmount > 0
                    ? `Current outstanding dues: ${formatCurrency(outstandingAmount)}`
                    : 'Surplus amount becomes Advance Credit'
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
                disabled={isSubmitting}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Payment Mode"
                value={paymentMethod}
                onChange={handleMethodChange}
                fullWidth
                disabled={isSubmitting}
              >
                <MenuItem value={PaymentMethod.CASH}>Cash</MenuItem>
                <MenuItem value={PaymentMethod.UPI}>UPI</MenuItem>
                <MenuItem value={PaymentMethod.BANK_TRANSFER}>Bank Transfer</MenuItem>
                <MenuItem value={PaymentMethod.CHEQUE}>Cheque</MenuItem>
                <MenuItem value={PaymentMethod.CARD}>Card</MenuItem>
                <MenuItem value={PaymentMethod.OTHER}>Other</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label={
                  isCash
                    ? 'Receipt / Reference Note (Optional)'
                    : paymentMethod === PaymentMethod.UPI
                    ? 'UPI Reference / UTR Number *'
                    : paymentMethod === PaymentMethod.BANK_TRANSFER
                    ? 'Bank Transaction / UTR Number *'
                    : paymentMethod === PaymentMethod.CHEQUE
                    ? 'Cheque Number *'
                    : paymentMethod === PaymentMethod.CARD
                    ? 'Card Auth / Transaction ID *'
                    : 'Transaction Reference ID *'
                }
                value={referenceNumber}
                onChange={handleReferenceChange}
                fullWidth
                disabled={isSubmitting}
                error={isRefNumberMissing}
                helperText={
                  isRefNumberMissing
                    ? `Required for ${paymentMethod} payments`
                    : isCash
                    ? 'Optional receipt note'
                    : paymentMethod === PaymentMethod.UPI
                    ? 'e.g. 12-digit UPI UTR'
                    : paymentMethod === PaymentMethod.BANK_TRANSFER
                    ? 'e.g. IMPS/NEFT/RTGS UTR'
                    : paymentMethod === PaymentMethod.CHEQUE
                    ? 'e.g. Cheque No.'
                    : 'e.g. Transaction Ref ID'
                }
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Optional Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                fullWidth
                disabled={isSubmitting}
                placeholder="e.g. Paid via PhonePe / Rent payment"
              />
            </Grid>
          </Grid>

          {/* Real-time Estimated Allocation Preview (Presentation Only) */}
          {numericAmount > 0 && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: advancePortionPreview > 0 ? 'info.50' : 'success.50',
                borderColor: advancePortionPreview > 0 ? 'info.200' : 'success.200',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <InfoOutlined
                  fontSize="small"
                  color={advancePortionPreview > 0 ? 'info' : 'success'}
                />
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: advancePortionPreview > 0 ? 'info.dark' : 'success.dark',
                  }}
                >
                  Estimated Allocation Preview (Subject to Finance realization)
                </Typography>
              </Box>

              <Grid container spacing={1}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Applied to Open Dues
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {formatCurrency(duesPortionPreview)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Advance Credit Created
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: advancePortionPreview > 0 ? 'info.main' : 'text.secondary',
                    }}
                  >
                    {formatCurrency(advancePortionPreview)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
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
