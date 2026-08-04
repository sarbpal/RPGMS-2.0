import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Grid,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Search, SearchOff } from '@mui/icons-material';
import { ResidentsListCoordinator } from '../application/coordinator/ResidentsListCoordinator';
import type { ResidentListFilter } from '../application/models/ResidentsListViewModel';
import { ResidentsSummaryCards } from '../components/ResidentsSummaryCards';
import { ResidentCardItem } from '../components/ResidentCardItem';

export function ResidentsPage() {
  const navigate = useNavigate();

  const coordinator = useMemo(() => new ResidentsListCoordinator(), []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ResidentListFilter>('ALL');

  const viewModel = useMemo(
    () => coordinator.createViewModel(searchQuery, activeFilter),
    [coordinator, searchQuery, activeFilter]
  );

  const handleFilterChange = (filter: ResidentListFilter) => {
    setActiveFilter(filter);
  };

  const handleReset = () => {
    setSearchQuery('');
    setActiveFilter('ALL');
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <Stack spacing={3}>
        {/* Page Header */}
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" color="text.primary" sx={{ fontWeight: 800 }}>
              Residents
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Operational list workspace for locating and managing hostel residents.
            </Typography>
          </Box>
        </Stack>

        {/* 1. Summary Cards */}
        <ResidentsSummaryCards
          summary={viewModel.summary}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />

        {/* 2. Universal Search & Operational Filters Bar */}
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            {/* Universal Search Box (65-70% width on desktop, auto-focus enabled) */}
            <TextField
              autoFocus
              placeholder="Search by name, resident code, mobile number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{
                flex: { xs: '1 1 100%', md: '0 1 68%' },
                width: { xs: '100%', md: '68%' },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Operational Filter Tabs */}
            <Tabs
              value={activeFilter}
              onChange={(_, val: ResidentListFilter) => setActiveFilter(val)}
              textColor="primary"
              indicatorColor="primary"
              variant="scrollable"
              scrollButtons="auto"
              sx={{ flexShrink: 0 }}
            >
              <Tab label={`All (${viewModel.summary.totalCount})`} value="ALL" sx={{ fontWeight: 700 }} />
              <Tab label={`Active (${viewModel.summary.activeCount})`} value="ACTIVE" sx={{ fontWeight: 700 }} />
              <Tab label={`On Notice (${viewModel.summary.onNoticeCount})`} value="ON_NOTICE" sx={{ fontWeight: 700 }} />
              <Tab label={`Alumni (${viewModel.summary.alumniCount})`} value="ALUMNI" sx={{ fontWeight: 700 }} />
            </Tabs>
          </Stack>
        </Paper>

        {/* 3. Resident Cards Grid or Empty State */}
        {viewModel.residents.length > 0 ? (
          <Grid container spacing={2.5}>
            {viewModel.residents.map((resident) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={resident.id}>
                <ResidentCardItem
                  resident={resident}
                  onClick={() => navigate(`/resident/${resident.id}`)}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper variant="outlined" sx={{ p: 6, borderRadius: 3, textAlign: 'center' }}>
            <Stack spacing={2} sx={{ alignItems: 'center' }}>
              <SearchOff sx={{ fontSize: 64, color: 'text.secondary' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                No Residents Found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
                No residents matched your search query &quot;{searchQuery}&quot; and filter criteria.
              </Typography>
              <Button variant="outlined" color="primary" onClick={handleReset} sx={{ mt: 1, fontWeight: 700 }}>
                Reset Search &amp; Filters
              </Button>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Container>
  );
}

export default ResidentsPage;
