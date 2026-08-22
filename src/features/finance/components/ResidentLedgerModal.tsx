import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import { ReceiptLong, Shield } from '@mui/icons-material';

import type { Resident } from '../../resident';
import type { Flat } from '../../accommodation/types';
import { ledgerService } from '../services/ledgerService';
import { depositService } from '../services/depositService';
import { DepositLedgerTable } from './DepositLedgerTable';
import { formatCurrency } from '../utils/currencyFormatters';

export interface ResidentLedgerModalProps {
  open: boolean;
  onClose: () => void;
  resident: Resident;
  selectedFlat?: Flat | null;
  stayId?: string;
}

export function ResidentLedgerModal({
  open,
  onClose,
  resident,
  selectedFlat,
  stayId,
}: ResidentLedgerModalProps) {
  const [activeTab, setActiveTab] = useState<number>(0);

  // Retrieve application view model
  const viewModel = useMemo(
    () => ledgerService.getResidentLedgerViewModel(stayId || '', resident),
    [stayId, resident]
  );

  // Retrieve deposit transactions and deposit balance
  const depositTransactions = useMemo(
    () => (stayId ? depositService.getDepositTransactionsByStayId(stayId) : []),
    [stayId]
  );

  const depositHeld = useMemo(
    () => (stayId ? depositService.getDepositBalance(stayId) : 0),
    [stayId]
  );

  const getTransactionTypeChipColor = (type: string) => {
    switch (type) {
      case 'Monthly Rent':
        return 'primary';
      case 'Laundry Charge':
      case 'Electricity Charge':
      case 'Recurring Charge':
        return 'info';
      case 'Payment Received':
        return 'success';
      case 'Security Deposit':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusChipColor = (status?: string) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'UNPAID':
        return 'error';
      case 'PARTIAL':
        return 'warning';
      case 'POSTED':
      case 'COMPLETED':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: { sx: { borderRadius: 3, p: 1 } },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <ReceiptLong color="info" sx={{ fontSize: 32 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Resident Financial Ledger
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Chronological statement of financial transactions and running balance history.
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ my: 1 }}>
        <Stack spacing={2.5}>
          {/* Context Header Summary */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
            <Grid container spacing={1.5} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Resident Account
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {viewModel.residentName} ({viewModel.residentCode})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedFlat ? `Flat ${selectedFlat.name} • ` : ''}Stay ID: {viewModel.stayId}
                </Typography>
              </Grid>

              <Grid size={{ xs: 4, sm: 2.6 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Current Dues
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: viewModel.currentOutstandingBalance > 0 ? 'error.main' : 'success.main',
                    }}
                  >
                    {formatCurrency(viewModel.currentOutstandingBalance)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 4, sm: 2.6 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Advance Credit
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: viewModel.currentAdvanceBalance > 0 ? 'success.main' : 'text.primary',
                    }}
                  >
                    {formatCurrency(viewModel.currentAdvanceBalance)}
                  </Typography>
                </Box>
              </Grid>

              <Grid size={{ xs: 4, sm: 2.6 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Deposit Held
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 700,
                      color: depositHeld > 0 ? 'info.main' : 'text.primary',
                    }}
                  >
                    {formatCurrency(depositHeld)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Tab Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab
                label={`Operating Ledger (${viewModel.rows.length})`}
                icon={<ReceiptLong fontSize="small" />}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
              <Tab
                label={`Security Deposit History (${depositTransactions.length})`}
                icon={<Shield fontSize="small" />}
                iconPosition="start"
                sx={{ textTransform: 'none', fontWeight: 600 }}
              />
            </Tabs>
          </Box>

          {activeTab === 1 ? (
            <DepositLedgerTable transactions={depositTransactions} />
          ) : viewModel.rows.length === 0 ? (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No financial transactions recorded for Stay ID '{viewModel.stayId}' yet.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small" aria-label="resident ledger table">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reference #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Transaction Type</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Debit (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Credit (₹)
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Running Balance
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {viewModel.rows.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                        {row.date}
                      </TableCell>

                      <TableCell
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                        }}
                      >
                        {row.referenceNumber}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={row.transactionType}
                          size="small"
                          color={getTransactionTypeChipColor(row.transactionType)}
                          variant="outlined"
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                        />
                      </TableCell>

                      <TableCell sx={{ maxWidth: 220, fontSize: '0.85rem' }}>
                        {row.description}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: row.debit > 0 ? 700 : 400,
                          color: row.debit > 0 ? 'error.main' : 'text.disabled',
                          fontSize: '0.85rem',
                        }}
                      >
                        {row.debit > 0 ? formatCurrency(row.debit) : '—'}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: row.credit > 0 ? 700 : 400,
                          color: row.credit > 0 ? 'success.main' : 'text.disabled',
                          fontSize: '0.85rem',
                        }}
                      >
                        {row.credit > 0 ? formatCurrency(row.credit) : '—'}
                      </TableCell>

                      <TableCell
                        align="right"
                        sx={{
                          fontWeight: 700,
                          color: row.runningBalance > 0 ? 'error.main' : 'success.main',
                          fontSize: '0.85rem',
                        }}
                      >
                        {formatCurrency(row.runningBalance)}
                      </TableCell>

                      <TableCell align="center">
                        {row.status ? (
                          <Chip
                            label={row.status}
                            size="small"
                            color={getStatusChipColor(row.status)}
                            sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }}
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Summary Totals Row */}
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell colSpan={4} sx={{ fontWeight: 700, textAlign: 'right' }}>
                      Totals:
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                      {formatCurrency(viewModel.totalDebits)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>
                      {formatCurrency(viewModel.totalCredits)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(viewModel.currentOutstandingBalance)}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
