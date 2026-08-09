import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { WarningOutlined, UndoOutlined } from '@mui/icons-material';
import type { HistoricalAllocationItem } from '../hooks/useSupplierBillAllocation';

export interface ReverseAllocationModalProps {
  open: boolean;
  item: HistoricalAllocationItem | null;
  onClose: () => void;
  onConfirmReversal: (allocationId: string, reversedBy: string, reversalReason?: string) => void;
}

export function ReverseAllocationModal({
  open,
  item,
  onClose,
  onConfirmReversal,
}: ReverseAllocationModalProps) {
  const [reversedBy, setReversedBy] = useState<string>('System Operator');
  const [reversalReason, setReversalReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReversedBy('System Operator');
      setReversalReason('');
      setValidationError(null);
    }
  }, [open]);

  if (!item) return null;

  const { allocation, bill } = item;
  const isOwnerAbsorbed = allocation.allocationOutcome === 'OWNER_ABSORBED';

  const handleSubmit = () => {
    if (!reversedBy || reversedBy.trim() === '') {
      setValidationError('Operator identity (reversedBy) is required to reverse an allocation.');
      return;
    }

    setValidationError(null);
    onConfirmReversal(allocation.id, reversedBy.trim(), reversalReason.trim() || undefined);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
        <UndoOutlined color="error" /> Reverse Confirmed Electricity Allocation
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Target Allocation:
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>
            Flat {allocation.flatId} ({allocation.periodStart} to {allocation.periodEnd})
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Supplier Bill #{bill?.supplierBillNumber || allocation.billId} — ₹{allocation.totalSupplierAmount.toFixed(2)}
          </Typography>
        </Box>

        <Alert severity="warning" icon={<WarningOutlined />} sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Controlled Financial Reversal (BR-E-49)
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
            {isOwnerAbsorbed
              ? 'This allocation was confirmed as OWNER_ABSORBED. Reversing it will update lifecycle status to REVERSED while keeping history intact.'
              : `Reversing this allocation will cancel ${allocation.participants.filter(p => p.selectedShares > 0).length} resident utility bill(s) and post counter-entries (Debit ELECTRICITY_REVENUE, Credit ACCOUNTS_RECEIVABLE) on resident ledgers.`}
          </Typography>
        </Alert>

        {validationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {validationError}
          </Alert>
        )}

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Operator Identity (Reversed By)"
            placeholder="e.g. System Operator"
            value={reversedBy}
            onChange={(e) => setReversedBy(e.target.value)}
            required
            fullWidth
            size="small"
            helperText="Identity of operator authorizing this allocation reversal."
          />

          <TextField
            label="Operational Reversal Reason (Optional)"
            placeholder="e.g. Incorrect meter period / Revised supplier invoice received"
            value={reversalReason}
            onChange={(e) => setReversalReason(e.target.value)}
            multiline
            rows={3}
            fullWidth
            size="small"
            helperText="Document reason for audit history."
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          startIcon={<UndoOutlined />}
          sx={{ fontWeight: 700 }}
        >
          Confirm Reversal
        </Button>
      </DialogActions>
    </Dialog>
  );
}
