import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { DirectionsCar, TwoWheeler } from '@mui/icons-material';
import type { VehicleItemViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface VehiclesCardProps {
  vehicles: VehicleItemViewModel[];
  onRegisterVehicle?: () => void;
}

export function VehiclesCard({ vehicles, onRegisterVehicle }: VehiclesCardProps) {
  const getVehicleIcon = (type: string) => {
    if (type.toLowerCase().includes('two') || type.toLowerCase().includes('bike')) {
      return <TwoWheeler fontSize="small" />;
    }
    return <DirectionsCar fontSize="small" />;
  };

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Section Header: Title & Action */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Registered Vehicles
          </Typography>
          {onRegisterVehicle && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<DirectionsCar />}
              onClick={onRegisterVehicle}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Register Vehicle
            </Button>
          )}
        </Stack>

        {vehicles.length > 0 ? (
          <Stack spacing={1.5}>
            {vehicles.map((v) => (
              <Box
                key={v.id}
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
                  {getVehicleIcon(v.vehicleType)}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {v.registrationNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Type: {v.vehicleType}
                    </Typography>
                  </Box>
                </Stack>
                <Chip label="Authorized" color="success" size="small" variant="outlined" sx={{ fontWeight: 600 }} />
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No vehicles currently registered for this resident.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
