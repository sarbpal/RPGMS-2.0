import React from 'react';
import { Card, CardContent, Grid, Stack, Typography, Box } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PhoneIcon from '@mui/icons-material/Phone';
import BedIcon from '@mui/icons-material/Bed';
import type { Reservation } from '../domain/entities/Reservation';

interface ReservationOverviewCardProps {
  reservation: Reservation;
}

export const ReservationOverviewCard: React.FC<ReservationOverviewCardProps> = ({
  reservation,
}) => {
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

  const getRelativeDaysText = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(dateStr);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return '(Today)';
      if (diffDays === 1) return '(Tomorrow)';
      if (diffDays > 1) return `(In ${diffDays} days)`;
      if (diffDays === -1) return '(1 day overdue)';
      return `(${Math.abs(diffDays)} days overdue)`;
    } catch {
      return '';
    }
  };

  const relativeText = getRelativeDaysText(reservation.expectedJoiningDate);

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 800, letterSpacing: 1.1, display: 'block', mb: 2 }}
        >
          Reservation Overview
        </Typography>

        <Grid container spacing={3}>
          {/* Expected Joining Date */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: 'primary.50',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CalendarMonthIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Expected Joining Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                  {formatDate(reservation.expectedJoiningDate)}
                </Typography>
                {relativeText && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    {relativeText}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Grid>

          {/* Contact Mobile */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: 'info.50',
                  color: 'info.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PhoneIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Contact Mobile Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                  {reservation.mobileNumber || 'Not Provided'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Primary Contact Phone
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Accommodation Preference */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: 'warning.50',
                  color: 'warning.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Accommodation Preference
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: reservation.accommodationPreference ? 700 : 500,
                    color: reservation.accommodationPreference ? 'text.primary' : 'text.secondary',
                    fontStyle: reservation.accommodationPreference ? 'normal' : 'italic',
                    mt: 0.25,
                  }}
                >
                  {reservation.accommodationPreference || 'No specific preference recorded'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Requested preference
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
