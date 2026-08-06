import React from 'react';
import { Card, CardContent, Grid, Stack, Typography, TextField } from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';

interface CommercialTermsCardProps {
  agreedRent: number;
  agreedDeposit: number;
  checkInDate: string;
  onChangeAgreedRent: (rent: number) => void;
  onChangeAgreedDeposit: (deposit: number) => void;
  onChangeCheckInDate: (date: string) => void;
}

export const CommercialTermsCard: React.FC<CommercialTermsCardProps> = ({
  agreedRent,
  agreedDeposit,
  checkInDate,
  onChangeAgreedRent,
  onChangeAgreedDeposit,
  onChangeCheckInDate,
}) => {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <PaymentsIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Commercial Terms & Agreed Pricing
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Target Check-in Date *"
                type="date"
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={checkInDate}
                onChange={(e) => onChangeCheckInDate(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Agreed Monthly Rent (₹) *"
                type="number"
                fullWidth
                size="small"
                value={agreedRent || ''}
                onChange={(e) => onChangeAgreedRent(Number(e.target.value))}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="Agreed Security Deposit (₹) *"
                type="number"
                fullWidth
                size="small"
                value={agreedDeposit || ''}
                onChange={(e) => onChangeAgreedDeposit(Number(e.target.value))}
              />
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};
