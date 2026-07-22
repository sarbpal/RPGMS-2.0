import { Person } from '@mui/icons-material';
import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import type { ResidentHeaderViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface ResidentHeaderProps {
  data: ResidentHeaderViewModel;
}

export function ResidentHeader({ data }: ResidentHeaderProps) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
          spacing={2}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
              <Person sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {data.fullName}
                </Typography>
                <Chip label={data.status} color="success" size="small" sx={{ fontWeight: 600 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Resident Code: {data.residentCode}{data.residentId ? ` \u2022 ID: ${data.residentId}` : ''}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Primary Mobile
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {data.primaryMobile}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Email Address
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {data.email}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
