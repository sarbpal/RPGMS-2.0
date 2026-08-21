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
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
} from '@mui/material';
import {
  LocalShipping,
  HomeWork,
  Store,
} from '@mui/icons-material';
import type { LaundryTransactionDetailViewModel } from '../../application/models/LaundryWorkspaceViewModel';
import type { ReleaseProcessingDTO } from '../../application/dtos/laundryDTOs';
import type { ProcessingRoute } from '../../domain/valueObjects/ProcessingRoute';

interface ReleaseProcessingDialogProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  onClose: () => void;
  onSubmit: (dto: ReleaseProcessingDTO) => Promise<any>;
}

export function ReleaseProcessingDialog({
  open,
  detail,
  onClose,
  onSubmit,
}: ReleaseProcessingDialogProps) {
  const [route, setRoute] = useState<ProcessingRoute>('IN_HOUSE');
  const [vendorId, setVendorId] = useState<string>('VND-ROYAL-CLEANERS');
  const [staffId, setStaffId] = useState<string>('STAFF-001');
  const [releasedAt, setReleasedAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && detail) {
      setRoute('IN_HOUSE');
      setVendorId('VND-ROYAL-CLEANERS');
      setStaffId('STAFF-001');
      setReleasedAt(new Date().toISOString().slice(0, 16));
      setNotes('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, detail]);

  if (!detail) {
    return null;
  }

  const handleSubmit = async () => {
    if (!detail.isInspected) {
      setError('Cannot release order: Pre-processing inspection must be signed off first.');
      return;
    }
    if (!staffId.trim()) {
      setError('Staff ID is required to release order to processing.');
      return;
    }
    if (route === 'EXTERNAL_VENDOR' && !vendorId.trim()) {
      setError('Vendor ID is required when selecting External Vendor processing route.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const dto: ReleaseProcessingDTO = {
        transactionId: detail.id,
        route,
        vendorId: route === 'EXTERNAL_VENDOR' ? vendorId.trim() : undefined,
        staffId: staffId.trim(),
        releasedAt: releasedAt ? new Date(releasedAt).toISOString() : new Date().toISOString(),
        notes: notes ? notes.trim() : undefined,
      };

      await onSubmit(dto);
    } catch (err: any) {
      setError(err?.message || 'Failed to release order to processing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalShipping color="secondary" /> Select Route & Release to Processing ({detail.id})
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Inspection Prerequisite Banner */}
          {!detail.isInspected && (
            <Alert severity="warning">
              This order has not completed pre-processing inspection. Please sign off on inspection before releasing to processing.
            </Alert>
          )}

          {/* Transaction Summary Card */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between' }} spacing={1}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {detail.residentName} ({detail.residentCode}) — {detail.locationSummary}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Physical Pieces: {detail.totalPhysicalPieces} • Inspected: {detail.isInspected ? 'Yes' : 'No'}
                </Typography>
              </Box>
              <Chip size="small" label={detail.statusLabel} color="info" sx={{ fontWeight: 600 }} />
            </Stack>
          </Paper>

          {/* Processing Route Radio Group */}
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.875rem', mb: 1 }}>
              Select Operational Processing Route *
            </FormLabel>
            <RadioGroup
              value={route}
              onChange={(e) => setRoute(e.target.value as ProcessingRoute)}
            >
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1.5,
                  borderColor: route === 'IN_HOUSE' ? 'primary.main' : 'divider',
                  bgcolor: route === 'IN_HOUSE' ? 'primary.50' : 'background.paper',
                }}
              >
                <FormControlLabel
                  value="IN_HOUSE"
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <HomeWork fontSize="small" color="primary" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          In-House Laundry Room
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Processed using on-premise washing and ironing equipment by hostel staff.
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </Paper>

              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  borderRadius: 1.5,
                  borderColor: route === 'EXTERNAL_VENDOR' ? 'secondary.main' : 'divider',
                  bgcolor: route === 'EXTERNAL_VENDOR' ? '#fdf8ff' : 'background.paper',
                }}
              >
                <FormControlLabel
                  value="EXTERNAL_VENDOR"
                  control={<Radio size="small" color="secondary" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Store fontSize="small" color="secondary" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          External Commercial Vendor
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Handed over to external commercial dry cleaner or industrial laundry partner.
                        </Typography>
                      </Box>
                    </Box>
                  }
                />
              </Paper>
            </RadioGroup>
          </FormControl>

          {/* Vendor ID Input (Visible if External Vendor Selected) */}
          {route === 'EXTERNAL_VENDOR' && (
            <TextField
              label="External Vendor Identifier / Name *"
              size="small"
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              placeholder="e.g. VND-ROYAL-CLEANERS"
              required
              helperText="Mandatory commercial vendor partner code for custody tracking."
            />
          )}

          {/* Staff ID & Timestamp */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Releasing Staff Member ID *"
              size="small"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. STAFF-001"
              required
              sx={{ flex: 1 }}
            />
            <TextField
              label="Release Date & Time"
              type="datetime-local"
              size="small"
              value={releasedAt}
              onChange={(e) => setReleasedAt(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          {/* Commercial Notice */}
          <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
            Processing route is an operational assignment and does not alter resident charge rates.
          </Alert>

          <Divider />

          {/* Release Notes */}
          <TextField
            label="Handover / Processing Notes"
            multiline
            rows={2}
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. 1 bag handed over to vendor driver"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<LocalShipping />}
          onClick={handleSubmit}
          disabled={isSubmitting || !detail.isInspected || !staffId.trim()}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {isSubmitting ? 'Releasing...' : 'Release to Processing'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
