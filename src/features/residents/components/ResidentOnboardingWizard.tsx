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
} from '@mui/material';

import { DocumentType, type ResidentDraft } from '../types';

const steps = ['Resident Details', 'Accommodation Details', 'Confirmation'];

interface ResidentOnboardingWizardProps {
  onCancel?: () => void;
  onSubmitSuccess?: (draft: ResidentDraft) => void;
}

export default function ResidentOnboardingWizard({
  onCancel,
  onSubmitSuccess,
}: ResidentOnboardingWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [draft, setDraft] = useState<ResidentDraft>({
    fullName: '',
    mobileNumber: '',
    documentType: DocumentType.AADHAAR,
    documentNumber: '',
    joiningDate: '2026-07-19', // Default placeholder date
    flatId: 'flat-placeholder-101', // Placeholder flat
    allocatedBedIds: ['101-B1'], // Placeholder bed
    agreedRent: 0,
    agreedDeposit: 0,
  });

  const [touched, setTouched] = useState({
    fullName: false,
    mobileNumber: false,
    documentNumber: false,
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Field validation checks
  const errors = {
    fullName: touched.fullName && draft.fullName.trim() === '' ? 'Full name is required' : '',
    mobileNumber: touched.mobileNumber && draft.mobileNumber.trim() === '' ? 'Mobile number is required' : '',
    documentNumber: touched.documentNumber && draft.documentNumber.trim() === '' ? 'Document number is required' : '',
  };

  const isStep1Valid =
    draft.fullName.trim() !== '' &&
    draft.mobileNumber.trim() !== '' &&
    draft.documentNumber.trim() !== '';

  const handleNext = () => {
    if (activeStep === 0) {
      // Trigger touched for all step 1 fields
      setTouched({
        fullName: true,
        mobileNumber: true,
        documentNumber: true,
      });
      if (!isStep1Valid) return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFieldChange = <K extends keyof ResidentDraft>(
    field: K,
    value: ResidentDraft[K]
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
  };

  const handleCreateResident = () => {
    console.log('Resident Onboarding Draft Submitted:', draft);
    setSnackbarOpen(true);
    if (onSubmitSuccess) {
      onSubmitSuccess(draft);
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
                      onChange={(e) => handleFieldChange('documentType', e.target.value)}
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

          {/* Step 2: Accommodation Details Placeholder */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Accommodation Allocation (Sprint 6.2 Placeholders)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                This step will support flat filtering, bed selection, and automated price populating in subsequent sprints.
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    disabled
                    label="Joining Date"
                    value={draft.joiningDate}
                    helperText="Onboarding Date (Placeholder)"
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    disabled
                    label="Flat Selection"
                    value={draft.flatId}
                    helperText="Target flat allocation (Placeholder)"
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    disabled
                    label="Allocate Beds"
                    value={draft.allocatedBedIds.join(', ')}
                    helperText="Bed allocations (Placeholder)"
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    disabled
                    label="Default Rent"
                    value={`₹${draft.agreedRent}`}
                    helperText="Agreed Rent (Placeholder)"
                    fullWidth
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    disabled
                    label="Default Deposit"
                    value={`₹${draft.agreedDeposit}`}
                    helperText="Agreed Deposit (Placeholder)"
                    fullWidth
                  />
                </Grid>
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
                        <strong>Name:</strong> {draft.fullName}
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
                        <strong>Flat:</strong> {draft.flatId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Beds:</strong> {draft.allocatedBedIds.join(', ')}
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
                disabled={activeStep === 0 && !isStep1Valid}
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
          Resident Onboarding Wizard UI complete! (Mock Submission Logged)
        </Alert>
      </Snackbar>
    </Box>
  );
}
