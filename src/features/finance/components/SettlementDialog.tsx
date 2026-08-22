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
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ExitToApp, CheckCircle, Warning, Info } from '@mui/icons-material';

import type { Resident } from '../../resident';
import type { PaymentMethod } from '../domain';
import { settlementService } from '../services/settlementService';
import { formatCurrency } from '../utils/currencyFormatters';

export interface SettlementDialogProps {
  open: boolean;
  onClose: () => void;
  resident?: Resident | null;
  stayId?: string;
  onSuccess: (message: string) => void;
}

export function SettlementDialog({
  open,
  onClose,
  resident,
  stayId,
  onSuccess,
}: SettlementDialogProps) {
  const [damageDeductionStr, setDamageDeductionStr] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER' as PaymentMethod);
  const [remarks, setRemarks] = useState<string>('Checkout settlement processing');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [idempotencyKey] = useState<string>(
    () => `stl_idem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  const parsedDamage = parseFloat(damageDeductionStr);
  const numericDamage = isNaN(parsedDamage) || parsedDamage < 0 ? 0 : parsedDamage;

  // Stage 1 Settlement Preview calculation via settlementService
  const previewResult = useMemo(() => {
    if (!stayId) return null;
    return settlementService.generateSettlementPreview(stayId, numericDamage, remarks);
  }, [stayId, numericDamage, remarks]);

  const preview = previewResult?.preview;

  const getOutcomeChip = (outcome?: string) => {
    switch (outcome) {
      case 'HOSTEL_REFUNDS_RESIDENT':
        return <Chip icon={<Info />} label="Hostel Refunds Resident" color="info" size="small" />;
      case 'RESIDENT_PAYS_HOSTEL':
        return <Chip icon={<Warning />} label="Resident Pays Hostel Dues" color="warning" size="small" />;
      case 'BALANCED_NO_ACTION':
        return <Chip icon={<CheckCircle />} label="Balanced - No Payment Required" color="success" size="small" />;
      default:
        return <Chip label="Pending Calculation" size="small" />;
    }
  };

  const isFormValid = Boolean(stayId) && previewResult?.success && preview !== undefined;

  const handleSubmit = () => {
    if (!stayId || !isFormValid || !preview) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Stage 2 Confirmation with live T2 validation and idempotency
      const result = settlementService.confirmSettlement(preview, paymentMethod, 'OPERATOR', idempotencyKey);

      if (result.success && result.settlement) {
        const outcomeMsg =
          preview.outcome === 'HOSTEL_REFUNDS_RESIDENT'
            ? `Net Refund to Resident: ${formatCurrency(preview.netSettlementAmount)}`
            : preview.outcome === 'RESIDENT_PAYS_HOSTEL'
            ? `Net Collection from Resident: ${formatCurrency(preview.netSettlementAmount)}`
            : 'Settlement Balanced Cleanly';

        onSuccess(
          `Checkout Settlement Confirmed! Settlement #${result.settlement.settlementNumber} | ${outcomeMsg}`
        );
        onClose();
      } else {
        setErrorMessage(
          result.errors.length > 0
            ? result.errors.join(', ')
            : 'Failed to confirm settlement.'
        );
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred during settlement.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1 } },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <ExitToApp color="warning" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Checkout & Deposit Settlement
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Stage 1 Settlement Preview & Stage 2 Execution for final financial closure.
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ my: 1 }}>
        <Stack spacing={2.5}>
          {/* Target Context Summary */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
              Settlement Target Context
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Resident Name
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {resident ? resident.fullName : 'Resident Account'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 6, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Stay ID
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                  {stayId || 'No active stay'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Settlement Outcome Status
                </Typography>
                {getOutcomeChip(preview?.outcome)}
              </Grid>
            </Grid>
          </Paper>

          {/* Validation Error Message */}
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {!stayId && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              No active stay record selected. Cannot execute settlement.
            </Alert>
          )}

          {/* Stage 1 Settlement Preview Breakdown Card */}
          {preview && (
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2.5,
                borderColor: 'primary.light',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'primary.main' }}>
                Stage 1 — Financial Settlement Preview Snapshot
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Total Unpaid Debits
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {formatCurrency(preview.totalDues)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Security Deposit Held
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {formatCurrency(preview.securityDepositHeld)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Advance Credit Balance
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {formatCurrency(preview.advanceCreditBalance)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Damage Recovery Deduction
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {formatCurrency(preview.damageDeductions)}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Net Settlement Amount:
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color:
                      preview.outcome === 'HOSTEL_REFUNDS_RESIDENT'
                        ? 'info.main'
                        : preview.outcome === 'RESIDENT_PAYS_HOSTEL'
                        ? 'error.main'
                        : 'success.main',
                  }}
                >
                  {formatCurrency(preview.netSettlementAmount)}
                </Typography>
              </Box>
            </Paper>
          )}

          {/* Stage 2 Execution Form Inputs */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, pt: 1 }}>
            Stage 2 — Confirmation & Adjustments
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Damage Recovery / Penalty Deduction (₹)"
                type="number"
                value={damageDeductionStr}
                onChange={(e) => {
                  setDamageDeductionStr(e.target.value);
                  setErrorMessage(null);
                }}
                fullWidth
                disabled={isSubmitting || !stayId}
                helperText="Optional property damage or penalty deduction from deposit"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                label="Refund / Payout Payment Mode"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                fullWidth
                disabled={isSubmitting || !stayId}
              >
                <MenuItem value="BANK_TRANSFER">Bank Transfer / UPI</MenuItem>
                <MenuItem value="CASH">Cash Payout</MenuItem>
              </TextField>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                label="Settlement Remarks & Audit Memo"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                fullWidth
                disabled={isSubmitting || !stayId}
                placeholder="e.g. Bed cleared, room inspected, deposit refunded via UPI"
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
          color="warning"
          disabled={!isFormValid || isSubmitting}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <ExitToApp />
            )
          }
        >
          {isSubmitting ? 'Confirming Settlement...' : 'Confirm Checkout Settlement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
