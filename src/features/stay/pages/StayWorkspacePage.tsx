import { useMemo, useState } from 'react';
import { Container, Link, Stack, Box, Snackbar, Alert } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink, useParams, useNavigate } from 'react-router-dom';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { QuickActions } from '../components/QuickActions';
import { StayHeader } from '../components/StayHeader';
import { StaySummaryCard } from '../components/StaySummaryCard';
import { SupportingInformationPanel } from '../components/SupportingInformationPanel';
import { TimelinePanel } from '../components/TimelinePanel';
import { BillingCycleHistoryCard } from '../components/BillingCycleHistoryCard';
import { ChangeBillingCycleModal } from '../components/ChangeBillingCycleModal';
import { TransferBedModal } from '../components/TransferBedModal';
import { GiveNoticeModal } from '../components/GiveNoticeModal';
import { ReceivePaymentModal } from '../../finance/components/ReceivePaymentModal';
import { GenerateRentModal } from '../../finance/components/GenerateRentModal';
import { AddLaundryModal } from '../../finance/components/AddLaundryModal';
import { SettlementDialog } from '../../finance/components/SettlementDialog';
import { useStayFinance } from '../../finance/hooks/useStayFinance';
import { stayWorkflowComposition } from '../../../app/composition/stayWorkflowComposition';

export default function StayWorkspacePage() {
  const { stayId } = useParams<{ stayId: string }>();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Dialog Visibility States
  const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isLaundryModalOpen, setIsLaundryModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

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

  const resident = useMemo(() => {
    const resId = stayDomainEntity?.residentId || viewModel.header.residentId;
    return resId ? coordinator.findResident(resId) : null;
  }, [coordinator, stayDomainEntity?.residentId, viewModel.header.residentId, refreshTrigger]);

  const selectedFlat = useMemo(() => {
    void refreshTrigger;
    return stayDomainEntity?.flatId ? coordinator.findFlat(stayDomainEntity.flatId) : null;
  }, [coordinator, stayDomainEntity?.flatId, refreshTrigger]);

  const modalResident = useMemo(() => {
    if (!resident) return null;
    return {
      ...resident,
      allocatedBedIds: stayDomainEntity?.allocatedBedIds || [],
      agreedRent: stayDomainEntity?.agreedRent || 0,
      agreedDeposit: stayDomainEntity?.agreedDeposit || 0,
    };
  }, [resident, stayDomainEntity]);

  // Retrieve stay financial metrics via application hook
  const { balances, refresh: refreshFinance } = useStayFinance(stayId);

  const handleActionSuccess = (message: string) => {
    setRefreshTrigger((prev) => prev + 1);
    refreshFinance();
    setSnackbarMessage(message);
  };

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
        <QuickActions
          onRecordPayment={() => setIsPaymentModalOpen(true)}
          onGenerateRent={() => setIsRentModalOpen(true)}
          onAddLaundry={() => setIsLaundryModalOpen(true)}
          onAddElectricity={() => navigate('/electricity')}
          onTransferBed={() => setIsTransferModalOpen(true)}
          onGiveNotice={() => setIsNoticeModalOpen(true)}
          onBeginCheckout={() => setIsCheckoutModalOpen(true)}
        />

        {/* 3. Responsive Grid with Stay Summary and Financial Summary */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
          <Box>
            <StaySummaryCard data={viewModel.summary} />
          </Box>
          <Box>
            <FinancialSummaryCard data={viewModel.financialSummary} />
          </Box>
        </Box>

        {/* 4. Stay Timeline */}
        <TimelinePanel events={viewModel.timeline} />

        {/* 5. Supporting Information (Documents & Emergency Contact) */}
        <SupportingInformationPanel data={viewModel.supportingInformation} />

        {/* 6. Billing Cycle History Card */}
        {stayDomainEntity && (
          <BillingCycleHistoryCard
            stay={stayDomainEntity}
            onChangeBillingCycle={() => setIsBillingModalOpen(true)}
          />
        )}
      </Stack>

      {/* ========================================================================= */}
      {/* Interactive Modal Dialogs (Preserving Clean Architecture & Domain Boundaries) */}
      {/* ========================================================================= */}

      {/* 1. Record Payment Modal */}
      {isPaymentModalOpen && modalResident && (
        <ReceivePaymentModal
          open={isPaymentModalOpen}
          resident={modalResident}
          selectedFlat={selectedFlat}
          stayId={stayId}
          balances={balances}
          currentMonthCharges={viewModel.financialSummary.currentMonthCharges ?? viewModel.financialSummary.currentMonthRent}
          lastPaymentDateText={viewModel.financialSummary.lastPaymentReceived}
          onClose={() => setIsPaymentModalOpen(false)}
          onSuccess={(msg) => {
            setIsPaymentModalOpen(false);
            handleActionSuccess(msg);
          }}
        />
      )}

      {/* 2. Generate Monthly Rent Modal */}
      {isRentModalOpen && modalResident && (
        <GenerateRentModal
          open={isRentModalOpen}
          resident={modalResident}
          selectedFlat={selectedFlat}
          stayId={stayId}
          onClose={() => setIsRentModalOpen(false)}
          onSuccess={(msg) => {
            setIsRentModalOpen(false);
            handleActionSuccess(msg);
          }}
        />
      )}

      {/* 3. Add Laundry Modal */}
      {isLaundryModalOpen && modalResident && (
        <AddLaundryModal
          open={isLaundryModalOpen}
          resident={modalResident}
          selectedFlat={selectedFlat}
          stayId={stayId}
          balances={balances}
          onClose={() => setIsLaundryModalOpen(false)}
          onSuccess={(msg) => {
            setIsLaundryModalOpen(false);
            handleActionSuccess(msg);
          }}
        />
      )}

      {/* 4. Transfer Bed Modal */}
      {isTransferModalOpen && stayDomainEntity && (
        <TransferBedModal
          open={isTransferModalOpen}
          stay={stayDomainEntity}
          onClose={() => setIsTransferModalOpen(false)}
          onSuccess={(msg) => {
            setIsTransferModalOpen(false);
            handleActionSuccess(msg);
          }}
          onTransferBed={(input) => coordinator.transferBed(input)}
        />
      )}

      {/* 5. Give Notice Modal */}
      {isNoticeModalOpen && stayDomainEntity && (
        <GiveNoticeModal
          open={isNoticeModalOpen}
          stay={stayDomainEntity}
          onClose={() => setIsNoticeModalOpen(false)}
          onSuccess={(msg) => {
            setIsNoticeModalOpen(false);
            handleActionSuccess(msg);
          }}
          onGiveNotice={(input) => coordinator.giveNotice(input)}
        />
      )}

      {/* 6. Settlement / Checkout Dialog */}
      {isCheckoutModalOpen && (
        <SettlementDialog
          open={isCheckoutModalOpen}
          resident={modalResident || resident}
          stayId={stayId}
          onClose={() => setIsCheckoutModalOpen(false)}
          onSuccess={(msg) => {
            setIsCheckoutModalOpen(false);
            handleActionSuccess(msg);
          }}
        />
      )}

      {/* 7. Change Billing Cycle Modal */}
      {stayDomainEntity && (
        <ChangeBillingCycleModal
          open={isBillingModalOpen}
          stay={stayDomainEntity}
          onClose={() => setIsBillingModalOpen(false)}
          onSuccess={() => {
            setIsBillingModalOpen(false);
            handleActionSuccess('Billing cycle changed successfully.');
          }}
          onChangeBillingCycle={(input) => coordinator.changeBillingCycle(input)}
        />
      )}

      {/* Success Notification Snackbar */}
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={4000}
        onClose={() => setSnackbarMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarMessage(null)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
