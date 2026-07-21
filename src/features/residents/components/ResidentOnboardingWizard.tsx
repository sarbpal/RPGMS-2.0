import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormHelperText,
} from '@mui/material';

import { DocumentType, type Resident, ResidentStatus } from '../types';
import type { Flat } from '../../accommodation/types';
import { BedStatus } from '../../accommodation/types';
import { toTitleCase } from '../utils/formatters';
import { residentService } from '../services/residentService';

const steps = ['Resident Details', 'Accommodation Details', 'Confirmation'];

interface ResidentOnboardingWizardProps {
  onCancel?: () => void;
  onSubmitSuccess?: (resident: Resident) => void;
}

interface WizardDraft {
  fullName: string;
  mobileNumber: string;
  documentType: DocumentType;
  documentNumber: string;
  joiningDate: string;
  flatId: string;
  allocatedBedIds: string[];
  agreedRent: number | '';
  agreedDeposit: number | '';
}

export default function ResidentOnboardingWizard({
  onCancel,
  onSubmitSuccess,
}: ResidentOnboardingWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [flats, setFlats] = useState<Flat[]>(() => residentService.getFlats());

  const [draft, setDraft] = useState<WizardDraft>({
    fullName: '',
    mobileNumber: '',
    documentType: DocumentType.AADHAAR,
    documentNumber: '',
    joiningDate: new Date().toISOString().split('T')[0], // Default to current date
    flatId: '',
    allocatedBedIds: [],
    agreedRent: 0,
    agreedDeposit: 0,
  });

  const [touched, setTouched] = useState({
    fullName: false,
    mobileNumber: false,
    documentNumber: false,
  });

  const [isRentOverridden, setIsRentOverridden] = useState(false);
  const [isDepositOverridden, setIsDepositOverridden] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Field validation checks for Step 1
  const errors = {
    fullName: touched.fullName && draft.fullName.trim() === '' ? 'Full name is required' : '',
    mobileNumber: touched.mobileNumber && draft.mobileNumber.trim() === '' ? 'Mobile number is required' : '',
    documentNumber: touched.documentNumber && draft.documentNumber.trim() === '' ? 'Document number is required' : '',
  };

  const isStep1Valid =
    draft.fullName.trim() !== '' &&
    draft.mobileNumber.trim() !== '' &&
    draft.documentNumber.trim() !== '';

  const getVacantBeds = (flat: Flat) => {
    return flat.areas.flatMap((area) =>
      area.beds.filter((bed) => bed.status === BedStatus.VACANT)
    );
  };

  const availableFlats = flats.filter((flat) => getVacantBeds(flat).length > 0);
  const selectedFlat = flats.find((f) => f.id === draft.flatId);

  const isStep2Valid =
    draft.joiningDate.trim() !== '' &&
    draft.flatId.trim() !== '' &&
    draft.allocatedBedIds.length > 0 &&
    (draft.agreedRent === '' || draft.agreedRent >= 0) &&
    (draft.agreedDeposit === '' || draft.agreedDeposit >= 0);

  const calculateTotalDefaultRent = (flat: Flat | undefined, bedIds: string[]): number => {
    let total = 0;
    if (!flat) return 0;
    flat.areas.forEach((area) => {
      area.beds.forEach((bed) => {
        if (bedIds.includes(bed.id)) {
          total += bed.defaultRent || 0;
        }
      });
    });
    return total;
  };

  const calculateTotalDefaultDeposit = (flat: Flat | undefined, bedIds: string[]): number => {
    let total = 0;
    if (!flat) return 0;
    flat.areas.forEach((area) => {
      area.beds.forEach((bed) => {
        if (bedIds.includes(bed.id)) {
          total += bed.defaultDeposit || 0;
        }
      });
    });
    return total;
  };

  const handleFlatChange = (flatId: string) => {
    setDraft((prev) => ({
      ...prev,
      flatId,
      allocatedBedIds: [],
      agreedRent: 0,
      agreedDeposit: 0,
    }));
    setIsRentOverridden(false);
    setIsDepositOverridden(false);
  };

  const handleBedToggle = (bedId: string, checked: boolean) => {
    const newBedIds = checked
      ? [...draft.allocatedBedIds, bedId]
      : draft.allocatedBedIds.filter((id) => id !== bedId);

    const newRent = isRentOverridden ? draft.agreedRent : calculateTotalDefaultRent(selectedFlat, newBedIds);
    const newDeposit = isDepositOverridden ? draft.agreedDeposit : calculateTotalDefaultDeposit(selectedFlat, newBedIds);

    setDraft((prev) => ({
      ...prev,
      allocatedBedIds: newBedIds,
      agreedRent: newRent,
      agreedDeposit: newDeposit,
    }));
  };

  const handleRentChange = (value: number | '') => {
    setIsRentOverridden(true);
    setDraft((prev) => ({
      ...prev,
      agreedRent: value,
    }));
  };

  const handleDepositChange = (value: number | '') => {
    setIsDepositOverridden(true);
    setDraft((prev) => ({
      ...prev,
      agreedDeposit: value,
    }));
  };

  const handleResetPricing = () => {
    setIsRentOverridden(false);
    setIsDepositOverridden(false);
    setDraft((prev) => ({
      ...prev,
      agreedRent: calculateTotalDefaultRent(selectedFlat, prev.allocatedBedIds),
      agreedDeposit: calculateTotalDefaultDeposit(selectedFlat, prev.allocatedBedIds),
    }));
  };

  const handlePricingBlur = (field: 'agreedRent' | 'agreedDeposit') => {
    setDraft((prev) => {
      if (prev[field] === '') {
        return {
          ...prev,
          [field]: 0,
        };
      }
      return prev;
    });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      setTouched({
        fullName: true,
        mobileNumber: true,
        documentNumber: true,
      });
      if (!isStep1Valid) return;
    }
    if (activeStep === 1) {
      if (!isStep2Valid) return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFieldChange = <K extends keyof WizardDraft>(
    field: K,
    value: WizardDraft[K]
  ) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBlur = (field: 'fullName' | 'mobileNumber' | 'documentNumber') => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
    if (field === 'fullName') {
      setDraft((prev) => ({
        ...prev,
        fullName: toTitleCase(prev.fullName),
      }));
    }
  };

  const handleCreateResident = () => {
    // Validation Safeguard
    if (!isStep1Valid || !isStep2Valid) {
      console.error('Onboarding validation failed. Aborting creation.');
      return;
    }

    try {
      // 1. Load existing residents & flats via service
      const residentsList = residentService.getResidents();
      const flatsList = residentService.getFlats();

      // 2. Generate values
      const residentCode = residentService.generateResidentCode(residentsList);
      const residentId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const finalRent = draft.agreedRent === '' ? 0 : draft.agreedRent;
      const finalDeposit = draft.agreedDeposit === '' ? 0 : draft.agreedDeposit;
      const formattedName = toTitleCase(draft.fullName);

      const newResident: Resident = {
        id: residentId,
        residentCode,
        fullName: formattedName,
        mobileNumber: draft.mobileNumber.trim(),
        documentType: draft.documentType,
        documentNumber: draft.documentNumber.trim(),
        joiningDate: draft.joiningDate,
        flatId: draft.flatId,
        allocatedBedIds: draft.allocatedBedIds,
        agreedRent: finalRent,
        agreedDeposit: finalDeposit,
        status: ResidentStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 3. Prepare Flats updates
      const updatedFlats = flatsList.map((flat) => {
        if (flat.id !== draft.flatId) return flat;

        const updatedAreas = flat.areas.map((area) => {
          const updatedBeds = area.beds.map((bed) => {
            if (draft.allocatedBedIds.includes(bed.id)) {
              return {
                ...bed,
                status: BedStatus.OCCUPIED,
                residentName: formattedName,
              };
            }
            return bed;
          });
          return { ...area, beds: updatedBeds };
        });

        return { ...flat, areas: updatedAreas };
      });

      // 4. Persist via service
      residentService.saveOnboardingTransaction(newResident, updatedFlats);

      // Update local state to trigger rerender/occupancy calculations
      setFlats(updatedFlats);

      // 5. Success Handling
      setSnackbarMessage(`Resident ${formattedName} (${residentCode}) onboarded successfully!`);
      setSnackbarOpen(true);

      // Reset Draft
      setDraft({
        fullName: '',
        mobileNumber: '',
        documentType: DocumentType.AADHAAR,
        documentNumber: '',
        joiningDate: new Date().toISOString().split('T')[0],
        flatId: '',
        allocatedBedIds: [],
        agreedRent: 0,
        agreedDeposit: 0,
      });
      setIsRentOverridden(false);
      setIsDepositOverridden(false);
      setTouched({
        fullName: false,
        mobileNumber: false,
        documentNumber: false,
      });
      setActiveStep(0);

      if (onSubmitSuccess) {
        onSubmitSuccess(newResident);
      }
    } catch (err) {
      console.error('Failed to save resident onboarding transaction:', err);
    }
  };

  return (
    <Box sx={{ width: '100%', py: 2 }}>
      <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Box sx={{ minHeight: '300px', mb: 4 }}>
          {/* Step 1: Resident Details */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Resident Identity
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    label="Full Name"
                    value={draft.fullName}
                    onChange={(e) => handleFieldChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    error={!!errors.fullName}
                    helperText={errors.fullName}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    label="Mobile Number"
                    value={draft.mobileNumber}
                    onChange={(e) => handleFieldChange('mobileNumber', e.target.value)}
                    onBlur={() => handleBlur('mobileNumber')}
                    error={!!errors.mobileNumber}
                    helperText={errors.mobileNumber}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="document-type-label">Document Type *</InputLabel>
                    <Select
                      labelId="document-type-label"
                      label="Document Type *"
                      value={draft.documentType}
                      onChange={(e) => handleFieldChange('documentType', e.target.value as DocumentType)}
                    >
                      <MenuItem value={DocumentType.AADHAAR}>Aadhaar</MenuItem>
                      <MenuItem value={DocumentType.PASSPORT}>Passport</MenuItem>
                      <MenuItem value={DocumentType.DRIVING_LICENSE}>Driving Licence</MenuItem>
                      <MenuItem value={DocumentType.PAN}>PAN</MenuItem>
                      <MenuItem value={DocumentType.VOTER_ID}>Voter ID</MenuItem>
                      <MenuItem value={DocumentType.GOVERNMENT_ID}>Government ID</MenuItem>
                      <MenuItem value={DocumentType.OTHER}>Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    label="Document Number"
                    value={draft.documentNumber}
                    onChange={(e) => handleFieldChange('documentNumber', e.target.value)}
                    onBlur={() => handleBlur('documentNumber')}
                    error={!!errors.documentNumber}
                    helperText={errors.documentNumber}
                    fullWidth
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Step 2: Accommodation Details */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Accommodation Allocation
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    required
                    label="Joining Date"
                    type="date"
                    value={draft.joiningDate}
                    onChange={(e) => handleFieldChange('joiningDate', e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth required>
                    <InputLabel id="flat-select-label">Flat Selection</InputLabel>
                    <Select
                      labelId="flat-select-label"
                      label="Flat Selection"
                      value={draft.flatId}
                      onChange={(e) => handleFlatChange(e.target.value as string)}
                    >
                      {availableFlats.map((flat) => {
                        const vacantCount = getVacantBeds(flat).length;
                        return (
                          <MenuItem key={flat.id} value={flat.id}>
                            Flat {flat.name} ({vacantCount} vacant {vacantCount === 1 ? 'bed' : 'beds'})
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>

                {draft.flatId && selectedFlat && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
                      Allocate Beds *
                    </Typography>
                    {selectedFlat.areas.map((area) => {
                      const vacantBedsInArea = area.beds.filter((bed) => bed.status === BedStatus.VACANT);
                      if (vacantBedsInArea.length === 0) return null;

                      return (
                        <Box key={area.id} sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                            {area.name} (Rent: ₹{area.defaultRent || 0}, Deposit: ₹{area.defaultDeposit || 0})
                          </Typography>
                          <FormGroup row>
                            {vacantBedsInArea.map((bed) => (
                              <FormControlLabel
                                key={bed.id}
                                control={
                                  <Checkbox
                                    checked={draft.allocatedBedIds.includes(bed.id)}
                                    onChange={(e) => handleBedToggle(bed.id, e.target.checked)}
                                  />
                                }
                                label={bed.name}
                              />
                            ))}
                          </FormGroup>
                        </Box>
                      );
                    })}
                    {draft.allocatedBedIds.length === 0 && (
                      <FormHelperText error>At least one bed must be selected</FormHelperText>
                    )}
                  </Grid>
                )}

                {draft.flatId && draft.allocatedBedIds.length > 0 && (
                  <>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        required
                        label="Agreed Rent (₹)"
                        type="number"
                        value={draft.agreedRent}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                          handleRentChange(isNaN(val as number) ? '' : (val as number | ''));
                        }}
                        onBlur={() => handlePricingBlur('agreedRent')}
                        helperText={isRentOverridden ? 'Manual override active' : 'Automatically calculated'}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        required
                        label="Agreed Deposit (₹)"
                        type="number"
                        value={draft.agreedDeposit}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                          handleDepositChange(isNaN(val as number) ? '' : (val as number | ''));
                        }}
                        onBlur={() => handlePricingBlur('agreedDeposit')}
                        helperText={isDepositOverridden ? 'Manual override active' : 'Automatically calculated'}
                        fullWidth
                      />
                    </Grid>
                    {(isRentOverridden || isDepositOverridden) && (
                      <Grid size={{ xs: 12 }}>
                        <Button size="small" variant="text" onClick={handleResetPricing}>
                          Reset to default pricing
                        </Button>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            </Box>
          )}

          {/* Step 3: Confirmation Summary */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Onboarding Summary
              </Typography>
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                        Resident Identity
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Name:</strong> {toTitleCase(draft.fullName)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Mobile:</strong> {draft.mobileNumber}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Document:</strong> {draft.documentType} ({draft.documentNumber})
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                        Accommodation
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Joining Date:</strong> {draft.joiningDate}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Flat:</strong> {selectedFlat ? `Flat ${selectedFlat.name}` : draft.flatId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Beds:</strong> {draft.allocatedBedIds.map((bedId) => {
                          const match = bedId.match(/[^-]+$/);
                          return match ? match[0] : bedId;
                        }).join(', ')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}>
                        Commercial Terms
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Agreed Rent:</strong> ₹{draft.agreedRent}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Agreed Deposit:</strong> ₹{draft.agreedDeposit}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box>
            {onCancel && activeStep === 0 && (
              <Button onClick={onCancel} variant="outlined" color="inherit">
                Cancel
              </Button>
            )}
            {activeStep > 0 && (
              <Button onClick={handleBack} variant="outlined" color="primary">
                Previous
              </Button>
            )}
          </Box>
          <Box>
            {activeStep < steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  (activeStep === 0 && !isStep1Valid) ||
                  (activeStep === 1 && !isStep2Valid)
                }
              >
                Next
              </Button>
            ) : (
              <Button variant="contained" color="success" onClick={handleCreateResident}>
                Create Resident
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
