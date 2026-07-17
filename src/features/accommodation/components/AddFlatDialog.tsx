import { useState } from 'react';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { generateBeds } from '../utils/generateBeds';

interface AddFlatDialogProps {
  open: boolean;
  onClose: () => void;
}

interface AreaDraft {
  id: string;
  name: string;
  bedPrefix: string;
  bedCount: number;
  isPrefixManuallyEdited?: boolean;
  touched?: {
    name?: boolean;
    bedPrefix?: boolean;
    bedCount?: boolean;
  };
}

interface FlatDraftArea {
  name: string;
  bedPrefix: string;
  beds: string[];
}

interface FlatDraft {
  flatNumber: string;
  floor: string;
  description: string;
  capacity: number;
  areas: FlatDraftArea[];
}

export function AddFlatDialog({ open, onClose }: AddFlatDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Form local states
  const [flatNumber, setFlatNumber] = useState('');
  const [flatNumberTouched, setFlatNumberTouched] = useState(false);
  const [floor, setFloor] = useState('');
  const [floorTouched, setFloorTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [areas, setAreas] = useState<AreaDraft[]>([]);
  const [newestAreaId, setNewestAreaId] = useState<string | null>(null);
  
  // Developer Section State
  const [draftPreview, setDraftPreview] = useState<FlatDraft | null>(null);

  const handleClose = () => {
    setFlatNumber('');
    setFlatNumberTouched(false);
    setFloor('');
    setFloorTouched(false);
    setDescription('');
    setAreas([]);
    setNewestAreaId(null);
    setDraftPreview(null);
    onClose();
  };

  const toTitleCase = (str: string): string => {
    const trimmed = str.trim();
    if (!trimmed) return '';
    return trimmed
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getSuggestedPrefix = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '';

    const mapping: Record<string, string> = {
      bedroom: 'B',
      hall: 'H',
      'small bedroom': 'SB',
      study: 'ST',
      lobby: 'L',
      balcony: 'BA',
    };

    const lowerName = trimmed.toLowerCase();
    if (mapping[lowerName]) {
      return mapping[lowerName];
    }

    return trimmed
      .split(/\s+/)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const handleAddArea = () => {
    const newId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newArea: AreaDraft = {
      id: newId,
      name: '',
      bedPrefix: '',
      bedCount: 1,
      isPrefixManuallyEdited: false,
      touched: {
        name: false,
        bedPrefix: false,
        bedCount: false,
      },
    };
    setAreas((prev) => [...prev, newArea]);
    setNewestAreaId(newId);
  };

  const handleUpdateArea = <K extends keyof AreaDraft>(
    id: string,
    key: K,
    value: AreaDraft[K]
  ) => {
    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== id) return area;

        const updated = { ...area, [key]: value };

        // Auto-normalization / Suggestion mapping rules
        if (key === 'name') {
          // If prefix wasn't manually edited, update suggestion
          if (!area.isPrefixManuallyEdited) {
            updated.bedPrefix = getSuggestedPrefix(value as string);
          }
        } else if (key === 'bedPrefix') {
          const valStr = (value as string).trim();
          if (valStr === '') {
            // cleared prefix -> resume auto-suggestions
            updated.isPrefixManuallyEdited = false;
            updated.bedPrefix = getSuggestedPrefix(area.name);
          } else {
            updated.isPrefixManuallyEdited = true;
          }
        }

        return updated;
      })
    );
  };

  const handleBlurField = (id: string, field: 'name' | 'bedPrefix' | 'bedCount') => {
    setAreas((prev) =>
      prev.map((area) => {
        if (area.id !== id) return area;

        const updated = {
          ...area,
          touched: {
            ...area.touched,
            [field]: true,
          },
        };

        // Normalize on Blur
        if (field === 'name') {
          updated.name = toTitleCase(area.name);
          if (!area.isPrefixManuallyEdited) {
            updated.bedPrefix = getSuggestedPrefix(updated.name);
          }
        } else if (field === 'bedPrefix') {
          updated.bedPrefix = area.bedPrefix.trim().toUpperCase();
        }

        return updated;
      })
    );
  };

  const handleDeleteArea = (id: string) => {
    setAreas((prev) => prev.filter((area) => area.id !== id));
    if (newestAreaId === id) {
      setNewestAreaId(null);
    }
  };

  // Duplicate checks helpers
  const hasDuplicateName = (id: string, name: string): boolean => {
    const cleaned = name.trim().toLowerCase();
    if (!cleaned) return false;
    return areas.some((a) => a.id !== id && a.name.trim().toLowerCase() === cleaned);
  };

  const hasDuplicatePrefix = (id: string, prefix: string): boolean => {
    const cleaned = prefix.trim().toUpperCase();
    if (!cleaned) return false;
    return areas.some((a) => a.id !== id && a.bedPrefix.trim().toUpperCase() === cleaned);
  };

  // Derive form-wide validation state
  const isFlatNumberValid = flatNumber.trim() !== '';
  const isFloorValid = floor !== '';
  const hasAreas = areas.length > 0;

  const trimmedNames = areas.map((a) => a.name.trim().toLowerCase());
  const hasDuplicateNames = trimmedNames.some(
    (name, index) => name !== '' && trimmedNames.indexOf(name) !== index
  );

  const trimmedPrefixes = areas.map((a) => a.bedPrefix.trim().toUpperCase());
  const hasDuplicatePrefixes = trimmedPrefixes.some(
    (prefix, index) => prefix !== '' && trimmedPrefixes.indexOf(prefix) !== index
  );

  const areAreasValid = areas.every((area) => {
    const isNameValid = area.name.trim() !== '';
    const isPrefixValid = area.bedPrefix.trim() !== '';
    const isCountValid = !isNaN(area.bedCount) && area.bedCount > 0;

    const isNameUnique = !hasDuplicateName(area.id, area.name);
    const isPrefixUnique = !hasDuplicatePrefix(area.id, area.bedPrefix);

    return isNameValid && isPrefixValid && isCountValid && isNameUnique && isPrefixUnique;
  });

  const isFormValid =
    isFlatNumberValid &&
    isFloorValid &&
    hasAreas &&
    areAreasValid &&
    !hasDuplicateNames &&
    !hasDuplicatePrefixes;

  // Run layout preview calculation
  const previewResult = generateBeds(areas);

  // Form submission handler
  const handleCreateFlat = () => {
    const bedsResult = generateBeds(areas);
    
    const draft: FlatDraft = {
      flatNumber: flatNumber.trim().toUpperCase(),
      floor: floor.toUpperCase(),
      description: description.trim(),
      capacity: bedsResult.totalCapacity,
      areas: bedsResult.areas.map((a) => ({
        name: a.name,
        bedPrefix: a.bedPrefix,
        beds: a.bedIds,
      })),
    };

    // log to developer console
    console.log('Flat Draft Object Created:', draft);

    // Save state for developer preview section
    setDraftPreview(draft);
  };

  return (
    <Dialog
      fullScreen={isMobile}
      fullWidth
      maxWidth="md"
      open={open}
      onClose={handleClose}
      aria-labelledby="add-flat-dialog-title"
    >
      <DialogTitle id="add-flat-dialog-title">
        Add Flat
      </DialogTitle>
      
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1, mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            Flat Details
          </Typography>

          <TextField
            required
            fullWidth
            id="flat-number"
            label="Flat Number"
            value={flatNumber}
            onChange={(e) => setFlatNumber(e.target.value.toUpperCase())}
            onBlur={() => {
              setFlatNumberTouched(true);
              setFlatNumber((prev) => prev.trim());
            }}
            error={flatNumberTouched && !flatNumber.trim()}
            helperText={flatNumberTouched && !flatNumber.trim() ? 'Flat Number is required' : ''}
            placeholder="e.g. G01, 101, 205"
          />

          <FormControl fullWidth required error={floorTouched && !floor}>
            <InputLabel id="floor-select-label">Floor</InputLabel>
            <Select
              labelId="floor-select-label"
              id="floor-select"
              value={floor}
              label="Floor"
              onChange={(e) => {
                setFloor(e.target.value);
                setFloorTouched(true);
              }}
              onBlur={() => setFloorTouched(true)}
            >
              <MenuItem value="Ground">Ground</MenuItem>
              <MenuItem value="First">First</MenuItem>
              <MenuItem value="Second">Second</MenuItem>
              <MenuItem value="Third">Third</MenuItem>
              <MenuItem value="Fourth">Fourth</MenuItem>
            </Select>
            {floorTouched && !floor && (
              <FormHelperText>Floor is required</FormHelperText>
            )}
          </FormControl>

          <TextField
            fullWidth
            id="description"
            label="Description"
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Corner Flat, Near Lift, Recently Renovated"
          />

          <Divider />

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Areas
          </Typography>

          {areas.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                px: 2,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: 'background.default',
                textAlign: 'center',
              }}
            >
              <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                No areas added.
              </Typography>
              <Button
                startIcon={<AddIcon />}
                variant="contained"
                onClick={handleAddArea}
                size="small"
              >
                Add Area
              </Button>
            </Box>
          ) : (
            <Stack spacing={2}>
              {areas.map((area) => {
                const suggested = getSuggestedPrefix(area.name);
                const prefixPlaceholder = suggested ? `${suggested} (Suggested)` : 'e.g. B (Suggested)';

                // Inline field error checks
                const areaNameError = (() => {
                  if (area.touched?.name && !area.name.trim()) {
                    return 'Area Name is required';
                  }
                  if (hasDuplicateName(area.id, area.name)) {
                    return 'Duplicate Area Name';
                  }
                  return '';
                })();

                const bedPrefixError = (() => {
                  if (area.touched?.bedPrefix && !area.bedPrefix.trim()) {
                    return 'Bed Prefix is required';
                  }
                  if (hasDuplicatePrefix(area.id, area.bedPrefix)) {
                    return 'Duplicate Bed Prefix';
                  }
                  return '';
                })();

                const bedCountError = (() => {
                  if (area.touched?.bedCount) {
                    if (isNaN(area.bedCount) || area.bedCount <= 0) {
                      return 'Must be > 0';
                    }
                  }
                  return '';
                })();

                return (
                  <Box
                    key={area.id}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'flex-start' },
                      gap: 2,
                      p: { xs: 2, sm: 0 },
                      border: { xs: '1px solid', sm: 'none' },
                      borderColor: 'divider',
                      borderRadius: 1,
                    }}
                  >
                    <TextField
                      autoFocus={area.id === newestAreaId}
                      label="Area Name"
                      value={area.name}
                      onChange={(e) => handleUpdateArea(area.id, 'name', e.target.value)}
                      onBlur={() => handleBlurField(area.id, 'name')}
                      error={!!areaNameError}
                      helperText={areaNameError}
                      placeholder="e.g. Bedroom, Hall"
                      fullWidth
                      sx={{ flex: 3 }}
                    />
                    <TextField
                      label="Bed Prefix"
                      value={area.bedPrefix}
                      onChange={(e) => handleUpdateArea(area.id, 'bedPrefix', e.target.value.toUpperCase())}
                      onBlur={() => handleBlurField(area.id, 'bedPrefix')}
                      error={!!bedPrefixError}
                      helperText={bedPrefixError || 'Suggested automatically, edit if needed.'}
                      placeholder={prefixPlaceholder}
                      fullWidth
                      sx={{ flex: 2 }}
                    />
                    <TextField
                      label="Beds"
                      type="number"
                      value={area.bedCount === 0 && !area.touched?.bedCount ? '' : area.bedCount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        handleUpdateArea(area.id, 'bedCount', isNaN(val) ? 0 : val);
                      }}
                      onBlur={() => handleBlurField(area.id, 'bedCount')}
                      error={!!bedCountError}
                      helperText={bedCountError}
                      slotProps={{ htmlInput: { min: 1 } }}
                      fullWidth
                      sx={{ flex: 1, minWidth: { sm: '80px' } }}
                    />
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteArea(area.id)}
                      aria-label="Delete Area"
                      tabIndex={-1}
                      sx={{ mt: { xs: 0, sm: 1 }, alignSelf: { xs: 'flex-end', sm: 'center' } }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                );
              })}

              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={handleAddArea}
                size="small"
                sx={{ alignSelf: 'flex-start', mt: 1 }}
              >
                Add Area
              </Button>
            </Stack>
          )}

          {areas.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: 'background.default',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Live Layout Preview
                </Typography>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: 1,
                    mb: 2.5,
                    pb: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Flat: {flatNumber || '—'}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="primary"
                    sx={{
                      fontWeight: 'bold',
                      bgcolor: 'primary.50',
                      color: 'primary.main',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    Capacity: {previewResult.totalCapacity} {previewResult.totalCapacity === 1 ? 'Bed' : 'Beds'}
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  {previewResult.areas.map((pArea, index) => (
                    <Box key={index}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 0.75 }}>
                        {pArea.name || 'Unnamed Area'}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {pArea.bedIds.length === 0 ? (
                          <Typography variant="caption" color="text.disabled">
                            No beds generated (please specify prefix and count)
                          </Typography>
                        ) : (
                          pArea.bedIds.map((bedId) => (
                            <Box
                              key={bedId}
                              sx={{
                                px: 1.5,
                                py: 0.5,
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                              }}
                            >
                              {bedId}
                            </Box>
                          ))
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </Box>
            </>
          )}

          {draftPreview && (
            <>
              <Divider sx={{ my: 1 }} />
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: 'grey.900',
                  color: 'grey.100',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'common.black',
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  overflowX: 'auto',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle2" color="primary.light" sx={{ fontWeight: 'bold' }}>
                    [Developer Mode] Flat Draft Object Assembled:
                  </Typography>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => setDraftPreview(null)}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0 }}
                  >
                    Clear Preview
                  </Button>
                </Box>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(draftPreview, null, 2)}
                </pre>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="primary">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!isFormValid}
          onClick={handleCreateFlat}
        >
          Create Flat
        </Button>
      </DialogActions>
    </Dialog>
  );
}
