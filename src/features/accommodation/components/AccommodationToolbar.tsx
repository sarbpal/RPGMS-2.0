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

import { BedStatus } from '../types';

interface AccommodationToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function AccommodationToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: AccommodationToolbarProps) {
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
        placeholder="Search Flat or Bed (e.g., 101, B1)..."
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
        <InputLabel id="status-filter-label">Bed Status</InputLabel>
        <Select
          label="Bed Status"
          labelId="status-filter-label"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          <MenuItem value="ALL">All Beds</MenuItem>
          <MenuItem value={BedStatus.VACANT}>Vacant</MenuItem>
          <MenuItem value={BedStatus.OCCUPIED}>Occupied</MenuItem>
          <MenuItem value={BedStatus.RESERVED}>Reserved</MenuItem>
          <MenuItem value={BedStatus.ON_NOTICE}>On Notice</MenuItem>
          <MenuItem value={BedStatus.MAINTENANCE}>Maintenance</MenuItem>
          <MenuItem value={BedStatus.BLOCKED}>Blocked</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
