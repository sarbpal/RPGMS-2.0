import { useEffect, useMemo, useState } from 'react';

import { Add, Apartment } from '@mui/icons-material';
import { Alert, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Stack, Typography } from '@mui/material';

import { EmptyState } from '../../../components/EmptyState';
import { PageHeader } from '../../../components/PageHeader';
import { AccommodationSummary } from '../components/AccommodationSummary';
import { AccommodationToolbar } from '../components/AccommodationToolbar';
import { AddFlatDialog, type FlatDraft } from '../components/AddFlatDialog';
import { BedDetailsDialog } from '../components/BedDetailsDialog';
import { FlatCard } from '../components/FlatCard';
import type { Bed, Flat } from '../domain';
import { stayWorkflowComposition } from '../../../app/composition/stayWorkflowComposition';
import { MaintenanceWorkspaceCoordinator, RegisterMaintenanceModal } from '../../maintenance';
import type { MaintenancePersonnel } from '../../maintenance';

export default function AccommodationWorkspacePage() {
  const coordinator = useMemo(() => stayWorkflowComposition.accommodationWorkspaceCoordinator, []);

  const [flats, setFlats] = useState<Flat[]>(() => {
    return coordinator.loadAndSynchronizeFlats();
  });

  const [flatToEdit, setFlatToEdit] = useState<Flat | undefined>(undefined);
  const [flatToDelete, setFlatToDelete] = useState<Flat | undefined>(undefined);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<{
    bed: Bed;
    flatId: string;
    flatName: string;
    areaName: string;
  } | null>(null);
  const maintenanceCoordinator = useMemo(() => new MaintenanceWorkspaceCoordinator(), []);
  const [maintenancePersonnel, setMaintenancePersonnel] = useState<readonly MaintenancePersonnel[]>([]);
  const [maintenanceFlatId, setMaintenanceFlatId] = useState<string | null>(null);

  useEffect(() => {
    maintenanceCoordinator.createViewModel().then((vm) => {
      setMaintenancePersonnel(vm.personnelList);
    });
  }, [maintenanceCoordinator]);

  const handleFlatMaintenanceClick = (flat: Flat) => {
    setMaintenanceFlatId(flat.id);
  };

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const viewModel = useMemo(
    () => coordinator.createViewModel(flats, searchQuery, statusFilter),
    [coordinator, flats, searchQuery, statusFilter]
  );

  const handleSaveFlat = (draft: FlatDraft) => {
    const savedFlat = coordinator.saveFlatDraft(draft, flatToEdit);

    if (flatToEdit) {
      setFlats((prev) => prev.map((f) => (f.id === flatToEdit.id ? savedFlat : f)));
      setSnackbar({
        open: true,
        message: `Flat ${draft.flatNumber} updated successfully.`,
        severity: 'success',
      });
    } else {
      setFlats((prev) => [...prev, savedFlat]);
      setSnackbar({
        open: true,
        message: `Flat ${draft.flatNumber} created successfully with ${draft.capacity} beds.`,
        severity: 'success',
      });
    }

    setFlatToEdit(undefined);
  };

  const handleAddFlatClick = () => {
    setFlatToEdit(undefined);
    setIsAddDialogOpen(true);
  };

  const handleEditFlatClick = (flat: Flat) => {
    setFlatToEdit(flat);
    setIsAddDialogOpen(true);
  };

  const handleDeleteFlatClick = (flat: Flat) => {
    const { canDelete, occupiedBeds } = coordinator.canDeleteFlat(flat);
    if (!canDelete) {
      const bedNames = occupiedBeds.map((b) => b.name).join(', ');
      setSnackbar({
        open: true,
        message: `Cannot delete Flat ${flat.name} because it contains occupied beds (${bedNames}). Check out residents first.`,
        severity: 'error',
      });
      return;
    }

    setFlatToDelete(flat);
    setIsDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = () => {
    if (flatToDelete) {
      const { canDelete } = coordinator.canDeleteFlat(flatToDelete);

      if (!canDelete) {
        setSnackbar({
          open: true,
          message: `Cannot delete Flat ${flatToDelete.name} because it contains occupied beds.`,
          severity: 'error',
        });
        setIsDeleteConfirmationOpen(false);
        setFlatToDelete(undefined);
        return;
      }

      coordinator.deleteFlat(flatToDelete.id);
      setFlats((prev) => prev.filter((f) => f.id !== flatToDelete.id));

      setSnackbar({
        open: true,
        message: `Flat ${flatToDelete.name} deleted successfully.`,
        severity: 'success',
      });
    }
    setIsDeleteConfirmationOpen(false);
    setFlatToDelete(undefined);
  };

  const handleBedClick = (flatId: string, flatName: string, areaName: string, bed: Bed) => {
    setSelectedBed({ bed, flatId, flatName, areaName });
  };

  const handleBlockBed = (flatId: string, bedId: string) => {
    try {
      const updatedFlat = coordinator.blockBed(flatId, bedId);
      setFlats((prev) => prev.map((f) => (f.id === flatId ? updatedFlat : f)));
      setSnackbar({ open: true, message: `Bed ${bedId} has been blocked.`, severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to block bed.', severity: 'error' });
    }
  };

  const handleUnblockBed = (flatId: string, bedId: string) => {
    try {
      const updatedFlat = coordinator.unblockBed(flatId, bedId);
      setFlats((prev) => prev.map((f) => (f.id === flatId ? updatedFlat : f)));
      setSnackbar({ open: true, message: `Bed ${bedId} has been unblocked.`, severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to unblock bed.', severity: 'error' });
    }
  };

  const handleStartMaintenance = (flatId: string, bedId: string) => {
    try {
      const updatedFlat = coordinator.startBedMaintenance(flatId, bedId);
      setFlats((prev) => prev.map((f) => (f.id === flatId ? updatedFlat : f)));
      setSnackbar({ open: true, message: `Bed ${bedId} placed into maintenance.`, severity: 'warning' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to start maintenance.', severity: 'error' });
    }
  };

  const handleCompleteMaintenance = (flatId: string, bedId: string) => {
    try {
      const updatedFlat = coordinator.completeBedMaintenance(flatId, bedId);
      setFlats((prev) => prev.map((f) => (f.id === flatId ? updatedFlat : f)));
      setSnackbar({ open: true, message: `Maintenance on Bed ${bedId} completed. Released to vacant.`, severity: 'success' });
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to complete maintenance.', severity: 'error' });
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <PageHeader
        action={
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={handleAddFlatClick}
          >
            Add Flat
          </Button>
        }
        subtitle="Manage flats, beds, and occupancy."
        title="Accommodation"
      />

      <AccommodationSummary
        stats={viewModel.stats}
        onCardClick={(key) => {
          if (key === 'VACANT' || key === 'OCCUPIED' || key === 'ON_NOTICE') {
            setStatusFilter(key);
          } else {
            setStatusFilter('ALL');
          }
        }}
      />

      <AccommodationToolbar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
      />

      {viewModel.flats.length === 0 ? (
        <EmptyState
          action={
            <Button
              startIcon={<Add />}
              variant="outlined"
              onClick={handleAddFlatClick}
            >
              Add First Flat
            </Button>
          }
          description="Get started by adding a new flat to set up logical areas and bed spaces."
          icon={<Apartment />}
          title="No Accommodation Units Found"
        />
      ) : (
        <Stack spacing={4}>
          {viewModel.filteredFlats.map((flat) => (
            <FlatCard
              key={flat.id}
              flat={flat}
              statusFilter={statusFilter}
              onMaintenanceClick={() => handleFlatMaintenanceClick(flat)}
              onEdit={() => handleEditFlatClick(flat)}
              onDelete={() => handleDeleteFlatClick(flat)}
              onBedClick={handleBedClick}
            />
          ))}
          {viewModel.filteredFlats.length === 0 && (
            <EmptyState
              title="No Matching Flats Found"
              description="Try adjusting your search query or bed status filter."
              icon={<Apartment />}
            />
          )}
        </Stack>
      )}

      <AddFlatDialog
        key={isAddDialogOpen ? (flatToEdit ? `edit-${flatToEdit.id}` : 'new-flat') : 'closed'}
        open={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false);
          setFlatToEdit(undefined);
        }}
        onSubmit={handleSaveFlat}
        existingFlatNumbers={flats.map((f) => f.name)}
        flatToEdit={flatToEdit}
      />

      <BedDetailsDialog
        open={Boolean(selectedBed)}
        bed={selectedBed?.bed || null}
        flatId={selectedBed?.flatId}
        flatName={selectedBed?.flatName}
        areaName={selectedBed?.areaName}
        onClose={() => setSelectedBed(null)}
        onBlockBed={handleBlockBed}
        onUnblockBed={handleUnblockBed}
        onStartMaintenance={handleStartMaintenance}
        onCompleteMaintenance={handleCompleteMaintenance}
      />

      <RegisterMaintenanceModal
        isOpen={Boolean(maintenanceFlatId)}
        onClose={() => setMaintenanceFlatId(null)}
        personnelList={maintenancePersonnel}
        initialContext={{ flatId: maintenanceFlatId ?? undefined }}
        onSubmit={async (dto) => {
          await maintenanceCoordinator.registerRequest(dto);
          setMaintenanceFlatId(null);
          setSnackbar({
            open: true,
            message: 'Maintenance request logged successfully.',
            severity: 'success',
          });
        }}
      />

      <Dialog
        open={isDeleteConfirmationOpen}
        onClose={() => {
          setIsDeleteConfirmationOpen(false);
          setFlatToDelete(undefined);
        }}
        aria-labelledby="delete-flat-dialog-title"
      >
        <DialogTitle id="delete-flat-dialog-title">
          Delete Flat {flatToDelete?.name}?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setIsDeleteConfirmationOpen(false);
              setFlatToDelete(undefined);
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            color="error"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
