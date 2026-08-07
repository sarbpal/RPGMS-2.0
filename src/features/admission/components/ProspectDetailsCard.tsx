import { Card, CardContent, Divider, Grid, Stack, Typography, TextField, Alert } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

interface ProspectDetailsCardProps {
  fullName: string;
  mobileNumber: string;
  onChangeFullName: (name: string) => void;
  onChangeMobileNumber: (mobile: string) => void;
  duplicateCheckStatus?: {
    status: 'ACTIVE_BLOCK' | 'ON_NOTICE_BLOCK' | 'REUSE_ALLOW' | 'NEW';
    existingResident?: { residentCode: string; fullName: string };
    message?: string;
  };
}

export const ProspectDetailsCard: React.FC<ProspectDetailsCardProps> = ({
  fullName,
  mobileNumber,
  onChangeFullName,
  onChangeMobileNumber,
  duplicateCheckStatus,
}) => {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <PersonIcon color="primary" fontSize="small" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Prospect Identity Details
          </Typography>
        </Stack>

        <Stack spacing={2}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Full Name *"
                fullWidth
                size="small"
                value={fullName}
                onChange={(e) => onChangeFullName(e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Mobile Number *"
                fullWidth
                size="small"
                value={mobileNumber}
                onChange={(e) => onChangeMobileNumber(e.target.value)}
                placeholder="10-digit mobile number"
              />
            </Grid>
          </Grid>

          {duplicateCheckStatus && duplicateCheckStatus.status !== 'NEW' && (
            <Alert
              severity={
                duplicateCheckStatus.status === 'ACTIVE_BLOCK' || duplicateCheckStatus.status === 'ON_NOTICE_BLOCK'
                  ? 'error'
                  : 'info'
              }
              sx={{ borderRadius: 1.5, py: 0.5, fontSize: '0.8125rem' }}
            >
              {duplicateCheckStatus.message}
            </Alert>
          )}

          <Divider />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Alternate Mobile
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: 'text.secondary' }}>
                N/A
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                Email Address
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5, color: 'text.secondary' }}>
                N/A
              </Typography>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
};
