import React from 'react';
import { Card, CardContent, Grid, Stack, Typography, Button, Box, Alert, CircularProgress } from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { AdmissionReadiness } from '../application/models/AdmissionReadiness';

interface AdmissionActionsCardProps {
  readiness: AdmissionReadiness;
  isValidated: boolean;
  isSubmitting?: boolean;
  onValidateReadiness: () => void;
  onCompleteAdmission: () => void;
  onCancelReturn: () => void;
}

export const AdmissionActionsCard: React.FC<AdmissionActionsCardProps> = ({
  readiness,
  isValidated,
  isSubmitting = false,
  onValidateReadiness,
  onCompleteAdmission,
  onCancelReturn,
}) => {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Admission Actions
        </Typography>

        {isValidated && (
          <Box sx={{ mb: 2.5 }}>
            {readiness.isReadyToConfirm ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Admission Checklist Validated (100% Ready)
                </Typography>
                All preparation criteria satisfied. Click Complete Admission to finalize resident admission.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Admission Preparation Incomplete
                </Typography>
                Please complete all Admission Checklist criteria before attempting to Complete Admission.
              </Alert>
            )}
          </Box>
        )}

        <Grid container spacing={2.5}>
          {/* Action 1: Validate Admission */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                bgcolor: 'background.paper',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <FactCheckIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Validate Admission
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Evaluate all Admission Checklist criteria and check readiness.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                startIcon={<FactCheckIcon />}
                onClick={onValidateReadiness}
                disabled={isSubmitting}
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                Validate Admission
              </Button>
            </Box>
          </Grid>

          {/* Action 2: Complete Admission */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #2e7d32',
                bgcolor: 'success.50',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.main' }}>
                    Complete Admission
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Execute atomic resident creation, stay allocation, bed occupancy, and reservation conversion.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="success"
                fullWidth
                startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                onClick={onCompleteAdmission}
                disabled={!readiness.isReadyToConfirm || isSubmitting}
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                {isSubmitting ? 'Completing Admission...' : 'Complete Admission'}
              </Button>
            </Box>
          </Grid>

          {/* Action 3: Cancel & Return */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                bgcolor: 'background.paper',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <ArrowBackIcon color="action" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Cancel & Return
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Discard temporary workspace preparation state and return to Reservation Workspace.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="inherit"
                fullWidth
                startIcon={<ArrowBackIcon />}
                onClick={onCancelReturn}
                disabled={isSubmitting}
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                Cancel & Return
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};
