import { Container, Grid, Stack } from '@mui/material';
import { useParams } from 'react-router-dom';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { QuickActions } from '../components/QuickActions';
import { StayHeader } from '../components/StayHeader';
import { StaySummaryCard } from '../components/StaySummaryCard';
import { SupportingInformationPanel } from '../components/SupportingInformationPanel';
import { TimelinePanel } from '../components/TimelinePanel';

export default function StayWorkspacePage() {
  const { stayId } = useParams<{ stayId: string }>();

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <Stack spacing={3}>
        {/* 1. Stay Header */}
        <StayHeader stayId={stayId} />

        {/* 2. Quick Actions */}
        <QuickActions />

        {/* 3. Responsive Grid with Stay Summary and Financial Summary */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <StaySummaryCard />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FinancialSummaryCard />
          </Grid>
        </Grid>

        {/* 4. Timeline Panel */}
        <TimelinePanel />

        {/* 5. Supporting Information Panel */}
        <SupportingInformationPanel />
      </Stack>
    </Container>
  );
}
