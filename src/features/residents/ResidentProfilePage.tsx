import { ArrowBack, AssignmentInd, ContactPhone, Home, Person } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

import type { Resident } from './types';

export default function ResidentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [residents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('rpgms_residents');
    return saved ? JSON.parse(saved) : [];
  });

  const resident = residents.find((r) => r.id === id);

  if (!resident) {
    return (
      <Container maxWidth="md" sx={{ pt: 12, pb: 4 }}>
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Resident Not Found
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            The resident profile you are looking for does not exist or has been removed.
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

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          variant="outlined"
          onClick={() => navigate('/residents')}
        >
          Back to Residents
        </Button>
      </Box>

      {/* Profile Header */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 2,
          mb: 4,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.contrastText',
              }}
            >
              <AssignmentInd sx={{ fontSize: 40 }} />
            </Box>
            <Box sx={{ flexGrow: 1, textAlign: { xs: 'center', sm: 'left' } }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {resident.personalInfo.fullName}
              </Typography>
              <Typography color="text.secondary" variant="subtitle1" sx={{ mt: 0.5 }}>
                Resident No: {resident.personalInfo.residentId} &bull; Status:{' '}
                <Box
                  component="span"
                  sx={{
                    fontWeight: 600,
                    color:
                      resident.status === 'Active'
                        ? 'success.main'
                        : resident.status === 'On Notice'
                        ? 'warning.main'
                        : 'text.secondary',
                  }}
                >
                  {resident.status}
                </Box>
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        {/* Accommodation Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <Home color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Accommodation Details
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2.5 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Flat Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.flatId ? `Flat ${resident.flatId}` : 'Not Assigned'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Assigned Beds
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.assignedBedIds.length > 0
                      ? resident.assignedBedIds.map((bedId) => bedId.replace(`${resident.flatId}-`, '')).join(', ')
                      : 'None'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Joining Date
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.joiningDate}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Personal Details Section */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <Person color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Personal Information
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2.5 }} />

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Mobile Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.personalInfo.mobileNumber}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Email Address
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.personalInfo.email || '-'}
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Date of Birth
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {resident.personalInfo.dateOfBirth || '-'}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Gender
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      {resident.personalInfo.gender || '-'}
                    </Typography>
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Emergency Contact Section */}
        <Grid size={{ xs: 12 }}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2 }}>
                <ContactPhone color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Emergency Contact Details
                </Typography>
              </Stack>
              <Divider sx={{ mb: 2.5 }} />

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Contact Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.emergencyContact.name || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Relationship
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.emergencyContact.relationship || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Contact Number
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {resident.emergencyContact.mobileNumber || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
