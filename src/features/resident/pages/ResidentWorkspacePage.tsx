import { useMemo } from 'react';
import { Container, Grid, Stack } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ResidentWorkspaceCoordinator } from '../application/coordinator/ResidentWorkspaceCoordinator';
import { ContactInformationCard } from '../components/ContactInformationCard';
import { DocumentsCard } from '../components/DocumentsCard';
import { EmergencyContactCard } from '../components/EmergencyContactCard';
import { ResidentHeader } from '../components/ResidentHeader';
import { ResidentQuickActions } from '../components/ResidentQuickActions';
import { ResidentSummaryCard } from '../components/ResidentSummaryCard';

export default function ResidentWorkspacePage() {
  const { residentId } = useParams<{ residentId: string }>();

  const coordinator = useMemo(() => new ResidentWorkspaceCoordinator(), []);
  const viewModel = useMemo(
    () => coordinator.createViewModel(residentId || ''),
    [coordinator, residentId]
  );

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <Stack spacing={3}>
        {/* 1. Resident Header */}
        <ResidentHeader data={viewModel.header} />

        {/* 2. Quick Actions */}
        <ResidentQuickActions />

        {/* 3. Summary & Contact Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ResidentSummaryCard data={viewModel.summary} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ContactInformationCard data={viewModel.contactInformation} />
          </Grid>
        </Grid>

        {/* 4. Documents & Emergency Contact Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DocumentsCard documents={viewModel.documents} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <EmergencyContactCard data={viewModel.emergencyContact} />
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
