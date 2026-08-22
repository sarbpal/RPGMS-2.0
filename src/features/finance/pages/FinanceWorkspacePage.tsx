import { useState, useMemo } from 'react';
import {
  Stack,
  Typography,
  Grid,
  Paper,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Payments,
  MonetizationOn,
  LocalLaundryService,
  ExitToApp,
  AccountBalanceWallet,
  MoneyOff,
  ReceiptLong,
  History,
} from '@mui/icons-material';

import { useFinanceWorkspace, type FinanceModalType } from '../hooks/useFinanceWorkspace';
import { useStayFinance } from '../hooks/useStayFinance';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { ReceivePaymentModal } from '../components/ReceivePaymentModal';
import { GenerateRentModal } from '../components/GenerateRentModal';
import { AddLaundryModal } from '../components/AddLaundryModal';
import { SettlementDialog } from '../components/SettlementDialog';
import { PartialDepositReturnModal } from '../components/PartialDepositReturnModal';
import { DepositDeductionModal } from '../components/DepositDeductionModal';
import { ResidentLedgerModal } from '../components/ResidentLedgerModal';
import { ReversePaymentModal } from '../components/ReversePaymentModal';
import { SelectStayModal } from '../components/SelectStayModal';
import type { SelectableStayItem } from '../application/coordinator/FinanceWorkspaceCoordinator';
import type { PaymentHistoryItem } from '../application/models/FinanceWorkspaceViewModel';
import { formatCurrency } from '../utils/currencyFormatters';
import type { OutstandingResidentReportItem, SettlementReportItem } from '../types';

export default function FinanceWorkspacePage() {
  const {
    viewModel,
    activity,
    activeModal,
    selectedResident,
    selectedStayId,
    selectedFlat,
    selectedBalances,
    selectedPayment,
    coordinator,
    openModal,
    closeModal,
    refresh,
  } = useFinanceWorkspace();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<FinanceModalType>(null);

  const { metrics, outstandingResidents, settlementsReport, paymentHistory = [] } = viewModel;

  const selectableStays = useMemo(() => {
    return coordinator.getActiveStaysForSelection();
  }, [coordinator, activity, viewModel]);

  const handleGlobalActionClick = (actionType: FinanceModalType) => {
    setPendingAction(actionType);
    setIsSelectorOpen(true);
  };

  const handleStaySelected = (stayItem: SelectableStayItem) => {
    setIsSelectorOpen(false);
    if (pendingAction) {
      openModal(
        pendingAction,
        stayItem.resident,
        stayItem.stayId,
        stayItem.flat,
        stayItem.balances
      );
    }
    setPendingAction(null);
  };

  const { bills: selectedBills, refresh: refreshStayFinance } = useStayFinance(selectedStayId);

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const stayCurrentMonthCharges = useMemo(() => {
    if (!selectedStayId || !selectedBills) return 0;
    return selectedBills
      .filter((b) => b.period === currentMonthStr && b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [selectedStayId, selectedBills, currentMonthStr]);

  const handleSuccess = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarOpen(true);
    refresh();
    if (selectedStayId) {
      refreshStayFinance();
    }
  };

  const getTimelineEventChipColor = (type: string) => {
    switch (type) {
      case 'BILL_GENERATED':
        return 'primary';
      case 'PAYMENT_RECEIVED':
        return 'success';
      case 'SETTLEMENT_RECORDED':
        return 'warning';
      case 'CHARGE_POSTED':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Stack spacing={3}>
      {/* Top Header & Actions Bar */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
              Finance & Accounting Dashboard
            </Typography>
            <Typography color="text.secondary">
              Property-wide financial ledger, monthly billing, payment tracking, checkout settlements, and audit reports.
            </Typography>
          </Box>

          {/* Header Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<Payments />}
              onClick={() => handleGlobalActionClick('RECEIVE_PAYMENT')}
              sx={{ fontWeight: 700 }}
            >
              Receive Payment
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<MonetizationOn />}
              onClick={() => handleGlobalActionClick('GENERATE_RENT')}
              sx={{ fontWeight: 600 }}
            >
              Generate Rent
            </Button>
            <Button
              variant="outlined"
              color="info"
              startIcon={<LocalLaundryService />}
              onClick={() => handleGlobalActionClick('ADD_LAUNDRY')}
              sx={{ fontWeight: 600 }}
            >
              Add Extra Charge
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AccountBalanceWallet />}
              onClick={() => handleGlobalActionClick('PARTIAL_DEPOSIT_RETURN')}
              sx={{ fontWeight: 600 }}
            >
              Deposit Return
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<MoneyOff />}
              onClick={() => handleGlobalActionClick('DEPOSIT_DEDUCTION')}
              sx={{ fontWeight: 600 }}
            >
              Deposit Deduction
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<ReceiptLong />}
              onClick={() => handleGlobalActionClick('VIEW_LEDGER')}
              sx={{ fontWeight: 600 }}
            >
              View Ledger
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ExitToApp />}
              onClick={() => handleGlobalActionClick('PROCESS_SETTLEMENT')}
              sx={{ fontWeight: 600 }}
            >
              Process Settlement
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Dashboard Cards Grid */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Outstanding Receivables"
            amount={metrics.outstandingReceivables}
            subtitle="Total pending dues across residents"
            color="error.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Monthly Billing"
            amount={metrics.totalMonthlyBilling}
            subtitle="Total billed this month"
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Total Collections"
            amount={metrics.totalCollections}
            subtitle="Total payments collected"
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Pending Settlements"
            amount={metrics.pendingSettlementsCount}
            subtitle="Active stays awaiting final settlement"
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Main Two-Column Layout */}
      <Grid container spacing={3}>
        {/* Left Column: Recent Financial Activity Stream */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent Financial Activity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Chronological log of bills generated, payments received, and settlements processed.
            </Typography>

            {activity.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No recent financial activity recorded.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {activity.map((event, index) => (
                  <Box key={event.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={event.type.replace(/_/g, ' ')}
                                size="small"
                                color={getTimelineEventChipColor(event.type)}
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {event.title}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {formatCurrency(event.amount)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {event.description}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {event.date instanceof Date
                                ? event.date.toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                  })
                                : String(event.date)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < activity.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Outstanding Dues by Resident Table */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Outstanding Dues by Resident
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Active resident accounts with unsettled balances or pending payments.
            </Typography>

            {outstandingResidents.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No active accounts with pending dues.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Resident</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        Current Dues
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {outstandingResidents.map((row: OutstandingResidentReportItem) => {
                      const selectableItem = selectableStays.find((s) => s.stayId === row.stayId);
                      return (
                        <TableRow key={row.stayId} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {row.residentName}
                            </Typography>
                            {row.phone && (
                              <Typography variant="caption" color="text.secondary">
                                {row.phone}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {row.roomBedLabel || 'Assigned'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                              {formatCurrency(row.outstandingAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Receive Payment for this resident">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => {
                                  if (selectableItem) {
                                    openModal(
                                      'RECEIVE_PAYMENT',
                                      selectableItem.resident,
                                      selectableItem.stayId,
                                      selectableItem.flat,
                                      selectableItem.balances
                                    );
                                  } else {
                                    handleGlobalActionClick('RECEIVE_PAYMENT');
                                  }
                                }}
                              >
                                <Payments fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Middle Section: Payment Receipts & Reversal Audit Table */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
          Payment Receipts & Reversal Audit
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Authoritative ledger-backed payment journal across all resident stays. Initiate double-entry compensating reversals for returned or erroneous payments.
        </Typography>

        {paymentHistory.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No recorded payments found.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Receipt #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Resident</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Stay ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Payment Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Method / Ref</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Amount
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentHistory.map((row: PaymentHistoryItem) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.paymentNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {row.residentName} {row.residentCode ? `(${row.residentCode})` : ''}
                    </TableCell>
                    <TableCell>{row.stayId}</TableCell>
                    <TableCell>{row.paymentDate}</TableCell>
                    <TableCell>
                      {row.paymentMethod}
                      {row.referenceNumber ? ` (${row.referenceNumber})` : ''}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: row.status === 'REVERSED' ? 'text.secondary' : 'success.main',
                        }}
                      >
                        {formatCurrency(row.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {row.status === 'REVERSED' ? (
                        <Tooltip
                          title={`Reversed on ${row.reversedAt || ''} by ${row.reversedBy || 'OPERATOR'}: ${
                            row.reversalReason || ''
                          }`}
                        >
                          <Chip label="REVERSED" size="small" color="error" variant="outlined" />
                        </Tooltip>
                      ) : (
                        <Chip label="RECORDED" size="small" color="success" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {row.status !== 'REVERSED' ? (
                        <Tooltip title="Reverse Payment (Compensating Double-Entry Counter-Posting)">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<History />}
                            onClick={() =>
                              openModal(
                                'REVERSE_PAYMENT',
                                null,
                                row.stayId,
                                null,
                                null,
                                row
                              )
                            }
                            sx={{ textTransform: 'none', fontWeight: 600 }}
                          >
                            Reverse
                          </Button>
                        </Tooltip>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Reversed
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Bottom Section: Recent Settlements Audit Report */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
          Completed Checkout Settlements Report
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Audit log of closed stays, deposit adjustments, damage recoveries, and final refund payouts.
        </Typography>

        {settlementsReport.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No closed checkout settlements recorded yet.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Settlement #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Resident</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Settlement Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Outcome</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Damage Recovery
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Final Net Amount
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settlementsReport.map((row: SettlementReportItem) => (
                  <TableRow key={row.settlementId} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.settlementNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.residentName}</TableCell>
                    <TableCell>{row.settlementDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.outcome.replace(/_/g, ' ')}
                        size="small"
                        color={row.outcome === 'HOSTEL_REFUNDS_RESIDENT' ? 'info' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      {row.damageRecovery > 0 ? formatCurrency(row.damageRecovery) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {formatCurrency(row.netRefundAmount || row.residentPaymentAmount)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Modal Dialogs */}
      {/* 0. Target Stay Selector Dialog */}
      <SelectStayModal
        open={isSelectorOpen}
        actionType={pendingAction}
        stays={selectableStays}
        onSelectStay={handleStaySelected}
        onClose={() => {
          setIsSelectorOpen(false);
          setPendingAction(null);
        }}
      />

      {/* 1. Receive Payment Modal */}
      {activeModal === 'RECEIVE_PAYMENT' && selectedResident && selectedStayId && (
        <ReceivePaymentModal
          open={activeModal === 'RECEIVE_PAYMENT'}
          onClose={closeModal}
          resident={selectedResident}
          selectedFlat={selectedFlat}
          stayId={selectedStayId}
          balances={
            selectedBalances || {
              receivableBalance: 0,
              securityDepositHeld: 0,
              advanceCreditBalance: 0,
              refundPayable: 0,
              netBalance: 0,
            }
          }
          currentMonthCharges={stayCurrentMonthCharges}
          lastPaymentDateText="Current Account"
          onSuccess={handleSuccess}
        />
      )}

      {/* 2. Generate Rent Modal */}
      {activeModal === 'GENERATE_RENT' && selectedResident && selectedStayId && (
        <GenerateRentModal
          open={activeModal === 'GENERATE_RENT'}
          onClose={closeModal}
          resident={selectedResident}
          selectedFlat={selectedFlat}
          stayId={selectedStayId}
          onSuccess={handleSuccess}
        />
      )}

      {/* 3. Add Laundry Modal */}
      {activeModal === 'ADD_LAUNDRY' && selectedResident && selectedStayId && (
        <AddLaundryModal
          open={activeModal === 'ADD_LAUNDRY'}
          onClose={closeModal}
          resident={selectedResident}
          selectedFlat={selectedFlat}
          stayId={selectedStayId}
          balances={
            selectedBalances || {
              receivableBalance: 0,
              securityDepositHeld: 0,
              advanceCreditBalance: 0,
              refundPayable: 0,
              netBalance: 0,
            }
          }
          onSuccess={handleSuccess}
        />
      )}

      {/* 4. Process Settlement Dialog */}
      {activeModal === 'PROCESS_SETTLEMENT' && selectedResident && selectedStayId && (
        <SettlementDialog
          open={activeModal === 'PROCESS_SETTLEMENT'}
          onClose={closeModal}
          resident={selectedResident}
          stayId={selectedStayId}
          onSuccess={handleSuccess}
        />
      )}

      {/* 5. Partial Deposit Return Modal */}
      {activeModal === 'PARTIAL_DEPOSIT_RETURN' && selectedStayId && (
        <PartialDepositReturnModal
          open={activeModal === 'PARTIAL_DEPOSIT_RETURN'}
          stayId={selectedStayId}
          currentDepositHeld={selectedBalances?.securityDepositHeld || 0}
          onClose={closeModal}
          onSuccess={() => handleSuccess('Partial deposit return recorded successfully.')}
        />
      )}

      {/* 6. Deposit Deduction Modal */}
      {activeModal === 'DEPOSIT_DEDUCTION' && selectedStayId && (
        <DepositDeductionModal
          open={activeModal === 'DEPOSIT_DEDUCTION'}
          stayId={selectedStayId}
          currentDepositHeld={selectedBalances?.securityDepositHeld || 0}
          onClose={closeModal}
          onSuccess={() => handleSuccess('Deposit deduction recorded successfully.')}
        />
      )}

      {/* 7. Resident Financial Ledger Modal */}
      {activeModal === 'VIEW_LEDGER' && selectedResident && selectedStayId && (
        <ResidentLedgerModal
          open={activeModal === 'VIEW_LEDGER'}
          resident={selectedResident}
          selectedFlat={selectedFlat}
          stayId={selectedStayId}
          onClose={closeModal}
        />
      )}

      {/* 8. Reverse Payment Modal */}
      {activeModal === 'REVERSE_PAYMENT' && selectedPayment && (
        <ReversePaymentModal
          open={activeModal === 'REVERSE_PAYMENT'}
          payment={selectedPayment}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}

      {/* Snackbar Alert for Success Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
