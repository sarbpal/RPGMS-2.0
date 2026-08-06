import React from 'react';
import { Card, CardContent, Box, Stack, Typography, Avatar, Chip } from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import type { Reservation } from '../../reservation/domain/entities/Reservation';

interface AdmissionHeaderProps {
  reservation: Reservation;
  isReady: boolean;
}

export const AdmissionHeader: React.FC<AdmissionHeaderProps> = ({ reservation, isReady }) => {
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
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'success.main', fontSize: '1.75rem' }}>
              <HowToRegIcon sx={{ fontSize: 36 }} />
            </Avatar>
            <Box>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Admission Preparation
                </Typography>
                <Chip
                  label={isReady ? 'Preparation Complete' : 'Preparation in Progress'}
                  color={isReady ? 'success' : 'warning'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
                Prospect: <strong>{reservation.prospectName}</strong> ({reservation.reservationNumber})
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ pt: { xs: 1, sm: 0 } }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Source Reservation
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: 'primary.main' }}>
                {reservation.reservationNumber}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Target Joining Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                {formatDate(reservation.expectedJoiningDate)}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
