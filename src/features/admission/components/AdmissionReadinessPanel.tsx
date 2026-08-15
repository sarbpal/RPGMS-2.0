import React from 'react';
import {
  Paper,
  Box,
  Typography,
  Stack,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import GavelIcon from '@mui/icons-material/Gavel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import type {
  AdmissionReadinessAssessment,
  ReadinessCategory,
  ObservationSeverity,
  AdmissionSection,
} from '../application/models/AdmissionReadinessAssessment';
import type { AdmissionReadiness } from '../application/models/AdmissionReadiness';

interface AdmissionReadinessPanelProps {
  assessment?: AdmissionReadinessAssessment;
  readiness?: AdmissionReadiness;
  isWalkIn?: boolean;
}

const CATEGORY_CONFIG: Record<
  ReadinessCategory,
  {
    title: string;
    description: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    chipColor: 'success' | 'warning' | 'info' | 'secondary' | 'default';
    icon: React.ReactNode;
  }
> = {
  READY_FOR_APPROVAL: {
    title: 'Ready for Approval',
    description: 'Preparation data appears sufficiently complete for operator review and approval.',
    bgColor: '#f0fdf4',
    borderColor: '#16a34a',
    textColor: '#15803d',
    chipColor: 'success',
    icon: <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 24 }} />,
  },
  REQUIRES_REVIEW: {
    title: 'Requires Review',
    description: 'There are operational or commercial divergences that require operator human judgment.',
    bgColor: '#fffbeb',
    borderColor: '#f59e0b',
    textColor: '#b45309',
    chipColor: 'warning',
    icon: <WarningAmberIcon sx={{ color: '#d97706', fontSize: 24 }} />,
  },
  AWAITING_INFORMATION: {
    title: 'Awaiting Information',
    description: 'Required operational or identity information is not yet complete in Preparation.',
    bgColor: '#f8fafc',
    borderColor: '#94a3b8',
    textColor: '#334155',
    chipColor: 'default',
    icon: <ErrorOutlinedIcon sx={{ color: '#64748b', fontSize: 24 }} />,
  },
  PENDING_OPERATOR_DECISION: {
    title: 'Pending Operator Decision',
    description: 'The system cannot make the final decision because explicit operator judgment is required.',
    bgColor: '#fdf4ff',
    borderColor: '#c084fc',
    textColor: '#7e22ce',
    chipColor: 'secondary',
    icon: <GavelIcon sx={{ color: '#a855f7', fontSize: 24 }} />,
  },
};

const SEVERITY_CONFIG: Record<
  ObservationSeverity,
  {
    label: string;
    color: 'error' | 'warning' | 'secondary' | 'info' | 'default';
  }
> = {
  INCOMPLETE_DATA: { label: 'Missing Data', color: 'error' },
  DECISION_REQUIRED: { label: 'Decision Required', color: 'secondary' },
  REVIEW_WARNING: { label: 'Review Warning', color: 'warning' },
  INFO: { label: 'Info', color: 'info' },
};

const SECTION_LABELS: Record<AdmissionSection, string> = {
  SOURCE: '1. Admission Source',
  IDENTITY: '2. Resident Identity',
  COMMERCIAL: '3. Commercial Terms',
  ACCOMMODATION: '4. Accommodation',
  TOKEN: '5. Token Disposition',
};

export const AdmissionReadinessPanel: React.FC<AdmissionReadinessPanelProps> = ({
  assessment,
  readiness,
  isWalkIn,
}) => {
  // If modern assessment is not passed, gracefully fallback to legacy readiness representation
  if (!assessment) {
    const isReady = Boolean(readiness?.isReadyToConfirm);
    const steps = [
      { label: isWalkIn ? '1. Admission Source (Direct Walk-in Entry)' : '1. Reservation Status', isValid: readiness?.isReservationValid },
      { label: '2. Resident Details', isValid: readiness?.isResidentDetailsValid },
      { label: '3. Commercial Terms', isValid: readiness?.isCommercialTermsValid },
      { label: '4. Accommodation Selection', isValid: readiness?.isAccommodationValid },
      { label: isWalkIn ? '5. Token Disposition (N/A — Walk-in)' : '5. Token Disposition Decision', isValid: readiness?.isTokenDecisionValid },
    ];

    return (
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          backgroundColor: isReady ? '#f0fdf4' : '#fffbeb',
          border: '1.5px solid',
          borderColor: isReady ? '#16a34a' : '#f59e0b',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          {isReady ? (
            <CheckCircleIcon sx={{ color: '#16a34a', mr: 1, fontSize: 24 }} />
          ) : (
            <ErrorOutlinedIcon sx={{ color: '#d97706', mr: 1, fontSize: 24 }} />
          )}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: isReady ? '#15803d' : '#b45309' }}>
            {isReady ? 'Ready for Admission' : 'Admission Readiness Checklist'}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Advisory readiness checklist to assist operator judgment during preparation.
        </Typography>
        <Divider sx={{ mb: 1.5 }} />
        <Stack spacing={1}>
          {steps.map((step, idx) => (
            <Stack key={idx} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              {step.isValid ? (
                <CheckCircleIcon fontSize="small" sx={{ color: '#16a34a' }} />
              ) : (
                <ErrorOutlinedIcon fontSize="small" sx={{ color: '#d97706' }} />
              )}
              <Typography variant="body2" sx={{ fontWeight: step.isValid ? 600 : 500, color: step.isValid ? '#16a34a' : '#92400e' }}>
                {step.label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    );
  }

  const category = assessment.category;
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.AWAITING_INFORMATION;
  const sections: AdmissionSection[] = ['SOURCE', 'IDENTITY', 'COMMERCIAL', 'ACCOMMODATION', 'TOKEN'];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        backgroundColor: config.bgColor,
        border: '1.5px solid',
        borderColor: config.borderColor,
      }}
    >
      {/* Top Banner: Category & Posture */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          {config.icon}
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: config.textColor }}>
              {config.title}
            </Typography>
          </Box>
        </Stack>

        <Chip
          label={category.replace(/_/g, ' ')}
          color={config.chipColor}
          size="small"
          sx={{ fontWeight: 800, px: 0.5 }}
        />
      </Box>

      {/* Summary Narrative */}
      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500, mb: 1.5 }}>
        {assessment.summary}
      </Typography>

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2, fontStyle: 'italic' }}>
        * Advisory assessment only. System recommends — Operator decides — RPGMS validates and executes.
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Section Assessments Grid */}
      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}>
        Section Readiness Status
      </Typography>

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {sections.map((sec) => {
          const sectionAssessment = assessment.sectionAssessments[sec];
          const isComplete = sectionAssessment ? sectionAssessment.isComplete : false;

          return (
            <Grid key={sec} size={{ xs: 12, sm: 6, md: 2.4 }}>
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: isComplete ? '#bbf7d0' : '#fed7aa',
                  bgcolor: isComplete ? 'rgba(240, 253, 244, 0.7)' : 'rgba(255, 251, 235, 0.7)',
                  height: '100%',
                }}
              >
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mb: 0.5 }}>
                  {isComplete ? (
                    <CheckCircleIcon fontSize="small" sx={{ color: '#16a34a', fontSize: 16 }} />
                  ) : (
                    <InfoOutlinedIcon fontSize="small" sx={{ color: '#d97706', fontSize: 16 }} />
                  )}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: isComplete ? '#15803d' : '#b45309' }}>
                    {SECTION_LABELS[sec]}
                  </Typography>
                </Stack>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                  {sectionAssessment?.summary || (isComplete ? 'Criteria satisfied' : 'Incomplete')}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Observations Breakdown */}
      {assessment.observations.length > 0 && (
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #cbd5e1' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}>
            Advisory Observations ({assessment.observations.length})
          </Typography>

          <Stack spacing={1}>
            {assessment.observations.map((obs, idx) => {
              const sev = SEVERITY_CONFIG[obs.severity] || SEVERITY_CONFIG.INFO;
              const isProgressiveInfo = obs.severity === 'INFO' && obs.section === 'IDENTITY';

              return (
                <Box
                  key={idx}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    border: '1px solid #e2e8f0',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={sev.label}
                      color={sev.color}
                      size="small"
                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800 }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                      [{obs.section}]
                    </Typography>
                    {isProgressiveInfo && (
                      <Typography variant="caption" sx={{ color: 'info.main', fontStyle: 'italic' }}>
                        (Non-blocking Progressive Profile)
                      </Typography>
                    )}
                  </Stack>

                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    {obs.message}
                  </Typography>

                  {obs.guidance && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                      💡 <strong>Guidance:</strong> {obs.guidance}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
        </Box>
      )}
    </Paper>
  );
};
