import { FilterAlt, Refresh, Search } from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { MaintenancePersonnel } from '../domain/entities/MaintenancePersonnel';
import type { MaintenanceSearchFilters } from '../domain/types/MaintenanceTypes';

interface Props {
  filters: MaintenanceSearchFilters;
  personnelList: readonly MaintenancePersonnel[];
  onFilterChange: (updated: Partial<MaintenanceSearchFilters>) => void;
  onResetFilters: () => void;
}

export function MaintenanceToolbar({
  filters,
  personnelList,
  onFilterChange,
  onResetFilters,
}: Props) {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', md: 'center' } }}
      >
        <TextField
          placeholder="Search ticket #, title, description, notes..."
          value={filters.searchQuery || ''}
          onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
          size="small"
          sx={{ minWidth: 300, flexGrow: 1 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || 'ALL'}
            label="Status"
            onChange={(e) => onFilterChange({ status: e.target.value as any })}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending (Open + In Progress)</MenuItem>
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
            <MenuItem value="RESOLVED">Resolved</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filters.priority || 'ALL'}
            label="Priority"
            onChange={(e) => onFilterChange({ priority: e.target.value as any })}
          >
            <MenuItem value="ALL">All Priorities</MenuItem>
            <MenuItem value="URGENT">Urgent</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.category || 'ALL'}
            label="Category"
            onChange={(e) => onFilterChange({ category: e.target.value as any })}
          >
            <MenuItem value="ALL">All Categories</MenuItem>
            <MenuItem value="PLUMBING">Plumbing</MenuItem>
            <MenuItem value="ELECTRICAL">Electrical</MenuItem>
            <MenuItem value="CARPENTRY">Carpentry</MenuItem>
            <MenuItem value="APPLIANCE">Appliance</MenuItem>
            <MenuItem value="CIVIL_CLEANING">Civil & Cleaning</MenuItem>
            <MenuItem value="OTHER">Other</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Assigned Technician</InputLabel>
          <Select
            value={filters.assignedToId || 'ALL'}
            label="Assigned Technician"
            onChange={(e) => onFilterChange({ assignedToId: e.target.value })}
          >
            <MenuItem value="ALL">All Personnel</MenuItem>
            {personnelList.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name} ({p.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          bgcolor: 'action.hover',
          p: 1.5,
          borderRadius: 1.5,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <FilterAlt fontSize="small" color="action" />
          <InputLabel sx={{ fontSize: '0.85rem' }}>Advanced Filters:</InputLabel>
        </Stack>

        <TextField
          label="Logged From"
          type="date"
          size="small"
          value={filters.dateLoggedFrom || ''}
          onChange={(e) => onFilterChange({ dateLoggedFrom: e.target.value || undefined })}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 140 }}
        />

        <TextField
          label="Logged To"
          type="date"
          size="small"
          value={filters.dateLoggedTo || ''}
          onChange={(e) => onFilterChange({ dateLoggedTo: e.target.value || undefined })}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 140 }}
        />

        <TextField
          label="Min Estimate (₹)"
          type="number"
          size="small"
          value={filters.estimateFrom ?? ''}
          onChange={(e) =>
            onFilterChange({
              estimateFrom: e.target.value !== '' ? Number(e.target.value) : undefined,
            })
          }
          sx={{ width: 130 }}
        />

        <TextField
          label="Max Estimate (₹)"
          type="number"
          size="small"
          value={filters.estimateTo ?? ''}
          onChange={(e) =>
            onFilterChange({
              estimateTo: e.target.value !== '' ? Number(e.target.value) : undefined,
            })
          }
          sx={{ width: 130 }}
        />

        <TextField
          label="Min Actual Cost (₹)"
          type="number"
          size="small"
          value={filters.actualCostFrom ?? ''}
          onChange={(e) =>
            onFilterChange({
              actualCostFrom: e.target.value !== '' ? Number(e.target.value) : undefined,
            })
          }
          sx={{ width: 140 }}
        />

        <TextField
          label="Max Actual Cost (₹)"
          type="number"
          size="small"
          value={filters.actualCostTo ?? ''}
          onChange={(e) =>
            onFilterChange({
              actualCostTo: e.target.value !== '' ? Number(e.target.value) : undefined,
            })
          }
          sx={{ width: 140 }}
        />

        <Button
          size="small"
          variant="outlined"
          startIcon={<Refresh />}
          onClick={onResetFilters}
          sx={{ ml: 'auto' }}
        >
          Reset Filters
        </Button>
      </Box>
    </Stack>
  );
}
