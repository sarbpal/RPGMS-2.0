import { useMemo, useState } from 'react';

import { Add, Apartment } from '@mui/icons-material';
import { Alert, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Stack, Typography } from '@mui/material';

import { EmptyState } from '../../../components/EmptyState';
import { PageHeader } from '../../../components/PageHeader';
import { AccommodationWorkspaceCoordinator } from '../application/coordinator/AccommodationWorkspaceCoordinator';
import { AccommodationSummary } from '../components/AccommodationSummary';
import { AccommodationToolbar } from '../components/AccommodationToolbar';
import { AddFlatDialog, type FlatDraft } from '../components/AddFlatDialog';
import { FlatCard } from '../components/FlatCard';
import { BedStatus } from '../domain';
import type { Flat } from '../domain';

export default function AccommodationWorkspacePage() {
  const coordinator = useMemo(() => new AccommodationWorkspaceCoordinator(), []);

  const [flats, setFlats] = useState<Flat[]>(() => {
    return coordinator.loadAndSynchronizeFlats();
  });

  const [flatToEdit, setFlatToEdit] = useState<Flat | undefined>(undefined);
  const [flatToDelete, setFlatToDelete] = useState<Flat | undefined>(undefined);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
    // Transform FlatDraft to Flat
    const newFlat: Flat = {
      id: draft.flatNumber,
      name: draft.flatNumber,
      floor: draft.floor,
      description: draft.description,
      areas: draft.areas.map((area) => ({
        id: `${draft.flatNumber}-${area.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: area.name,
        bedPrefix: area.bedPrefix,
        defaultRent: area.defaultRent,
        defaultDeposit: area.defaultDeposit,
        beds: area.beds.map((bedId) => {
          const fullBedId = `${draft.flatNumber}-${bedId}`;
          let existingBedStatus: BedStatus = BedStatus.VACANT;
          let existingResidentName: string | undefined = undefined;

          if (flatToEdit) {
            const foundBed = flatToEdit.areas
              .flatMap((a) => a.beds)
              .find((b) => b.id === fullBedId);
            if (foundBed) {
              existingBedStatus = foundBed.status;
              existingResidentName = foundBed.residentName;
            }
          }

          return {
            id: fullBedId,
            name: bedId,
            status: existingBedStatus,
            residentName: existingResidentName,
            defaultRent: area.defaultRent,
            defaultDeposit: area.defaultDeposit,
          };
        }),
      })),
    };

    coordinator.saveFlat(newFlat);

    if (flatToEdit) {
      setFlats((prev) => prev.map((f) => (f.id === flatToEdit.id ? newFlat : f)));
      setSnackbar({
        open: true,
        message: `Flat ${draft.flatNumber} updated successfully.`,
        severity: 'success',
      });
    } else {
      setFlats((prev) => [...prev, newFlat]);
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
    const hasOccupiedBeds = flat.areas.some((area) =>
      area.beds.some(
        (bed) =>
          bed.status === BedStatus.OCCUPIED ||
          bed.status === BedStatus.ON_NOTICE ||
          !!bed.residentName
      )
    );

    if (hasOccupiedBeds) {
      setSnackbar({
        open: true,
        message: `Cannot delete Flat ${flat.name} because it contains occupied beds. Please check out or reassign residents first.`,
        severity: 'error',
      });
      return;
    }

    setFlatToDelete(flat);
    setIsDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = () => {
    if (flatToDelete) {
      const hasOccupiedBeds = flatToDelete.areas.some((area) =>
        area.beds.some(
          (bed) =>
            bed.status === BedStatus.OCCUPIED ||
            bed.status === BedStatus.ON_NOTICE ||
            !!bed.residentName
        )
      );

      if (hasOccupiedBeds) {
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
              onEdit={() => handleEditFlatClick(flat)}
              onDelete={() => handleDeleteFlatClick(flat)}
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
