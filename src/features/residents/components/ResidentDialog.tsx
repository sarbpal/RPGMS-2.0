import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Divider,
} from '@mui/material';
import { useState } from 'react';

import type { Flat } from '../../accommodation/types';
import { BedStatus } from '../../accommodation/types';
import type { Resident } from '../types';

interface ResidentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Resident, 'id'> & { id?: string }) => void;
  flats: Flat[];
  existingResidents: Resident[];
  residentToEdit?: Resident;
}

const generateResidentNumber = (existingResidents: { personalInfo: { residentId: string } }[]): string => {
  let maxSeq = 0;
  existingResidents.forEach((res) => {
    const id = res.personalInfo.residentId;
    if (id.startsWith('R') && id.length === 7) {
      const seq = parseInt(id.slice(1), 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });
  const nextSeq = maxSeq + 1;
  return `R${String(nextSeq).padStart(6, '0')}`;
};

export function ResidentDialog({
  open,
  onClose,
  onSubmit,
  flats,
  existingResidents,
  residentToEdit,
}: ResidentDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Personal Info States
  const [residentId] = useState(() => {
    if (residentToEdit) return residentToEdit.personalInfo.residentId;
    return generateResidentNumber(existingResidents);
  });
  
  const [fullName, setFullName] = useState(residentToEdit ? residentToEdit.personalInfo.fullName : '');
  const [fullNameTouched, setFullNameTouched] = useState(false);
  
  const [mobileNumber, setMobileNumber] = useState(residentToEdit ? residentToEdit.personalInfo.mobileNumber : '');
  const [mobileNumberTouched, setMobileNumberTouched] = useState(false);

  // Accommodation States
  const [flatId, setFlatId] = useState(residentToEdit ? residentToEdit.flatId : '');
  const [flatIdTouched, setFlatIdTouched] = useState(false);
  const [selectedBeds, setSelectedBeds] = useState<string[]>(residentToEdit ? residentToEdit.assignedBedIds : []);
  const [joiningDate, setJoiningDate] = useState(residentToEdit ? residentToEdit.joiningDate : new Date().toISOString().split('T')[0]);

  // Compute validation states
  const isResidentIdValid = residentId.trim() !== '';
  const isFullNameValid = fullName.trim() !== '';
  const isMobileNumberValid = mobileNumber.trim() !== '';
  const isFlatIdValid = flatId !== '';
  const isBedsSelectedValid = selectedBeds.length > 0;

  const isFormValid =
    isResidentIdValid &&
    isFullNameValid &&
    isMobileNumberValid &&
    isFlatIdValid &&
    isBedsSelectedValid;

  // Filter flats that have vacant beds (or are currently assigned to the edited resident)
  const availableFlats = flats.filter((flat) => {
    const vacantBedsInFlat = flat.areas.flatMap((a) => a.beds).filter((bed) => {
      const isVacant = bed.status === BedStatus.VACANT;
      const isCurrentlyAssignedToMe = residentToEdit && residentToEdit.assignedBedIds.includes(bed.id);
      return isVacant || isCurrentlyAssignedToMe;
    });

    return vacantBedsInFlat.length > 0;
  });

  // Get selected flat details
  const selectedFlat = flats.find((f) => f.id === flatId);

  const handleFlatChange = (e: SelectChangeEvent) => {
    setFlatId(e.target.value);
    setFlatIdTouched(true);
    setSelectedBeds([]); // Clear previous bed selection on flat change
  };

  const handleBedToggle = (bedId: string) => {
    setSelectedBeds((prev) =>
      prev.includes(bedId) ? prev.filter((id) => id !== bedId) : [...prev, bedId]
    );
  };

  const handleSave = () => {
    if (!isFormValid) return;

    // Build the resident payload, preserving non-onboarding fields if editing
    onSubmit({
      id: residentToEdit?.id,
      personalInfo: {
        residentId: residentId.trim(),
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: residentToEdit?.personalInfo.email,
        dateOfBirth: residentToEdit?.personalInfo.dateOfBirth,
        gender: residentToEdit?.personalInfo.gender,
      },
      emergencyContact: {
        name: residentToEdit ? residentToEdit.emergencyContact.name : '',
        relationship: residentToEdit ? residentToEdit.emergencyContact.relationship : '',
        mobileNumber: residentToEdit ? residentToEdit.emergencyContact.mobileNumber : '',
      },
      flatId,
      assignedBedIds: selectedBeds,
      joiningDate,
      status: residentToEdit ? residentToEdit.status : 'Active', // Auto-Active for new residents
    });
    handleClose();
  };

  const handleClose = () => {
    setFullName('');
    setFullNameTouched(false);
    setMobileNumber('');
    setMobileNumberTouched(false);
    setFlatId('');
    setFlatIdTouched(false);
    setSelectedBeds([]);
    setJoiningDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  return (
    <Dialog
      fullScreen={isMobile}
      fullWidth
      maxWidth="md"
      open={open}
      onClose={handleClose}
      aria-labelledby="resident-dialog-title"
    >
      <DialogTitle id="resident-dialog-title">
        {residentToEdit ? 'Edit Resident' : 'Add Resident'}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              required
              fullWidth
              label="Resident No."
              value={residentId}
              slotProps={{ input: { readOnly: true } }}
              helperText="Automatically generated unique identifier."
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              required
              fullWidth
              label="Full Name"
              placeholder="e.g. John Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setFullNameTouched(true);
              }}
              error={fullNameTouched && !isFullNameValid}
              helperText={fullNameTouched && !isFullNameValid ? 'Full name is required.' : ''}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Mobile Number"
              placeholder="e.g. 9876543210"
              value={mobileNumber}
              onChange={(e) => {
                setMobileNumber(e.target.value);
                setMobileNumberTouched(true);
              }}
              error={mobileNumberTouched && !isMobileNumberValid}
              helperText={mobileNumberTouched && !isMobileNumberValid ? 'Mobile number is required.' : ''}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              required
              fullWidth
              label="Joining Date"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth required error={flatIdTouched && !isFlatIdValid}>
              <InputLabel id="dialog-flat-label">Select Flat</InputLabel>
              <Select
                label="Select Flat"
                labelId="dialog-flat-label"
                value={flatId}
                onChange={handleFlatChange}
              >
                {availableFlats.map((flat) => {
                  const vacantCount = flat.areas
                    .flatMap((a) => a.beds)
                    .filter((bed) => {
                      const isVacant = bed.status === BedStatus.VACANT;
                      const isCurrentlyAssignedToMe = residentToEdit && residentToEdit.assignedBedIds.includes(bed.id);
                      return isVacant || isCurrentlyAssignedToMe;
                    }).length;
                  return (
                    <MenuItem key={flat.id} value={flat.id}>
                      Flat {flat.name} ({vacantCount} vacant)
                    </MenuItem>
                  );
                })}
              </Select>
              {flatIdTouched && !isFlatIdValid && (
                <FormHelperText>Flat selection is required.</FormHelperText>
              )}
            </FormControl>
          </Grid>

          {/* Grouped Bed Selection List */}
          {flatId && selectedFlat && (
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  p: 2.5,
                  bgcolor: 'grey.50',
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                  Select Beds *
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={3.5}>
                  {selectedFlat.areas.map((area) => {
                    const bedsInArea = area.beds.filter((bed) => {
                      const isVacant = bed.status === BedStatus.VACANT;
                      const isCurrentlyAssignedToMe = residentToEdit && residentToEdit.assignedBedIds.includes(bed.id);
                      return isVacant || isCurrentlyAssignedToMe;
                    });

                    if (bedsInArea.length === 0) return null;

                    return (
                      <Grid size={{ xs: 12, sm: 4 }} key={area.id}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                          {area.name}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {bedsInArea.map((bed) => (
                            <FormControlLabel
                              key={bed.id}
                              control={
                                <Checkbox
                                  checked={selectedBeds.includes(bed.id)}
                                  onChange={() => handleBedToggle(bed.id)}
                                />
                              }
                              label={bed.name}
                            />
                          ))}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
                {!isBedsSelectedValid && flatIdTouched && (
                  <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1.5 }}>
                    At least one bed must be selected.
                  </Typography>
                )}
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="primary">
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!isFormValid}
          onClick={handleSave}
        >
          {residentToEdit ? 'Save Changes' : 'Save Resident'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
