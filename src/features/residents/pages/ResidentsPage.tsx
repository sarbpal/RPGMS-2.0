import { Container, Typography, Box } from '@mui/material';
import ResidentOnboardingWizard from '../components/ResidentOnboardingWizard';

export default function ResidentsPage() {
  return (
    <Container maxWidth="lg" sx={{ pt: 12, pb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Residents Registry
        </Typography>
        <Typography color="text.secondary">
          Onboard new residents, manage identity details, and set up accommodation terms.
        </Typography>
      </Box>

      <ResidentOnboardingWizard />
    </Container>
  );
}
