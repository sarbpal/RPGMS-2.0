import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  MenuItem,
  Typography,
  Box,
} from '@mui/material';
import { ReceiptLong } from '@mui/icons-material';
import type { CreateSupplierBillInput } from '../services/supplierBillAllocationService';

export interface FlatOption {
  id: string;
  name: string;
}

export interface SupplierBillEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateSupplierBillInput, flatId: string, periodStart: string, periodEnd: string) => boolean;
  flats?: FlatOption[];
  defaultFlatId?: string;
}

export function SupplierBillEntryModal({
  open,
  onClose,
  onSubmit,
  flats = [],
  defaultFlatId = '',
}: SupplierBillEntryModalProps) {
  const [flatId, setFlatId] = useState<string>(defaultFlatId || (flats.length > 0 ? flats[0].id : ''));
  const [supplierName, setSupplierName] = useState<string>('TPDDL Electricity');
  const [supplierBillNumber, setSupplierBillNumber] = useState<string>('');
  const [supplierAmount, setSupplierAmount] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<string>('2026-07-01');
  const [periodEnd, setPeriodEnd] = useState<string>('2026-07-31');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = () => {
    setFormError(null);
    if (!flatId.trim()) {
      setFormError('Please select or specify a Flat.');
      return;
    }
    if (!supplierName.trim()) {
      setFormError('Supplier Name is required.');
      return;
    }
    if (!supplierBillNumber.trim()) {
      setFormError('Supplier Bill/Reference Number is required.');
      return;
    }
    const amountNum = parseFloat(supplierAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Supplier Bill Amount must be a positive number greater than zero.');
      return;
    }
    if (!periodStart || !periodEnd) {
      setFormError('Billing period start and end dates are required.');
      return;
    }
    if (periodEnd < periodStart) {
      setFormError('Billing period end date cannot be earlier than period start date.');
      return;
    }

    const success = onSubmit(
      {
        supplierName: supplierName.trim(),
        supplierBillNumber: supplierBillNumber.trim(),
        supplierAmount: amountNum,
      },
      flatId.trim(),
      periodStart,
      periodEnd
    );

    if (success) {
      setSupplierBillNumber('');
      setSupplierAmount('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <ReceiptLong color="primary" /> Enter Supplier Electricity Bill
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Enter details from the official electricity supplier invoice. The system will discover historical Stays for the flat during this billing period to create a draft allocation.
          </Typography>

          {formError && <Alert severity="error">{formError}</Alert>}

          {flats.length > 0 ? (
            <TextField
              select
              label="Flat / Property Unit"
              value={flatId}
              onChange={(e) => setFlatId(e.target.value)}
              fullWidth
              required
            >
              {flats.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  {f.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField
              label="Flat ID / Name"
              value={flatId}
              onChange={(e) => setFlatId(e.target.value)}
              placeholder="e.g. flat-101"
              fullWidth
              required
            />
          )}

          <TextField
            label="Supplier Company Name"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            placeholder="e.g. TPDDL Delhi / BSES Rajdhani"
            fullWidth
            required
          />

          <TextField
            label="Supplier Invoice / Bill Reference Number"
            value={supplierBillNumber}
            onChange={(e) => setSupplierBillNumber(e.target.value)}
            placeholder="e.g. TPDDL-2026-07-8892"
            fullWidth
            required
          />

          <TextField
            label="Actual Supplier Bill Amount (₹)"
            type="number"
            value={supplierAmount}
            onChange={(e) => setSupplierAmount(e.target.value)}
            placeholder="e.g. 4500"
            fullWidth
            required
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Billing Period Start Date"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Billing Period End Date"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              fullWidth
              required
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary" sx={{ fontWeight: 700 }}>
          Create Draft Allocation
        </Button>
      </DialogActions>
    </Dialog>
  );
}
