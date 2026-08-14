import { Hotel } from '@mui/icons-material';
import { Box, Card, CardActionArea, CardContent, Chip, Stack, Typography } from '@mui/material';

import { BedStatus } from '../domain';
import type { Bed } from '../domain';

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

  const cardInnerContent = (
    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
      <Stack spacing={1.5}>
        {/* Top row: Icon, Bed ID & Status Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Hotel color={config.iconColor} fontSize="small" />
            <Typography sx={{ fontWeight: 700 }} variant="subtitle2">
              {bed.id}
            </Typography>
          </Box>
          <Chip
            color={config.color}
            label={config.label}
            size="small"
            variant={config.variant}
            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
          />
        </Box>

        {/* Occupant row */}
        <Box sx={{ minHeight: 20 }}>
          {bed.residentName ? (
            <Typography color="text.primary" sx={{ fontWeight: 700 }} variant="body2">
              {bed.residentName}
            </Typography>
          ) : (
            <Typography color="text.disabled" sx={{ fontStyle: 'italic' }} variant="body2">
              {config.label}
            </Typography>
          )}
        </Box>

        {/* Commercial terms footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 0.5,
            pt: 1,
            borderTop: 1,
            borderStyle: 'dashed',
            borderColor: 'divider',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Rent: ₹{bed.defaultRent || 0}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Deposit: ₹{bed.defaultDeposit || 0}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        height: '100%',
        bgcolor: 'background.paper',
        borderColor: 'divider',
        transition: 'all 0.2s ease-in-out',
        ...(onClick && {
          '&:hover': {
            borderColor: 'primary.main',
            boxShadow: 3,
            transform: 'translateY(-2px)',
          },
        }),
      }}
    >
      {onClick ? (
        <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
          {cardInnerContent}
        </CardActionArea>
      ) : (
        cardInnerContent
      )}
    </Card>
  );
}
