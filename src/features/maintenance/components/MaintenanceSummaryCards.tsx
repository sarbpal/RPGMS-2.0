import { Build, CheckCircle, HourglassEmpty, Warning } from '@mui/icons-material';
import { Box, Card, CardContent, Stack, Typography, useTheme } from '@mui/material';
import type { MaintenanceMetricsViewModel } from '../application/models/MaintenanceWorkspaceViewModel';

interface Props {
  metrics: MaintenanceMetricsViewModel;
  activeStatusFilter?: string;
  activePriorityFilter?: string;
  onCardClick: (statusFilter?: string, priorityFilter?: string) => void;
}

export function MaintenanceSummaryCards({
  metrics,
  activeStatusFilter,
  activePriorityFilter,
  onCardClick,
}: Props) {
  const theme = useTheme();

  const cards = [
    {
      id: 'open',
      label: 'Open Requests',
      value: metrics.totalOpen,
      icon: <Build sx={{ color: theme.palette.info.main }} />,
      color: theme.palette.info.main,
      statusFilter: 'OPEN',
      priorityFilter: undefined,
      isActive: activeStatusFilter === 'OPEN',
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: metrics.inProgress,
      icon: <HourglassEmpty sx={{ color: theme.palette.warning.main }} />,
      color: theme.palette.warning.main,
      statusFilter: 'IN_PROGRESS',
      priorityFilter: undefined,
      isActive: activeStatusFilter === 'IN_PROGRESS',
    },
    {
      id: 'urgent_high',
      label: 'Urgent / High Priority',
      value: metrics.urgentHighPriority,
      icon: <Warning sx={{ color: theme.palette.error.main }} />,
      color: theme.palette.error.main,
      statusFilter: 'PENDING',
      priorityFilter: 'URGENT',
      isActive: activePriorityFilter === 'URGENT' || activePriorityFilter === 'HIGH',
    },
    {
      id: 'resolved',
      label: 'Resolved This Month',
      value: metrics.resolvedThisMonth,
      icon: <CheckCircle sx={{ color: theme.palette.success.main }} />,
      color: theme.palette.success.main,
      statusFilter: 'RESOLVED',
      priorityFilter: undefined,
      isActive: activeStatusFilter === 'RESOLVED',
    },
  ];

  return (
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
      {cards.map((card) => (
        <Card
          key={card.id}
          elevation={0}
          onClick={() => onCardClick(card.statusFilter, card.priorityFilter)}
          sx={{
            border: 1,
            borderColor: card.isActive ? card.color : 'divider',
            borderWidth: card.isActive ? 2 : 1,
            bgcolor: card.isActive ? `${card.color}0D` : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: card.color,
              transform: 'translateY(-2px)',
              boxShadow: 2,
            },
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Stack spacing={0.5}>
                <Typography color="text.secondary" variant="body2">
                  {card.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {card.value}
                </Typography>
              </Stack>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: `${card.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {card.icon}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
