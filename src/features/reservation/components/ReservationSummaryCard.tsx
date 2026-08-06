import React from 'react';
import { Card, CardContent, Grid, Stack, Typography, Chip, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { Reservation } from '../domain/entities/Reservation';
import { canConvertReservation } from '../domain/rules/reservationRules';

interface ReservationSummaryCardProps {
  reservation: Reservation;
}

export const ReservationSummaryCard: React.FC<ReservationSummaryCardProps> = ({ reservation }) => {
  const formatDate = (dateStr: string) => {
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
    if (amount === undefined || amount === null) return 'Not Specified';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const isTokenReceived = reservation.tokenAmount !== undefined && reservation.tokenAmount > 0;
  const tokenStatusText = isTokenReceived
    ? `${formatCurrency(reservation.tokenAmount)} Received`
    : 'No Token Received';

  const readiness = canConvertReservation(reservation.status);
  const isReadyForAdmission = readiness.allowed;

  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'primary.light',
        borderRadius: 2,
        bgcolor: '#f8fafc',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>
          Operational Decision Summary
        </Typography>

        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Reservation Status
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>
              {reservation.status.replace(/_/g, ' ')}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Expected Joining Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>
              {formatDate(reservation.expectedJoiningDate)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Accommodation Preference
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>
              {reservation.accommodationPreference || 'Area A'}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Expected Rent
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>
              {formatCurrency(reservation.expectedMonthlyRent)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Token Status
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: isTokenReceived ? 'success.main' : 'text.secondary' }}>
              {tokenStatusText}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Ready for Admission:
            </Typography>
            <Chip
              icon={isReadyForAdmission ? <CheckCircleIcon /> : <CancelIcon />}
              label={isReadyForAdmission ? 'Yes' : 'No'}
              color={isReadyForAdmission ? 'success' : 'default'}
              size="small"
              sx={{ fontWeight: 800, px: 1 }}
            />
          </Stack>
          {!isReadyForAdmission && (
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {readiness.reason || 'Reservation is not active.'}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
