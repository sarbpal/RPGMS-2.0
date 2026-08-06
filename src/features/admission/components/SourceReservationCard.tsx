import React from 'react';
import { Card, CardContent, Divider, Grid, Stack, Typography, Chip } from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import type { Reservation } from '../../reservation/domain/entities/Reservation';

interface SourceReservationCardProps {
  reservation: Reservation;
}

export const SourceReservationCard: React.FC<SourceReservationCardProps> = ({ reservation }) => {
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

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null || amount === 0) return 'No Token';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <EventAvailableIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Source Reservation Information
            </Typography>
          </Stack>
          <Chip label={reservation.status} color="success" size="small" sx={{ fontWeight: 700 }} />
        </Stack>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Reservation Number
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: 'primary.main' }}>
                {reservation.reservationNumber}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Created Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                {formatDate(reservation.createdAt)}
              </Typography>
            </Grid>
          </Grid>

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Accommodation Preference
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                {reservation.accommodationPreference || 'Not Specified'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Token Received
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: reservation.tokenAmount ? 'success.dark' : 'text.secondary' }}>
                {formatCurrency(reservation.tokenAmount)}
              </Typography>
            </Grid>
          </Grid>

          {reservation.notes && (
            <>
              <Divider />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Reservation Notes
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                {reservation.notes}
              </Typography>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
