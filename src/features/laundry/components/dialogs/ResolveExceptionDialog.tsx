import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Typography,
  Box,
  Paper,
  Alert,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material';
import { CheckCircleOutlined } from '@mui/icons-material';
import type {
  LaundryTransactionDetailViewModel,
  ExceptionViewModel,
} from '../../application/models/LaundryWorkspaceViewModel';
import type { ResolveExceptionDTO } from '../../application/dtos/laundryDTOs';
import { ResolutionOutcome } from '../../domain/valueObjects/ResolutionOutcome';
import { ResponsibleParty } from '../../domain/valueObjects/ResponsibleParty';

interface ResolveExceptionDialogProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  exception: ExceptionViewModel | null;
  onClose: () => void;
  onSubmit: (dto: ResolveExceptionDTO) => Promise<any>;
}

const RESOLUTION_OUTCOME_OPTIONS: { value: ResolutionOutcome; label: string }[] = [
  { value: ResolutionOutcome.ITEM_RECOVERED, label: 'Item Recovered (Return to Flow)' },
  { value: ResolutionOutcome.SERVICE_CORRECTED, label: 'Service Corrected (In-House Correction)' },
  { value: ResolutionOutcome.VENDOR_CORRECTED, label: 'Vendor Corrected (Vendor Re-performed)' },
  { value: ResolutionOutcome.RESIDENT_ACCEPTED, label: 'Resident Accepted Item / Condition' },
  { value: ResolutionOutcome.PERMANENTLY_LOST, label: 'Permanently Lost (Conclusive Physical Reconciliation)' },
  { value: ResolutionOutcome.NO_ACTION_REQUIRED, label: 'No Action Required (Unfounded / Informational)' },
  { value: ResolutionOutcome.OTHER, label: 'Other Formal Resolution' },
];

const RESPONSIBLE_PARTY_OPTIONS: { value: ResponsibleParty; label: string }[] = [
  { value: ResponsibleParty.VENDOR, label: 'External Vendor' },
  { value: ResponsibleParty.RESIDENT, label: 'Resident' },
  { value: ResponsibleParty.RPGMS, label: 'RPGMS Staff / Internal Operations' },
  { value: ResponsibleParty.UNKNOWN, label: 'Unknown / Non-Attributable' },
  { value: ResponsibleParty.NONE, label: 'None' },
  { value: ResponsibleParty.OTHER, label: 'Other External Party' },
];

export function ResolveExceptionDialog({
  open,
  detail,
  exception,
  onClose,
  onSubmit,
}: ResolveExceptionDialogProps) {
  const [resolverStaffId, setResolverStaffId] = useState<string>('STAFF-001');
  const [outcome, setOutcome] = useState<ResolutionOutcome>(ResolutionOutcome.ITEM_RECOVERED);
  const [resolvedQuantity, setResolvedQuantity] = useState<number>(0);
  const [responsibleParty, setResponsibleParty] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && exception) {
      setResolverStaffId('STAFF-001');
      setOutcome(ResolutionOutcome.ITEM_RECOVERED);
      setResolvedQuantity(0);
      setResponsibleParty('');
      setNotes('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, exception]);

  if (!detail || !exception) {
    return null;
  }

  const handleSubmit = async () => {
    setError(null);

    if (!resolverStaffId.trim()) {
      setError('Resolver Staff ID is required.');
      return;
    }
    if (!outcome) {
      setError('Resolution outcome is required.');
      return;
    }
    if (
      typeof resolvedQuantity !== 'number' ||
      isNaN(resolvedQuantity) ||
      resolvedQuantity < 0 ||
      !Number.isInteger(resolvedQuantity)
    ) {
      setError('Resolved quantity must be a non-negative integer (0 or greater).');
      return;
    }

    const dto: ResolveExceptionDTO = {
      transactionId: detail.id,
      exceptionId: exception.id,
      outcome,
      resolverStaffId: resolverStaffId.trim(),
      resolvedQuantity,
      responsibleParty: responsibleParty ? (responsibleParty as ResponsibleParty) : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(dto);
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve exception.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CheckCircleOutlined color="success" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Resolve Operational Exception
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Record the formal business resolution outcome for exception {exception.id}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Exception Context Header */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {exception.id}: {exception.typeLabel}
                  </Typography>
                  <Chip
                    size="small"
                    label={exception.statusLabel}
                    color={exception.status === 'UNDER_INVESTIGATION' ? 'info' : 'warning'}
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                  {exception.isBlocking && (
                    <Chip size="small" color="error" label="Blocking Delivery" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {exception.description}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  {exception.itemName ? `Target Item: ${exception.itemName} • ` : ''}Affected Quantity: {exception.affectedQuantity} pc(s)
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Raised by {exception.raisedByStaffId} on {exception.raisedAtFormatted}
              </Typography>
            </Stack>
          </Paper>

          {/* Form Controls */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Resolver Staff ID */}
            <TextField
              label="Resolver Staff ID"
              size="small"
              value={resolverStaffId}
              onChange={(e) => setResolverStaffId(e.target.value)}
              required
              disabled={isSubmitting}
              sx={{ flex: 1 }}
            />

            {/* Resolution Outcome */}
            <FormControl size="small" required sx={{ flex: 1.5 }}>
              <InputLabel id="resolution-outcome-label">Resolution Outcome</InputLabel>
              <Select
                labelId="resolution-outcome-label"
                value={outcome}
                label="Resolution Outcome"
                onChange={(e) => setOutcome(e.target.value as ResolutionOutcome)}
                disabled={isSubmitting}
              >
                {RESOLUTION_OUTCOME_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Resolved Quantity */}
            <TextField
              label="Resolved Physical Quantity (Pieces)"
              type="number"
              size="small"
              value={resolvedQuantity}
              onChange={(e) => setResolvedQuantity(Math.max(0, parseInt(e.target.value, 10) || 0))}
              slotProps={{ htmlInput: { min: 0 } }}
              required
              disabled={isSubmitting}
              sx={{ flex: 1 }}
              helperText="Physical pieces conclusively accounted for in physical reconciliation without delivery"
            />

            {/* Responsible Party */}
            <FormControl size="small" sx={{ flex: 1.5 }}>
              <InputLabel id="resolve-responsible-party-label">Responsible Party (Operational Attribution)</InputLabel>
              <Select
                labelId="resolve-responsible-party-label"
                value={responsibleParty}
                label="Responsible Party (Operational Attribution)"
                onChange={(e) => setResponsibleParty(e.target.value)}
                disabled={isSubmitting}
              >
                <MenuItem value="">
                  <em>None / Unassigned</em>
                </MenuItem>
                {RESPONSIBLE_PARTY_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Resolution Notes */}
          <TextField
            label="Resolution Notes & Business Summary"
            multiline
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Record the operational basis of this resolution, corrective actions taken, or vendor agreements..."
            disabled={isSubmitting}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="success"
          disabled={isSubmitting || !resolverStaffId.trim() || !outcome || resolvedQuantity < 0}
          sx={{ fontWeight: 700, textTransform: 'none', px: 3 }}
        >
          {isSubmitting ? 'Resolving...' : 'Resolve Exception'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
