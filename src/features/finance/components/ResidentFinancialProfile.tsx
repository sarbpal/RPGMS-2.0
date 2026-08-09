import { useMemo, useState } from 'react';
import {
  Alert,
  Box,

  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { GenerateRentModal } from './GenerateRentModal';
import { ReceivePaymentModal } from './ReceivePaymentModal';
import { AddLaundryModal } from './AddLaundryModal';
import { ResidentLedgerModal } from './ResidentLedgerModal';
import { SettlementDialog } from './SettlementDialog';
import { PartialDepositReturnModal } from './PartialDepositReturnModal';
import { DepositDeductionModal } from './DepositDeductionModal';





import {
  AccountBalanceWallet,
  ExitToApp,
  FlashOn,
  LocalLaundryService,
  MenuBook,
  MonetizationOn,
  Payments,
  ReceiptLong,
  Shield,
  CalendarToday,
  CheckCircleOutlined,
  InfoOutlined,
} from '@mui/icons-material';

import type { Resident } from '../../resident';
import type { Flat } from '../../accommodation/types';
import { InMemoryStayRepository, StayStatus } from '../../stay';
import { useStayFinance } from '../hooks/useStayFinance';
import { formatCurrency } from '../utils/currencyFormatters';

export interface ResidentFinancialProfileProps {
  resident: Resident;
  selectedFlat?: Flat | null;
}

export type ActionType =
  | 'GENERATE_RENT'
  | 'ADD_LAUNDRY'
  | 'ADD_ELECTRICITY'
  | 'RECEIVE_PAYMENT'
  | 'VIEW_LEDGER'
  | 'CHECKOUT'
  | 'PARTIAL_DEPOSIT_RETURN'
  | 'DEPOSIT_DEDUCTION'
  | null;


export function ResidentFinancialProfile({
  resident,
  selectedFlat,
}: ResidentFinancialProfileProps) {
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');

  const res = resident as Resident & {
    allocatedBedIds?: string[];
    agreedRent?: number;
    agreedDeposit?: number;
  };

  // Fetch active stay for resident
  const activeStay = useMemo(() => {
    const stayRepo = new InMemoryStayRepository();
    return (
      stayRepo
        .getAllSync()
        .find(
          (s) =>
            s.residentId === resident.id &&
            (s.status === StayStatus.ACTIVE || s.status === StayStatus.ON_NOTICE)
        ) || null
    );
  }, [resident.id]);
  const stayId = activeStay?.id;

  // Retrieve stay financial metrics via application hook
  const { balances, bills, payments, refresh } = useStayFinance(stayId);

  const handleRentGeneratedSuccess = (message: string) => {
    refresh();
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handlePaymentReceivedSuccess = (message: string) => {
    refresh();
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleLaundryChargeSuccess = (message: string) => {
    refresh();
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSettlementSuccess = (message: string) => {
    refresh();
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };




  // Financial Snapshot Metrics
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const currentMonthCharges = useMemo(() => {
    return bills
      .filter((b) => b.period === currentMonthStr && b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + b.totalAmount, 0);
  }, [bills, currentMonthStr]);

  const totalPaymentsReceived = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  // Recent Activity dates
  const lastBill = useMemo(() => {
    if (!bills || bills.length === 0) return null;
    return [...bills].sort(
      (a, b) =>
        new Date(b.issueDate || b.createdAt).getTime() -
        new Date(a.issueDate || a.createdAt).getTime()
    )[0];
  }, [bills]);

  const lastPayment = useMemo(() => {
    if (!payments || payments.length === 0) return null;
    return [...payments].sort(
      (a, b) =>
        new Date(b.paymentDate || b.createdAt).getTime() -
        new Date(a.paymentDate || a.createdAt).getTime()
    )[0];
  }, [payments]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getBedLabel = () => {
    if (!res.allocatedBedIds || res.allocatedBedIds.length === 0) {
      return 'No Bed Allocated';
    }
    return res.allocatedBedIds
      .map((bedId: string) => {
        const match = bedId.match(/[^-]+$/);
        return match ? match[0] : bedId;
      })
      .join(', ');
  };

  const renderActionDialogContent = () => {
    switch (activeAction) {
      case 'GENERATE_RENT':
        return {
          title: 'Generate Rent Invoice',
          icon: <MonetizationOn color="primary" sx={{ fontSize: 32 }} />,
          chipLabel: 'Workflow - Sprint 12.6',
          description: `This action will issue a monthly rent bill of ${formatCurrency(
            res.agreedRent || 0
          )} for Stay ID ${stayId || 'N/A'} for period ${currentMonthStr}.`,
        };
      case 'ADD_LAUNDRY':
        return {
          title: 'Add Laundry Charge',
          icon: <LocalLaundryService color="primary" sx={{ fontSize: 32 }} />,
          chipLabel: 'Workflow - Sprint 12.7',
          description: `This action will post an ancillary laundry service fee to ${resident.fullName}'s financial account.`,
        };
      case 'ADD_ELECTRICITY':
        return {
          title: 'Add Electricity Charge',
          icon: <FlashOn color="primary" sx={{ fontSize: 32 }} />,
          chipLabel: 'Workflow - Sprint 12.7',
          description: `This action will calculate and post flat meter utility splits for ${
            selectedFlat ? `Flat ${selectedFlat.name}` : 'the allocated flat'
          }.`,
        };
      case 'RECEIVE_PAYMENT':
        return {
          title: 'Receive Payment',
          icon: <Payments color="success" sx={{ fontSize: 32 }} />,
          chipLabel: 'Workflow - Sprint 12.6',
          description: `This action will record a cash/bank payment for ${resident.fullName}, allocate funds against open unpaid bills, and process advance credits.`,
        };
      case 'VIEW_LEDGER':
        return {
          title: 'View Resident Ledger',
          icon: <ReceiptLong color="info" sx={{ fontSize: 32 }} />,
          chipLabel: 'Workflow - Sprint 12.6',
          description: `This action will display the full interactive double-entry financial ledger and transaction history for ${resident.fullName} (Stay ID ${stayId || 'N/A'}).`,
        };

      case 'CHECKOUT':
        return {
          title: 'Resident Checkout & Settlement',
          icon: <ExitToApp color="warning" sx={{ fontSize: 32 }} />,
          chipLabel: 'Workflow - Sprint 12.8',
          description: `This action will initiate 2-stage checkout preview calculation, reconcile deposit held (${formatCurrency(
            balances.securityDepositHeld
          )}) against outstanding dues, and close the Stay.`,
        };
      default:
        return null;
    }
  };

  const dialogDetails = renderActionDialogContent();

  return (
    <Stack spacing={3}>
      {/* Top Header Card: Financial Profile Summary */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccountBalanceWallet color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Resident Financial Profile
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Financial account overview, live ledger metrics, and operational actions for{' '}
                <strong>{resident.fullName}</strong>
              </Typography>
            </Box>
          </Box>
          <Chip
            icon={<CheckCircleOutlined />}
            label={`Status: ${resident.status}`}

            color={
              resident.status === 'ACTIVE'
                ? 'success'
                : resident.status === 'ON_NOTICE'
                ? 'warning'
                : 'default'
            }
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Resident Name & Bed
            </Typography>

            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {resident.fullName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {selectedFlat ? `Flat ${selectedFlat.name}` : 'No Flat'} • Bed {getBedLabel()}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Security Deposit
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {formatCurrency(balances.securityDepositHeld)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Agreed: {formatCurrency(res.agreedDeposit || 0)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Outstanding Balance
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                color: balances.receivableBalance > 0 ? 'error.main' : 'success.main',
              }}
            >
              {formatCurrency(balances.receivableBalance)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {balances.receivableBalance > 0 ? 'Pending Payment' : 'Fully Clear'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Advance Balance / Credit
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: 'info.main' }}>
              {formatCurrency(balances.advanceCreditBalance)}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Available Credit
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Recent Activity Dates */}
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarToday color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                <strong>Last Bill Issued:</strong>{' '}
                {lastBill ? (
                  <>
                    {formatDate(lastBill.issueDate || lastBill.createdAt)} (
                    {formatCurrency(lastBill.totalAmount)} - {lastBill.billType})
                  </>
                ) : (
                  'No bills issued yet'
                )}
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Payments color="action" fontSize="small" />
              <Typography variant="body2" color="text.secondary">
                <strong>Last Payment Received:</strong>{' '}
                {lastPayment ? (
                  <>
                    {formatDate(lastPayment.paymentDate || lastPayment.createdAt)} (
                    {formatCurrency(lastPayment.amount)} via {lastPayment.paymentMethod})
                  </>
                ) : (
                  'No payments recorded yet'
                )}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Financial Snapshot Cards */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1.5 }}>
          Financial Snapshot
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: balances.receivableBalance > 0 ? 'error.light' : 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Outstanding Amount
                  </Typography>

                  <AccountBalanceWallet
                    color={balances.receivableBalance > 0 ? 'error' : 'action'}
                  />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: balances.receivableBalance > 0 ? 'error.main' : 'text.primary',
                  }}
                >
                  {formatCurrency(balances.receivableBalance)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Derived from resident ledger
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Current Month Charges
                  </Typography>
                  <ReceiptLong color="primary" />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {formatCurrency(currentMonthCharges)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Billed in {currentMonthStr}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Payments Received
                  </Typography>
                  <Payments color="success" />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {formatCurrency(totalPaymentsReceived)}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Total receipts for stay
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined" sx={{ borderRadius: 3, bgcolor: 'background.paper' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box
                  sx={{
                    display: 'flex',
                    justify: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Security Deposit Held
                  </Typography>
                  <Shield color="info" />
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 700, color: 'info.main' }}>
                  {formatCurrency(balances.securityDepositHeld)}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  Held in deposit ledger
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Finance Action Panel */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          Finance Action Panel
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Execute financial transactions, billing routines, payment receipts, and checkout workflows.
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<MonetizationOn />}
              onClick={() => setActiveAction('GENERATE_RENT')}
              sx={{
                py: 1.5,
                borderRadius: 2,
                justify: 'flex-start',
                fontWeight: 600,
              }}
            >
              Generate Rent
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<LocalLaundryService />}
              onClick={() => setActiveAction('ADD_LAUNDRY')}
              sx={{
                py: 1.5,
                borderRadius: 2,
                justify: 'flex-start',
                fontWeight: 600,
              }}
            >
              Add Laundry
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              startIcon={<FlashOn />}
              onClick={() => setActiveAction('ADD_ELECTRICITY')}
              sx={{
                py: 1.5,
                borderRadius: 2,
                justify: 'flex-start',
                fontWeight: 600,
              }}
            >
              Add Electricity
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="contained"
              color="success"
              fullWidth
              startIcon={<Payments />}
              onClick={() => setActiveAction('RECEIVE_PAYMENT')}
              sx={{
                py: 1.5,
                borderRadius: 2,
                justify: 'flex-start',
                fontWeight: 600,
              }}
            >
              Receive Payment
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="outlined"
              color="info"
              fullWidth
              startIcon={<MenuBook />}
              onClick={() => setActiveAction('VIEW_LEDGER')}
              sx={{
                py: 1.5,
                borderRadius: 2,
                justify: 'flex-start',
                fontWeight: 600,
              }}
            >
              View Ledger
            </Button>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Button
              variant="outlined"
              color="warning"
              fullWidth
              startIcon={<ExitToApp />}
              onClick={() => setActiveAction('CHECKOUT')}
              sx={{
                py: 1.5,
                borderRadius: 2,
                justify: 'flex-start',
                fontWeight: 600,
              }}
            >
              Checkout
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Generate Monthly Rent Modal */}
      {activeAction === 'GENERATE_RENT' && (
        <GenerateRentModal
          open={activeAction === 'GENERATE_RENT'}
          onClose={() => setActiveAction(null)}
          resident={resident}
          selectedFlat={selectedFlat}
          stayId={stayId}
          onSuccess={handleRentGeneratedSuccess}
        />
      )}

      {/* Receive Payment Modal */}
      {activeAction === 'RECEIVE_PAYMENT' && (
        <ReceivePaymentModal
          open={activeAction === 'RECEIVE_PAYMENT'}
          onClose={() => setActiveAction(null)}
          resident={resident}
          selectedFlat={selectedFlat}
          stayId={stayId}
          balances={balances}
          currentMonthCharges={currentMonthCharges}
          lastPaymentDateText={
            lastPayment
              ? `${formatDate(lastPayment.paymentDate || lastPayment.createdAt)} (${formatCurrency(lastPayment.amount)} via ${lastPayment.paymentMethod})`
              : 'No payments recorded yet'
          }
          onSuccess={handlePaymentReceivedSuccess}
        />
      )}

      {/* Add Laundry Charge Modal */}
      {activeAction === 'ADD_LAUNDRY' && (
        <AddLaundryModal
          open={activeAction === 'ADD_LAUNDRY'}
          onClose={() => setActiveAction(null)}
          resident={resident}
          selectedFlat={selectedFlat}
          stayId={stayId}
          balances={balances}
          onSuccess={handleLaundryChargeSuccess}
        />
      )}

      {/* View Resident Ledger Modal */}
      {activeAction === 'VIEW_LEDGER' && (
        <ResidentLedgerModal
          open={activeAction === 'VIEW_LEDGER'}
          onClose={() => setActiveAction(null)}
          resident={resident}
          selectedFlat={selectedFlat}
          stayId={stayId}
        />
      )}

      {/* Checkout Settlement Modal */}
      {activeAction === 'CHECKOUT' && (
        <SettlementDialog
          open={activeAction === 'CHECKOUT'}
          onClose={() => setActiveAction(null)}
          resident={resident}
          stayId={stayId}
          onSuccess={handleSettlementSuccess}
        />
      )}

      {/* Partial Deposit Return Modal */}
      {activeAction === 'PARTIAL_DEPOSIT_RETURN' && stayId && (
        <PartialDepositReturnModal
          open={activeAction === 'PARTIAL_DEPOSIT_RETURN'}
          onClose={() => setActiveAction(null)}
          stayId={stayId}
          currentDepositHeld={balances.securityDepositHeld}
          onSuccess={() => handleSettlementSuccess('Partial deposit return processed successfully.')}
        />
      )}

      {/* Deposit Deduction Modal */}
      {activeAction === 'DEPOSIT_DEDUCTION' && stayId && (
        <DepositDeductionModal
          open={activeAction === 'DEPOSIT_DEDUCTION'}
          onClose={() => setActiveAction(null)}
          stayId={stayId}
          currentDepositHeld={balances.securityDepositHeld}
          onSuccess={() => handleSettlementSuccess('Deposit deduction recorded successfully.')}
        />
      )}


      {/* Action Placeholder Dialog for Other Ancillary Workflows */}
      <Dialog
        open={Boolean(
          activeAction &&
            activeAction !== 'GENERATE_RENT' &&
            activeAction !== 'RECEIVE_PAYMENT' &&
            activeAction !== 'ADD_LAUNDRY' &&
            activeAction !== 'VIEW_LEDGER' &&
            activeAction !== 'CHECKOUT'
        )}



        onClose={() => setActiveAction(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: { sx: { borderRadius: 3, p: 1 } },
        }}
      >
        {dialogDetails && (
          <>
            <DialogTitle
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                pb: 1,
              }}
            >
              {dialogDetails.icon}
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {dialogDetails.title}
                </Typography>
                <Chip
                  label={dialogDetails.chipLabel}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mt: 0.5, fontWeight: 600 }}
                />
              </Box>
            </DialogTitle>

            <DialogContent dividers sx={{ my: 1 }}>
              <Stack spacing={2}>
                <Typography variant="body2" color="text.secondary">
                  {dialogDetails.description}
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
                    Target Context Details
                  </Typography>

                  <Grid container spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Resident Name:
                      </Typography>

                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {resident.fullName}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Stay ID:
                      </Typography>

                      <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {stayId || 'No active stay'}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Agreed Rent:
                      </Typography>

                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(res.agreedRent || 0)}
                      </Typography>
                    </Grid>

                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Outstanding Dues:
                      </Typography>

                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                        {formatCurrency(balances.receivableBalance)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>

                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'info.50',
                    border: '1px solid',
                    borderColor: 'info.200',
                  }}
                >
                  <InfoOutlined color="info" fontSize="small" sx={{ mt: 0.2 }} />
                  <Typography variant="caption" color="info.main">
                    This workflow UI structure is complete. Full interactive execution will be wired up in subsequent sprints.
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button
                variant="contained"
                onClick={() => setActiveAction(null)}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Success Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          onClose={() => setSnackbarOpen(false)}
          sx={{ width: '100%', borderRadius: 2, boxShadow: 3 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Stack>

  );
}
