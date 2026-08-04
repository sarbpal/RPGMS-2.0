import { Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { CheckCircle, WarningAmber } from '@mui/icons-material';
import type { OperationalReadinessViewModel } from '../application/models/ResidentWorkspaceViewModel';

interface OperationalReadinessCardProps {
  data: OperationalReadinessViewModel;
}

export function OperationalReadinessCard({ data }: OperationalReadinessCardProps) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          {/* Section Title & Readiness Badge */}
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Operational Readiness
            </Typography>
            <Chip
              icon={data.isReady ? <CheckCircle fontSize="small" /> : <WarningAmber fontSize="small" />}
              label={data.statusLabel}
              color={data.isReady ? 'success' : 'warning'}
              sx={{ fontWeight: 700 }}
            />
          </Stack>

          {/* Readiness Requirements Checklist */}
          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
            {data.requirements.map((req) => (
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }} key={req.label}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: req.isSatisfied ? 'success.main' : 'warning.main',
                  }}
                >
                  {req.isSatisfied ? '✓' : '✗'}
                </Typography>
                <Typography variant="caption" color={req.isSatisfied ? 'text.primary' : 'text.secondary'} sx={{ fontWeight: 600 }}>
                  {req.label}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {/* Missing Mandatory Items Summary */}
          {!data.isReady && data.missingMandatoryItems.length > 0 && (
            <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 600 }}>
              Attention Required: Missing {data.missingMandatoryItems.join(', ')}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
