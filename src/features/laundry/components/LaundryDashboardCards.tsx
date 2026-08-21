import { Grid, Card, CardContent, Typography, Box, Chip, Stack } from '@mui/material';
import {
  LocalLaundryService,
  PendingActions,
  HourglassEmpty,
  WarningAmber,
  CheckCircleOutlined,
} from '@mui/icons-material';
import type { LaundryWorkspaceMetricsViewModel } from '../application/models/LaundryWorkspaceViewModel';
import type { LaundryWorkspaceFilters } from '../application/dtos/laundryDTOs';

interface LaundryDashboardCardsProps {
  metrics?: LaundryWorkspaceMetricsViewModel;
  filters: LaundryWorkspaceFilters;
  onSelectMetric: (metricKey: string) => void;
}

export function LaundryDashboardCards({
  metrics,
  filters,
  onSelectMetric,
}: LaundryDashboardCardsProps) {
  if (!metrics) {
    return null;
  }

  const isFilterActive = (status?: string, hasExceptions?: boolean) => {
    if (hasExceptions !== undefined) {
      return filters.hasExceptions === hasExceptions;
    }
    if (status !== undefined) {
      return filters.status === status;
    }
    return !filters.status && !filters.hasExceptions;
  };

  const totalInProcess = metrics.inProcessExternal + metrics.inProcessInHouse;

  return (
    <Grid container spacing={2}>
      {/* 1. Total Active Workload */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card
          variant="outlined"
          onClick={() => onSelectMetric('TOTAL_ACTIVE')}
          sx={{
            cursor: 'pointer',
            height: '100%',
            transition: 'all 0.2s',
            borderColor: isFilterActive(undefined, undefined) && !filters.status ? 'primary.main' : 'divider',
            bgcolor: isFilterActive(undefined, undefined) && !filters.status ? 'primary.50' : 'background.paper',
            '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' },
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Total Active Orders
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>
                  {metrics.totalActive}
                </Typography>
              </Box>
              <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1.5, color: 'primary.main', display: 'flex' }}>
                <LocalLaundryService />
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              All in-flight laundry transactions
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* 2. Action Required (Drafts & Collected) */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card
          variant="outlined"
          sx={{
            height: '100%',
            transition: 'all 0.2s',
            borderColor: (filters.status === 'DRAFT' || filters.status === 'COLLECTED') ? 'warning.main' : 'divider',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Awaiting Intake & Inspection
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'warning.dark' }}>
                  {metrics.awaitingCollectionConfirmation + metrics.awaitingInspection}
                </Typography>
              </Box>
              <Box sx={{ p: 1, bgcolor: 'warning.light', borderRadius: 1.5, color: 'warning.dark', display: 'flex' }}>
                <PendingActions />
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
              <Chip
                size="small"
                label={`Drafts: ${metrics.awaitingCollectionConfirmation}`}
                color={filters.status === 'DRAFT' ? 'warning' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMetric('AWAITING_CONFIRMATION');
                }}
                sx={{ fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
              />
              <Chip
                size="small"
                label={`Inspection: ${metrics.awaitingInspection}`}
                color={filters.status === 'COLLECTED' ? 'warning' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMetric('AWAITING_INSPECTION');
                }}
                sx={{ fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* 3. Processing & Ready for Delivery */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card
          variant="outlined"
          onClick={() => onSelectMetric('IN_PROCESS')}
          sx={{
            cursor: 'pointer',
            height: '100%',
            transition: 'all 0.2s',
            borderColor: filters.status === 'IN_PROCESS' ? 'info.main' : 'divider',
            bgcolor: filters.status === 'IN_PROCESS' ? 'info.50' : 'background.paper',
            '&:hover': { borderColor: 'info.main', transform: 'translateY(-2px)' },
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  In Processing
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: 'info.dark' }}>
                  {totalInProcess}
                </Typography>
              </Box>
              <Box sx={{ p: 1, bgcolor: 'info.light', borderRadius: 1.5, color: 'info.dark', display: 'flex' }}>
                <HourglassEmpty />
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Ext: {metrics.inProcessExternal} | In-House: {metrics.inProcessInHouse} | Returned: {metrics.returnedAwaitingDelivery}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* 4. Exceptions & Unposted Charges */}
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card
          variant="outlined"
          onClick={() => onSelectMetric('OPEN_EXCEPTIONS')}
          sx={{
            cursor: 'pointer',
            height: '100%',
            transition: 'all 0.2s',
            borderColor: filters.hasExceptions ? 'error.main' : 'divider',
            bgcolor: filters.hasExceptions ? 'error.50' : (metrics.openExceptionsCount > 0 ? '#fff8f8' : 'background.paper'),
            '&:hover': { borderColor: 'error.main', transform: 'translateY(-2px)' },
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                  Open Exceptions
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    mt: 0.5,
                    color: metrics.openExceptionsCount > 0 ? 'error.main' : 'text.primary',
                  }}
                >
                  {metrics.openExceptionsCount}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1,
                  bgcolor: metrics.openExceptionsCount > 0 ? 'error.light' : 'grey.100',
                  borderRadius: 1.5,
                  color: metrics.openExceptionsCount > 0 ? 'error.main' : 'text.secondary',
                  display: 'flex',
                }}
              >
                {metrics.openExceptionsCount > 0 ? <WarningAmber /> : <CheckCircleOutlined />}
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {metrics.openExceptionsCount > 0
                ? `${metrics.openExceptionsCount} order(s) require dispute/damage resolution`
                : `${metrics.unpostedChargesCount} order(s) awaiting Finance posting`}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
