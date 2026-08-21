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
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  SearchOutlined,
  Add,
  Delete,
  VerifiedUser,
} from '@mui/icons-material';
import type { LaundryTransactionDetailViewModel } from '../../application/models/LaundryWorkspaceViewModel';
import type {
  RecordInspectionDTO,
  ConditionObservationInputDTO,
} from '../../application/dtos/laundryDTOs';

interface RecordInspectionDialogProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  onClose: () => void;
  onSubmit: (dto: RecordInspectionDTO) => Promise<any>;
}

const OBSERVATION_TYPES = [
  { value: 'STAIN', label: 'Stain / Discoloration' },
  { value: 'TEAR', label: 'Tear / Ripped Seam' },
  { value: 'BUTTON_MISSING', label: 'Missing Button(s)' },
  { value: 'COLOR_FADE', label: 'Color Fading / Bleeding' },
  { value: 'FABRIC_DAMAGE', label: 'Fabric / Thread Damage' },
  { value: 'EXISTING_DAMAGE', label: 'Prior Existing Defect' },
  { value: 'OTHER', label: 'Other Condition' },
];

export function RecordInspectionDialog({
  open,
  detail,
  onClose,
  onSubmit,
}: RecordInspectionDialogProps) {
  const [staffId, setStaffId] = useState<string>('STAFF-001');
  const [inspectedAt, setInspectedAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Staging form state for adding a condition observation
  const [selectedGarmentLineId, setSelectedGarmentLineId] = useState<string>('');
  const [observationType, setObservationType] = useState<string>('STAIN');
  const [affectedQuantity, setAffectedQuantity] = useState<number>(1);
  const [description, setDescription] = useState<string>('');
  const [photoUrisText, setPhotoUrisText] = useState<string>('');
  const [stagedObservations, setStagedObservations] = useState<ConditionObservationInputDTO[]>([]);

  useEffect(() => {
    if (open && detail) {
      setStaffId('STAFF-001');
      setInspectedAt(new Date().toISOString().slice(0, 16));
      setNotes('');
      setError(null);
      setIsSubmitting(false);
      setStagedObservations([]);
      setSelectedGarmentLineId(detail.garmentLines[0]?.id || '');
      setObservationType('STAIN');
      setAffectedQuantity(1);
      setDescription('');
      setPhotoUrisText('');
    }
  }, [open, detail]);

  if (!detail) {
    return null;
  }

  const selectedLine = detail.garmentLines.find((l) => l.id === selectedGarmentLineId);
  const maxQuantity = selectedLine ? selectedLine.physicalQuantity : 1;

  const handleAddObservation = () => {
    if (!selectedGarmentLineId) {
      setError('Please select a target garment line for the observation.');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description for the condition observation.');
      return;
    }
    if (affectedQuantity <= 0 || affectedQuantity > maxQuantity) {
      setError(`Affected quantity must be between 1 and ${maxQuantity}.`);
      return;
    }

    const photoUris = photoUrisText
      ? photoUrisText.split(',').map((u) => u.trim()).filter(Boolean)
      : undefined;

    const newObs: ConditionObservationInputDTO = {
      garmentLineId: selectedGarmentLineId,
      observationType,
      description: description.trim(),
      affectedQuantity,
      photoUris,
    };

    setStagedObservations((prev) => [...prev, newObs]);
    setDescription('');
    setPhotoUrisText('');
    setAffectedQuantity(1);
    setError(null);
  };

  const handleRemoveObservation = (index: number) => {
    setStagedObservations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!staffId.trim()) {
      setError('Staff ID is required to complete inspection sign-off.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const dto: RecordInspectionDTO = {
        transactionId: detail.id,
        staffId: staffId.trim(),
        inspectedAt: inspectedAt ? new Date(inspectedAt).toISOString() : new Date().toISOString(),
        conditionObservations: stagedObservations.length > 0 ? stagedObservations : undefined,
        notes: notes ? notes.trim() : undefined,
      };

      await onSubmit(dto);
    } catch (err: any) {
      setError(err?.message || 'Failed to record pre-processing inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <SearchOutlined color="primary" /> Pre-Processing Garment Inspection ({detail.id})
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Transaction Summary Card */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between' }} spacing={1}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {detail.residentName} ({detail.residentCode}) — {detail.locationSummary}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Order Created: {detail.createdAtFormatted} • Total Physical Pieces: {detail.totalPhysicalPieces}
                </Typography>
              </Box>
              <Chip size="small" label={detail.statusLabel} color="info" sx={{ fontWeight: 600 }} />
            </Stack>
          </Paper>

          {/* Staff Member & Inspection Timestamp */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Inspected By Staff ID *"
              size="small"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. STAFF-001"
              required
              sx={{ flex: 1 }}
            />
            <TextField
              label="Inspection Date & Time"
              type="datetime-local"
              size="small"
              value={inspectedAt}
              onChange={(e) => setInspectedAt(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          {/* Garment Lines Overview */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
              Garment Lines to Inspect
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Pieces</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Requested Services</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Existing Observations</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.garmentLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {line.itemName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {line.physicalQuantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                          {line.serviceAllocations.map((sa) => (
                            <Chip key={sa.id} size="small" label={sa.serviceName} variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          ))}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        {line.conditionObservations && line.conditionObservations.length > 0 ? (
                          <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 600 }}>
                            {line.conditionObservations.length} observation(s) recorded
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            None
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Divider />

          {/* Condition Observation Staging Builder */}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Record Condition Observation(s)
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Document existing defects, tears, stains, or missing buttons prior to cleaning release. (Optional if items are in clean condition).
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.paper' }}>
              <Stack spacing={2}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  {/* Select Target Garment Line */}
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel id="target-line-select-label">Target Garment Line *</InputLabel>
                    <Select
                      labelId="target-line-select-label"
                      value={selectedGarmentLineId}
                      label="Target Garment Line *"
                      onChange={(e) => setSelectedGarmentLineId(e.target.value)}
                    >
                      {detail.garmentLines.map((line) => (
                        <MenuItem key={line.id} value={line.id}>
                          {line.itemName} ({line.physicalQuantity} pcs)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Select Observation Type */}
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel id="obs-type-select-label">Defect Category *</InputLabel>
                    <Select
                      labelId="obs-type-select-label"
                      value={observationType}
                      label="Defect Category *"
                      onChange={(e) => setObservationType(e.target.value)}
                    >
                      {OBSERVATION_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Affected Quantity */}
                  <TextField
                    label="Affected Pcs *"
                    type="number"
                    size="small"
                    value={affectedQuantity}
                    onChange={(e) => setAffectedQuantity(parseInt(e.target.value, 10) || 1)}
                    slotProps={{ htmlInput: { min: 1, max: maxQuantity } }}
                    sx={{ width: { xs: '100%', sm: 120 } }}
                    helperText={`Max: ${maxQuantity}`}
                  />
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start' }}>
                  {/* Description */}
                  <TextField
                    label="Condition Description *"
                    size="small"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Deep ink stain on front pocket"
                    sx={{ flex: 2 }}
                  />

                  {/* Photo URIs */}
                  <TextField
                    label="Photo Evidence URI(s)"
                    size="small"
                    value={photoUrisText}
                    onChange={(e) => setPhotoUrisText(e.target.value)}
                    placeholder="evidence://tear-01.jpg"
                    sx={{ flex: 1.5 }}
                    helperText="Optional comma-separated URIs"
                  />

                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<Add />}
                    onClick={handleAddObservation}
                    sx={{ mt: { xs: 1, sm: 0 }, height: 40, whiteSpace: 'nowrap', textTransform: 'none' }}
                  >
                    Stage Defect
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            {/* List of Staged Observations */}
            {stagedObservations.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1 }}>
                  Staged Condition Observations ({stagedObservations.length}):
                </Typography>
                <Stack spacing={1}>
                  {stagedObservations.map((obs, idx) => {
                    const line = detail.garmentLines.find((l) => l.id === obs.garmentLineId);
                    return (
                      <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, borderColor: 'warning.main', bgcolor: '#fffdf9' }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {line?.itemName || obs.garmentLineId} — {obs.observationType} ({obs.affectedQuantity} pc)
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {obs.description}
                            </Typography>
                            {obs.photoUris && obs.photoUris.length > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                Photos: {obs.photoUris.join(', ')}
                              </Typography>
                            )}
                          </Box>
                          <IconButton size="small" color="error" onClick={() => handleRemoveObservation(idx)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Box>

          <Divider />

          {/* General Inspection Notes */}
          <TextField
            label="General Inspection Summary / Notes"
            multiline
            rows={2}
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. All 4 items physically inspected before release."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<VerifiedUser />}
          onClick={handleSubmit}
          disabled={isSubmitting || !staffId.trim()}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {isSubmitting ? 'Saving Inspection...' : 'Complete Inspection Sign-Off'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
