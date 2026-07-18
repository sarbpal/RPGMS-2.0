import { Container, Typography } from '@mui/material';

export default function ResidentsPage() {
  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
        Residents Registry
      </Typography>
      <Typography color="text.secondary">
        Placeholder for Residents Registry page.
      </Typography>
    </Container>
  );
}
