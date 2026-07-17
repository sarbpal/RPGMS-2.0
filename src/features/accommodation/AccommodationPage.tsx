import { useState } from 'react';

import { Add, Apartment } from '@mui/icons-material';
import { Alert, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Stack, Typography } from '@mui/material';

import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { AccommodationSummary } from './components/AccommodationSummary';
import { AccommodationToolbar } from './components/AccommodationToolbar';
import { AddFlatDialog, type FlatDraft } from './components/AddFlatDialog';
import { FlatCard } from './components/FlatCard';
import { BedStatus } from './types';
import type { Flat } from './types';

export default function AccommodationPage() {
  const [flats, setFlats] = useState<Flat[]>(() => {
    const saved = localStorage.getItem('rpgms_flats');
    return saved ? JSON.parse(saved) : [];
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

  const addFlat = (flat: Flat) => {
    setFlats((prev) => {
      const next = [...prev, flat];
      localStorage.setItem('rpgms_flats', JSON.stringify(next));
      return next;
    });
  };

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
          };
        }),
      })),
    };

    if (flatToEdit) {
      setFlats((prev) => {
        const next = prev.map((f) => (f.id === flatToEdit.id ? newFlat : f));
        localStorage.setItem('rpgms_flats', JSON.stringify(next));
        return next;
      });
      setSnackbar({
        open: true,
        message: `Flat ${draft.flatNumber} updated successfully.`,
        severity: 'success',
      });
    } else {
      addFlat(newFlat);
      setSnackbar({
        open: true,
        message: `Flat ${draft.flatNumber} created successfully with ${draft.capacity} beds.`,
        severity: 'success',
      });
    }

    setFlatToEdit(undefined);
  };

  // Derive summary metrics dynamically from state
  const totalFlats = flats.length;
  let totalBeds = 0;
  let vacantBeds = 0;
  let occupiedBeds = 0;
  let onNoticeBeds = 0;

  flats.forEach((flat) => {
    flat.areas.forEach((area) => {
      area.beds.forEach((bed) => {
        totalBeds++;
        if (bed.status === BedStatus.VACANT) {
          vacantBeds++;
        } else if (bed.status === BedStatus.OCCUPIED) {
          occupiedBeds++;
        } else if (bed.status === BedStatus.ON_NOTICE) {
          onNoticeBeds++;
        }
      });
    });
  });

  const stats = {
    totalFlats,
    totalBeds,
    vacantBeds,
    occupiedBeds,
    onNoticeBeds,
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
    setFlatToDelete(flat);
    setIsDeleteConfirmationOpen(true);
  };

  const handleConfirmDelete = () => {
    if (flatToDelete) {
      setFlats((prev) => {
        const next = prev.filter((f) => f.id !== flatToDelete.id);
        localStorage.setItem('rpgms_flats', JSON.stringify(next));
        return next;
      });
      setSnackbar({
        open: true,
        message: `Flat ${flatToDelete.name} deleted successfully.`,
        severity: 'success',
      });
    }
    setIsDeleteConfirmationOpen(false);
    setFlatToDelete(undefined);
  };

  // Filter flats dynamically
  const filteredFlats = flats.filter((flat) => {
    // 1. Status Filter: A flat matches if it has at least one bed matching the filter,
    // or if the filter is 'ALL'.
    const matchesStatus =
      statusFilter === 'ALL' ||
      flat.areas.some((area) =>
        area.beds.some((bed) => bed.status === statusFilter)
      );

    // 2. Search Query Filter: matches flat number/name, bed ID/name, or resident name.
    const matchesSearch =
      searchQuery.trim() === '' ||
      flat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flat.areas.some((area) =>
        area.beds.some(
          (bed) =>
            bed.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            bed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (bed.residentName &&
              bed.residentName.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      );

    return matchesStatus && matchesSearch;
  });

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
        stats={stats}
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

      {flats.length === 0 ? (
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
          {filteredFlats.map((flat) => (
            <FlatCard
              key={flat.id}
              flat={flat}
              onEdit={() => handleEditFlatClick(flat)}
              onDelete={() => handleDeleteFlatClick(flat)}
            />
          ))}
          {filteredFlats.length === 0 && (
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
