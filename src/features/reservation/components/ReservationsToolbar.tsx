import React from 'react';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';

interface ReservationsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onNewReservation?: () => void;
}

export const ReservationsToolbar: React.FC<ReservationsToolbarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onNewReservation,
}) => {
  // Normalize filter value to ensure it matches Select options
  const selectValue = activeFilter === 'TODAY' ? 'ARRIVING_TODAY' : activeFilter;

  return (
    <Paper
      elevation={0}
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: 'background.paper',
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
        }}
      >
        {/* Left / Center: Universal Search + Compact Filter */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            flex: { xs: '1 1 100%', md: '1 1 auto' },
            alignItems: 'center',
          }}
        >
          {/* Universal Search Input */}
          <TextField
            fullWidth
            size="small"
            placeholder="Search by prospect name, mobile number, or reservation #..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      aria-label="clear search"
                      onClick={() => onSearchChange('')}
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 auto' },
            }}
          />

          {/* Compact Filter Selector */}
          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 190 }, flexShrink: 0 }}>
            <Select
              value={selectValue}
              onChange={(e) => onFilterChange(e.target.value)}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" color="action" />
                </InputAdornment>
              }
              renderValue={(selected) => {
                switch (selected) {
                  case 'ACTIVE':
                    return 'Active Pipeline';
                  case 'ARRIVING_TODAY':
                  case 'TODAY':
                    return 'Arriving Today';
                  case 'FOLLOW_UP_REQUIRED':
                    return 'Follow-up Required';
                  case 'CONVERTED':
                    return 'Converted';
                  case 'CANCELLED':
                    return 'Cancelled';
                  case 'ALL':
                  default:
                    return 'All Reservations';
                }
              }}
              sx={{ borderRadius: 1.5 }}
            >
              <MenuItem value="ALL">All Reservations</MenuItem>
              <MenuItem value="ACTIVE">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">Active Pipeline</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="ARRIVING_TODAY">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">Arriving Today</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="FOLLOW_UP_REQUIRED">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">Follow-up Required</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="CONVERTED">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">Converted</Typography>
                </Box>
              </MenuItem>
              <MenuItem value="CANCELLED">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2">Cancelled</Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Right: Actions */}
        <Box
          sx={{
            flexShrink: 0,
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {onNewReservation && (
            <Button
              fullWidth={false}
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onNewReservation}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                px: 2.5,
                borderRadius: 1.5,
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              New Reservation
            </Button>
          )}
        </Box>
      </Stack>
    </Paper>
  );
};
