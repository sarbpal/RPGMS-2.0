import React from 'react';
import { Paper, Box, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import type { AdmissionReadiness } from '../application/models/AdmissionReadiness';

interface AdmissionReadinessPanelProps {
  readiness: AdmissionReadiness;
  isWalkIn?: boolean;
}

export const AdmissionReadinessPanel: React.FC<AdmissionReadinessPanelProps> = ({ readiness, isWalkIn }) => {
  const steps = [
    { label: isWalkIn ? '1. Admission Source (Direct Walk-in Entry)' : '1. Reservation Status', isValid: readiness.isReservationValid },
    { label: '2. Resident Details', isValid: readiness.isResidentDetailsValid },
    { label: '3. Commercial Terms', isValid: readiness.isCommercialTermsValid },
    { label: '4. Accommodation Selection', isValid: readiness.isAccommodationValid },
    { label: isWalkIn ? '5. Token Disposition (N/A — Walk-in)' : '5. Token Disposition Decision', isValid: readiness.isTokenDecisionValid },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        backgroundColor: readiness.isReadyToConfirm ? '#f0fdf4' : '#fffbeb',
        border: '1.5px solid',
        borderColor: readiness.isReadyToConfirm ? '#16a34a' : '#f59e0b',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        {readiness.isReadyToConfirm ? (
          <CheckCircleIcon sx={{ color: '#16a34a', mr: 1, fontSize: 24 }} />
        ) : (
          <ErrorOutlinedIcon sx={{ color: '#d97706', mr: 1, fontSize: 24 }} />
        )}
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: readiness.isReadyToConfirm ? '#15803d' : '#b45309' }}>
          {readiness.isReadyToConfirm ? 'Ready for Admission' : 'Admission Readiness Checklist'}
        </Typography>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        All 5 business validation criteria must be completed to confirm admission.
      </Typography>

      <Divider sx={{ mb: 1.5 }} />

      <List dense disablePadding>
        {steps.map((step, idx) => (
          <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              {step.isValid ? (
                <CheckCircleIcon fontSize="small" sx={{ color: '#16a34a' }} />
              ) : (
                <ErrorOutlinedIcon fontSize="small" sx={{ color: '#d97706' }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={step.label}
              slotProps={{
                primary: {
                  variant: 'body2',
                  sx: {
                    fontWeight: step.isValid ? 600 : 500,
                    color: step.isValid ? '#16a34a' : '#92400e',
                  },
                },
              }}
            />
          </ListItem>
        ))}
      </List>

      {readiness.validationMessages.length > 0 && (
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px border-dashed #fde68a' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#b45309', display: 'block', mb: 0.5 }}>
            Pending Items:
          </Typography>
          {readiness.validationMessages.map((msg, idx) => (
            <Typography key={idx} variant="caption" sx={{ color: '#92400e', display: 'block', mb: 0.3 }}>
              • {msg}
            </Typography>
          ))}
        </Box>
      )}
    </Paper>
  );
};
