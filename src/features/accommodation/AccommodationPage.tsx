import { useState } from 'react';

import { Add, Apartment } from '@mui/icons-material';
import { Button, Container, Stack } from '@mui/material';

import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { AccommodationSummary } from './components/AccommodationSummary';
import { AccommodationToolbar } from './components/AccommodationToolbar';
import { FlatCard } from './components/FlatCard';
import { mockFlats } from './mock/accommodationData';
import { BedStatus } from './types';

export default function AccommodationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Derive summary metrics dynamically from mock data
  const totalFlats = mockFlats.length;
  let totalBeds = 0;
  let vacantBeds = 0;
  let occupiedBeds = 0;
  let onNoticeBeds = 0;

  mockFlats.forEach((flat) => {
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
    console.log('Add Flat clicked');
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

      <AccommodationSummary stats={stats} />

      <AccommodationToolbar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
      />

      {mockFlats.length === 0 ? (
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
          {mockFlats.map((flat) => (
            <FlatCard key={flat.id} flat={flat} />
          ))}
        </Stack>
      )}
    </Container>
  );
}
