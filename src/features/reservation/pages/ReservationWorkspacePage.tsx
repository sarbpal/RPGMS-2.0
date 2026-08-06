import React, { useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { Container, Stack, Grid, Link, Paper, Typography, Button, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { ReservationUseCases } from '../application/useCases/ReservationUseCases';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationHeader } from '../components/ReservationHeader';
import { ReservationSummaryCard } from '../components/ReservationSummaryCard';
import { ProspectInformationCard } from '../components/ProspectInformationCard';
import { ReservationDetailsCard } from '../components/ReservationDetailsCard';
import { TokenInformationCard } from '../components/TokenInformationCard';
import { ReservationNotesCard } from '../components/ReservationNotesCard';

export const ReservationWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const useCases = useMemo(
    () => new ReservationUseCases(new InMemoryReservationRepository()),
    []
  );

  const reservation = useMemo(() => {
    if (!id) return null;
    return useCases.getReservationByIdSync(id);
  }, [id, useCases]);

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
      </Stack>
    </Container>
  );
};

export default ReservationWorkspacePage;
