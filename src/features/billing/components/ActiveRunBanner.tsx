import { Paper, Box, Typography, Button, CircularProgress, Chip } from '@mui/material';
import { StopCircleOutlined } from '@mui/icons-material';
import type { BillingRunSummaryViewModel } from '../application/models/BillingWorkspaceViewModel';

interface ActiveRunBannerProps {
  readonly activeRun: BillingRunSummaryViewModel | null;
  readonly isSubmitting: boolean;
  readonly onStop: (runId: string) => void;
}

export function ActiveRunBanner({ activeRun, isSubmitting, onStop }: ActiveRunBannerProps) {
  if (!activeRun || (activeRun.status !== 'PROCESSING' && activeRun.status !== 'STOPPING')) {
    return null;
  }

  const isStopping = activeRun.status === 'STOPPING';

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        bgcolor: isStopping ? 'warning.light' : 'primary.light',
        color: isStopping ? 'warning.contrastText' : 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <CircularProgress size={28} color="inherit" />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {isStopping ? 'Stopping Active Billing Run...' : 'Billing Run in Progress...'}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Run ID: <strong>{activeRun.id}</strong> | Period: {activeRun.periodStart} to {activeRun.periodEnd} | Affected Stays: {activeRun.affectedStaysCount}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Chip
          label={activeRun.status}
          color={isStopping ? 'warning' : 'default'}
          variant="filled"
          sx={{ fontWeight: 600 }}
        />
        {!isStopping && (
          <Button
            variant="contained"
            color="error"
            startIcon={<StopCircleOutlined />}
            onClick={() => onStop(activeRun.id)}
            disabled={isSubmitting}
            sx={{ fontWeight: 600 }}
          >
            Stop Processing
          </Button>
        )}
      </Box>
    </Paper>
  );
}
