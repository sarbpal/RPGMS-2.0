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
} from '@mui/material';
import { useFinanceSummary } from '../hooks/useFinanceSummary';
import { useFinanceActivity } from '../hooks/useFinanceActivity';
import { FinancialSummaryCard } from '../components/FinancialSummaryCard';
import { formatCurrency } from '../utils/currencyFormatters';

export default function FinancePage() {
  const { summary } = useFinanceSummary();
  const { activity } = useFinanceActivity(10);

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
          Finance Workspace
        </Typography>
        <Typography color="text.secondary">
          Financial ledger, rent billing, payment tracking, checkout settlements, and unified timeline.
        </Typography>
      </Box>

      {/* Summary Cards Grid */}
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

      {/* Recent Financial Activity Stream */}
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
          Recent Financial Activity Stream
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Unified chronological timeline stream from Billing, Payment, and Settlement engines.
        </Typography>

        {activity.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No financial activity recorded yet. Onboard a resident or generate bills to view live timeline events.
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
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, ml: 'auto !important' }}>
                          {formatCurrency(evt.amount)}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {evt.description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto !important' }}>
                          {evt.date.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
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
    </Stack>
  );
}
