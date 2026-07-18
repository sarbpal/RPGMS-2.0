import { Container, Typography } from '@mui/material';

export default function ResidentProfilePage() {
  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Resident Profile
      </Typography>
      <Typography color="text.secondary">
        Placeholder for Resident Profile page.
      </Typography>
    </Container>
  );
}
