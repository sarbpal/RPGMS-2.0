import { useState } from 'react';
import { Add } from '@mui/icons-material';
import { Alert, Button, Container, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '../../components/PageHeader';
import type { Flat } from '../accommodation/types';
import { BedStatus } from '../accommodation/types';
import { ResidentDialog } from './components/ResidentDialog';
import { ResidentsTable } from './components/ResidentsTable';
import { ResidentsToolbar } from './components/ResidentsToolbar';
import type { Resident } from './types';
import { ResidentStatus } from './types';

export default function ResidentsPage() {
  const navigate = useNavigate();

  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('rpgms_residents');
    return saved ? JSON.parse(saved) : [];
  });

  const [flats, setFlats] = useState<Flat[]>(() => {
    const saved = localStorage.getItem('rpgms_flats');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [residentToEdit, setResidentToEdit] = useState<Resident | undefined>(undefined);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const hasVacantBeds = flats.some((flat) =>
    flat.areas.flatMap((a) => a.beds).some((bed) => bed.status === BedStatus.VACANT)
  );

  const handleAddResidentClick = () => {
    setResidentToEdit(undefined);
    setIsDialogOpen(true);
  };

  const handleEditResidentClick = (resident: Resident) => {
    setResidentToEdit(resident);
    setIsDialogOpen(true);
  };

  const handleSaveResident = (data: Omit<Resident, 'id'> & { id?: string }) => {
    const residentId = data.personalInfo.residentId;
    const isOccupying = data.status === 'Active' || data.status === 'On Notice';
    const assignedBeds = isOccupying ? data.assignedBedIds : [];

    const newResident: Resident = {
      id: residentId,
      personalInfo: data.personalInfo,
      emergencyContact: data.emergencyContact,
      flatId: isOccupying ? data.flatId : '',
      assignedBedIds: assignedBeds,
      joiningDate: data.joiningDate,
      status: data.status,
    };

    // 1. Update flats state
    setFlats((prevFlats) => {
      const updatedFlats = prevFlats.map((flat) => {
        const updatedAreas = flat.areas.map((area) => {
          const updatedBeds = area.beds.map((bed) => {
            let nextStatus = bed.status;
            let nextResidentName = bed.residentName;

            // Reset old beds occupied by this resident
            if (residentToEdit && residentToEdit.assignedBedIds.includes(bed.id)) {
              nextStatus = BedStatus.VACANT;
              nextResidentName = undefined;
            }

            // Assign new beds
            if (newResident.assignedBedIds.includes(bed.id)) {
              nextStatus = newResident.status === ResidentStatus.ON_NOTICE ? BedStatus.ON_NOTICE : BedStatus.OCCUPIED;
              nextResidentName = newResident.personalInfo.fullName;
            }

            return {
              ...bed,
              status: nextStatus,
              residentName: nextResidentName,
            };
          });

          return { ...area, beds: updatedBeds };
        });

        return { ...flat, areas: updatedAreas };
      });

      localStorage.setItem('rpgms_flats', JSON.stringify(updatedFlats));
      return updatedFlats;
    });

    // 2. Update residents state
    setResidents((prevResidents) => {
      let updatedResidents;
      if (residentToEdit) {
        updatedResidents = prevResidents.map((r) =>
          r.id === residentToEdit.id ? newResident : r
        );
        setSnackbar({
          open: true,
          message: `Resident ${newResident.personalInfo.fullName} updated successfully.`,
          severity: 'success',
        });
      } else {
        updatedResidents = [...prevResidents, newResident];
        setSnackbar({
          open: true,
          message: `Resident ${newResident.personalInfo.fullName} registered successfully.`,
          severity: 'success',
        });
      }

      localStorage.setItem('rpgms_residents', JSON.stringify(updatedResidents));
      return updatedResidents;
    });

    setResidentToEdit(undefined);
  };

  const handleRowClick = (id: string) => {
    navigate(`/residents/${id}`);
  };

  // Filter residents
  const filteredResidents = residents.filter((resident) => {
    // 1. Status Filter
    const matchesStatus = statusFilter === 'ALL' || resident.status === statusFilter;

    // 2. Search Query
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      resident.personalInfo.residentId.toLowerCase().includes(query) ||
      resident.personalInfo.fullName.toLowerCase().includes(query) ||
      resident.personalInfo.mobileNumber.toLowerCase().includes(query) ||
      resident.flatId.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <PageHeader
        action={
          <Button
            startIcon={<Add />}
            variant="contained"
            onClick={handleAddResidentClick}
            disabled={!hasVacantBeds && !residentToEdit}
          >
            Add Resident
          </Button>
        }
        subtitle="Manage resident profiles, emergency contacts, and bed assignments."
        title="Residents"
      />

      {!hasVacantBeds && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No vacant beds are currently available. Add capacity or check out a resident before adding a new resident.
        </Alert>
      )}

      <ResidentsToolbar
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
      />

      <ResidentsTable
        residents={filteredResidents}
        onEdit={handleEditResidentClick}
        onRowClick={handleRowClick}
      />

      <ResidentDialog
        key={isDialogOpen ? (residentToEdit ? `edit-${residentToEdit.id}` : 'new-resident') : 'closed'}
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setResidentToEdit(undefined);
        }}
        onSubmit={handleSaveResident}
        flats={flats}
        existingResidents={residents}
        residentToEdit={residentToEdit}
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
