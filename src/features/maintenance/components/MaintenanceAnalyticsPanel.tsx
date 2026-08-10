import {
  AccountBalanceWallet,
  Assessment,
  Build,
  Schedule,
  TrendingDown,
  TrendingUp,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import type { MaintenanceAnalyticsResult } from '../domain/types/MaintenanceTypes';

interface Props {
  analytics?: MaintenanceAnalyticsResult;
  onDrillDown: (filters: {
    category?: string;
    flatId?: string;
    assignedToId?: string;
    status?: string;
    period?: string;
  }) => void;
}

export function MaintenanceAnalyticsPanel({ analytics, onDrillDown }: Props) {
  const theme = useTheme();

  if (!analytics) return null;

  const { financial, performance, byCategory, byFlat, byPersonnel, byPeriod } = analytics;

  return (
    <Stack spacing={3.5} sx={{ mt: 2 }}>
      {/* Top Financial & Operational Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 2.5,
        }}
      >
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="body2">
                  Total Actual Repair Cost
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                  ₹{financial.totalActualCost.toLocaleString('en-IN')}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  Est: ₹{financial.totalEstimatedCost.toLocaleString('en-IN')}
                </Typography>
              </Stack>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
                <AccountBalanceWallet />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="body2">
                  Cost Variance (Act vs Est)
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color:
                      financial.costVariance > 0
                        ? theme.palette.error.main
                        : theme.palette.success.main,
                  }}
                >
                  {financial.costVariance > 0 ? '+' : ''}₹
                  {financial.costVariance.toLocaleString('en-IN')}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                  {financial.costVariance > 0 ? (
                    <TrendingUp color="error" fontSize="small" />
                  ) : (
                    <TrendingDown color="success" fontSize="small" />
                  )}
                  <Typography color="text.secondary" variant="caption">
                    {financial.costVariance > 0 ? 'Over Estimate' : 'Under Estimate'}
                  </Typography>
                </Stack>
              </Stack>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: financial.costVariance > 0 ? 'error.light' : 'success.light',
                  color: financial.costVariance > 0 ? 'error.main' : 'success.main',
                }}
              >
                <Assessment />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="body2">
                  Average Resolution Time
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {performance.averageResolutionTimeHours} hrs
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  Across {performance.resolvedCount} resolved tickets
                </Typography>
              </Stack>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.main' }}>
                <Schedule />
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="body2">
                  Average Repair Cost
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  ₹{financial.averageRepairCost.toLocaleString('en-IN')}
                </Typography>
                {financial.highestCostRepairTicket && (
                  <Typography color="text.secondary" variant="caption">
                    Max: {financial.highestCostRepairTicket.ticketNumber} (₹
                    {financial.highestCostRepairTicket.amount.toLocaleString('en-IN')})
                  </Typography>
                )}
              </Stack>
              <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'info.light', color: 'info.main' }}>
                <Build />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Divider />

      {/* Category & Location Aggregations */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
          gap: 3,
        }}
      >
        {/* Category Breakdown */}
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Breakdown by Category (Click to Drill Down)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Tickets
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Est. Cost
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Act. Cost
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byCategory.map((cat) => (
                  <TableRow
                    key={cat.label}
                    hover
                    onClick={() => onDrillDown({ category: cat.label })}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{cat.label}</TableCell>
                    <TableCell align="center">
                      <Chip label={cat.count} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">₹{cat.totalEstimateCost.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                      ₹{cat.totalActualCost.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Location Breakdown */}
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Repair Costs by Flat (Click to Drill Down)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Flat</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Tickets
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Total Actual Cost
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byFlat.map((item) => (
                  <TableRow
                    key={item.label}
                    hover
                    onClick={() => onDrillDown({ flatId: item.label })}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>Flat {item.label}</TableCell>
                    <TableCell align="center">
                      <Chip label={item.count} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      ₹{item.totalActualCost.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Technician & Period Breakdown */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
          gap: 3,
        }}
      >
        {/* Personnel Breakdown */}
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Technician Workload & Costs
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Technician</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Assigned
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Total Cost
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byPersonnel.map((p) => (
                  <TableRow
                    key={p.label}
                    hover
                    onClick={() => onDrillDown({ assignedToId: p.label })}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>{p.label}</TableCell>
                    <TableCell align="center">
                      <Chip label={p.count} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ₹{p.totalActualCost.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Period Trends */}
        <Paper elevation={0} sx={{ border: 1, borderColor: 'divider', p: 2.5 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Monthly Complaint Trends (YYYY-MM)
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Logged
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Resolved
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Actual Cost
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {byPeriod.map((prd) => (
                  <TableRow
                    key={prd.period}
                    hover
                    onClick={() => onDrillDown({ period: prd.period })}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {prd.period}
                    </TableCell>
                    <TableCell align="center">{prd.ticketCount}</TableCell>
                    <TableCell align="center">
                      <Chip label={prd.resolvedCount} size="small" color="success" />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ₹{prd.totalActualCost.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Stack>
  );
}
