import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Chip, Divider, Grid, Stack, Typography } from '@mui/material';
import { Build, Visibility } from '@mui/icons-material';
import type { CurrentStaySummaryViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface CurrentStaySummaryCardProps {
  data: CurrentStaySummaryViewModel;
}

export function CurrentStaySummaryCard({ data }: CurrentStaySummaryCardProps) {
  const navigate = useNavigate();

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Section Header: Title & Action */}
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Current Stay Summary
          </Typography>
          {data.hasActiveStay && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<Build />}
                onClick={() => navigate(`/maintenance?stayId=${data.stayId}`)}
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                Maintenance
              </Button>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<Visibility />}
                onClick={() => navigate(`/stay/${data.stayId}`)}
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                Open Stay Workspace
              </Button>
            </Stack>
          )}
        </Stack>

        {data.hasActiveStay ? (
          <Stack spacing={2}>
            {/* Grid Row 1: Accommodation details */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  Area
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {data.area}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  Flat
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {data.flat}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  Bed
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {data.bed}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  Door ID
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {data.doorId}
                </Typography>
              </Grid>
            </Grid>

            <Divider />

            {/* Grid Row 2: Stay status & commercial info */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  Stay Status
                </Typography>
                <Chip label={data.stayStatus} color="success" size="small" sx={{ fontWeight: 700, mt: 0.5 }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  Joining Date
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {data.joiningDate}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  Monthly Rent
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5, color: 'primary.main' }}>
                  ₹{data.monthlyRent.toLocaleString('en-IN')}
                </Typography>
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  Security Deposit
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                  ₹{data.securityDeposit.toLocaleString('en-IN')}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No active stay projection currently associated with this resident.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
