import React from 'react';
import { Card, CardContent, Divider, Grid, Stack, Typography, Chip } from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import type { Reservation } from '../domain/entities/Reservation';

interface TokenInformationCardProps {
  reservation: Reservation;
}

export const TokenInformationCard: React.FC<TokenInformationCardProps> = ({ reservation }) => {
  const formatDate = (dateStr?: string) => {
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
    if (amount === undefined || amount === null || amount === 0) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const isTokenReceived = reservation.tokenAmount !== undefined && reservation.tokenAmount > 0;

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PaymentsIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Token Information
            </Typography>
          </Stack>
          <Chip
            label={isTokenReceived ? 'Token Received' : 'No Token'}
            color={isTokenReceived ? 'success' : 'default'}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Token Amount
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: isTokenReceived ? 'success.dark' : 'text.secondary' }}>
                {formatCurrency(reservation.tokenAmount)}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Received Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                {formatDate(reservation.tokenReceivedOn)}
              </Typography>
            </Grid>
          </Grid>

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Payment Mode / Remarks
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                {reservation.tokenRemarks || 'N/A'}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Reference Number
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: 'text.secondary' }}>
                N/A
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};
