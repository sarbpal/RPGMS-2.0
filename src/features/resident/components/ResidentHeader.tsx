import { Person } from '@mui/icons-material';
import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { ResidentHeaderViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface ResidentHeaderProps {
  data: ResidentHeaderViewModel;
}

export function ResidentHeader({ data }: ResidentHeaderProps) {
  const getChipColor = (status: string) => {
    if (status.includes('Active')) return 'success';
    if (status.includes('Notice')) return 'warning';
    return 'default';
  };

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.75rem' }}>
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                {data.fullName}
              </Typography>
              <Chip label={data.status} color={getChipColor(data.status)} size="small" sx={{ fontWeight: 700 }} />
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontWeight: 600 }}>
              Resident Code: {data.residentCode}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
