import { useState } from 'react';

import { Add, Apartment } from '@mui/icons-material';
import { Alert, Button, Container, Snackbar, Stack } from '@mui/material';

import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { AccommodationSummary } from './components/AccommodationSummary';
import { AccommodationToolbar } from './components/AccommodationToolbar';
import { AddFlatDialog, type FlatDraft } from './components/AddFlatDialog';
import { FlatCard } from './components/FlatCard';
import { BedStatus } from './types';
import type { Flat } from './types';

export default function AccommodationPage() {
  const [flats, setFlats] = useState<Flat[]>([]);
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
    setFlats((prev) => [...prev, flat]);
  };

  const handleCreateFlat = (draft: FlatDraft) => {
    // Transform FlatDraft to Flat
    const newFlat: Flat = {
      id: draft.flatNumber,
      name: draft.flatNumber,
      areas: draft.areas.map((area) => ({
        id: `${draft.flatNumber}-${area.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: area.name,
        beds: area.beds.map((bedId) => ({
          id: `${draft.flatNumber}-${bedId}`,
          name: bedId,
          status: BedStatus.VACANT,
        })),
      })),
    };

    addFlat(newFlat);
    setSnackbar({
      open: true,
      message: `Flat ${draft.flatNumber} created successfully with ${draft.capacity} beds.`,
      severity: 'success',
    });
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
    setIsAddDialogOpen(true);
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
            <FlatCard key={flat.id} flat={flat} />
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
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleCreateFlat}
        existingFlatNumbers={flats.map((f) => f.name)}
      />

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
