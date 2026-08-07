import { useState } from 'react';
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
} from '@mui/icons-material';

import { useFinanceWorkspace } from '../hooks/useFinanceWorkspace';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { ReceivePaymentModal } from '../components/ReceivePaymentModal';
import { GenerateRentModal } from '../components/GenerateRentModal';
import { AddLaundryModal } from '../components/AddLaundryModal';
import { SettlementDialog } from '../components/SettlementDialog';
import { formatCurrency } from '../utils/currencyFormatters';
import type { Resident } from '../../resident';
import type { StayBalance } from '../domain';
import type { OutstandingResidentReportItem, SettlementReportItem } from '../types';

export default function FinanceWorkspacePage() {
  const {
    viewModel,
    activity,
    activeModal,
    selectedResident,
    selectedStayId,
    selectedFlat,
    openModal,
    closeModal,
    refresh,
  } = useFinanceWorkspace();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const { metrics, outstandingResidents, settlementsReport } = viewModel;

  const handleSuccess = (message: string) => {
    refresh();
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const getEventChipColor = (type: string) => {
    switch (type) {
      case 'BILL':
        return 'error';
      case 'PAYMENT':
        return 'success';
      case 'SETTLEMENT':
        return 'info';
      default:
        return 'default';
    }
  };

  // Construct dummy / target resident object when triggered globally without a specific row selection
  const targetResident: Resident = selectedResident || {
    id: selectedStayId || 'res_global',
    residentCode: 'RES-GLOBAL',
    fullName: 'Global Finance Account',
    status: 'ACTIVE' as const,
    mobileNumber: '9999999999',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const dummyBalances: StayBalance = {
    receivableBalance: metrics.outstandingReceivables,
    securityDepositHeld: 0,
    advanceCreditBalance: 0,
    refundPayable: 0,
    netBalance: metrics.outstandingReceivables,
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
              onClick={() => openModal('RECEIVE_PAYMENT')}
              sx={{ fontWeight: 700 }}
            >
              Receive Payment
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<MonetizationOn />}
              onClick={() => openModal('GENERATE_RENT')}
              sx={{ fontWeight: 600 }}
            >
              Generate Rent
            </Button>
            <Button
              variant="outlined"
              color="info"
              startIcon={<LocalLaundryService />}
              onClick={() => openModal('ADD_LAUNDRY')}
              sx={{ fontWeight: 600 }}
            >
              Add Extra Charge
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<ExitToApp />}
              onClick={() => openModal('PROCESS_SETTLEMENT')}
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
            subtitle="Current month total billed rent"
            color="primary.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Total Collections"
            amount={metrics.totalCollections}
            subtitle="Total cash & bank payments"
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Pending Settlements"
            amount={metrics.pendingSettlementsCount}
            subtitle="Residents on notice / pending checkout"
            color="warning.main"
          />
        </Grid>
      </Grid>

      {/* Main Content Grid: Activity Stream & Outstanding Table */}
      <Grid container spacing={3}>
        {/* Left Column: Recent Activity Stream */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent Financial Activity Stream
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Unified chronological timeline from Billing, Payment, and Settlement engines.
            </Typography>

            {activity.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No financial activity recorded yet.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {activity.map((evt, idx) => (
                  <Box key={evt.id}>
                    {idx > 0 && <Divider component="li" />}
                    <ListItem sx={{ py: 1.5, px: 1 }}>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Chip
                              label={evt.type}
                              size="small"
                              color={getEventChipColor(evt.type)}
                              variant="outlined"
                            />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {evt.title}
                            </Typography>
                            <Typography
                              variant="subtitle2"
                              sx={{ fontWeight: 700, ml: 'auto !important' }}
                            >
                              {formatCurrency(evt.amount)}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {evt.description}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 'auto !important' }}
                            >
                              {evt.date.toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </Typography>
                          </Stack>
                        }
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Outstanding Residents Table */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Outstanding Dues by Resident
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Active residents with pending receivable balances (highest first).
            </Typography>

            {outstandingResidents.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No outstanding receivables! All active residents are fully paid.
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
                        Outstanding Dues
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {outstandingResidents.map((row: OutstandingResidentReportItem) => {
                      const rowResident: Resident = {
                        id: row.stayId,
                        residentCode: row.stayId.toUpperCase(),
                        fullName: row.residentName,
                        status: 'ACTIVE' as const,
                        mobileNumber: row.phone || '9999999999',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
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
                            <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                              {formatCurrency(row.outstandingAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Receive Payment for Resident">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => openModal('RECEIVE_PAYMENT', rowResident, row.stayId)}
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
      {activeModal === 'RECEIVE_PAYMENT' && (
        <ReceivePaymentModal
          open={activeModal === 'RECEIVE_PAYMENT'}
          onClose={closeModal}
          resident={targetResident}
          selectedFlat={selectedFlat}
          stayId={selectedStayId}
          balances={dummyBalances}
          currentMonthCharges={metrics.totalMonthlyBilling}
          lastPaymentDateText="Active Account"
          onSuccess={handleSuccess}
        />
      )}

      {activeModal === 'GENERATE_RENT' && (
        <GenerateRentModal
          open={activeModal === 'GENERATE_RENT'}
          onClose={closeModal}
          resident={targetResident}
          selectedFlat={selectedFlat}
          stayId={selectedStayId}
          onSuccess={handleSuccess}
        />
      )}

      {activeModal === 'ADD_LAUNDRY' && (
        <AddLaundryModal
          open={activeModal === 'ADD_LAUNDRY'}
          onClose={closeModal}
          resident={targetResident}
          selectedFlat={selectedFlat}
          stayId={selectedStayId}
          balances={dummyBalances}
          onSuccess={handleSuccess}
        />
      )}

      {activeModal === 'PROCESS_SETTLEMENT' && (
        <SettlementDialog
          open={activeModal === 'PROCESS_SETTLEMENT'}
          onClose={closeModal}
          resident={selectedResident}
          stayId={selectedStayId}
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
