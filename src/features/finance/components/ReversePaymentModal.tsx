import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography,
  Stack,
  Divider,
} from '@mui/material';
import { WarningAmber, History } from '@mui/icons-material';
import { paymentService } from '../services/paymentService';
import { formatCurrency } from '../utils/currencyFormatters';

export interface PaymentForReversal {
  id: string;
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  stayId: string;
  residentName?: string;
  residentCode?: string;
}

export interface ReversePaymentModalProps {
  open: boolean;
  payment: PaymentForReversal | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function generateReversalIdempotencyKey(paymentId?: string): string {
  const prefix = paymentId ? `rev_idem_${paymentId}` : 'rev_idem';
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export const ReversePaymentModal: React.FC<ReversePaymentModalProps> = ({
  open,
  payment,
  onClose,
  onSuccess,
}) => {
  const [reversalReason, setReversalReason] = useState('');
  const [reversedBy, setReversedBy] = useState('OPERATOR');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() =>
    generateReversalIdempotencyKey(payment?.id)
  );

  useEffect(() => {
    if (open && payment) {
      setReversalReason('');
      setReversedBy('OPERATOR');
      setError(null);
      setIsSubmitting(false);
      setIdempotencyKey(generateReversalIdempotencyKey(payment.id));
    }
  }, [open, payment]);

  if (!payment) return null;

  const handleSubmit = () => {
    setError(null);

    const trimmedReason = reversalReason.trim();
    if (!trimmedReason) {
      setError('Reversal reason is mandatory.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = paymentService.reversePayment({
        paymentId: payment.id,
        reversalReason: trimmedReason,
        reversedBy: reversedBy.trim() || 'OPERATOR',
        idempotencyKey,
      });

      setIsSubmitting(false);

      if (!result.success) {
        setError(result.errors.join(', '));
        return;
      }

      onSuccess(
        `Payment #${payment.paymentNumber} (${formatCurrency(payment.amount)}) was successfully reversed.`
      );
      onClose();
    } catch (err: unknown) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during reversal.');
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setError(null);
    setReversalReason('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <History color="error" />
        Reverse Payment Receipt
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Alert severity="warning" icon={<WarningAmber />}>
            Reversing this payment will post balanced double-entry compensating counter-postings to
            the Unified Stay Ledger, restore the original bill obligations, and permanently mark the
            payment record as <strong>REVERSED</strong>.
          </Alert>

          {/* Payment Details Snapshot */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 1.5,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Payment Information
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Receipt #{payment.paymentNumber}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>
                {formatCurrency(payment.amount)}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Resident: <strong>{payment.residentName || 'Resident'}</strong>
                {payment.residentCode ? ` (${payment.residentCode})` : ''}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stay ID: <strong>{payment.stayId}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Date: <strong>{payment.paymentDate}</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Method: <strong>{payment.paymentMethod}</strong>
                {payment.referenceNumber ? ` (${payment.referenceNumber})` : ''}
              </Typography>
            </Box>
          </Box>

          <TextField
            label="Reversal Reason"
            value={reversalReason}
            onChange={(e) => {
              setReversalReason(e.target.value);
              setError(null);
            }}
            fullWidth
            required
            multiline
            rows={2}
            placeholder="e.g. Bounced cheque, operator entry mistake, resident chargeback"
            helperText="State the operational reason for this financial reversal."
          />

          <TextField
            label="Authorized By"
            value={reversedBy}
            onChange={(e) => setReversedBy(e.target.value)}
            fullWidth
            size="small"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={isSubmitting || !reversalReason.trim()}
          sx={{ fontWeight: 700 }}
        >
          {isSubmitting ? 'Reversing...' : 'Confirm Reversal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
