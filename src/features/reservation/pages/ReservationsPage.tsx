import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '@mui/material';
import { PageHeader } from '../../../components/PageHeader';
import { ReservationUseCases } from '../application/useCases/ReservationUseCases';
import { ReservationWorkspaceCoordinator } from '../application/coordinator/ReservationWorkspaceCoordinator';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import type { Reservation } from '../domain/entities/Reservation';
import type { ReservationDraft } from '../application/models/ReservationDraft';
import { ReservationsToolbar } from '../components/ReservationsToolbar';
import { ReservationsTable } from '../components/ReservationsTable';
import { CreateReservationModal } from '../components/CreateReservationModal';

export function ReservationsPage() {
  const navigate = useNavigate();

  const reservationRepo = useMemo(() => new InMemoryReservationRepository(), []);
  const useCases = useMemo(() => new ReservationUseCases(reservationRepo), [reservationRepo]);
  const coordinator = useMemo(
    () => new ReservationWorkspaceCoordinator(reservationRepo),
    [reservationRepo]
  );

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    return useCases.listReservationsSync();
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const totalCount = reservations.length;
  const activeCount = useMemo(() => {
    return reservations.filter((r) => r.status === 'ACTIVE').length;
  }, [reservations]);

  const handleSelectReservation = (reservation: Reservation) => {
    navigate(`/reservations/${reservation.id}`);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleSaveReservation = (draft: ReservationDraft) => {
    coordinator.saveReservation(draft);
    setReservations(useCases.listReservationsSync());
    setIsCreateModalOpen(false);
  };

  const handleCheckDuplicate = (mobileNumber: string) => {
    return coordinator.checkDuplicateMobile(mobileNumber);
  };

  const handleOpenExisting = (existingReservation: Reservation) => {
    navigate(`/reservations/${existingReservation.id}`);
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
        onNewReservation={handleOpenCreateModal}
      />

      <ReservationsTable
        reservations={reservations}
        onSelectReservation={handleSelectReservation}
      />

      <CreateReservationModal
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSave={handleSaveReservation}
        onCheckDuplicate={handleCheckDuplicate}
        onOpenExisting={handleOpenExisting}
      />
    </Container>
  );
}

export default ReservationsPage;
