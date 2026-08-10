import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Add, Assessment, ListAlt, People } from '@mui/icons-material';
import {
  Box,
  Button,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';

import { MaintenanceWorkspaceCoordinator } from './application/coordinator/MaintenanceWorkspaceCoordinator';
import type {
  MaintenanceRequestItemViewModel,
  MaintenanceWorkspaceViewModel,
} from './application/models/MaintenanceWorkspaceViewModel';
import type { MaintenanceSearchFilters } from './domain/types/MaintenanceTypes';

import { MaintenanceSummaryCards } from './components/MaintenanceSummaryCards';
import { MaintenanceToolbar } from './components/MaintenanceToolbar';
import { MaintenanceTable } from './components/MaintenanceTable';
import { MaintenanceAnalyticsPanel } from './components/MaintenanceAnalyticsPanel';
import { RegisterMaintenanceModal } from './components/RegisterMaintenanceModal';
import { UpdateStatusModal } from './components/UpdateStatusModal';
import { ManagePersonnelModal } from './components/ManagePersonnelModal';
import { TicketDetailModal } from './components/TicketDetailModal';

export default function MaintenancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'OPERATIONAL' | 'ANALYTICS'>('OPERATIONAL');

  const coordinator = useMemo(() => new MaintenanceWorkspaceCoordinator(), []);
  const [viewModel, setViewModel] = useState<MaintenanceWorkspaceViewModel | null>(null);

  // Search Filters state derived from URL params
  const filters: MaintenanceSearchFilters = useMemo(
    () => ({
      ticketNumber: searchParams.get('ticketNumber') || undefined,
      status: (searchParams.get('status') as any) || 'ALL',
      priority: (searchParams.get('priority') as any) || 'ALL',
      category: (searchParams.get('category') as any) || 'ALL',
      assignedToId: searchParams.get('assignedToId') || 'ALL',
      flatId: searchParams.get('flatId') || undefined,
      areaId: searchParams.get('areaId') || undefined,
      bedId: searchParams.get('bedId') || undefined,
      stayId: searchParams.get('stayId') || undefined,
      reporterId: searchParams.get('reporterId') || undefined,
      dateLoggedFrom: searchParams.get('dateLoggedFrom') || undefined,
      dateLoggedTo: searchParams.get('dateLoggedTo') || undefined,
      actualCostFrom: searchParams.get('actualCostFrom')
        ? Number(searchParams.get('actualCostFrom'))
        : undefined,
      actualCostTo: searchParams.get('actualCostTo')
        ? Number(searchParams.get('actualCostTo'))
        : undefined,
      searchQuery: searchParams.get('searchQuery') || undefined,
    }),
    [searchParams]
  );

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isPersonnelOpen, setIsPersonnelOpen] = useState(false);
  const [selectedTicketForUpdate, setSelectedTicketForUpdate] =
    useState<MaintenanceRequestItemViewModel | null>(null);
  const [selectedTicketForView, setSelectedTicketForView] =
    useState<MaintenanceRequestItemViewModel | null>(null);

  const loadData = useCallback(async () => {
    const vm = await coordinator.createViewModel(filters);
    setViewModel(vm);
  }, [coordinator, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateFilters = (updated: Partial<MaintenanceSearchFilters>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updated).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'ALL') {
        newParams.set(key, String(val));
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handleDrillDown = (drillFilters: {
    category?: string;
    flatId?: string;
    assignedToId?: string;
    status?: string;
    period?: string;
  }) => {
    setActiveTab('OPERATIONAL');
    updateFilters({
      category: (drillFilters.category as any) || undefined,
      flatId: drillFilters.flatId,
      assignedToId: drillFilters.assignedToId,
      status: (drillFilters.status as any) || undefined,
    });
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 6 }}>
      {/* Header & Primary Actions */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          mb: 3,
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'center' },
        }}
      >
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Maintenance Workspace
          </Typography>
          <Typography color="text.secondary">
            Manage hostel maintenance requests, operational repairs, technician assignments, and cost analytics.
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<People />}
            onClick={() => setIsPersonnelOpen(true)}
          >
            Manage Personnel
          </Button>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setIsRegisterOpen(true)}
          >
            Log Maintenance Request
          </Button>
        </Stack>
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{ '& .MuiTab-root': { fontWeight: 600 } }}
        >
          <Tab
            icon={<ListAlt fontSize="small" />}
            iconPosition="start"
            label="Operational List"
            value="OPERATIONAL"
          />
          <Tab
            icon={<Assessment fontSize="small" />}
            iconPosition="start"
            label="Analytics & Period Reports"
            value="ANALYTICS"
          />
        </Tabs>
      </Box>

      {viewModel && (
        <>
          {activeTab === 'OPERATIONAL' ? (
            <Stack spacing={3}>
              <MaintenanceSummaryCards
                metrics={viewModel.metrics}
                activeStatusFilter={filters.status}
                activePriorityFilter={filters.priority}
                onCardClick={(status, priority) =>
                  updateFilters({
                    status: (status as any) || 'ALL',
                    priority: (priority as any) || 'ALL',
                  })
                }
              />

              <MaintenanceToolbar
                filters={filters}
                personnelList={viewModel.personnelList}
                onFilterChange={updateFilters}
                onResetFilters={handleResetFilters}
              />

              <MaintenanceTable
                requests={viewModel.requests}
                onViewTicket={(t) => setSelectedTicketForView(t)}
                onUpdateStatus={(t) => setSelectedTicketForUpdate(t)}
              />
            </Stack>
          ) : (
            <MaintenanceAnalyticsPanel
              analytics={viewModel.analytics}
              onDrillDown={handleDrillDown}
            />
          )}

          {/* Dialogs */}
          <RegisterMaintenanceModal
            isOpen={isRegisterOpen}
            onClose={() => setIsRegisterOpen(false)}
            personnelList={viewModel.personnelList}
            initialContext={{
              flatId: filters.flatId,
              areaId: filters.areaId,
              bedId: filters.bedId,
              stayId: filters.stayId,
              reporterId: filters.reporterId,
            }}
            onSubmit={async (dto) => {
              await coordinator.registerRequest(dto);
              loadData();
            }}
          />

          <UpdateStatusModal
            isOpen={Boolean(selectedTicketForUpdate)}
            onClose={() => setSelectedTicketForUpdate(null)}
            ticket={selectedTicketForUpdate || undefined}
            personnelList={viewModel.personnelList}
            onSubmit={async (data) => {
              if (selectedTicketForUpdate) {
                await coordinator.updateStatus({
                  requestId: selectedTicketForUpdate.id,
                  ...data,
                  actorId: 'operator-1',
                  actorName: 'Hostel Operator',
                });
                loadData();
              }
            }}
          />

          <ManagePersonnelModal
            isOpen={isPersonnelOpen}
            onClose={() => setIsPersonnelOpen(false)}
            personnelList={viewModel.personnelList}
            onCreatePersonnel={async (data) => {
              await coordinator.createPersonnel(data);
              loadData();
            }}
            onToggleStatus={async (id) => {
              await coordinator.togglePersonnelStatus(id);
              loadData();
            }}
          />

          <TicketDetailModal
            isOpen={Boolean(selectedTicketForView)}
            onClose={() => setSelectedTicketForView(null)}
            ticket={selectedTicketForView || undefined}
            onUpdateStatus={(t) => {
              setSelectedTicketForView(null);
              setSelectedTicketForUpdate(t);
            }}
          />
        </>
      )}
    </Container>
  );
}
