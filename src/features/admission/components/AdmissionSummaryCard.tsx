import React from 'react';
import { Card, CardContent, Grid, Stack, Typography, Chip, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import type { Reservation } from '../../reservation/domain/entities/Reservation';
import type { AdmissionReadiness } from '../application/models/AdmissionReadiness';
import { formatTokenDispositionLabel } from '../domain/valueObjects/TokenDisposition';
import type { TokenDisposition } from '../domain/valueObjects/TokenDisposition';

interface AdmissionSummaryCardProps {
  reservation: Reservation;
  readiness: AdmissionReadiness;
  selectedFlatName?: string;
  selectedBedNames?: string[];
  agreedRent: number;
  agreedDeposit: number;
  checkInDate: string;
  tokenDisposition?: TokenDisposition;
}

export const AdmissionSummaryCard: React.FC<AdmissionSummaryCardProps> = ({
  reservation,
  readiness,
  selectedFlatName,
  selectedBedNames = [],
  agreedRent,
  agreedDeposit,
  checkInDate,
  tokenDisposition,
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

  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const accommodationDisplay = selectedFlatName && selectedBedNames.length > 0
    ? `${selectedFlatName} (${selectedBedNames.join(', ')})`
    : 'Pending Selection';

  const tokenChoiceDisplay = reservation.tokenAmount && reservation.tokenAmount > 0
    ? (tokenDisposition ? formatTokenDispositionLabel(tokenDisposition) : 'Pending Choice')
    : 'No Token';

  return (
    <Card
      elevation={0}
      sx={{
        border: 1,
        borderColor: 'success.light',
        borderRadius: 2,
        bgcolor: '#f0fdf4',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="overline" color="success.main" sx={{ fontWeight: 800, letterSpacing: 1.2 }}>
          Admission Preparation Summary
        </Typography>

        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Prospect Name
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>
              {reservation.prospectName}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Target Check-in Date
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>
              {formatDate(checkInDate || reservation.expectedJoiningDate)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Selected Accommodation
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: selectedBedNames.length > 0 ? '#15803d' : 'text.secondary' }}>
              {accommodationDisplay}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Agreed Rent / Deposit
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>
              {formatCurrency(agreedRent)} / {formatCurrency(agreedDeposit)}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Token Disposition
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5, color: '#0f172a' }}>
              {tokenChoiceDisplay}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Preparation Readiness:
            </Typography>
            <Chip
              icon={readiness.isReadyToConfirm ? <CheckCircleIcon /> : <PendingIcon />}
              label={readiness.isReadyToConfirm ? '100% Ready for RA-6 Execution' : 'Preparation Pending'}
              color={readiness.isReadyToConfirm ? 'success' : 'warning'}
              size="small"
              sx={{ fontWeight: 800, px: 1 }}
            />
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};
