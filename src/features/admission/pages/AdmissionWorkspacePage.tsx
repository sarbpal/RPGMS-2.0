import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Stack, Grid, Link, Paper, Typography, Button, Box } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { ReservationUseCases } from '../../reservation/application/useCases/ReservationUseCases';
import { InMemoryReservationRepository } from '../../reservation/infrastructure/repositories/InMemoryReservationRepository';
import type { Reservation } from '../../reservation/domain/entities/Reservation';
import { AdmissionHeader } from '../components/AdmissionHeader';
import { AdmissionSummaryCard } from '../components/AdmissionSummaryCard';
import { AdmissionReadinessPanel } from '../components/AdmissionReadinessPanel';
import { SourceReservationCard } from '../components/SourceReservationCard';
import { ProspectDetailsCard } from '../components/ProspectDetailsCard';
import { CommercialTermsCard } from '../components/CommercialTermsCard';
import { AccommodationSelectionCard } from '../components/AccommodationSelectionCard';
import { TokenReviewCard } from '../components/TokenReviewCard';
import { AdmissionActionsCard } from '../components/AdmissionActionsCard';
import { AdmissionCoordinator } from '../application/coordinator/AdmissionCoordinator';
import type { AdmissionDraft } from '../application/models/AdmissionDraft';
import type { TokenDisposition } from '../domain/valueObjects/TokenDisposition';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';

export const AdmissionWorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const reservationUseCases = useMemo(
    () => new ReservationUseCases(new InMemoryReservationRepository()),
    []
  );

  const admissionCoordinator = useMemo(
    () => new AdmissionCoordinator(new InMemoryReservationRepository()),
    []
  );

  const accommodationRepo = useMemo(
    () => new InMemoryAccommodationRepository(),
    []
  );

  const reservation: Reservation | null = useMemo(() => {
    if (!id) return null;
    return reservationUseCases.getReservationByIdSync(id);
  }, [id, reservationUseCases]);

  // Temporary Workspace Preparation State ONLY (No DB Persistence per Refinement #2 & #3)
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [agreedRent, setAgreedRent] = useState<number>(0);
  const [agreedDeposit, setAgreedDeposit] = useState<number>(0);
  const [flatId, setFlatId] = useState<string | undefined>(undefined);
  const [bedIds, setBedIds] = useState<string[]>([]);
  const [tokenDisposition, setTokenDisposition] = useState<TokenDisposition | undefined>(undefined);
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    if (reservation) {
      setFullName(reservation.prospectName || '');
      setMobileNumber(reservation.mobileNumber || '');
      setCheckInDate(reservation.expectedJoiningDate || '');
      setAgreedRent(reservation.expectedMonthlyRent || 0);
      setAgreedDeposit(reservation.expectedSecurityDeposit || 0);
    }
  }, [reservation]);

  const draft: AdmissionDraft = useMemo(
    () => ({
      reservationId: reservation?.id,
      residentName: fullName,
      mobileNumber,
      checkInDate,
      agreedRent,
      agreedDeposit,
      flatId,
      bedIds,
      tokenDisposition,
    }),
    [reservation?.id, fullName, mobileNumber, checkInDate, agreedRent, agreedDeposit, flatId, bedIds, tokenDisposition]
  );

  const readiness = useMemo(() => {
    return admissionCoordinator.evaluateReadiness(draft, reservation);
  }, [admissionCoordinator, draft, reservation]);

  const selectedFlat = useMemo(() => {
    if (!flatId) return null;
    return accommodationRepo.findById(flatId);
  }, [flatId, accommodationRepo]);

  const selectedBedNames = useMemo(() => {
    if (!selectedFlat || bedIds.length === 0) return [];
    const flatBeds = selectedFlat.areas.flatMap((a) => a.beds);
    return bedIds
      .map((bId) => flatBeds.find((b) => b.id === bId)?.name)
      .filter((name): name is string => Boolean(name));
  }, [selectedFlat, bedIds]);

  const handleValidateReadiness = () => {
    setIsValidated(true);
  };

  const handleCancelReturn = () => {
    if (reservation) {
      navigate(`/reservations/${reservation.id}`);
    } else {
      navigate('/reservations');
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
              The source reservation with ID &quot;{id}&quot; could not be found.
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
          to={`/reservations/${reservation.id}`}
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
          Back to Reservation ({reservation.reservationNumber})
        </Link>

        {/* Operational Workspace Top Block */}
        <Stack spacing={2}>
          <AdmissionHeader reservation={reservation} isReady={readiness.isReadyToConfirm} />
          <AdmissionSummaryCard
            reservation={reservation}
            readiness={readiness}
            selectedFlatName={selectedFlat?.name}
            selectedBedNames={selectedBedNames}
            agreedRent={agreedRent}
            agreedDeposit={agreedDeposit}
            checkInDate={checkInDate}
            tokenDisposition={tokenDisposition}
          />
          <AdmissionReadinessPanel readiness={readiness} />
        </Stack>

        {/* Information Cards Grid */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <SourceReservationCard reservation={reservation} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ProspectDetailsCard
              fullName={fullName}
              mobileNumber={mobileNumber}
              onChangeFullName={setFullName}
              onChangeMobileNumber={setMobileNumber}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <CommercialTermsCard
              agreedRent={agreedRent}
              agreedDeposit={agreedDeposit}
              checkInDate={checkInDate}
              onChangeAgreedRent={setAgreedRent}
              onChangeAgreedDeposit={setAgreedDeposit}
              onChangeCheckInDate={setCheckInDate}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <AccommodationSelectionCard
              flatId={flatId}
              bedIds={bedIds}
              onChangeFlatId={setFlatId}
              onChangeBedIds={setBedIds}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TokenReviewCard
              tokenAmount={reservation.tokenAmount}
              tokenReceivedOn={reservation.tokenReceivedOn}
              tokenRemarks={reservation.tokenRemarks}
              disposition={tokenDisposition}
              agreedRent={agreedRent}
              agreedDeposit={agreedDeposit}
              onChangeDisposition={setTokenDisposition}
            />
          </Grid>
        </Grid>

        {/* Operational Action Panel */}
        <AdmissionActionsCard
          readiness={readiness}
          isValidated={isValidated}
          onValidateReadiness={handleValidateReadiness}
          onCancelReturn={handleCancelReturn}
        />
      </Stack>
    </Container>
  );
};

export default AdmissionWorkspacePage;
