import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import type { ProfileCompletionViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface ProfileCompletionCardProps {
  data: ProfileCompletionViewModel;
}

export function ProfileCompletionCard({ data }: ProfileCompletionCardProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Section Title & Percentage */}
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Profile Completion
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
              {data.percentage}%
            </Typography>
          </Stack>

          {/* Progress Bar */}
          <LinearProgress
            variant="determinate"
            value={data.percentage}
            color={getProgressColor(data.percentage)}
            sx={{ height: 10, borderRadius: 5 }}
          />

          {/* Summary of Missing / Completed Items */}
          {data.missingItems.length > 0 ? (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Missing: {data.missingItems.join(', ')}
            </Typography>
          ) : (
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
              ✓ All profile fields complete
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
