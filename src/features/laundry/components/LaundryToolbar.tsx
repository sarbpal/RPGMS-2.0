import {
  Paper,
  Stack,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Box,
  IconButton,
  Button,
} from '@mui/material';
import { Search, Clear, FilterAltOff } from '@mui/icons-material';
import type { LaundryWorkspaceFilters } from '../application/dtos/laundryDTOs';

interface LaundryToolbarProps {
  filters: LaundryWorkspaceFilters;
  onSearchChange: (query: string) => void;
  onStatusChange: (status?: string) => void;
  onHasExceptionsChange: (hasExceptions?: boolean) => void;
  onResetFilters: () => void;
}

export function LaundryToolbar({
  filters,
  onSearchChange,
  onStatusChange,
  onHasExceptionsChange,
  onResetFilters,
}: LaundryToolbarProps) {
  const currentTab = filters.hasExceptions
    ? 'EXCEPTIONS'
    : filters.status || 'ALL';

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'EXCEPTIONS') {
      onHasExceptionsChange(true);
    } else if (newValue === 'ALL') {
      onStatusChange(undefined);
    } else {
      onStatusChange(newValue);
    }
  };

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
    filters.status ||
    filters.hasExceptions ||
    filters.processingRoute
  );

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack spacing={2}>
        {/* Top Bar: Universal Search & Quick Actions */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
          }}
        >
          {/* Universal Search Box */}
          <TextField
            placeholder="Search by resident name, resident code, room/flat, transaction ID, or tag..."
            value={filters.searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            size="small"
            sx={{
              flex: { xs: '1 1 100%', md: '0 1 70%' },
              width: { xs: '100%', md: '70%' },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: filters.searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => onSearchChange('')}>
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<FilterAltOff />}
              onClick={onResetFilters}
              sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}
            >
              Reset Filters
            </Button>
          )}
        </Stack>

        {/* Bottom Bar: Operational Lifecycle Status Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              '& .MuiTab-root': {
                minHeight: 40,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                py: 1,
              },
            }}
          >
            <Tab label="All Orders" value="ALL" />
            <Tab label="Drafts" value="DRAFT" />
            <Tab label="Awaiting Inspection" value="COLLECTED" />
            <Tab label="In Processing" value="IN_PROCESS" />
            <Tab label="Ready for Delivery" value="RETURNED_FULL" />
            <Tab label="Partially Delivered" value="DELIVERED_PARTIAL" />
            <Tab label="Completed" value="COMPLETED" />
            <Tab label="Exceptions" value="EXCEPTIONS" sx={{ color: 'error.main' }} />
          </Tabs>
        </Box>
      </Stack>
    </Paper>
  );
}
