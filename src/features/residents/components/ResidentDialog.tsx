import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
} from '@mui/material';
import { useState } from 'react';

import type { Flat } from '../../accommodation/types';
import { BedStatus } from '../../accommodation/types';
import { ResidentStatus } from '../types';
import type { Resident } from '../types';

interface ResidentDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Resident, 'id'> & { id?: string }) => void;
  flats: Flat[];
  existingResidents: Resident[];
  residentToEdit?: Resident;
}

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
  const [residentId, setResidentId] = useState(residentToEdit ? residentToEdit.personalInfo.residentId : '');
  const [residentIdTouched, setResidentIdTouched] = useState(false);
  
  const [fullName, setFullName] = useState(residentToEdit ? residentToEdit.personalInfo.fullName : '');
  const [fullNameTouched, setFullNameTouched] = useState(false);
  
  const [mobileNumber, setMobileNumber] = useState(residentToEdit ? residentToEdit.personalInfo.mobileNumber : '');
  const [mobileNumberTouched, setMobileNumberTouched] = useState(false);
  
  const [email, setEmail] = useState(residentToEdit ? (residentToEdit.personalInfo.email || '') : '');
  const [dateOfBirth, setDateOfBirth] = useState(residentToEdit ? (residentToEdit.personalInfo.dateOfBirth || '') : '');
  const [gender, setGender] = useState(residentToEdit ? (residentToEdit.personalInfo.gender || '') : '');

  // Emergency Contact States
  const [emergencyName, setEmergencyName] = useState(residentToEdit ? residentToEdit.emergencyContact.name : '');
  const [emergencyRelationship, setEmergencyRelationship] = useState(residentToEdit ? residentToEdit.emergencyContact.relationship : '');
  const [emergencyPhone, setEmergencyPhone] = useState(residentToEdit ? residentToEdit.emergencyContact.mobileNumber : '');

  // Accommodation States
  const [flatId, setFlatId] = useState(residentToEdit ? residentToEdit.flatId : '');
  const [flatIdTouched, setFlatIdTouched] = useState(false);
  const [selectedBeds, setSelectedBeds] = useState<string[]>(residentToEdit ? residentToEdit.assignedBedIds : []);
  const [joiningDate, setJoiningDate] = useState(residentToEdit ? residentToEdit.joiningDate : new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<ResidentStatus>(residentToEdit ? residentToEdit.status : 'Active');

  // Compute validation states
  const isResidentIdDuplicate = existingResidents.some(
    (res) =>
      res.personalInfo.residentId.trim().toUpperCase() === residentId.trim().toUpperCase() &&
      (!residentToEdit || res.id !== residentToEdit.id)
  );

  const isResidentIdValid = residentId.trim() !== '' && !isResidentIdDuplicate;
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
    // Beds are vacant OR already occupied by this resident
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
    setSelectedBeds([]); // Clear previous bed selection as per rules
  };

  const handleBedToggle = (bedId: string) => {
    setSelectedBeds((prev) =>
      prev.includes(bedId) ? prev.filter((id) => id !== bedId) : [...prev, bedId]
    );
  };

  const handleSave = () => {
    if (!isFormValid) return;

    onSubmit({
      id: residentToEdit?.id, // Keep the same ID if editing
      personalInfo: {
        residentId: residentId.trim(),
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        email: email.trim() || undefined,
        dateOfBirth: dateOfBirth || undefined,
        gender: gender || undefined,
      },
      emergencyContact: {
        name: emergencyName.trim(),
        relationship: emergencyRelationship.trim(),
        mobileNumber: emergencyPhone.trim(),
      },
      flatId,
      assignedBedIds: selectedBeds,
      joiningDate,
      status,
    });
    handleClose();
  };

  const handleClose = () => {
    // Reset states
    setResidentId('');
    setResidentIdTouched(false);
    setFullName('');
    setFullNameTouched(false);
    setMobileNumber('');
    setMobileNumberTouched(false);
    setEmail('');
    setDateOfBirth('');
    setGender('');
    setEmergencyName('');
    setEmergencyRelationship('');
    setEmergencyPhone('');
    setFlatId('');
    setFlatIdTouched(false);
    setSelectedBeds([]);
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setStatus('Active');
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
          {/* Section: Personal Info */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
              Personal Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              required
              fullWidth
              label="Resident ID"
              placeholder="e.g. RES101"
              value={residentId}
              onChange={(e) => {
                setResidentId(e.target.value);
                setResidentIdTouched(true);
              }}
              error={residentIdTouched && !isResidentIdValid}
              helperText={
                residentIdTouched && isResidentIdDuplicate
                  ? 'Resident ID must be unique.'
                  : residentIdTouched && !residentId.trim()
                  ? 'Resident ID is required.'
                  : ''
              }
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

          <Grid size={{ xs: 12, sm: 4 }}>
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

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              placeholder="e.g. john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 2 }}>
            <TextField
              fullWidth
              label="DOB"
              type="date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 2 }}>
            <FormControl fullWidth>
              <InputLabel id="gender-label">Gender</InputLabel>
              <Select
                label="Gender"
                labelId="gender-label"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Section: Emergency Contact */}
          <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
              Emergency Contact
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Contact Name"
              placeholder="e.g. Sarah Doe"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Relationship"
              placeholder="e.g. Mother"
              value={emergencyRelationship}
              onChange={(e) => setEmergencyRelationship(e.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Contact Number"
              placeholder="e.g. 9876543211"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />
          </Grid>

          {/* Section: Accommodation details */}
          <Grid size={{ xs: 12 }} sx={{ mt: 1 }}>
            <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
              Accommodation & Status
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
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

          <Grid size={{ xs: 12, sm: 4 }}>
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

          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel id="dialog-status-label">Status</InputLabel>
              <Select
                label="Status"
                labelId="dialog-status-label"
                value={status}
                onChange={(e) => setStatus(e.target.value as ResidentStatus)}
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="On Notice">On Notice</MenuItem>
                <MenuItem value="Checked Out">Checked Out</MenuItem>
                <MenuItem value="Alumni">Alumni</MenuItem>
              </Select>
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
