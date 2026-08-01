import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Paper,
  InputAdornment,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import TodayIcon from '@mui/icons-material/Today';
import FilterListIcon from '@mui/icons-material/FilterList';
import type { Reservation } from '../domain/entities/Reservation';
import type { ReservationDraft } from '../application/models/ReservationDraft';
import { ReservationWorkspaceCoordinator } from '../application/coordinator/ReservationWorkspaceCoordinator';
import { ReservationSummary } from '../components/ReservationSummary';
import { ReservationCard } from '../components/ReservationCard';
import { CreateReservationModal } from '../components/CreateReservationModal';
import { ReservationDetailModal } from '../components/ReservationDetailModal';
import { CancelReservationModal } from '../components/CancelReservationModal';

// Admission Imports (CR-2.4)
import { AdmissionWorkspaceModal, AdmissionSuccessModal, AdmissionCoordinator } from '../../admission';
import type { AdmissionResult } from '../../admission';

export const ReservationWorkspace: React.FC = () => {
  const [coordinator] = useState(() => new ReservationWorkspaceCoordinator());
  const [admissionCoordinator] = useState(() => new AdmissionCoordinator());

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [isAdmissionSuccessModalOpen, setIsAdmissionSuccessModalOpen] = useState(false);

  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [reservationToEdit, setReservationToEdit] = useState<Reservation | null>(null);
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [reservationToConvert, setReservationToConvert] = useState<Reservation | null>(null);
  const [admissionResult, setAdmissionResult] = useState<AdmissionResult | null>(null);

  // Workspace View Model state
  const [viewModel, setViewModel] = useState(() => coordinator.loadWorkspace(searchQuery, statusFilter));

  useEffect(() => {
    setViewModel(coordinator.loadWorkspace(searchQuery, statusFilter));
  }, [coordinator, searchQuery, statusFilter]);

  const handleRefresh = () => {
    setViewModel(coordinator.loadWorkspace(searchQuery, statusFilter));
  };

  const handleOpenCreateModal = () => {
    setReservationToEdit(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (reservation: Reservation) => {
    setReservationToEdit(reservation);
    setIsCreateModalOpen(true);
  };

  const handleOpenDetailModal = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDetailModalOpen(true);
  };

  const handleOpenCancelModal = (reservation: Reservation) => {
    setReservationToCancel(reservation);
    setIsCancelModalOpen(true);
  };

  const handleOpenAdmissionModal = (reservation: Reservation) => {
    setReservationToConvert(reservation);
    setIsAdmissionModalOpen(true);
  };

  const handleSaveReservation = (draft: ReservationDraft, editingReservation?: Reservation) => {
    coordinator.saveReservation(draft, editingReservation);
    handleRefresh();
  };

  const handleConfirmCancel = (id: string, reason?: string) => {
    coordinator.cancelReservation(id, reason);
    handleRefresh();
  };

  const handleAdmissionConfirmed = (result: AdmissionResult) => {
    setAdmissionResult(result);
    setIsAdmissionSuccessModalOpen(true);
    handleRefresh();
  };

  const handleCheckDuplicate = (mobileNumber: string) => {
    return coordinator.checkDuplicateMobile(mobileNumber);
  };

  const handleOpenExisting = (existingReservation: Reservation) => {
    setSelectedReservation(existingReservation);
    setIsDetailModalOpen(true);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Reservation Workspace
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage prospect pipeline, expected joining dates, and convert active reservations to admission.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateModal}
          sx={{
            fontWeight: 700,
            px: 3,
            py: 1.2,
            borderRadius: 2.5,
            boxShadow: '0 4px 14px 0 rgba(2, 132, 199, 0.39)',
            textTransform: 'none',
          }}
        >
          + New Reservation
        </Button>
      </Box>

      {/* Summary Cards */}
      <ReservationSummary
        stats={viewModel.stats}
        selectedFilter={statusFilter}
        onFilterSelect={(filter) => setStatusFilter(filter)}
      />

      {/* Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '5fr 4fr 3fr' },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            placeholder="Search by RESV #, Name, Mobile..."
            fullWidth
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            select
            fullWidth
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterListIcon fontSize="small" sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              },
            }}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="ACTIVE">Active</MenuItem>
            <MenuItem value="FOLLOW_UP_REQUIRED">Follow-up Required</MenuItem>
            <MenuItem value="CONVERTED">Converted</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </TextField>

          <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Chip
              icon={<TodayIcon />}
              label="Arriving Today Quick Filter"
              variant={statusFilter === 'TODAY' ? 'filled' : 'outlined'}
              color={statusFilter === 'TODAY' ? 'success' : 'default'}
              onClick={() => setStatusFilter(statusFilter === 'TODAY' ? 'ALL' : 'TODAY')}
              sx={{ fontWeight: 700, cursor: 'pointer', py: 2 }}
            />
          </Box>
        </Box>
      </Paper>

      {/* Reservation Card Grid */}
      {viewModel.filteredReservations.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px border-dashed #cbd5e1' }}>
          <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            No reservations found
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Try adjusting your search query or status filter, or create a new reservation.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {viewModel.filteredReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onEdit={handleOpenEditModal}
              onOpen={handleOpenDetailModal}
              onCancelRequest={handleOpenCancelModal}
              onConvertAdmission={handleOpenAdmissionModal}
            />
          ))}
        </Box>
      )}

      {/* Modals & Drawers */}
      <CreateReservationModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveReservation}
        onCheckDuplicate={handleCheckDuplicate}
        onOpenExisting={handleOpenExisting}
        reservationToEdit={reservationToEdit}
      />

      <ReservationDetailModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        reservation={selectedReservation}
        onEdit={handleOpenEditModal}
        onCancelRequest={handleOpenCancelModal}
        onConvertAdmission={handleOpenAdmissionModal}
      />

      <CancelReservationModal
        open={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        reservation={reservationToCancel}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* CR-2.4 Admission Modals */}
      <AdmissionWorkspaceModal
        open={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        reservation={reservationToConvert}
        onAdmissionConfirmed={handleAdmissionConfirmed}
        coordinator={admissionCoordinator}
      />

      <AdmissionSuccessModal
        open={isAdmissionSuccessModalOpen}
        onClose={() => setIsAdmissionSuccessModalOpen(false)}
        result={admissionResult}
      />
    </Box>
  );
};
