import { useMemo } from 'react';
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
} from '@mui/material';
import { reportingService } from '../services/reportingService';
import { useFinanceActivity } from '../hooks/useFinanceActivity';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { formatCurrency } from '../utils/currencyFormatters';

export default function FinancePage() {
  const metrics = useMemo(() => reportingService.getFinanceDashboard(), []);
  const outstandingResidents = useMemo(() => reportingService.getOutstandingResidents(), []);
  const settlementsReport = useMemo(() => reportingService.getSettlementReport(), []);
  const { activity } = useFinanceActivity(8);

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

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          Finance & Accounting Dashboard
        </Typography>
        <Typography color="text.secondary">
          Property-wide financial ledger, monthly billing, payment tracking, checkout settlements, and audit reports.
        </Typography>
      </Box>

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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {outstandingResidents.map((row) => (
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
                      </TableRow>
                    ))}
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
                {settlementsReport.map((row) => (
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
    </Stack>
  );
}
