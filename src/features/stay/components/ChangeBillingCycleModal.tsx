import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Stay } from '../domain/entities/Stay';
import type { ChangeBillingCycleInput } from '../application/coordinator/StayBillingCycleCoordinator';

interface ChangeBillingCycleModalProps {
  open: boolean;
  stay: Stay;
  onClose: () => void;
  onSuccess: () => void;
  onChangeBillingCycle: (input: ChangeBillingCycleInput) => void;
}

export function ChangeBillingCycleModal({
  open,
  stay,
  onClose,
  onSuccess,
  onChangeBillingCycle,
}: ChangeBillingCycleModalProps) {
  const [requestedAnchor, setRequestedAnchor] = useState<number>(
    stay.billingAnchorDay === 10 ? 20 : 10
  );
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('');
  const [financialRef, setFinancialRef] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Please provide an explicit reason for the billing cycle change.');
      return;
    }

    try {
      onChangeBillingCycle({
        stayId: stay.id,
        requestedBillingAnchor: Number(requestedAnchor),
        effectiveFrom,
        reason,
        financialAdjustmentReference: financialRef.trim() || undefined,
      });

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Change Billing Cycle Anchor</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Stay ID: <strong>{stay.id}</strong> | Current Anchor Day: <strong>{stay.billingAnchorDay}th</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Original Check-In Date: <strong>{stay.checkInDate}</strong> (Immutable)
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mb: 3 }}>
            The Stay domain updates billing-cycle history and anchor day. Financial prorata calculation, adjustments, and ledger entries belong exclusively to Finance/Billing.
          </Alert>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              select
              label="Requested Billing Anchor Day"
              value={requestedAnchor}
              onChange={(e) => setRequestedAnchor(Number(e.target.value))}
              fullWidth
              required
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <MenuItem key={day} value={day}>
                  Day {day} of month {day === stay.billingAnchorDay ? '(Current)' : ''}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Effective Date"
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              required
            />

            <TextField
              label="Reason / Business Context"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Resident requested salary cycle alignment to 20th"
              multiline
              rows={2}
              fullWidth
              required
            />

            <TextField
              label="Financial Adjustment Reference (Optional)"
              value={financialRef}
              onChange={(e) => setFinancialRef(e.target.value)}
              placeholder="e.g. ADJ-2026-0041"
              helperText="External reference to future authoritative financial adjustment"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Confirm Billing Cycle Change
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
