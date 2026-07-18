import { Container, Box, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ResidentOnboardingWizard from '../components/ResidentOnboardingWizard';

export default function ResidentOnboardingPage() {
  const navigate = useNavigate();

  const handleSubmitSuccess = () => {
    // Let the snackbar display for 1.5 seconds before navigating back to the list
    setTimeout(() => {
      navigate('/residents');
    }, 1500);
  };

  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/residents')}
          variant="outlined"
          size="small"
        >
          Back
        </Button>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            New Resident Onboarding
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Register a new resident and allocate their accommodation details.
          </Typography>
        </Box>
      </Box>

      <ResidentOnboardingWizard
        onSubmitSuccess={handleSubmitSuccess}
        onCancel={() => navigate('/residents')}
      />
    </Container>
  );
}
