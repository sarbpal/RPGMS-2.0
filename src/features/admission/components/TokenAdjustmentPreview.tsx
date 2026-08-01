import React from 'react';
import { Paper, Box, Typography, Chip } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import PaymentsIcon from '@mui/icons-material/Payments';
import { TokenDisposition } from '../domain/valueObjects/TokenDisposition';

interface TokenAdjustmentPreviewProps {
  agreedRent: number;
  agreedDeposit: number;
  tokenAmount: number;
  disposition?: TokenDisposition;
  previewSummaryText: string;
  adjustedDepositBalance: number;
  adjustedRentBalance: number;
}

export const TokenAdjustmentPreview: React.FC<TokenAdjustmentPreviewProps> = ({
  agreedRent,
  agreedDeposit,
  tokenAmount,
  disposition,
  previewSummaryText,
  adjustedDepositBalance,
  adjustedRentBalance,
}) => {
  if (tokenAmount <= 0) {
    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          No Token Recorded (Token Waived or ₹0). Full agreed rent & deposit payable.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        backgroundColor: '#f0f9ff',
        border: '1.5px solid #0284c7',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: '#0369a1' }}>
          <CalculateIcon sx={{ mr: 1 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
            Decision Support — Token Adjustment Preview
          </Typography>
        </Box>
        <Chip
          icon={<PaymentsIcon />}
          label={`Token Paid: ₹${tokenAmount.toLocaleString('en-IN')}`}
          color="primary"
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Box>

      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0c4a6e', mb: 1.5 }}>
        {previewSummaryText}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, pt: 1, borderTop: '1px border-dashed #bae6fd' }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            Security Deposit Breakdown
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Agreed: ₹{agreedDeposit.toLocaleString('en-IN')}{' '}
            {disposition === TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT && (
              <Box component="span" sx={{ color: '#059669', ml: 1 }}>
                ➔ Payable: ₹{adjustedDepositBalance.toLocaleString('en-IN')}
              </Box>
            )}
          </Typography>
        </Box>

        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            First Month Rent Breakdown
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
            Agreed: ₹{agreedRent.toLocaleString('en-IN')}{' '}
            {disposition === TokenDisposition.ADJUST_TO_FIRST_RENT && (
              <Box component="span" sx={{ color: '#059669', ml: 1 }}>
                ➔ Payable: ₹{adjustedRentBalance.toLocaleString('en-IN')}
              </Box>
            )}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};
