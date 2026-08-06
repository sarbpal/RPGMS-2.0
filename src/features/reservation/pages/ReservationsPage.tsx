import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';
import { PageHeader } from '../../../components/PageHeader';
import { ReservationUseCases } from '../application/useCases/ReservationUseCases';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationsToolbar } from '../components/ReservationsToolbar';
import { ReservationsTable } from '../components/ReservationsTable';

export function ReservationsPage() {
  const navigate = useNavigate();
  const useCases = useMemo(
    () => new ReservationUseCases(new InMemoryReservationRepository()),
    []
  );

  const [reservations] = useState<Reservation[]>(() => {
    return useCases.listReservationsSync();
  });

  const totalCount = reservations.length;
  const activeCount = useMemo(() => {
    return reservations.filter((r) => r.status === 'ACTIVE').length;
  }, [reservations]);

  const handleSelectReservation = (reservation: Reservation) => {
    navigate(`/reservations/${reservation.id}`);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <PageHeader
        title="Reservations"
        subtitle="Manage future resident admissions and reservation pipeline"
      />

      <ReservationsToolbar
        totalCount={totalCount}
        activeCount={activeCount}
      />

      <ReservationsTable
        reservations={reservations}
        onSelectReservation={handleSelectReservation}
      />
    </Container>
  );
}

export default ReservationsPage;
