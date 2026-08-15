import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Stack } from '@mui/material';
import { PageHeader } from '../../../components/PageHeader';
import { stayWorkflowComposition } from '../../../app/composition/stayWorkflowComposition';
import type { Reservation } from '../domain/entities/Reservation';
import type { ReservationDraft } from '../application/models/ReservationDraft';
import { ReservationSummaryCards } from '../components/ReservationSummaryCards';
import { ReservationsToolbar } from '../components/ReservationsToolbar';
import { ReservationsTable } from '../components/ReservationsTable';
import { CreateReservationModal } from '../components/CreateReservationModal';

export function ReservationsPage() {
  const navigate = useNavigate();

  const coordinator = useMemo(
    () => stayWorkflowComposition.reservationWorkspaceCoordinator,
    []
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load ViewModel via composed coordinator
  const viewModel = useMemo(() => {
    void refreshKey;
    return coordinator.loadWorkspace(searchQuery, activeFilter);
  }, [coordinator, searchQuery, activeFilter, refreshKey]);

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
    setRefreshKey((prev) => prev + 1);
    setIsCreateModalOpen(false);
  };

  const handleCheckDuplicate = (mobileNumber: string) => {
    return coordinator.checkDuplicateMobile(mobileNumber);
  };

  const handleOpenExisting = (existingReservation: Reservation) => {
    navigate(`/reservations/${existingReservation.id}`);
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <Stack spacing={3}>
        <PageHeader
          title="Reservations"
          subtitle="Manage prospects and upcoming arrivals."
        />

        <ReservationSummaryCards
          stats={viewModel.stats}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <ReservationsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onNewReservation={handleOpenCreateModal}
        />

        <ReservationsTable
          reservations={viewModel.filteredReservations}
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          onSelectReservation={handleSelectReservation}
          onNewReservation={handleOpenCreateModal}
          onClearSearch={() => setSearchQuery('')}
        />

        <CreateReservationModal
          open={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onSave={handleSaveReservation}
          onCheckDuplicate={handleCheckDuplicate}
          onOpenExisting={handleOpenExisting}
        />
      </Stack>
    </Container>
  );
}

export default ReservationsPage;
