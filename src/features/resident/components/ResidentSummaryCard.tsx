import { Card, CardContent, Divider, Grid, Stack, Typography } from '@mui/material';
import type { ResidentSummaryViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface ResidentSummaryCardProps {
  data: ResidentSummaryViewModel;
}

export function ResidentSummaryCard({ data }: ResidentSummaryCardProps) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Resident Summary
        </Typography>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Resident Code
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.residentCode}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Joining Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.joiningDate}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Occupation
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.occupation}
              </Typography>
            </Grid>
          </Grid>

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Employer / College
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.employerOrCollege}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Blood Group
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {data.bloodGroup}
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
