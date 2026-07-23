import {
  ArrowBack,
  ContactPhone,
  Edit,
  FamilyRestroom,
  Home,
  Info,
  LocalHospital,
  LocationOn,
  Person,
  Work,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { DocumentType, ResidentStatus } from '../types';
import { useResident } from '../hooks/useResident';
import { toTitleCase } from '../utils/formatters';

export default function ResidentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    resident,
    selectedFlat,
    editingSection,
    startEditingSection,
    cancelEditingSection,
    saveSection,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    formatJoiningDate,
    formatDate,
  } = useResident(id);

  // Local Form States for Section Editing
  const [identityForm, setIdentityForm] = useState<{
    fullName: string;
    mobileNumber: string;
    alternateMobile: string;
    email: string;
    documentType: DocumentType;
    documentNumber: string;
  }>({
    fullName: '',
    mobileNumber: '',
    alternateMobile: '',
    email: '',
    documentType: DocumentType.AADHAAR,
    documentNumber: '',
  });

  const [familyForm, setFamilyForm] = useState({
    fatherOrGuardianName: '',
    motherName: '',
  });

  const [emergencyForm, setEmergencyForm] = useState({
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
  });

  const [addressForm, setAddressForm] = useState({
    permanentAddress: '',
    correspondenceAddress: '',
    city: '',
    state: '',
    pinCode: '',
  });

  const [occupationForm, setOccupationForm] = useState({
    occupation: '',
    employerOrCollege: '',
  });

  const [medicalForm, setMedicalForm] = useState({
    bloodGroup: '',
    medicalNotes: '',
  });

  // Sync form states when entering edit mode or when resident changes
  useEffect(() => {
    if (resident) {
      queueMicrotask(() => {
        setIdentityForm({
          fullName: resident.fullName || '',
          mobileNumber: resident.mobileNumber || '',
          alternateMobile: resident.alternateMobile || '',
          email: resident.email || '',
          documentType: resident.documentType || DocumentType.AADHAAR,
          documentNumber: resident.documentNumber || '',
        });
        setFamilyForm({
          fatherOrGuardianName: resident.fatherOrGuardianName || '',
          motherName: resident.motherName || '',
        });
        setEmergencyForm({
          emergencyContactName: resident.emergencyContactName || '',
          emergencyContactRelation: resident.emergencyContactRelation || '',
          emergencyContactPhone: resident.emergencyContactPhone || '',
        });
        setAddressForm({
          permanentAddress: resident.permanentAddress || '',
          correspondenceAddress: resident.correspondenceAddress || '',
          city: resident.city || '',
          state: resident.state || '',
          pinCode: resident.pinCode || '',
        });
        setOccupationForm({
          occupation: resident.occupation || '',
          employerOrCollege: resident.employerOrCollege || '',
        });
        setMedicalForm({
          bloodGroup: resident.bloodGroup || '',
          medicalNotes: resident.medicalNotes || '',
        });
      });
    }
  }, [resident, editingSection]);


  if (!resident) {
    return (
      <Container maxWidth="md" sx={{ pt: 12, pb: 4 }}>
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
            Resident Profile Not Found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            The resident profile you are looking for does not exist or has been removed from the registry.
          </Typography>
          <Button
            startIcon={<ArrowBack />}
            variant="contained"
            onClick={() => navigate('/residents')}
          >
            Back to Residents
          </Button>
        </Card>
      </Container>
    );
  }

  const getStatusColor = (status: ResidentStatus) => {
    switch (status) {
      case ResidentStatus.ACTIVE:
        return 'success';
      case ResidentStatus.ON_NOTICE:
        return 'warning';
      case ResidentStatus.CHECKED_OUT:
        return 'default';
      case ResidentStatus.ALUMNI:
        return 'info';
      default:
        return 'default';
    }
  };

  const renderFieldValue = (value?: string, fallback = 'Not specified') => {
    if (!value || value.trim() === '') {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          {fallback}
        </Typography>
      );
    }
    return <Typography variant="body1" sx={{ fontWeight: 500 }}>{value}</Typography>;
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 4 }}>
      {/* Profile Header */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/residents')}
            variant="outlined"
            size="small"
          >
            Back
          </Button>
        </Box>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              {resident.fullName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', flexWrap: 'wrap', mb: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Code: {resident.residentCode}
              </Typography>
              <Typography variant="body2">•</Typography>
              <Typography variant="body2">
                {selectedFlat ? `Flat ${selectedFlat.name}` : 'Flat not assigned'} • Beds {resident.allocatedBedIds.map((bedId) => {
                  const match = bedId.match(/[^-]+$/);
                  return match ? match[0] : bedId;
                }).join(', ')}
              </Typography>
              <Typography variant="body2">•</Typography>
              <Typography variant="body2">
                Joined {formatJoiningDate(resident.joiningDate)}
              </Typography>
            </Box>
            <Chip
              label={resident.status}
              color={getStatusColor(resident.status)}
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          </Box>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Editable Section Cards */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {/* Card 1: Personal Identity & Contact */}
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Identity & Contact
                  </Typography>
                </Box>
                {editingSection !== 'identity' ? (
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => startEditingSection('identity')}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" color="inherit" onClick={cancelEditingSection}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() =>
                        saveSection(
                          {
                            fullName: toTitleCase(identityForm.fullName),
                            mobileNumber: identityForm.mobileNumber.trim(),
                            alternateMobile: identityForm.alternateMobile.trim(),
                            email: identityForm.email.trim(),
                            documentType: identityForm.documentType,
                            documentNumber: identityForm.documentNumber.trim(),
                          },
                          'Identity & Contact'
                        )
                      }
                      disabled={
                        !identityForm.fullName.trim() ||
                        !identityForm.mobileNumber.trim() ||
                        !identityForm.documentNumber.trim()
                      }
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              {editingSection === 'identity' ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      required
                      label="Full Name"
                      value={identityForm.fullName}
                      onChange={(e) => setIdentityForm((p) => ({ ...p, fullName: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      required
                      label="Mobile Number"
                      value={identityForm.mobileNumber}
                      onChange={(e) => setIdentityForm((p) => ({ ...p, mobileNumber: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Alternate Mobile Number"
                      value={identityForm.alternateMobile}
                      onChange={(e) => setIdentityForm((p) => ({ ...p, alternateMobile: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Email Address"
                      type="email"
                      value={identityForm.email}
                      onChange={(e) => setIdentityForm((p) => ({ ...p, email: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth required>
                      <InputLabel id="doc-type-select-label">Document Type</InputLabel>
                      <Select
                        labelId="doc-type-select-label"
                        label="Document Type"
                        value={identityForm.documentType}
                        onChange={(e) => setIdentityForm((p) => ({ ...p, documentType: e.target.value as DocumentType }))}
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
                      value={identityForm.documentNumber}
                      onChange={(e) => setIdentityForm((p) => ({ ...p, documentNumber: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Full Name
                    </Typography>
                    {renderFieldValue(resident.fullName)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Mobile Number
                    </Typography>
                    {renderFieldValue(resident.mobileNumber)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Alternate Mobile
                    </Typography>
                    {renderFieldValue(resident.alternateMobile)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Email Address
                    </Typography>
                    {renderFieldValue(resident.email)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Document Type
                    </Typography>
                    {renderFieldValue(resident.documentType)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Document Number
                    </Typography>
                    {renderFieldValue(resident.documentNumber)}
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Card 2: Family Details */}
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FamilyRestroom color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Family Details
                  </Typography>
                </Box>
                {editingSection !== 'family' ? (
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => startEditingSection('family')}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" color="inherit" onClick={cancelEditingSection}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() =>
                        saveSection(
                          {
                            fatherOrGuardianName: familyForm.fatherOrGuardianName.trim(),
                            motherName: familyForm.motherName.trim(),
                          },
                          'Family Details'
                        )
                      }
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              {editingSection === 'family' ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Father / Guardian Name"
                      value={familyForm.fatherOrGuardianName}
                      onChange={(e) => setFamilyForm((p) => ({ ...p, fatherOrGuardianName: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Mother Name"
                      value={familyForm.motherName}
                      onChange={(e) => setFamilyForm((p) => ({ ...p, motherName: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Father / Guardian Name
                    </Typography>
                    {renderFieldValue(resident.fatherOrGuardianName)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Mother Name
                    </Typography>
                    {renderFieldValue(resident.motherName)}
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Card 3: Emergency Contact Details */}
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ContactPhone color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Emergency Contact
                  </Typography>
                </Box>
                {editingSection !== 'emergency' ? (
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => startEditingSection('emergency')}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" color="inherit" onClick={cancelEditingSection}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() =>
                        saveSection(
                          {
                            emergencyContactName: emergencyForm.emergencyContactName.trim(),
                            emergencyContactRelation: emergencyForm.emergencyContactRelation.trim(),
                            emergencyContactPhone: emergencyForm.emergencyContactPhone.trim(),
                          },
                          'Emergency Contact'
                        )
                      }
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              {editingSection === 'emergency' ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Contact Name"
                      value={emergencyForm.emergencyContactName}
                      onChange={(e) => setEmergencyForm((p) => ({ ...p, emergencyContactName: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Relationship"
                      value={emergencyForm.emergencyContactRelation}
                      onChange={(e) => setEmergencyForm((p) => ({ ...p, emergencyContactRelation: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="Phone Number"
                      value={emergencyForm.emergencyContactPhone}
                      onChange={(e) => setEmergencyForm((p) => ({ ...p, emergencyContactPhone: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Emergency Contact Name
                    </Typography>
                    {renderFieldValue(resident.emergencyContactName)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Relationship
                    </Typography>
                    {renderFieldValue(resident.emergencyContactRelation)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Phone Number
                    </Typography>
                    {renderFieldValue(resident.emergencyContactPhone)}
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Card 4: Address Details */}
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Address Details
                  </Typography>
                </Box>
                {editingSection !== 'address' ? (
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => startEditingSection('address')}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" color="inherit" onClick={cancelEditingSection}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() =>
                        saveSection(
                          {
                            permanentAddress: addressForm.permanentAddress.trim(),
                            correspondenceAddress: addressForm.correspondenceAddress.trim(),
                            city: addressForm.city.trim(),
                            state: addressForm.state.trim(),
                            pinCode: addressForm.pinCode.trim(),
                          },
                          'Address Details'
                        )
                      }
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              {editingSection === 'address' ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Permanent Address"
                      multiline
                      rows={2}
                      value={addressForm.permanentAddress}
                      onChange={(e) => setAddressForm((p) => ({ ...p, permanentAddress: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Correspondence Address"
                      multiline
                      rows={2}
                      value={addressForm.correspondenceAddress}
                      onChange={(e) => setAddressForm((p) => ({ ...p, correspondenceAddress: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="City"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="State"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      label="PIN Code"
                      value={addressForm.pinCode}
                      onChange={(e) => setAddressForm((p) => ({ ...p, pinCode: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Permanent Address
                    </Typography>
                    {renderFieldValue(resident.permanentAddress)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Correspondence Address
                    </Typography>
                    {renderFieldValue(resident.correspondenceAddress)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      City
                    </Typography>
                    {renderFieldValue(resident.city)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      State
                    </Typography>
                    {renderFieldValue(resident.state)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      PIN Code
                    </Typography>
                    {renderFieldValue(resident.pinCode)}
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Card 5: Occupation & Education */}
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Work color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Occupation & Education
                  </Typography>
                </Box>
                {editingSection !== 'occupation' ? (
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => startEditingSection('occupation')}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" color="inherit" onClick={cancelEditingSection}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() =>
                        saveSection(
                          {
                            occupation: occupationForm.occupation.trim(),
                            employerOrCollege: occupationForm.employerOrCollege.trim(),
                          },
                          'Occupation & Education'
                        )
                      }
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              {editingSection === 'occupation' ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel id="occupation-select-label">Occupation</InputLabel>
                      <Select
                        labelId="occupation-select-label"
                        label="Occupation"
                        value={occupationForm.occupation}
                        onChange={(e) => setOccupationForm((p) => ({ ...p, occupation: e.target.value }))}
                      >
                        <MenuItem value="Working Professional">Working Professional</MenuItem>
                        <MenuItem value="Student">Student</MenuItem>
                        <MenuItem value="Self-Employed">Self-Employed</MenuItem>
                        <MenuItem value="Business Owner">Business Owner</MenuItem>
                        <MenuItem value="Unemployed">Unemployed</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label="Employer / College / Institution"
                      value={occupationForm.employerOrCollege}
                      onChange={(e) => setOccupationForm((p) => ({ ...p, employerOrCollege: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Occupation
                    </Typography>
                    {renderFieldValue(resident.occupation)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Employer / College
                    </Typography>
                    {renderFieldValue(resident.employerOrCollege)}
                  </Grid>
                </Grid>
              )}
            </Paper>

            {/* Card 6: Medical Information */}
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalHospital color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Medical Information
                  </Typography>
                </Box>
                {editingSection !== 'medical' ? (
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => startEditingSection('medical')}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" color="inherit" onClick={cancelEditingSection}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() =>
                        saveSection(
                          {
                            bloodGroup: medicalForm.bloodGroup.trim(),
                            medicalNotes: medicalForm.medicalNotes.trim(),
                          },
                          'Medical Information'
                        )
                      }
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              {editingSection === 'medical' ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel id="blood-group-label">Blood Group</InputLabel>
                      <Select
                        labelId="blood-group-label"
                        label="Blood Group"
                        value={medicalForm.bloodGroup}
                        onChange={(e) => setMedicalForm((p) => ({ ...p, bloodGroup: e.target.value }))}
                      >
                        <MenuItem value="A+">A+</MenuItem>
                        <MenuItem value="A-">A-</MenuItem>
                        <MenuItem value="B+">B+</MenuItem>
                        <MenuItem value="B-">B-</MenuItem>
                        <MenuItem value="AB+">AB+</MenuItem>
                        <MenuItem value="AB-">AB-</MenuItem>
                        <MenuItem value="O+">O+</MenuItem>
                        <MenuItem value="O-">O-</MenuItem>
                        <MenuItem value="Unknown">Unknown</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      label="Medical Notes & Conditions"
                      multiline
                      rows={2}
                      value={medicalForm.medicalNotes}
                      onChange={(e) => setMedicalForm((p) => ({ ...p, medicalNotes: e.target.value }))}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Blood Group
                    </Typography>
                    {renderFieldValue(resident.bloodGroup)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Medical Notes
                    </Typography>
                    {renderFieldValue(resident.medicalNotes)}
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Stack>
        </Grid>

        {/* Right Column: Accommodation Details & System Metadata Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={3}>
            {/* Card 7: Accommodation & Commercial Details (Read-Only) */}
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Home color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Accommodation & Commercial
                </Typography>
              </Box>

              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Joining Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {formatJoiningDate(resident.joiningDate)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Flat Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedFlat ? `Flat ${selectedFlat.name}` : 'Not Allocated'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Allocated Beds
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.allocatedBedIds
                      .map((bedId) => {
                        const match = bedId.match(/[^-]+$/);
                        return match ? match[0] : bedId;
                      })
                      .join(', ')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Agreed Monthly Rent
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    ₹{resident.agreedRent}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Agreed Security Deposit
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    ₹{resident.agreedDeposit}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Card 8: System Metadata */}
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Info color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  System Metadata
                </Typography>
              </Box>

              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    System ID (Read-Only)
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontFamily: 'monospace', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}
                  >
                    {resident.id}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Created At
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatDate(resident.createdAt)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Last Updated At
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {formatDate(resident.updatedAt)}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
