import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Stack, Grid, Link, Paper, Typography, Button, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { ReservationUseCases } from '../application/useCases/ReservationUseCases';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationHeader } from '../components/ReservationHeader';
import { ReservationSummaryCard } from '../components/ReservationSummaryCard';
import { ReservationActionsCard } from '../components/ReservationActionsCard';
import { ProspectInformationCard } from '../components/ProspectInformationCard';
import { ReservationDetailsCard } from '../components/ReservationDetailsCard';
import { TokenInformationCard } from '../components/TokenInformationCard';
import { ReservationNotesCard } from '../components/ReservationNotesCard';
import { EditReservationDialog } from '../components/EditReservationDialog';
import { CancelReservationModal } from '../components/CancelReservationModal';
import type { UpdateReservationDTO } from '../application/dtos/UpdateReservationDTO';
import type { Reservation } from '../domain/entities/Reservation';
import { canConvertReservation } from '../domain/rules/reservationRules';

export const ReservationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const useCases = useMemo(
    () => new ReservationUseCases(new InMemoryReservationRepository()),
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

  const handleConfirmCancel = (resId: string, reason?: string) => {
    useCases.cancelReservationSync(resId, { reason });
    handleRefresh();
  };

  const handleConvertAdmission = () => {
    if (!reservation) return;
    const convertCheck = canConvertReservation(reservation.status);
    if (!convertCheck.allowed) {
      alert(convertCheck.reason || 'Reservation cannot be converted.');
      return;
    }
    // Mandatory Revision 2 & 3: Navigate to Admission Workspace (Hand-off only)
    navigate(`/admission/from-reservation/${reservation.id}`);
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

        {/* Operational Workspace Top Block */}
        <Stack spacing={2}>
          <ReservationHeader reservation={reservation} />
          <ReservationSummaryCard reservation={reservation} />
          {/* RA-4 Operational Action Panel */}
          <ReservationActionsCard
            reservation={reservation}
            onEdit={() => setIsEditOpen(true)}
            onCancel={() => setIsCancelOpen(true)}
            onConvert={handleConvertAdmission}
          />
        </Stack>

        {/* Information Cards Grid */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ProspectInformationCard reservation={reservation} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ReservationDetailsCard reservation={reservation} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TokenInformationCard reservation={reservation} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ReservationNotesCard reservation={reservation} />
          </Grid>
        </Grid>

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
