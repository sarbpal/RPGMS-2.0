import { Hotel } from '@mui/icons-material';
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';

import { BedStatus } from '../types';
import type { Bed } from '../types';

interface BedCardProps {
  bed: Bed;
}

export function BedCard({ bed }: BedCardProps) {
  const isOccupied = bed.status === BedStatus.OCCUPIED;

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'grey.200',
        bgcolor: 'background.default',
        borderRadius: 1.5,
        height: '100%',
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Hotel color={isOccupied ? 'primary' : 'action'} fontSize="small" />
              <Typography sx={{ fontWeight: 600 }} variant="subtitle2">
                {bed.id}
              </Typography>
            </Box>
            <Chip
              color={isOccupied ? 'primary' : 'success'}
              label={isOccupied ? 'Occupied' : 'Vacant'}
              sx={{ fontWeight: 600, height: 24, fontSize: '0.8rem', px: 0.5 }}
              variant={isOccupied ? 'filled' : 'outlined'}
            />
          </Box>

          <Box sx={{ minHeight: 20 }}>
            {isOccupied && bed.residentName ? (
              <Typography color="text.secondary" sx={{ fontWeight: 600 }} variant="body2">
                {bed.residentName}
              </Typography>
            ) : (
              <Typography color="text.disabled" sx={{ fontStyle: 'italic' }} variant="body2">
                Vacant
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
