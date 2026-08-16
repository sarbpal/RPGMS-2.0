import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  PlayCircleOutlined,
  MonetizationOnOutlined,
  CheckCircleOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import type { BillingWorkspaceSummaryViewModel } from '../application/models/BillingWorkspaceViewModel';

interface BillingSummaryCardsProps {
  readonly summary: BillingWorkspaceSummaryViewModel | null;
  readonly onOpenRecovery?: () => void;
}

export function BillingSummaryCards({ summary, onOpenRecovery }: BillingSummaryCardsProps) {
  const activeRun = summary?.activeRun;
  const totalBilled = summary?.totalAmountBilledAllTime || 0;
  const completedRuns = summary?.completedRunsCount || 0;
  const totalRuns = summary?.totalRunsCount || 0;
  const recoveryCount = summary?.recoveryRequiredCount || 0;

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {/* 1. Active Run State */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PlayCircleOutlined color={activeRun ? 'primary' : 'action'} sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Active Execution
              </Typography>
            </Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              {activeRun ? activeRun.status : 'IDLE'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {activeRun ? `Run: ${activeRun.id}` : 'No run currently processing'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 2. Total Billed */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <MonetizationOnOutlined color="success" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Total Billed (All Time)
              </Typography>
            </Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600, color: 'success.main' }}>
              ₹{totalBilled.toLocaleString('en-IN')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Across all completed runs
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 3. Completed Runs */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CheckCircleOutlined color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Billing Cycles
              </Typography>
            </Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
              {completedRuns} / {totalRuns}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Completed successfully
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 4. Recovery Required Count (Interactive Workbench entry) */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card
          sx={{
            height: '100%',
            borderColor: recoveryCount > 0 ? 'warning.main' : undefined,
            cursor: recoveryCount > 0 && onOpenRecovery ? 'pointer' : 'default',
            '&:hover': recoveryCount > 0 && onOpenRecovery ? { bgcolor: 'warning.50', borderColor: 'warning.dark' } : undefined,
            transition: 'all 0.2s ease-in-out',
          }}
          onClick={recoveryCount > 0 && onOpenRecovery ? onOpenRecovery : undefined}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WarningAmberOutlined color={recoveryCount > 0 ? 'warning' : 'action'} sx={{ mr: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">
                Recovery Required
              </Typography>
            </Box>
            <Typography
              variant="h5"
              component="div"
              sx={{ fontWeight: 600, color: recoveryCount > 0 ? 'warning.dark' : 'text.primary' }}
            >
              {recoveryCount}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {recoveryCount > 0 ? 'Click to open Recovery Workbench' : 'Zero recovery exceptions'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
