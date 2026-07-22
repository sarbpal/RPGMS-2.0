import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { StayHeaderViewModel } from '../application/models/StayWorkspaceViewModel';

interface StayHeaderProps {
  data: StayHeaderViewModel;
}

export function StayHeader({ data }: StayHeaderProps) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                {data.residentName}
              </Typography>
              <Chip label={data.status} color="success" size="small" sx={{ fontWeight: 600, mb: 1 }} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Resident ID: {data.residentId}{data.stayId ? ` \u2022 Stay ID: ${data.stayId}` : ''}
            </Typography>
          </Box>

          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Check-in Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {data.checkInDate}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Flat / Bed Allocation
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {data.allocation}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
