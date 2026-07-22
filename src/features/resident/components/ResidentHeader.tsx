import { Person } from '@mui/icons-material';
import { Avatar, Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';

interface ResidentHeaderProps {
  residentId?: string;
}

export function ResidentHeader({ residentId }: ResidentHeaderProps) {
  const displayId = residentId || 'RES-00124';

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
                  Rajesh Kumar
                </Typography>
                <Chip label="Active Resident" color="success" size="small" sx={{ fontWeight: 600 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Resident Code: R000124 &bull; ID: {displayId}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Primary Mobile
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                +91 98765 43210
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Email Address
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                rajesh.kumar@example.com
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
