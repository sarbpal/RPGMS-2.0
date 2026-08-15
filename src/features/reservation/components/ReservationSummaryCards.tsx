import React from 'react';
import { Card, CardActionArea, CardContent, Grid, Stack, Typography, Box } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import TodayIcon from '@mui/icons-material/Today';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import type { ReservationStats } from '../application/models/ReservationWorkspaceViewModel';

interface ReservationSummaryCardsProps {
  stats: ReservationStats;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const ReservationSummaryCards: React.FC<ReservationSummaryCardsProps> = ({
  stats,
  activeFilter,
  onFilterChange,
}) => {
  const cards = [
    {
      id: 'ACTIVE',
      label: 'Active',
      count: stats.totalActive,
      description: stats.totalActive > 0 ? 'Awaiting admission' : 'No active reservations',
      filter: 'ACTIVE',
      color: '#0284c7', // Primary Sky / Blue
      icon: <EventAvailableIcon fontSize="small" />,
    },
    {
      id: 'ARRIVING_TODAY',
      label: 'Arriving Today',
      count: stats.arrivingToday,
      description: stats.arrivingToday > 0 ? 'Expected check-ins today' : 'No arrivals today',
      filter: 'ARRIVING_TODAY',
      color: '#16a34a', // Green / Success
      icon: <TodayIcon fontSize="small" />,
    },
    {
      id: 'FOLLOW_UP_REQUIRED',
      label: 'Follow-up Required',
      count: stats.totalFollowUp,
      description: stats.totalFollowUp > 0 ? 'Overdue expected arrival' : 'Nothing requires follow-up',
      filter: 'FOLLOW_UP_REQUIRED',
      color: stats.totalFollowUp > 0 ? '#d97706' : '#16a34a', // Amber when > 0, Positive Green when 0
      icon: stats.totalFollowUp > 0 ? <ScheduleIcon fontSize="small" /> : <CheckCircleOutlinedIcon fontSize="small" />,
    },
  ];

  return (
    <Grid container spacing={2.5}>
      {cards.map((card) => {
        const isSelected = activeFilter === card.filter || (card.filter === 'ARRIVING_TODAY' && activeFilter === 'TODAY');

        return (
          <Grid size={{ xs: 12, sm: 4 }} key={card.id}>
            <Card
              variant={isSelected ? 'elevation' : 'outlined'}
              elevation={isSelected ? 3 : 0}
              sx={{
                borderRadius: 2.5,
                position: 'relative',
                overflow: 'hidden',
                borderColor: isSelected ? card.color : 'divider',
                borderWidth: isSelected ? 2 : 1,
                borderStyle: 'solid',
                bgcolor: isSelected ? 'action.selected' : 'background.paper',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                transition: 'all 0.2s ease-in-out',
                '&::before': isSelected
                  ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      bgcolor: card.color,
                    }
                  : {},
                '&:hover': {
                  borderColor: card.color,
                  boxShadow: 2,
                },
              }}
            >
              <CardActionArea
                onClick={() => onFilterChange(isSelected ? 'ALL' : card.filter)}
                aria-label={`${card.label}: ${card.count}. ${card.description}`}
                sx={{ height: '100%' }}
              >
                <CardContent sx={{ py: 2, px: 2.5 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography
                        variant="body2"
                        color={isSelected ? 'text.primary' : 'text.secondary'}
                        sx={{ fontWeight: isSelected ? 700 : 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}
                      >
                        {card.label}
                      </Typography>
                      <Box sx={{ color: card.color, display: 'flex', alignItems: 'center' }}>
                        {card.icon}
                      </Box>
                    </Stack>

                    <Typography
                      variant="h4"
                      sx={{
                        color: card.color,
                        fontWeight: 800,
                        fontSize: isSelected ? '2.1rem' : '1.9rem',
                        lineHeight: 1,
                      }}
                    >
                      {card.count}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: 500, display: 'block', minHeight: 18 }}
                    >
                      {card.description}
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};
