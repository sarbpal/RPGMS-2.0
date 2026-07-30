import { Hotel } from '@mui/icons-material';
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';

import { BedStatus } from '../types';
import type { Bed } from '../types';

interface BedCardProps {
  bed: Bed;
  onClick?: () => void;
}

export function BedCard({ bed, onClick }: BedCardProps) {
  const getStatusConfig = (status: BedStatus) => {
    switch (status) {
      case BedStatus.VACANT:
        return { color: 'success' as const, label: 'Vacant', variant: 'outlined' as const, iconColor: 'action' as const };
      case BedStatus.OCCUPIED:
        return { color: 'primary' as const, label: 'Occupied', variant: 'filled' as const, iconColor: 'primary' as const };
      case BedStatus.ON_NOTICE:
        return { color: 'warning' as const, label: 'On Notice', variant: 'filled' as const, iconColor: 'warning' as const };
      case BedStatus.RESERVED:
        return { color: 'info' as const, label: 'Reserved', variant: 'filled' as const, iconColor: 'info' as const };
      case BedStatus.MAINTENANCE:
        return { color: 'error' as const, label: 'Maintenance', variant: 'outlined' as const, iconColor: 'error' as const };
      case BedStatus.BLOCKED:
        return { color: 'error' as const, label: 'Blocked', variant: 'filled' as const, iconColor: 'error' as const };
      default:
        return { color: 'default' as const, label: status, variant: 'outlined' as const, iconColor: 'action' as const };
    }
  };

  const config = getStatusConfig(bed.status);

  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: 'background.default',
        borderRadius: 1.5,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              borderColor: 'primary.main',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transform: 'translateY(-2px)',
            }
          : {},
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Hotel color={config.iconColor} fontSize="small" />
              <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
                {bed.id}
              </Typography>
            </Box>
            <Chip
              color={config.color}
              label={config.label}
              sx={{ fontWeight: 600, height: 24, fontSize: '0.8rem', px: 0.5 }}
              variant={config.variant}
            />
          </Box>

          <Box sx={{ minHeight: 20 }}>
            {bed.residentName ? (
              <Typography color="text.secondary" sx={{ fontWeight: 600 }} variant="body2">
                {bed.residentName}
              </Typography>
            ) : (
              <Typography color="text.disabled" sx={{ fontStyle: 'italic' }} variant="body2">
                {config.label}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5, borderTop: '1px dashed', borderColor: 'grey.100', pt: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Rent: ₹{bed.defaultRent || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Deposit: ₹{bed.defaultDeposit || 0}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
