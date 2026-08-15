import React from 'react';
import { Card, CardContent, Grid, Stack, Typography, Button, Box, CircularProgress, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import type { AdmissionReadinessAssessment } from '../application/models/AdmissionReadinessAssessment';
import type { AdmissionReadiness } from '../application/models/AdmissionReadiness';

export interface AdmissionActionsCardProps {
  assessment?: AdmissionReadinessAssessment;
  readiness?: AdmissionReadiness;
  isSubmitting?: boolean;
  onApproveAndAdmit: () => void;
  onCancelReturn: () => void;
  // Optional backwards compatibility handlers
  isValidated?: boolean;
  onValidateReadiness?: () => void;
  onCompleteAdmission?: () => void;
}

export const AdmissionActionsCard: React.FC<AdmissionActionsCardProps> = ({
  assessment,
  isSubmitting = false,
  onApproveAndAdmit,
  onCancelReturn,
  onCompleteAdmission,
}) => {
  const handlePrimaryAction = () => {
    if (onApproveAndAdmit) {
      onApproveAndAdmit();
    } else if (onCompleteAdmission) {
      onCompleteAdmission();
    }
  };

  const category = assessment?.category;
  const isRequiresReview = category === 'REQUIRES_REVIEW';

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Operator Decision & Admission Actions
          </Typography>
          {category && (
            <Chip
              label={`Posture: ${category.replace(/_/g, ' ')}`}
              color={category === 'READY_FOR_APPROVAL' ? 'success' : isRequiresReview ? 'warning' : 'default'}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          )}
        </Box>

        <Grid container spacing={2.5}>
          {/* Primary Action: Approve & Admit */}
          <Grid size={{ xs: 12, sm: 7, md: 8 }}>
            <Box
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: '1.5px solid',
                borderColor: isRequiresReview ? '#f59e0b' : '#16a34a',
                bgcolor: isRequiresReview ? 'rgba(255, 251, 235, 0.6)' : 'rgba(240, 253, 244, 0.6)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                  <HowToRegIcon sx={{ color: isRequiresReview ? '#d97706' : '#16a34a' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: isRequiresReview ? '#b45309' : '#15803d' }}>
                    Approve & Admit Resident
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                  Operator decision to formally approve admission. RPGMS validates live operational invariants immediately before committing the atomic transaction.
                </Typography>
              </Box>

              <Box sx={{ pt: 1 }}>
                <Button
                  variant="contained"
                  color={isRequiresReview ? 'warning' : 'success'}
                  size="large"
                  startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                  onClick={handlePrimaryAction}
                  disabled={isSubmitting}
                  sx={{
                    fontWeight: 800,
                    textTransform: 'none',
                    px: 3,
                    py: 1.2,
                    fontSize: '1rem',
                    boxShadow: 2,
                  }}
                >
                  {isSubmitting ? 'Admitting Resident...' : 'Approve & Admit'}
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Secondary Action: Cancel & Return */}
          <Grid size={{ xs: 12, sm: 5, md: 4 }}>
            <Box
              sx={{
                p: 2.5,
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
                  Discard temporary workspace preparation state and return to previous list.
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
