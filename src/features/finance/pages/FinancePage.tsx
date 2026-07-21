import { Stack, Typography, Grid, Paper, Box } from '@mui/material';
import { useFinanceSummary } from '../hooks/useFinanceSummary';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';

export default function FinancePage() {
  const { summary } = useFinanceSummary();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
          Finance Workspace
        </Typography>
        <Typography color="text.secondary">
          Financial ledger, rent billing, payment tracking, and checkout settlements.
        </Typography>
      </Box>

      {/* Summary Cards Skeleton Grid */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Total Collections"
            amount={summary.totalCollected}
            subtitle="Current month payments"
            color="success.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Outstanding Dues"
            amount={summary.totalOutstanding}
            subtitle="Pending rent & charges"
            color="error.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Deposits Held"
            amount={summary.totalDepositHeld}
            subtitle="Refundable security deposits"
            color="info.main"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FinancialSummaryCard
            title="Advance Credit"
            amount={summary.totalAdvanceCredit}
            subtitle="Unallocated pre-payments"
            color="warning.main"
          />
        </Grid>
      </Grid>

      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Finance Management Engine
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Immutable ledger core and billing services established (Sprint F1 Foundation).
        </Typography>
      </Paper>
    </Stack>
  );
}

