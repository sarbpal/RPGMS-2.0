import { Container, Grid, Stack } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ContactInformationCard } from '../components/ContactInformationCard';
import { DocumentsCard } from '../components/DocumentsCard';
import { EmergencyContactCard } from '../components/EmergencyContactCard';
import { ResidentHeader } from '../components/ResidentHeader';
import { ResidentQuickActions } from '../components/ResidentQuickActions';
import { ResidentSummaryCard } from '../components/ResidentSummaryCard';

export default function ResidentWorkspacePage() {
  const { residentId } = useParams<{ residentId: string }>();

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <Stack spacing={3}>
        {/* 1. Resident Header */}
        <ResidentHeader residentId={residentId} />

        {/* 2. Quick Actions */}
        <ResidentQuickActions />

        {/* 3. Summary & Contact Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ResidentSummaryCard />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ContactInformationCard />
          </Grid>
        </Grid>

        {/* 4. Documents & Emergency Contact Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DocumentsCard />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <EmergencyContactCard />
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
