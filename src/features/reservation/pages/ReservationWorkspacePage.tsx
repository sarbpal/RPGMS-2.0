import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Stack, Link, Paper, Typography, Button, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { ReservationUseCases } from '../application/useCases/ReservationUseCases';
import { stayWorkflowComposition } from '../../../app/composition/stayWorkflowComposition';
import { ReservationHeader } from '../components/ReservationHeader';
import { ReservationCancellationOutcome } from '../components/ReservationCancellationOutcome';
import { ReservationOverviewCard } from '../components/ReservationOverviewCard';
import { ReservationCommercialExpectations } from '../components/ReservationCommercialExpectations';
import { ReservationNotesAccordion } from '../components/ReservationNotesAccordion';
import { ReservationHistoryAccordion } from '../components/ReservationHistoryAccordion';
import { EditReservationDialog } from '../components/EditReservationDialog';
import { CancelReservationModal } from '../components/CancelReservationModal';
import type { UpdateReservationDTO } from '../application/dtos/UpdateReservationDTO';
import type { Reservation, TokenCancellationDisposition } from '../domain/entities/Reservation';
import { canConvertReservation } from '../domain/rules/reservationRules';

export const ReservationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const useCases = useMemo(
    () => new ReservationUseCases(stayWorkflowComposition.reservationRepository),
    []
  );

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  // Key state trigger to force re-fetch when reservation updates
  const [refreshKey, setRefreshKey] = useState(0);

  const reservation: Reservation | null = useMemo(() => {
    if (!id) return null;
    return useCases.getReservationByIdSync(id);
  }, [id, useCases, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSaveEdit = (resId: string, dto: UpdateReservationDTO) => {
    useCases.updateReservationSync(resId, dto);
    handleRefresh();
  };

  const handleConfirmCancel = (
    resId: string,
    reason: string,
    tokenDisposition?: TokenCancellationDisposition
  ) => {
    useCases.cancelReservationSync(resId, { reason, tokenDisposition });
    handleRefresh();
  };


  const handleConvertAdmission = () => {
    if (!reservation) return;
    const convertCheck = canConvertReservation(reservation.status);
    if (!convertCheck.allowed) {
      alert(convertCheck.reason || 'Reservation cannot be converted.');
      return;
    }
    // Navigate to Admission Workspace (Hand-off only)
    navigate(`/admission/from-reservation/${reservation.id}`);
  };

  const handleViewAdmission = () => {
    if (!reservation) return;
    if (reservation.convertedStayId) {
      navigate(`/stays/${reservation.convertedStayId}`);
    } else if (reservation.convertedResidentId) {
      navigate(`/resident/${reservation.convertedResidentId}`);
    } else {
      navigate('/stays');
    }
  };

  if (!reservation) {
    return (
      <Container maxWidth="xl" sx={{ pt: 10, pb: 4 }}>
        <Stack spacing={2.5}>
          <Link
            component={RouterLink}
            to="/reservations"
            underline="hover"
            color="text.secondary"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 600,
              fontSize: '0.875rem',
              width: 'fit-content',
              '&:hover': { color: 'primary.main' },
            }}
          >
            <ArrowBackIcon sx={{ fontSize: '1.1rem' }} />
            Back to Reservations
          </Link>

          <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px border-dashed #cbd5e1' }}>
            <Box sx={{ color: 'text.secondary', mb: 2 }}>
              <EventBusyIcon sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#0f172a' }}>
              Reservation Not Found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1, mb: 3 }}>
              The reservation with ID &quot;{id}&quot; could not be found or has been removed.
            </Typography>
            <Button
              variant="contained"
              component={RouterLink}
              to="/reservations"
              startIcon={<ArrowBackIcon />}
              sx={{ fontWeight: 700, textTransform: 'none', px: 3 }}
            >
              Return to Reservations List
            </Button>
          </Paper>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ pt: 10, pb: 4 }}>
      <Stack spacing={2.5}>
        {/* Navigation Link */}
        <Link
          component={RouterLink}
          to="/reservations"
          underline="hover"
          color="text.secondary"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            fontWeight: 600,
            fontSize: '0.875rem',
            width: 'fit-content',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: '1.1rem' }} />
          Back to Reservations
        </Link>

        {/* A. HEADER: Identity + Actions */}
        <ReservationHeader
          reservation={reservation}
          onEdit={() => setIsEditOpen(true)}
          onCancel={() => setIsCancelOpen(true)}
          onConvert={handleConvertAdmission}
          onViewAdmission={handleViewAdmission}
        />

        {/* Cancellation Outcome (when CANCELLED) */}
        <ReservationCancellationOutcome reservation={reservation} />

        {/* B. RESERVATION OVERVIEW: Single home for core reservation & contact facts */}
        <ReservationOverviewCard reservation={reservation} />


        {/* C. COMMERCIAL EXPECTATIONS: Single home for commercial terms & token */}
        <ReservationCommercialExpectations reservation={reservation} />

        {/* D. NOTES & REMARKS: Collapsed progressive disclosure */}
        <ReservationNotesAccordion reservation={reservation} />

        {/* E. RESERVATION HISTORY: Collapsed progressive disclosure */}
        <ReservationHistoryAccordion reservation={reservation} />

        {/* Action Modals */}
        <EditReservationDialog
          open={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          reservation={reservation}
          onSave={handleSaveEdit}
        />

        <CancelReservationModal
          open={isCancelOpen}
          onClose={() => setIsCancelOpen(false)}
          reservation={reservation}
          onConfirmCancel={handleConfirmCancel}
        />
      </Stack>
    </Container>
  );
};

export default ReservationWorkspacePage;
