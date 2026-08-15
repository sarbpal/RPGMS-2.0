import React from 'react';
import { Card, CardContent, Grid, Stack, Typography, Box } from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import SecurityIcon from '@mui/icons-material/Security';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import type { Reservation } from '../domain/entities/Reservation';

interface ReservationCommercialExpectationsProps {
  reservation: Reservation;
}

export const ReservationCommercialExpectations: React.FC<ReservationCommercialExpectationsProps> = ({
  reservation,
}) => {
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'Not Specified';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
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

  const hasToken = typeof reservation.tokenAmount === 'number' && reservation.tokenAmount > 0;
  const hasDeposit = typeof reservation.expectedSecurityDeposit === 'number';

  const expectedRemainingDeposit = hasDeposit
    ? Math.max(0, reservation.expectedSecurityDeposit! - (reservation.tokenAmount || 0))
    : undefined;

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 800, letterSpacing: 1.1, display: 'block', mb: 2 }}
        >
          Commercial Expectations
        </Typography>

        <Grid container spacing={3}>
          {/* 1. Expected Monthly Rent */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: 'success.50',
                  color: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PaymentsIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Expected Monthly Rent
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                  {formatCurrency(reservation.expectedMonthlyRent)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Agreed Base Monthly Rate
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* 2. Total Expected Security Deposit */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
                <SecurityIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Total Expected Security Deposit
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.25 }}>
                  {formatCurrency(reservation.expectedSecurityDeposit)}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  Contractual Total Expectation
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* 3. Token Advance Received */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: hasToken ? 'info.50' : 'action.hover',
                  color: hasToken ? 'info.main' : 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ReceiptLongIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Token Received
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: hasToken ? 'info.main' : 'text.secondary',
                    mt: 0.25,
                  }}
                >
                  {hasToken ? formatCurrency(reservation.tokenAmount) : 'No Token Collected'}
                </Typography>
                {hasToken ? (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, display: 'block' }}>
                    {reservation.tokenReceivedOn ? `Received ${formatDate(reservation.tokenReceivedOn)}` : 'Advance received'}
                    {reservation.tokenRemarks ? ` • ${reservation.tokenRemarks}` : ''}
                  </Typography>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    No advance held
                  </Typography>
                )}
              </Box>
            </Stack>
          </Grid>

          {/* 4. Expected Remaining Deposit at Admission */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: 'secondary.50',
                  color: 'secondary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AccountBalanceWalletIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
                  Expected Remaining at Admission
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 700,
                    color: hasDeposit ? 'text.primary' : 'text.secondary',
                    mt: 0.25,
                  }}
                >
                  {hasDeposit ? formatCurrency(expectedRemainingDeposit) : 'Pending Admission Confirmation'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  {hasDeposit && hasToken
                    ? `Deposit ${formatCurrency(reservation.expectedSecurityDeposit)} - Token ${formatCurrency(reservation.tokenAmount)}`
                    : 'Payable upon Admission confirmation'}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
