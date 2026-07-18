import { Add, Search } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import type { Resident } from '../types';
import { ResidentStatus } from '../types';
import { mockResidents } from '../data/mockResidents';
import type { Flat } from '../../accommodation/types';

export default function ResidentsPage() {
  const navigate = useNavigate();

  const [residents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('rpgms_residents');
    if (saved) return JSON.parse(saved);
    // Initialize with mock data if not set
    localStorage.setItem('rpgms_residents', JSON.stringify(mockResidents));
    return mockResidents;
  });

  const [flats] = useState<Flat[]>(() => {
    const saved = localStorage.getItem('rpgms_flats');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const getStatusColor = (status: ResidentStatus) => {
    switch (status) {
      case ResidentStatus.ACTIVE:
        return 'success';
      case ResidentStatus.ON_NOTICE:
        return 'warning';
      case ResidentStatus.CHECKED_OUT:
        return 'default';
      case ResidentStatus.ALUMNI:
        return 'info';
      default:
        return 'default';
    }
  };

  const getFlatName = (flatId: string) => {
    const flat = flats.find((f) => f.id === flatId);
    return flat ? `Flat ${flat.name}` : flatId;
  };

  const getBedsString = (allocatedBedIds: string[]) => {
    return allocatedBedIds
      .map((bedId) => {
        const match = bedId.match(/[^-]+$/);
        return match ? match[0] : bedId;
      })
      .join(', ');
  };

  // Summary Metrics calculations
  const totalCount = residents.length;
  const activeCount = residents.filter((r) => r.status === ResidentStatus.ACTIVE).length;
  const onNoticeCount = residents.filter((r) => r.status === ResidentStatus.ON_NOTICE).length;
  const checkedOutCount = residents.filter((r) => r.status === ResidentStatus.CHECKED_OUT).length;

  const filteredResidents = residents.filter((r) => {
    const flatName = getFlatName(r.flatId);
    const bedsString = getBedsString(r.allocatedBedIds);

    const query = searchQuery.toLowerCase();
    const matchesSearch =
      r.fullName.toLowerCase().includes(query) ||
      r.mobileNumber.toLowerCase().includes(query) ||
      r.residentCode.toLowerCase().includes(query) ||
      flatName.toLowerCase().includes(query) ||
      bedsString.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            Residents Registry
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Manage Pg residents profiles, contact identity registry, and commercial onboarding.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/residents/new')}
          sx={{ borderRadius: 2 }}
        >
          Add Resident
        </Button>
      </Box>

      {/* Summary metrics panel */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 600 }}>
                Total Residents
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="success.main" variant="subtitle2" sx={{ fontWeight: 600 }}>
                Active Residents
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                {activeCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="warning.main" variant="subtitle2" sx={{ fontWeight: 600 }}>
                On Notice
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                {onNoticeCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography color="text.secondary" variant="subtitle2" sx={{ fontWeight: 600 }}>
                Checked Out
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                {checkedOutCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters panel */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <TextField
          placeholder="Search by Code, Name, Mobile, Flat or Bed..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
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

        <FormControl sx={{ minWidth: { sm: 200 } }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="ALL">All Statuses</MenuItem>
            <MenuItem value={ResidentStatus.ACTIVE}>Active</MenuItem>
            <MenuItem value={ResidentStatus.ON_NOTICE}>On Notice</MenuItem>
            <MenuItem value={ResidentStatus.CHECKED_OUT}>Checked Out</MenuItem>
            <MenuItem value={ResidentStatus.ALUMNI}>Alumni</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Residents Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Resident Code</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Mobile</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Flat</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Beds</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                    {residents.length === 0 ? 'No residents onboarded' : 'No matching residents found'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {residents.length === 0
                      ? 'Click "Add Resident" above to onboard your first PG resident.'
                      : 'Try adjusting your search query or status filter selection.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredResidents.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  onClick={() => navigate(`/residents/${r.id}`)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{r.residentCode}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{r.fullName}</TableCell>
                  <TableCell>{r.mobileNumber}</TableCell>
                  <TableCell>{getFlatName(r.flatId)}</TableCell>
                  <TableCell>{getBedsString(r.allocatedBedIds)}</TableCell>
                  <TableCell>
                    <Chip
                      label={r.status}
                      size="small"
                      color={getStatusColor(r.status)}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/residents/${r.id}`);
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
