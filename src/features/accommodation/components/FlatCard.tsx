import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';

import { BedStatus } from '../types';
import type { Flat } from '../types';
import { AreaSection } from './AreaSection';

interface FlatCardProps {
  flat: Flat;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function FlatCard({ flat, onEdit, onDelete }: FlatCardProps) {
  // Derive metrics dynamically
  let totalBeds = 0;
  let occupiedBeds = 0;
  let vacantBeds = 0;

  flat.areas.forEach((area) => {
    area.beds.forEach((bed) => {
      totalBeds++;
      if (bed.status === BedStatus.OCCUPIED) {
        occupiedBeds++;
      } else if (bed.status === BedStatus.VACANT) {
        vacantBeds++;
      }
    });
  });

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'grey.300',
        bgcolor: 'background.paper',
        borderRadius: 2,
        mb: 4,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header - Simplified and visually integrated with theme defaults */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 1.5,
            mb: 2.5,
          }}
        >
          <Typography variant="h5">
            Flat {flat.name}
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ flexGrow: 1 }}>
            ({totalBeds} Beds &bull; {occupiedBeds} Occupied &bull; {vacantBeds} Vacant)
          </Typography>
          <Stack direction="row" spacing={1}>
            {onEdit && (
              <Button
                startIcon={<EditIcon />}
                variant="outlined"
                size="small"
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                startIcon={<DeleteIcon />}
                variant="outlined"
                color="error"
                size="small"
                onClick={onDelete}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Nested Areas */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {flat.areas.map((area) => (
            <AreaSection key={area.id} area={area} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
