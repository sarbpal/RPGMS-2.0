import { useState } from 'react';

import { Apartment, Add } from '@mui/icons-material';
import { Button, Container } from '@mui/material';

import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { AccommodationSummary } from './components/AccommodationSummary';
import { AccommodationToolbar } from './components/AccommodationToolbar';

export default function AccommodationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Triggered when clicking "Add Flat" action
  const handleAddFlatClick = () => {
    // Dialog rendering is out of scope for Sprint 4.1
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

      <AccommodationSummary />

      <AccommodationToolbar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
      />

      <EmptyState
        description="Get started by adding a new flat to set up logical areas and bed spaces."
        icon={<Apartment />}
        title="No Accommodation Units Found"
        action={
          <Button
            startIcon={<Add />}
            variant="outlined"
            onClick={handleAddFlatClick}
          >
            Add First Flat
          </Button>
        }
      />
    </Container>
  );
}
