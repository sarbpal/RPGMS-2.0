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
  FormControlLabel,
  Checkbox,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { WarningAmber, AddPhotoAlternate, Clear } from '@mui/icons-material';
import type { LaundryTransactionDetailViewModel } from '../../application/models/LaundryWorkspaceViewModel';
import type { RaiseExceptionDTO } from '../../application/dtos/laundryDTOs';
import { LaundryExceptionType } from '../../domain/valueObjects/LaundryExceptionType';

interface RaiseExceptionDialogProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  onClose: () => void;
  onSubmit: (dto: RaiseExceptionDTO) => Promise<any>;
}

const EXCEPTION_TYPE_OPTIONS: { value: LaundryExceptionType; label: string }[] = [
  { value: LaundryExceptionType.MISSING, label: 'Missing Item (Not Returned)' },
  { value: LaundryExceptionType.DAMAGED, label: 'Damaged Item (Tears, Stains, Defects)' },
  { value: LaundryExceptionType.EXISTING_CONDITION_DISPUTE, label: 'Existing Condition Dispute' },
  { value: LaundryExceptionType.WRONG_ITEM_RETURNED, label: 'Wrong Item Returned' },
  { value: LaundryExceptionType.IDENTITY_DISPUTE, label: 'Identity Dispute (Resident Disowns Item)' },
  { value: LaundryExceptionType.SERVICE_NOT_PERFORMED, label: 'Service Not Performed' },
  { value: LaundryExceptionType.SERVICE_NOT_PERFORMED_AS_REQUESTED, label: 'Service Not Performed as Requested' },
  { value: LaundryExceptionType.QUALITY_ISSUE, label: 'Quality Issue / Substandard Cleaning' },
  { value: LaundryExceptionType.QUANTITY_DISCREPANCY, label: 'Quantity Discrepancy' },
  { value: LaundryExceptionType.OTHER, label: 'Other Operational Exception' },
];

export function RaiseExceptionDialog({
  open,
  detail,
  onClose,
  onSubmit,
}: RaiseExceptionDialogProps) {
  const [staffId, setStaffId] = useState<string>('STAFF-001');
  const [type, setType] = useState<LaundryExceptionType>(LaundryExceptionType.MISSING);
  const [garmentLineId, setGarmentLineId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('');
  const [affectedQuantity, setAffectedQuantity] = useState<number>(1);
  const [isBlocking, setIsBlocking] = useState<boolean>(false);
  const [description, setDescription] = useState<string>('');
  const [photoUriInput, setPhotoUriInput] = useState<string>('');
  const [photoUris, setPhotoUris] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && detail) {
      setStaffId('STAFF-001');
      setType(LaundryExceptionType.MISSING);
      setGarmentLineId('');
      setServiceId('');
      setAffectedQuantity(1);
      setIsBlocking(false);
      setDescription('');
      setPhotoUriInput('');
      setPhotoUris([]);
      setError(null);
      setIsSubmitting(false);
    }
  }, [open, detail]);

  if (!detail) {
    return null;
  }

  const selectedLine = garmentLineId
    ? detail.garmentLines.find((gl) => gl.id === garmentLineId)
    : undefined;

  const handleGarmentLineChange = (newLineId: string) => {
    setGarmentLineId(newLineId);
    setServiceId('');
    if (newLineId) {
      const line = detail.garmentLines.find((gl) => gl.id === newLineId);
      if (line && affectedQuantity > line.physicalQuantity) {
        setAffectedQuantity(line.physicalQuantity);
      }
    }
  };

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

    if (!staffId.trim()) {
      setError('Staff ID is required.');
      return;
    }
    if (!description.trim()) {
      setError('Exception description is required.');
      return;
    }
    if (typeof affectedQuantity !== 'number' || isNaN(affectedQuantity) || affectedQuantity <= 0 || !Number.isInteger(affectedQuantity)) {
      setError('Affected quantity must be a positive integer.');
      return;
    }

    const dto: RaiseExceptionDTO = {
      transactionId: detail.id,
      staffId: staffId.trim(),
      type,
      description: description.trim(),
      affectedQuantity,
      garmentLineId: garmentLineId ? garmentLineId : undefined,
      serviceId: garmentLineId && serviceId ? serviceId : undefined,
      isBlocking: isBlocking ? true : undefined,
      photoUris: photoUris.length > 0 ? photoUris : undefined,
    };

    setIsSubmitting(true);
    try {
      await onSubmit(dto);
    } catch (err: any) {
      setError(err?.message || 'Failed to raise operational exception.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <WarningAmber color="warning" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Raise Operational Exception
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">
          Record a problem, damage, missing item, or service discrepancy against transaction {detail.id}
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Context Header */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Resident / Location
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {detail.residentName} ({detail.residentCode}) • {detail.locationSummary}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Collected Pieces
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {detail.totalPhysicalPieces} pcs
                </Typography>
              </Box>
            </Stack>
          </Paper>

          {/* Form Controls */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Staff ID */}
            <TextField
              label="Staff ID"
              size="small"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              required
              disabled={isSubmitting}
              sx={{ flex: 1 }}
            />

            {/* Exception Type */}
            <FormControl size="small" required sx={{ flex: 1.5 }}>
              <InputLabel id="exception-type-label">Exception Type</InputLabel>
              <Select
                labelId="exception-type-label"
                value={type}
                label="Exception Type"
                onChange={(e) => setType(e.target.value as LaundryExceptionType)}
                disabled={isSubmitting}
              >
                {EXCEPTION_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Exception Targeting: Garment Line & Service Allocation */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {/* Garment Line Target */}
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel id="garment-line-target-label">Target Garment Line</InputLabel>
              <Select
                labelId="garment-line-target-label"
                value={garmentLineId}
                label="Target Garment Line"
                onChange={(e) => handleGarmentLineChange(e.target.value)}
                disabled={isSubmitting}
              >
                <MenuItem value="">
                  <em>Entire Order / Not Garment-Specific</em>
                </MenuItem>
                {detail.garmentLines.map((line) => (
                  <MenuItem key={line.id} value={line.id}>
                    {line.itemName} ({line.physicalQuantity} pcs collected)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Service Target */}
            <FormControl size="small" sx={{ flex: 1 }} disabled={isSubmitting || !garmentLineId || !selectedLine}>
              <InputLabel id="service-target-label">Target Service</InputLabel>
              <Select
                labelId="service-target-label"
                value={serviceId}
                label="Target Service"
                onChange={(e) => setServiceId(e.target.value)}
              >
                <MenuItem value="">
                  <em>All Services on Item</em>
                </MenuItem>
                {selectedLine?.serviceAllocations.map((sa) => (
                  <MenuItem key={sa.serviceId} value={sa.serviceId}>
                    {sa.serviceName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
            {/* Affected Quantity */}
            <TextField
              label="Affected Quantity"
              type="number"
              size="small"
              value={affectedQuantity}
              onChange={(e) => setAffectedQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              slotProps={{ htmlInput: { min: 1, max: selectedLine ? selectedLine.physicalQuantity : detail.totalPhysicalPieces } }}
              required
              disabled={isSubmitting}
              sx={{ flex: 1 }}
              helperText={
                selectedLine
                  ? `Max ${selectedLine.physicalQuantity} pcs on selected line`
                  : `Max ${detail.totalPhysicalPieces} pcs on order`
              }
            />

            {/* Is Blocking Toggle */}
            <Box sx={{ flex: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isBlocking}
                    onChange={(e) => setIsBlocking(e.target.checked)}
                    disabled={isSubmitting}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Request Delivery Blocking
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Flags this issue as blocking delivery of affected garments
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Stack>

          {/* Description */}
          <TextField
            label="Exception Description & Operational Findings"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the discrepancy, damage location, missing pieces, or resident dispute..."
            required
            disabled={isSubmitting}
            fullWidth
          />

          <Divider />

          {/* Photo / Evidence URIs */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddPhotoAlternate fontSize="small" color="action" /> Supporting Evidence References (Optional)
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Enter evidence URI reference (e.g. photo://laundry/dmg-001.jpg)..."
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
          color="warning"
          disabled={isSubmitting || !staffId.trim() || !description.trim() || affectedQuantity < 1}
          sx={{ fontWeight: 700, textTransform: 'none', px: 3 }}
        >
          {isSubmitting ? 'Raising Exception...' : 'Raise Exception'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
