import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  IconButton,
  FormHelperText,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import { Add, Delete, LocalLaundryService } from '@mui/icons-material';
import type {
  SelectableLaundryStayItem,
  LaundryMasterCatalogViewModel,
} from '../../application/models/LaundryWorkspaceViewModel';
import type {
  CreateCollectionDraftDTO,
  GarmentLineDraftDTO,
} from '../../application/dtos/laundryDTOs';

interface GarmentLineDraftState {
  itemId: string;
  quantity: number;
  selectedServiceIds: string[];
  notes?: string;
}

interface CreateCollectionDraftDialogProps {
  open: boolean;
  selectableStays: readonly SelectableLaundryStayItem[];
  masterCatalog: LaundryMasterCatalogViewModel | null;
  onClose: () => void;
  onSubmit: (dto: CreateCollectionDraftDTO) => Promise<any>;
}

export function CreateCollectionDraftDialog({
  open,
  selectableStays,
  masterCatalog,
  onClose,
  onSubmit,
}: CreateCollectionDraftDialogProps) {
  const [selectedStayId, setSelectedStayId] = useState<string>('');
  const [lines, setLines] = useState<GarmentLineDraftState[]>([
    { itemId: 'LITM-001', quantity: 1, selectedServiceIds: ['LSRV-001'] },
  ]);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedStayId('');
      setLines([{ itemId: masterCatalog?.items[0]?.id || 'LITM-001', quantity: 1, selectedServiceIds: ['LSRV-001'] }]);
      setNotes('');
      setValidationError(null);
      setIsSubmitting(false);
    }
  }, [open, masterCatalog]);

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        itemId: masterCatalog?.items[0]?.id || '',
        quantity: 1,
        selectedServiceIds: ['LSRV-001'],
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index: number, itemId: string) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, itemId } : line))
    );
  };

  const handleLineQuantityChange = (index: number, quantity: number) => {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, quantity: Math.max(1, quantity) } : line))
    );
  };

  const handleServiceToggle = (index: number, serviceId: string) => {
    setLines((prev) =>
      prev.map((line, i) => {
        if (i !== index) return line;
        const exists = line.selectedServiceIds.includes(serviceId);
        const selectedServiceIds = exists
          ? line.selectedServiceIds.filter((id) => id !== serviceId)
          : [...line.selectedServiceIds, serviceId];
        return { ...line, selectedServiceIds };
      })
    );
  };

  const handleSubmit = async () => {
    if (!selectedStayId) {
      setValidationError('Please select an active resident stay.');
      return;
    }

    const selectedStay = selectableStays.find((s) => s.stayId === selectedStayId);
    if (!selectedStay) {
      setValidationError('Selected stay was not found.');
      return;
    }

    if (lines.length === 0) {
      setValidationError('At least one garment line must be added.');
      return;
    }

    for (const [idx, line] of lines.entries()) {
      if (!line.itemId) {
        setValidationError(`Garment line #${idx + 1} has no item selected.`);
        return;
      }
      if (line.quantity <= 0 || !Number.isInteger(line.quantity)) {
        setValidationError(`Garment line #${idx + 1} quantity must be a positive integer.`);
        return;
      }
      if (line.selectedServiceIds.length === 0) {
        setValidationError(`Garment line #${idx + 1} must have at least one service requested.`);
        return;
      }
    }

    setValidationError(null);
    setIsSubmitting(true);

    try {
      const garmentLinesDto: GarmentLineDraftDTO[] = lines.map((l) => ({
        itemId: l.itemId,
        physicalQuantity: l.quantity,
        serviceIds: l.selectedServiceIds,
        notes: l.notes,
      }));

      const dto: CreateCollectionDraftDTO = {
        stayId: selectedStay.stayId,
        residentId: selectedStay.residentId,
        garmentLines: garmentLinesDto,
        notes: notes ? notes.trim() : undefined,
      };

      await onSubmit(dto);
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to create collection draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalLaundryService color="primary" /> Create New Laundry Collection Draft
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {validationError && <Alert severity="error">{validationError}</Alert>}

          {/* 1. Stay & Resident Selection */}
          <FormControl fullWidth size="small">
            <InputLabel id="select-stay-label">Select Active Resident Stay *</InputLabel>
            <Select
              labelId="select-stay-label"
              value={selectedStayId}
              label="Select Active Resident Stay *"
              onChange={(e) => setSelectedStayId(e.target.value)}
            >
              {selectableStays.map((s) => (
                <MenuItem key={s.stayId} value={s.stayId}>
                  {s.residentName} ({s.residentCode}) — {s.locationSummary}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Only active or on-notice resident stays are eligible for laundry service.</FormHelperText>
          </FormControl>

          <Divider />

          {/* 2. Garment Lines & Services */}
          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Garment Lines & Requested Services
              </Typography>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={handleAddLine}
                variant="outlined"
                sx={{ textTransform: 'none' }}
              >
                Add Item Line
              </Button>
            </Stack>

            <Stack spacing={2}>
              {lines.map((line, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
                    {/* Item Dropdown */}
                    <FormControl size="small" sx={{ minWidth: 160, flex: 2 }}>
                      <InputLabel id={`item-select-label-${index}`}>Laundry Item *</InputLabel>
                      <Select
                        labelId={`item-select-label-${index}`}
                        value={line.itemId}
                        label="Laundry Item *"
                        onChange={(e) => handleLineItemChange(index, e.target.value)}
                      >
                        {(masterCatalog?.items || []).map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.name} ({item.code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Quantity */}
                    <TextField
                      size="small"
                      label="Piece Count *"
                      type="number"
                      value={line.quantity}
                      onChange={(e) => handleLineQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                      slotProps={{ htmlInput: { min: 1, step: 1 } }}
                      sx={{ width: { xs: '100%', sm: 110 } }}
                    />

                    {/* Remove Line Button */}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveLine(index)}
                      disabled={lines.length === 1}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Stack>

                  {/* Requested Services Checkboxes */}
                  <Box sx={{ mt: 1.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 0.5 }}>
                      Requested Services for these {line.quantity} piece(s):
                    </Typography>
                    <FormGroup row>
                      {(masterCatalog?.services || []).map((service) => {
                        const isChecked = line.selectedServiceIds.includes(service.id);
                        return (
                          <FormControlLabel
                            key={service.id}
                            control={
                              <Checkbox
                                size="small"
                                checked={isChecked}
                                onChange={() => handleServiceToggle(index, service.id)}
                              />
                            }
                            label={
                              <Typography variant="body2">
                                {service.name}
                              </Typography>
                            }
                          />
                        );
                      })}
                    </FormGroup>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </Box>

          <Divider />

          {/* 3. Notes */}
          <TextField
            label="Special Intake Instructions / Staff Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            multiline
            rows={2}
            size="small"
            placeholder="e.g. resident requested delicate cycle or extra starch"
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
          onClick={handleSubmit}
          disabled={isSubmitting || !selectedStayId || lines.length === 0}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {isSubmitting ? 'Creating Draft...' : 'Create Draft'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
