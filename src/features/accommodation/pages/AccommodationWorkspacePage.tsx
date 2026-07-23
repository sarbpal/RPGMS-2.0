import { useState } from 'react';

import { Add, Apartment } from '@mui/icons-material';
import { Alert, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Stack, Typography } from '@mui/material';

import { EmptyState } from '../../../components/EmptyState';
import { PageHeader } from '../../../components/PageHeader';
import { AccommodationSummary } from '../components/AccommodationSummary';
import { AccommodationToolbar } from '../components/AccommodationToolbar';
import { AddFlatDialog, type FlatDraft } from '../components/AddFlatDialog';
import { FlatCard } from '../components/FlatCard';
import { BedStatus } from '../types';
import type { Flat } from '../types';
import type { Resident } from '../../residents/types';
import { ResidentStatus } from '../../residents';

export default function AccommodationWorkspacePage() {
  const [flats, setFlats] = useState<Flat[]>(() => {
    const savedFlats = localStorage.getItem('rpgms_flats');
    const savedResidents = localStorage.getItem('rpgms_residents');
    
    const initialFlats: Flat[] = savedFlats ? JSON.parse(savedFlats) : [];
    const residents = savedResidents ? JSON.parse(savedResidents) : [];
    
    if (initialFlats.length === 0) return [];
    
    // Create a map of bedId -> Resident for self-healing status synchronization
    const residentBedMap = new Map();
    residents.forEach((res: Resident) => {
      const isOccupying = res.status === ResidentStatus.ACTIVE || res.status === ResidentStatus.ON_NOTICE;
      if (isOccupying && res.allocatedBedIds) {
        res.allocatedBedIds.forEach((bedId: string) => {
          residentBedMap.set(bedId, res);
        });
      }
    });

    let hasUpdates = false;

    const synchronizedFlats = initialFlats.map((flat) => {
      const updatedAreas = flat.areas.map((area) => {
        const expectedAreaRent = area.defaultRent || 0;
        const expectedAreaDeposit = area.defaultDeposit || 0;

        const updatedBeds = area.beds.map((bed) => {
          const resident = residentBedMap.get(bed.id);
          let expectedStatus: BedStatus;
          let expectedResidentName: string | undefined;
          const expectedBedRent = bed.defaultRent !== undefined ? bed.defaultRent : expectedAreaRent;
          const expectedBedDeposit = bed.defaultDeposit !== undefined ? bed.defaultDeposit : expectedAreaDeposit;

          if (resident) {
            expectedStatus = resident.status === ResidentStatus.ON_NOTICE ? BedStatus.ON_NOTICE : BedStatus.OCCUPIED;
            expectedResidentName = resident.fullName;
          } else {
            expectedResidentName = undefined;
            // Keep status if not occupied or on notice (e.g. maintenance, blocked, reserved)
            if (bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.ON_NOTICE) {
              expectedStatus = BedStatus.VACANT;
            } else {
              expectedStatus = bed.status;
            }
          }

          if (
            bed.status !== expectedStatus ||
            bed.residentName !== expectedResidentName ||
            bed.defaultRent !== expectedBedRent ||
            bed.defaultDeposit !== expectedBedDeposit
          ) {
            hasUpdates = true;
            return {
              ...bed,
              status: expectedStatus,
              residentName: expectedResidentName,
              defaultRent: expectedBedRent,
              defaultDeposit: expectedBedDeposit,
            };
          }
          return bed;
        });

        if (
          area.defaultRent !== expectedAreaRent ||
          area.defaultDeposit !== expectedAreaDeposit ||
          updatedBeds !== area.beds
        ) {
          hasUpdates = true;
          return {
            ...area,
            defaultRent: expectedAreaRent,
            defaultDeposit: expectedAreaDeposit,
            beds: updatedBeds,
          };
        }

        return area;
      });

      return { ...flat, areas: updatedAreas };
    });

    if (hasUpdates) {
      localStorage.setItem('rpgms_flats', JSON.stringify(synchronizedFlats));
      return synchronizedFlats;
    }

    return initialFlats;
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
        area.beds.some((bed) => {
          if (statusFilter === BedStatus.OCCUPIED) {
            return bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.ON_NOTICE;
          }
          return bed.status === statusFilter;
        })
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
