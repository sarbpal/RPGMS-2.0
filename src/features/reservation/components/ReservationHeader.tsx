import React from 'react';
import { Card, CardContent, Box, Stack, Typography, Avatar } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatusChip } from './ReservationStatusChip';

interface ReservationHeaderProps {
  reservation: Reservation;
}

export const ReservationHeader: React.FC<ReservationHeaderProps> = ({ reservation }) => {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2.5}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.75rem' }}>
              <EventAvailableIcon sx={{ fontSize: 36 }} />
            </Avatar>
            <Box>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {reservation.reservationNumber}
                </Typography>
                <ReservationStatusChip status={reservation.status} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
                Prospect: {reservation.prospectName}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ pt: { xs: 1, sm: 0 } }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Created Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                {formatDate(reservation.createdAt)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Last Updated
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                {formatDate(reservation.updatedAt)}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
