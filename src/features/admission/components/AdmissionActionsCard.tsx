import React from 'react';
import { Card, CardContent, Grid, Stack, Typography, Button, Box, Alert } from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { AdmissionReadiness } from '../application/models/AdmissionReadiness';

interface AdmissionActionsCardProps {
  readiness: AdmissionReadiness;
  isValidated: boolean;
  onValidateReadiness: () => void;
  onCancelReturn: () => void;
}

export const AdmissionActionsCard: React.FC<AdmissionActionsCardProps> = ({
  readiness,
  isValidated,
  onValidateReadiness,
  onCancelReturn,
}) => {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Admission Preparation Actions
        </Typography>

        {isValidated && (
          <Box sx={{ mb: 2.5 }}>
            {readiness.isReadyToConfirm ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Admission Prepared & Validated (100% Ready)
                </Typography>
                All 5 business preparation criteria have been satisfied. The admission draft is ready for execution in Sprint RA-6.
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  Admission Preparation Incomplete
                </Typography>
                Please complete all 5 readiness checklist criteria before validating admission.
              </Alert>
            )}
          </Box>
        )}

        <Grid container spacing={2.5}>
          {/* Action 1: Validate Admission Readiness */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                bgcolor: 'background.paper',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <FactCheckIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    Validate Admission Readiness
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Evaluate all 5 preparation criteria and verify readiness status for RA-6 execution.
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<FactCheckIcon />}
                onClick={onValidateReadiness}
                sx={{ fontWeight: 700, textTransform: 'none' }}
              >
                Validate Readiness
              </Button>
            </Box>
          </Grid>

          {/* Action 2: Cancel & Return */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                bgcolor: 'background.paper',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
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
