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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { SearchOutlined, AddPhotoAlternate, Clear } from '@mui/icons-material';
import type {
  LaundryTransactionDetailViewModel,
  ExceptionViewModel,
} from '../../application/models/LaundryWorkspaceViewModel';
import type { RecordInvestigationDTO } from '../../application/dtos/laundryDTOs';
import { ResponsibleParty } from '../../domain/valueObjects/ResponsibleParty';

interface RecordInvestigationDialogProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  exception: ExceptionViewModel | null;
  onClose: () => void;
  onSubmit: (dto: RecordInvestigationDTO) => Promise<any>;
}

const RESPONSIBLE_PARTY_OPTIONS: { value: ResponsibleParty; label: string }[] = [
  { value: ResponsibleParty.VENDOR, label: 'External Vendor' },
  { value: ResponsibleParty.RESIDENT, label: 'Resident' },
  { value: ResponsibleParty.RPGMS, label: 'RPGMS Staff / Internal Operations' },
  { value: ResponsibleParty.UNKNOWN, label: 'Unknown / Under Determination' },
  { value: ResponsibleParty.NONE, label: 'None / Non-Attributable' },
  { value: ResponsibleParty.OTHER, label: 'Other External Party' },
];

export function RecordInvestigationDialog({
  open,
  detail,
  exception,
  onClose,
  onSubmit,
}: RecordInvestigationDialogProps) {
  const [investigatorStaffId, setInvestigatorStaffId] = useState<string>('STAFF-001');
  const [findings, setFindings] = useState<string>('');
  const [responsibleParty, setResponsibleParty] = useState<string>('');
  const [photoUriInput, setPhotoUriInput] = useState<string>('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && exception) {
      setInvestigatorStaffId('STAFF-001');
      setFindings('');
      setResponsibleParty('');
      setPhotoUriInput('');
      setPhotoUris([]);
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, exception]);

  if (!detail || !exception) {
    return null;
  }

  const handleAddPhotoUri = () => {
    const trimmed = photoUriInput.trim();
    if (trimmed && !photoUris.includes(trimmed)) {
      setPhotoUris((prev) => [...prev, trimmed]);
      setPhotoUriInput('');
    }
  };

  const handleRemovePhotoUri = (uriToRemove: string) => {
    setPhotoUris((prev) => prev.filter((u) => u !== uriToRemove));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!investigatorStaffId.trim()) {
      setError('Investigator Staff ID is required.');
      return;
    }
    if (!findings.trim()) {
      setError('Investigation findings description is required.');
      return;
    }

    const dto: RecordInvestigationDTO = {
      transactionId: detail.id,
      exceptionId: exception.id,
      investigatorStaffId: investigatorStaffId.trim(),
      findings: findings.trim(),
      responsibleParty: responsibleParty ? (responsibleParty as ResponsibleParty) : undefined,
      photoUris: photoUris.length > 0 ? photoUris : undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(dto);
    } catch (err: any) {
      setError(err?.message || 'Failed to record investigation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <SearchOutlined color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Record Exception Investigation
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Document operational findings, evidence, and responsible party for exception {exception.id}
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
                {exception.itemName && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Target Item: <strong>{exception.itemName}</strong> • Affected: {exception.affectedQuantity} pc(s)
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Raised by {exception.raisedByStaffId} on {exception.raisedAtFormatted}
              </Typography>
            </Stack>
          </Paper>

          {/* Form Controls */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Investigator Staff ID */}
            <TextField
              label="Investigator Staff ID"
              size="small"
              value={investigatorStaffId}
              onChange={(e) => setInvestigatorStaffId(e.target.value)}
              required
              disabled={isSubmitting}
              sx={{ flex: 1 }}
            />

            {/* Responsible Party Attribution */}
            <FormControl size="small" sx={{ flex: 1.5 }}>
              <InputLabel id="responsible-party-label">Responsible Party (Operational Finding)</InputLabel>
              <Select
                labelId="responsible-party-label"
                value={responsibleParty}
                label="Responsible Party (Operational Finding)"
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

          {/* Findings Description */}
          <TextField
            label="Investigation Findings & Operational Notes"
            multiline
            rows={4}
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="Detail investigation steps taken, discussion with resident/vendor, physical verification, or root cause..."
            required
            disabled={isSubmitting}
            fullWidth
          />

          <Divider />

          {/* Photo / Evidence URIs */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddPhotoAlternate fontSize="small" color="action" /> Investigation Evidence References (Optional)
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Enter evidence URI reference (e.g. photo://investigation/inv-001.jpg)..."
                value={photoUriInput}
                onChange={(e) => setPhotoUriInput(e.target.value)}
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPhotoUri();
                  }
                }}
                slotProps={{
                  input: {
                    endAdornment: photoUriInput ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setPhotoUriInput('')}>
                          <Clear fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
              <Button variant="outlined" onClick={handleAddPhotoUri} disabled={isSubmitting || !photoUriInput.trim()}>
                Add
              </Button>
            </Stack>

            {photoUris.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {photoUris.map((uri, idx) => (
                  <Chip
                    key={idx}
                    label={uri}
                    size="small"
                    onDelete={isSubmitting ? undefined : () => handleRemovePhotoUri(uri)}
                    variant="outlined"
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting || !investigatorStaffId.trim() || !findings.trim()}
          sx={{ fontWeight: 700, textTransform: 'none', px: 3 }}
        >
          {isSubmitting ? 'Recording...' : 'Record Investigation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
