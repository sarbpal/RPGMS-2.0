import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  CircularProgress,
} from '@mui/material';
import { PreviewOutlined } from '@mui/icons-material';
import type { CreatePreviewInput } from '../application/coordinator/BillingWorkspaceCoordinator';

interface CreateRunModalProps {
  readonly open: boolean;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onGeneratePreview: (input: CreatePreviewInput) => void;
}

export function CreateRunModal({
  open,
  isSubmitting,
  onClose,
  onGeneratePreview,
}: CreateRunModalProps) {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const defaultStart = `${year}-${month}-01`;
  const defaultEnd = `${year}-${month}-${new Date(year, currentDate.getMonth() + 1, 0).getDate()}`;

  const [periodStart, setPeriodStart] = useState<string>(defaultStart);
  const [periodEnd, setPeriodEnd] = useState<string>(defaultEnd);
  const [operatorId, setOperatorId] = useState<string>('OPERATOR');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodStart || !periodEnd || !operatorId.trim()) return;

    onGeneratePreview({
      periodStart,
      periodEnd,
      operatorId: operatorId.trim(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 600 }}>Create Billing Run / Preview</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Select the billing period to discover eligible rent and ancillary obligations. An informational preview will be generated for operator review before any financial commitment is made.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Period Start"
                type="date"
                fullWidth
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Period End"
                type="date"
                fullWidth
                required
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Operator ID"
                fullWidth
                required
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                helperText="Identifier of the property manager supervising this run"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Run Notes (Optional)"
                fullWidth
                multiline
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Regular monthly cycle"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PreviewOutlined />}
            disabled={isSubmitting || !periodStart || !periodEnd || !operatorId.trim()}
          >
            Generate Preview
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
