import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TodayIcon from '@mui/icons-material/Today';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import type { ReservationStats } from '../application/models/ReservationWorkspaceViewModel';

interface ReservationSummaryProps {
  stats: ReservationStats;
  selectedFilter: string;
  onFilterSelect: (filter: string) => void;
}

export const ReservationSummary: React.FC<ReservationSummaryProps> = ({
  stats,
  selectedFilter,
  onFilterSelect,
}) => {
  const cards = [
    {
      id: 'ACTIVE',
      label: 'Active',
      count: stats.totalActive,
      icon: <EventAvailableIcon sx={{ fontSize: 28, color: '#0284c7' }} />,
      bgColor: 'rgba(2, 132, 199, 0.08)',
      borderColor: '#0284c7',
    },
    {
      id: 'FOLLOW_UP_REQUIRED',
      label: 'Follow-up Required',
      count: stats.totalFollowUp,
      icon: <WarningAmberIcon sx={{ fontSize: 28, color: '#d97706' }} />,
      bgColor: 'rgba(217, 119, 6, 0.08)',
      borderColor: '#d97706',
    },
    {
      id: 'TODAY',
      label: 'Arriving Today', // Refinement #4
      count: stats.arrivingToday,
      icon: <TodayIcon sx={{ fontSize: 28, color: '#059669' }} />,
      bgColor: 'rgba(5, 150, 105, 0.08)',
      borderColor: '#059669',
    },
    {
      id: 'CONVERTED',
      label: 'Converted',
      count: stats.totalConverted,
      icon: <CheckCircleOutlinedIcon sx={{ fontSize: 28, color: '#16a34a' }} />,
      bgColor: 'rgba(22, 163, 74, 0.08)',
      borderColor: '#16a34a',
    },
    {
      id: 'CANCELLED',
      label: 'Cancelled',
      count: stats.totalCancelled,
      icon: <CancelOutlinedIcon sx={{ fontSize: 28, color: '#dc2626' }} />,
      bgColor: 'rgba(220, 38, 38, 0.08)',
      borderColor: '#dc2626',
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(5, 1fr)',
        },
        gap: 2,
        mb: 3,
      }}
    >
      {cards.map((card) => {
        const isSelected = selectedFilter === card.id;
        return (
          <Paper
            key={card.id}
            elevation={0}
            onClick={() => onFilterSelect(card.id)}
            sx={{
              p: 2,
              borderRadius: 3,
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              backgroundColor: card.bgColor,
              border: '1.5px solid',
              borderColor: isSelected ? card.borderColor : 'transparent',
              boxShadow: isSelected ? `0 4px 14px 0 ${card.bgColor}` : '0 2px 8px rgba(0,0,0,0.04)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {card.label}
              </Typography>
              {card.icon}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 1, color: '#0f172a' }}>
              {card.count}
            </Typography>
          </Paper>
        );
      })}
    </Box>
  );
};
