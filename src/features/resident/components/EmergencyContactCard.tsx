import { Card, CardContent, Divider, Grid, Stack, Typography } from '@mui/material';
import type { EmergencyContactViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface EmergencyContactCardProps {
  data: EmergencyContactViewModel;
}

export function EmergencyContactCard({ data }: EmergencyContactCardProps) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Emergency Contact Details
        </Typography>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Contact Name
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.contactName}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Relationship
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.relationship}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Emergency Phone
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.emergencyPhone}
              </Typography>
            </Grid>
          </Grid>

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Mother Name
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.motherName}
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
