import { Box, Typography } from '@mui/material';

import type { Area, Bed } from '../domain';
import { BedCard } from './BedCard';

interface AreaSectionProps {
  area: Area;
  statusFilter?: string;
  onBedClick?: (areaName: string, bed: Bed) => void;
}

export function AreaSection({ area, statusFilter, onBedClick }: AreaSectionProps) {
  const visibleBeds =
    statusFilter && statusFilter !== 'ALL'
      ? area.beds.filter((bed) => bed.status === statusFilter)
      : area.beds;

  if (visibleBeds.length === 0) {
    return null;
  }

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
        {visibleBeds.map((bed) => (
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
