import { ArrowBack, Person, Home, LocalOffer, Info } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Divider,
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

import { DocumentType, ResidentStatus } from '../types';
import { useResident } from '../hooks/useResident';

export default function ResidentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    resident,
    selectedFlat,
    isEditing,
    editForm,
    setEditForm,
    errors,
    isValid,
    snackbarOpen,
    setSnackbarOpen,
    handleStartEdit,
    handleCancelEdit,
    handleSave,
    setTouched,
    formatJoiningDate,
    formatDate,
  } = useResident(id);

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

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 4 }}>
      {/* Profile Header Redesign */}
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
            alignItems: 'flex-start',
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
                Resident Code: {resident.residentCode}
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
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {!isEditing ? (
              <Button variant="contained" onClick={handleStartEdit} sx={{ borderRadius: 2 }}>
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outlined" color="inherit" onClick={handleCancelEdit} sx={{ borderRadius: 2 }}>
                  Cancel
                </Button>
                <Button variant="contained" color="success" onClick={handleSave} sx={{ borderRadius: 2 }} disabled={!isValid}>
                  Save
                </Button>
              </>
            )}
          </Box>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Details sections */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            {/* Section 1: Identity */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Identity Details
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditing ? (
                    <TextField
                      required
                      label="Full Name"
                      value={editForm.fullName}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
                      error={!!errors.fullName}
                      helperText={errors.fullName}
                      fullWidth
                    />
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Full Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {resident.fullName}
                      </Typography>
                    </>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditing ? (
                    <TextField
                      required
                      label="Mobile Number"
                      value={editForm.mobileNumber}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                      onBlur={() => setTouched((prev) => ({ ...prev, mobileNumber: true }))}
                      error={!!errors.mobileNumber}
                      helperText={errors.mobileNumber}
                      fullWidth
                    />
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Mobile Number
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {resident.mobileNumber}
                      </Typography>
                    </>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditing ? (
                    <FormControl fullWidth>
                      <InputLabel id="edit-doc-type-label">Document Type *</InputLabel>
                      <Select
                        labelId="edit-doc-type-label"
                        label="Document Type *"
                        value={editForm.documentType}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, documentType: e.target.value as DocumentType }))}
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
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Document Type
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {resident.documentType}
                      </Typography>
                    </>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditing ? (
                    <TextField
                      required
                      label="Document Number"
                      value={editForm.documentNumber}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, documentNumber: e.target.value }))}
                      onBlur={() => setTouched((prev) => ({ ...prev, documentNumber: true }))}
                      error={!!errors.documentNumber}
                      helperText={errors.documentNumber}
                      fullWidth
                    />
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Document Number
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {resident.documentNumber}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Section 2: Accommodation (Always Read-Only) */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Home color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Accommodation Allocation (Read-Only)
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Joining Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.joiningDate}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Flat Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {selectedFlat ? `Flat ${selectedFlat.name}` : 'Not Allocated'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Allocated Beds
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.allocatedBedIds.map((bedId) => {
                      const match = bedId.match(/[^-]+$/);
                      return match ? match[0] : bedId;
                    }).join(', ')}
                  </Typography>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Section 3: Commercial */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalOffer color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Commercial Agreement
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditing ? (
                    <TextField
                      required
                      label="Agreed Monthly Rent (₹)"
                      type="number"
                      value={editForm.agreedRent}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                        setEditForm((prev) => ({
                          ...prev,
                          agreedRent: isNaN(val as number) ? '' : (val as number | ''),
                        }));
                      }}
                      onBlur={() => {
                        setEditForm((prev) => {
                          if (prev.agreedRent === '') {
                            return { ...prev, agreedRent: 0 };
                          }
                          return prev;
                        });
                      }}
                      fullWidth
                    />
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Agreed Monthly Rent
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        ₹{resident.agreedRent}
                      </Typography>
                    </>
                  )}
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {isEditing ? (
                    <TextField
                      required
                      label="Agreed Security Deposit (₹)"
                      type="number"
                      value={editForm.agreedDeposit}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                        setEditForm((prev) => ({
                          ...prev,
                          agreedDeposit: isNaN(val as number) ? '' : (val as number | ''),
                        }));
                      }}
                      onBlur={() => {
                        setEditForm((prev) => {
                          if (prev.agreedDeposit === '') {
                            return { ...prev, agreedDeposit: 0 };
                          }
                          return prev;
                        });
                      }}
                      fullWidth
                    />
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Agreed Security Deposit
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        ₹{resident.agreedDeposit}
                      </Typography>
                    </>
                  )}
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: System info metadata */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              height: '100%',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Info color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                System Metadata
              </Typography>
            </Box>

            <Stack spacing={3}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  System ID (Read-Only)
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'grey.50', p: 1, borderRadius: 1 }}>
                  {resident.id}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Created At (Read-Only)
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(resident.createdAt)}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Last Updated At (Read-Only)
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatDate(resident.updatedAt)}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
          Resident profile updated successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
}
