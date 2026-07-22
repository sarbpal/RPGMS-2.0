import { Card, CardContent, Divider, Grid, Stack, Typography } from '@mui/material';
import type { ContactInformationViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface ContactInformationCardProps {
  data: ContactInformationViewModel;
}

export function ContactInformationCard({ data }: ContactInformationCardProps) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Contact & Address Information
        </Typography>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Primary Mobile
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.primaryMobile}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Alternate Mobile
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.alternateMobile}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                City & State
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.city}, {data.state}
              </Typography>
            </Grid>
          </Grid>

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Permanent Address
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.permanentAddress}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Correspondence Address
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.correspondenceAddress}
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
