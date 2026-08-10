import { useMemo, useState } from 'react';
import { Container, Link, Stack, Box } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { QuickActions } from '../components/QuickActions';
import { StayHeader } from '../components/StayHeader';
import { StaySummaryCard } from '../components/StaySummaryCard';
import { SupportingInformationPanel } from '../components/SupportingInformationPanel';
import { TimelinePanel } from '../components/TimelinePanel';
import { BillingCycleHistoryCard } from '../components/BillingCycleHistoryCard';
import { ChangeBillingCycleModal } from '../components/ChangeBillingCycleModal';
import { stayWorkflowComposition } from '../../../app/composition/stayWorkflowComposition';

export default function StayWorkspacePage() {
  const { stayId } = useParams<{ stayId: string }>();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

  const coordinator = useMemo(() => stayWorkflowComposition.stayWorkspaceCoordinator, []);
  const viewModel = useMemo(
    () => {
      void refreshTrigger;
      return coordinator.createViewModel(stayId || '');
    },
    [coordinator, stayId, refreshTrigger]
  );

  const stayDomainEntity = useMemo(() => {
    void refreshTrigger;
    return coordinator.findStay(stayId || '');
  }, [coordinator, stayId, refreshTrigger]);

  const parentResidentPath = viewModel.header.residentId
    ? `/resident/${viewModel.header.residentId}`
    : '/residents';

  return (
    <Container maxWidth="xl" sx={{ pt: 10, pb: 4 }}>
      <Stack spacing={2.5}>
        {/* Workspace Navigation: Lightweight Back links */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link
            component={RouterLink}
            to="/stays"
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
            Back to Stay Registry
          </Link>
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
            Back to Resident Profile
          </Link>
        </Box>

        {/* 1. Stay Header */}
        <StayHeader data={viewModel.header} />

        {/* 2. Quick Actions */}
        <QuickActions />

        {/* 3. Responsive Grid with Stay Summary and Financial Summary */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
          <Box>
            <StaySummaryCard data={viewModel.summary} />
          </Box>
          <Box>
            <FinancialSummaryCard data={viewModel.financialSummary} />
          </Box>
        </Box>

        {/* 4. Billing Cycle History Card */}
        {stayDomainEntity && (
          <BillingCycleHistoryCard
            stay={stayDomainEntity}
            onChangeBillingCycle={() => setIsBillingModalOpen(true)}
          />
        )}

        {/* 5. Timeline Panel */}
        <TimelinePanel events={viewModel.timeline} />

        {/* 6. Supporting Information Panel */}
        <SupportingInformationPanel data={viewModel.supportingInformation} />
      </Stack>

      {/* Change Billing Cycle Modal */}
      {stayDomainEntity && (
        <ChangeBillingCycleModal
          open={isBillingModalOpen}
          stay={stayDomainEntity}
          onClose={() => setIsBillingModalOpen(false)}
          onSuccess={() => {
            setIsBillingModalOpen(false);
            setRefreshTrigger((prev) => prev + 1);
          }}
          onChangeBillingCycle={(input) => coordinator.changeBillingCycle(input)}
        />
      )}
    </Container>
  );
}
