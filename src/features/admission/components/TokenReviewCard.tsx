import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Stack,
  Typography,
  RadioGroup,
  Radio,
  FormControlLabel,
  Divider,
  Chip,
  Box,
} from '@mui/material';
import PaymentsIcon from '@mui/icons-material/Payments';
import { TokenDisposition } from '../domain/valueObjects/TokenDisposition';
import { TokenAdjustmentPreview } from './TokenAdjustmentPreview';

interface TokenReviewCardProps {
  tokenAmount?: number;
  tokenReceivedOn?: string;
  tokenRemarks?: string;
  disposition?: TokenDisposition;
  agreedRent: number;
  agreedDeposit: number;
  onChangeDisposition: (disposition: TokenDisposition) => void;
}

export const TokenReviewCard: React.FC<TokenReviewCardProps> = ({
  tokenAmount = 0,
  tokenReceivedOn,
  tokenRemarks,
  disposition,
  agreedRent,
  agreedDeposit,
  onChangeDisposition,
}) => {
  const isTokenReceived = tokenAmount > 0;

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

  const adjustedDeposit =
    disposition === TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT
      ? Math.max(0, agreedDeposit - tokenAmount)
      : agreedDeposit;

  const adjustedRent =
    disposition === TokenDisposition.ADJUST_TO_FIRST_RENT
      ? Math.max(0, agreedRent - tokenAmount)
      : agreedRent;

  const previewText = isTokenReceived
    ? disposition === TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT
      ? `Token of ₹${tokenAmount.toLocaleString('en-IN')} will be adjusted against Security Deposit (Payable Deposit: ₹${adjustedDeposit.toLocaleString('en-IN')}).`
      : disposition === TokenDisposition.ADJUST_TO_FIRST_RENT
      ? `Token of ₹${tokenAmount.toLocaleString('en-IN')} will be adjusted against First Month Rent (Payable Rent: ₹${adjustedRent.toLocaleString('en-IN')}).`
      : disposition === TokenDisposition.LEAVE_PENDING
      ? `Token of ₹${tokenAmount.toLocaleString('en-IN')} remains pending manual settlement.`
      : 'Select a token disposition choice below.'
    : 'No token payment recorded for this reservation.';

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <PaymentsIcon color="primary" fontSize="small" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Token Review & Disposition
            </Typography>
          </Stack>
          <Chip
            label={isTokenReceived ? `Token Paid: ₹${tokenAmount.toLocaleString('en-IN')}` : 'No Token'}
            color={isTokenReceived ? 'success' : 'default'}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Token Amount Received
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: isTokenReceived ? 'success.dark' : 'text.secondary' }}>
                ₹{tokenAmount.toLocaleString('en-IN')}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Received Date & Mode
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                {formatDate(tokenReceivedOn)} {tokenRemarks ? `(${tokenRemarks})` : ''}
              </Typography>
            </Grid>
          </Grid>

          {isTokenReceived && (
            <>
              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Select Token Adjustment Choice *:
                </Typography>

                <RadioGroup
                  value={disposition || ''}
                  onChange={(e) => onChangeDisposition(e.target.value as TokenDisposition)}
                >
                  <FormControlLabel
                    value={TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT}
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Adjust to Security Deposit (Deduct ₹{tokenAmount.toLocaleString('en-IN')} from Deposit)
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value={TokenDisposition.ADJUST_TO_FIRST_RENT}
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Adjust to First Month Rent (Deduct ₹{tokenAmount.toLocaleString('en-IN')} from Rent)
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value={TokenDisposition.LEAVE_PENDING}
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Leave Pending (Do not adjust automatically)
                      </Typography>
                    }
                  />
                </RadioGroup>
              </Box>

              <TokenAdjustmentPreview
                agreedRent={agreedRent}
                agreedDeposit={agreedDeposit}
                tokenAmount={tokenAmount}
                disposition={disposition}
                previewSummaryText={previewText}
                adjustedDepositBalance={adjustedDeposit}
                adjustedRentBalance={adjustedRent}
              />
            </>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block' }}>
            Note: Token disposition choice is temporary preparation state. No financial ledger postings occur until RA-6 execution.
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};
