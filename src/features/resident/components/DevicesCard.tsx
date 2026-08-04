import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Devices, Laptop, Smartphone } from '@mui/icons-material';
import type { DeviceItemViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface DevicesCardProps {
  devices: DeviceItemViewModel[];
  onRegisterDevice?: () => void;
}

export function DevicesCard({ devices, onRegisterDevice }: DevicesCardProps) {
  const getDeviceIcon = (type: string) => {
    if (type.toLowerCase().includes('mobile') || type.toLowerCase().includes('phone')) {
      return <Smartphone fontSize="small" />;
    }
    if (type.toLowerCase().includes('laptop') || type.toLowerCase().includes('computer')) {
      return <Laptop fontSize="small" />;
    }
    return <Devices fontSize="small" />;
  };

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Section Header: Title & Action */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Registered Devices
          </Typography>
          {onRegisterDevice && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Devices />}
              onClick={onRegisterDevice}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Register Device
            </Button>
          )}
        </Stack>

        {devices.length > 0 ? (
          <Stack spacing={1.5}>
            {devices.map((d) => (
              <Box
                key={d.id}
                sx={{
                  p: 1.75,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  {getDeviceIcon(d.deviceType)}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {d.deviceName} ({d.deviceType})
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      MAC: {d.macAddress}
                    </Typography>
                  </Box>
                </Stack>
                <Chip label="Authorized" color="primary" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No devices currently registered for this resident.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
