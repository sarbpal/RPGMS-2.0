import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  Box,
  Typography,
} from '@mui/material';
import type { PaymentMethod } from '../domain';
import { depositService } from '../services/depositService';

interface PartialDepositReturnModalProps {
  open: boolean;
  onClose: () => void;
  stayId: string;
  currentDepositHeld: number;
  onSuccess: () => void;
}

export const PartialDepositReturnModal: React.FC<PartialDepositReturnModalProps> = ({
  open,
  onClose,
  stayId,
  currentDepositHeld,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a stable session-scoped idempotency key for this return dialog instance
  const [idempotencyKey] = useState<string>(
    () => `IDEMP-DEP-RET-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  );

  const handleSubmit = () => {
    setError(null);

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid return amount greater than zero.');
      return;
    }

    if (amount > currentDepositHeld) {
      setError(`Return amount cannot exceed available deposit held (₹${currentDepositHeld.toLocaleString('en-IN')}).`);
      return;
    }

    setIsSubmitting(true);
    const result = depositService.recordPartialDepositReturn({
      stayId,
      amount,
      paymentMethod,
      expectedDepositBalance: currentDepositHeld,
      remarks,
      createdBy: 'OPERATOR_UI',
      idempotencyKey,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.errors.join(', '));
      return;
    }

    // Reset and close
    setAmount('');
    setRemarks('');
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    setError(null);
    setAmount('');
    setRemarks('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Record Partial Deposit Return</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Available Security Deposit Held
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
              ₹{currentDepositHeld.toLocaleString('en-IN')}
            </Typography>
          </Box>

          <TextField
            label="Return Amount (₹)"
            type="number"
            value={amount}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Number(e.target.value);
              setAmount(val);
            }}
            fullWidth
            required
            slotProps={{ htmlInput: { min: 1, max: currentDepositHeld } }}
          />


          <TextField
            select
            label="Payout Method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            fullWidth
          >
            <MenuItem value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</MenuItem>
            <MenuItem value="UPI">UPI Payment</MenuItem>
            <MenuItem value="CHEQUE">Cheque</MenuItem>
            <MenuItem value="CASH">Cash</MenuItem>
          </TextField>

          <TextField
            label="Remarks / Reference Notes"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="e.g. Mid-stay room downgrade partial deposit refund"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" disabled={isSubmitting}>
          Confirm Partial Return
        </Button>
      </DialogActions>
    </Dialog>
  );
};
