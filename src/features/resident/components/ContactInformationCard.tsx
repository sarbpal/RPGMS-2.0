import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import type { ContactInformationViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface ContactInformationCardProps {
  data: ContactInformationViewModel;
}

export function ContactInformationCard({ data }: ContactInformationCardProps) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        {/* Section Header: Title */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Contact Information
          </Typography>
        </Stack>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Primary Mobile
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
              {data.primaryMobile}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Alternate Mobile
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
              {data.alternateMobile}
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Email Address
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
              {data.email}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
