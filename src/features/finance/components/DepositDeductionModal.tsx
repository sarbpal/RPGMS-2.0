import React, { useState } from 'react';
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
} from '@mui/material';
import { depositService } from '../services/depositService';

interface DepositDeductionModalProps {
  open: boolean;
  onClose: () => void;
  stayId: string;
  currentDepositHeld: number;
  onSuccess: () => void;
}

export const DepositDeductionModal: React.FC<DepositDeductionModalProps> = ({
  open,
  onClose,
  stayId,
  currentDepositHeld,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setError(null);

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid deduction amount greater than zero.');
      return;
    }

    if (!reason || reason.trim() === '') {
      setError('Deduction reason is mandatory.');
      return;
    }

    if (amount > currentDepositHeld) {
      setError(`Deduction amount cannot exceed available deposit held (₹${currentDepositHeld.toLocaleString('en-IN')}).`);
      return;
    }

    setIsSubmitting(true);
    const result = depositService.recordDepositDeduction(
      stayId,
      amount,
      reason,
      remarks,
      'OPERATOR_UI'
    );
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.errors.join(', '));
      return;
    }

    // Reset and close
    setAmount('');
    setReason('');
    setRemarks('');
    onSuccess();
    onClose();
  };

  const handleClose = () => {
    setError(null);
    setAmount('');
    setReason('');
    setRemarks('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Record Deposit Deduction</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Available Security Deposit Held
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.main' }}>
              ₹{currentDepositHeld.toLocaleString('en-IN')}
            </Typography>
          </Box>

          <TextField
            label="Deduction Amount (₹)"
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
            label="Deduction Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            required
            placeholder="e.g. Wall damage, key loss penalty, furniture repair"
          />

          <TextField
            label="Additional Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="warning" disabled={isSubmitting}>
          Confirm Deduction
        </Button>
      </DialogActions>
    </Dialog>
  );
};
