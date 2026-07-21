import { Card, CardContent, Typography, Box } from '@mui/material';
import { formatCurrency } from '../utils/currencyFormatters';

interface FinancialSummaryCardProps {
  title: string;
  amount: number;
  subtitle?: string;
  color?: string;
}

export function FinancialSummaryCard({
  title,
  amount,
  subtitle,
  color = 'primary.main',
}: FinancialSummaryCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ color, fontWeight: 700, fontSize: '1.75rem', my: 0.5 }}>
          {formatCurrency(amount)}
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
