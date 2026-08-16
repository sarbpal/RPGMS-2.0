import React from 'react';
import { Card, CardContent, Typography, Stack, Box, Divider } from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';

interface ReservationCancellationOutcomeProps {
  reservation: Reservation;
}

export const ReservationCancellationOutcome: React.FC<ReservationCancellationOutcomeProps> = ({
  reservation,
}) => {
  if (reservation.status !== ReservationStatus.CANCELLED) {
    return null;
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Not Specified';
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
    if (amount === undefined || amount === null) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const cancelledDate = reservation.cancelledAt || reservation.updatedAt;
  const tokenDisposition = reservation.tokenDisposition;
  const hasTokenDisposition = Boolean(tokenDisposition && tokenDisposition.amount > 0);

  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'error.200',
        borderRadius: 2,
        bgcolor: '#fff5f5',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <EventBusyIcon sx={{ color: 'error.main', fontSize: '1.25rem' }} />
          <Typography
            variant="overline"
            sx={{ fontWeight: 800, letterSpacing: 1.1, color: 'error.dark' }}
          >
            Cancellation Outcome
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 3 }}
          divider={<Divider orientation="vertical" flexItem />}
          sx={{ flexWrap: 'wrap' }}
        >
          {/* Cancelled On */}
          <Box sx={{ minWidth: 140 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
              Cancelled On
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
              {formatDate(cancelledDate)}
            </Typography>
          </Box>

          {/* Cancellation Reason */}
          <Box sx={{ flex: 1, minWidth: 180 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
              Cancellation Reason
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.25 }}>
              {reservation.cancellationReason || 'No reason specified'}
            </Typography>
          </Box>

          {/* Token Disposition (Only if token existed) */}
          {hasTokenDisposition && (
            <Box sx={{ minWidth: 160 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                Token Disposition
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.dark', mt: 0.25 }}>
                {formatCurrency(tokenDisposition!.amount)} — {tokenDisposition!.outcome === 'REFUND' ? 'Refund' : 'Forfeit'}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
