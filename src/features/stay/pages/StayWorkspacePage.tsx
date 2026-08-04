import { useMemo } from 'react';
import { Container, Grid, Link, Stack } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { StayWorkspaceCoordinator } from '../application/coordinator/StayWorkspaceCoordinator';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { QuickActions } from '../components/QuickActions';
import { StayHeader } from '../components/StayHeader';
import { StaySummaryCard } from '../components/StaySummaryCard';
import { SupportingInformationPanel } from '../components/SupportingInformationPanel';
import { TimelinePanel } from '../components/TimelinePanel';

export default function StayWorkspacePage() {
  const { stayId } = useParams<{ stayId: string }>();

  const coordinator = useMemo(() => new StayWorkspaceCoordinator(), []);
  const viewModel = useMemo(
    () => coordinator.createViewModel(stayId || ''),
    [coordinator, stayId]
  );

  const parentResidentPath = viewModel.header.residentId
    ? `/resident/${viewModel.header.residentId}`
    : '/residents';

  return (
    <Container maxWidth="xl" sx={{ pt: 10, pb: 4 }}>
      <Stack spacing={2.5}>
        {/* Workspace Navigation: Lightweight Back to Resident link */}
        <Link
          component={RouterLink}
          to={parentResidentPath}
          underline="hover"
          color="text.secondary"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            fontWeight: 600,
            fontSize: '0.875rem',
            width: 'fit-content',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <ArrowBack sx={{ fontSize: '1.1rem' }} />
          Back to Resident
        </Link>

        {/* 1. Stay Header */}
        <StayHeader data={viewModel.header} />

        {/* 2. Quick Actions */}
        <QuickActions />

        {/* 3. Responsive Grid with Stay Summary and Financial Summary */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <StaySummaryCard data={viewModel.summary} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FinancialSummaryCard data={viewModel.financialSummary} />
          </Grid>
        </Grid>

        {/* 4. Timeline Panel */}
        <TimelinePanel events={viewModel.timeline} />

        {/* 5. Supporting Information Panel */}
        <SupportingInformationPanel data={viewModel.supportingInformation} />
      </Stack>
    </Container>
  );
}
