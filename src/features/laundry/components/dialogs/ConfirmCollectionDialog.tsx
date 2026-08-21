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
  Paper,
  FormControlLabel,
  Checkbox,
  Alert,
  Divider,
} from '@mui/material';
import { Checklist, VerifiedUser } from '@mui/icons-material';
import type { LaundryTransactionSummaryViewModel } from '../../application/models/LaundryWorkspaceViewModel';
import type { ConfirmCollectionDTO } from '../../application/dtos/laundryDTOs';

interface ConfirmCollectionDialogProps {
  open: boolean;
  transaction: LaundryTransactionSummaryViewModel | null;
  onClose: () => void;
  onSubmit: (dto: ConfirmCollectionDTO) => Promise<any>;
}

export function ConfirmCollectionDialog({
  open,
  transaction,
  onClose,
  onSubmit,
}: ConfirmCollectionDialogProps) {
  const [staffId, setStaffId] = useState<string>('STAFF-001');
  const [bagCount, setBagCount] = useState<string>('1');
  const [bagTagsText, setBagTagsText] = useState<string>('');
  const [photoUrisText, setPhotoUrisText] = useState<string>('');
  const [residentVerified, setResidentVerified] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStaffId('STAFF-001');
      setBagCount('1');
      setBagTagsText('');
      setPhotoUrisText('');
      setResidentVerified(true);
      setNotes('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [open]);

  if (!transaction) {
    return null;
  }

  const handleSubmit = async () => {
    if (!staffId.trim()) {
      setError('Staff ID is required to confirm physical intake.');
      return;
    }

    const parsedBagCount = bagCount ? parseInt(bagCount, 10) : undefined;
    if (parsedBagCount !== undefined && (isNaN(parsedBagCount) || parsedBagCount <= 0)) {
      setError('Bag count must be a positive integer.');
      return;
    }

    const tagNumbers = bagTagsText
      ? bagTagsText.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    const photoUris = photoUrisText
      ? photoUrisText.split(',').map((p) => p.trim()).filter(Boolean)
      : undefined;

    setError(null);
    setIsSubmitting(true);

    try {
      const dto: ConfirmCollectionDTO = {
        transactionId: transaction.id,
        staffId: staffId.trim(),
        bagCount: parsedBagCount,
        bagTagNumbers: tagNumbers,
        photoUris,
        residentVerified,
        notes: notes ? notes.trim() : undefined,
      };

      await onSubmit(dto);
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm collection baseline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Checklist color="warning" /> Confirm Collection Baseline ({transaction.id})
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Transaction Summary Card */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {transaction.residentName} ({transaction.residentCode})
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {transaction.locationSummary} • Total Physical Pieces: {transaction.totalPhysicalPieces}
            </Typography>
            <Typography variant="caption" color="warning.dark" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
              Confirmation establishes the immutable historical collection baseline and locks active charge rate snapshots.
            </Typography>
          </Paper>

          {/* Staff ID */}
          <TextField
            label="Staff Member ID *"
            size="small"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            placeholder="e.g. STAFF-001"
            required
            helperText="Operational accountability for physical laundry handover."
          />

          {/* Bag Count & Bag Tags */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Laundry Bags Received"
              size="small"
              type="number"
              value={bagCount}
              onChange={(e) => setBagCount(e.target.value)}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              sx={{ width: { xs: '100%', sm: 140 } }}
            />
            <TextField
              label="Bag Tag Barcode(s)"
              size="small"
              value={bagTagsText}
              onChange={(e) => setBagTagsText(e.target.value)}
              placeholder="e.g. TAG-101, TAG-102"
              sx={{ flex: 1 }}
              helperText="Comma-separated physical bag tags"
            />
          </Stack>

          {/* Intake Photographs (Evidence References) */}
          <TextField
            label="Intake Photo URIs / Evidence References"
            size="small"
            value={photoUrisText}
            onChange={(e) => setPhotoUrisText(e.target.value)}
            placeholder="evidence://photo-bag-01.jpg, evidence://photo-bag-02.jpg"
            helperText="Optional transient collection evidence references (comma-separated)"
          />

          {/* Resident Verified Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={residentVerified}
                onChange={(e) => setResidentVerified(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2">
                Physical garment count verified directly with resident at intake
              </Typography>
            }
          />

          <Divider />

          {/* Notes */}
          <TextField
            label="Confirmation Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            size="small"
            placeholder="e.g. 2 bags sealed in presence of resident"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="warning"
          startIcon={<VerifiedUser />}
          onClick={handleSubmit}
          disabled={isSubmitting || !staffId.trim()}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {isSubmitting ? 'Confirming...' : 'Confirm Collection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
