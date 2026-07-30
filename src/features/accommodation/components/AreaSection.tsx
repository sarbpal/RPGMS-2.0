import { Box, Typography } from '@mui/material';

import type { Area, Bed } from '../domain';
import { BedCard } from './BedCard';

interface AreaSectionProps {
  area: Area;
  onBedClick?: (areaName: string, bed: Bed) => void;
}

export function AreaSection({ area, onBedClick }: AreaSectionProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        color="text.primary"
        sx={{
          fontWeight: 600,
          fontSize: '0.875rem',
          mb: 1.5,
        }}
        variant="subtitle2"
      >
        {area.name}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
          },
          gap: 2,
        }}
      >
        {area.beds.map((bed) => (
          <BedCard
            key={bed.id}
            bed={bed}
            onClick={onBedClick ? () => onBedClick(area.name, bed) : undefined}
          />
        ))}
      </Box>
    </Box>
  );
}
