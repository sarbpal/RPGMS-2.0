import { Search } from '@mui/icons-material';
import {
  Box,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  type SelectChangeEvent,
} from '@mui/material';

import { ResidentStatus } from '../types';

interface ResidentsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function ResidentsToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: ResidentsToolbarProps) {
  const handleStatusChange = (event: SelectChangeEvent) => {
    onStatusFilterChange(event.target.value);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 4,
        alignItems: { xs: 'stretch', sm: 'center' },
      }}
    >
      <OutlinedInput
        placeholder="Search by name, mobile, or flat (e.g., John, 9876, 101)..."
        size="small"
        sx={{ flexGrow: 1 }}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        startAdornment={
          <InputAdornment position="start">
            <Search color="action" fontSize="small" />
          </InputAdornment>
        }
      />

      <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
        <InputLabel id="resident-status-filter-label">Status Filter</InputLabel>
        <Select
          label="Status Filter"
          labelId="resident-status-filter-label"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          <MenuItem value="ALL">All Residents</MenuItem>
          <MenuItem value={ResidentStatus.ACTIVE}>Active</MenuItem>
          <MenuItem value={ResidentStatus.ON_NOTICE}>On Notice</MenuItem>
          <MenuItem value={ResidentStatus.CHECKED_OUT}>Checked Out</MenuItem>
          <MenuItem value={ResidentStatus.ALUMNI}>Alumni</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
