import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  InputAdornment,
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
  Tooltip,
} from '@mui/material';
import {
  Search,
  Visibility,
  CalendarMonth,
  CheckCircle,
  Warning,
  Cancel,
  Schedule,
  Bed,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { StayStatus } from '../domain/valueObjects/StayStatus';
import { Stay } from '../domain/entities/Stay';
import { ChangeBillingCycleModal } from '../components/ChangeBillingCycleModal';
import { stayWorkflowComposition } from '../../../app/composition/stayWorkflowComposition';

const stayCoordinator = stayWorkflowComposition.stayWorkspaceCoordinator;

export function StaysRegistryPage() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedFlat, setSelectedFlat] = useState<string>('ALL');
  const [selectedStayType, setSelectedStayType] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modal State
  const [billingModalStay, setBillingModalStay] = useState<Stay | null>(null);

  const stays = useMemo(() => {
    void refreshTrigger;
    return stayCoordinator.getAllStays();
  }, [refreshTrigger]);

  const residentsMap = useMemo(() => {
    const residents = stayCoordinator.getAllResidents();
    const map = new Map<string, { fullName: string; residentCode: string }>();
    residents.forEach((r) => {
      map.set(r.id, { fullName: r.fullName, residentCode: r.residentCode });
    });
    return map;
  }, [refreshTrigger]);

  const uniqueFlats = useMemo(() => {
    const flats = new Set<string>();
    stays.forEach((s) => {
      if (s.flatId && s.flatId !== 'Unassigned') {
        flats.add(s.flatId);
      }
    });
    return Array.from(flats).sort();
  }, [stays]);

  const filteredStays = useMemo(() => {
    return stays.filter((stay) => {
      const resInfo = residentsMap.get(stay.residentId);
      const residentName = resInfo ? resInfo.fullName.toLowerCase() : '';
      const residentCode = resInfo ? resInfo.residentCode.toLowerCase() : '';
      const stayId = stay.id.toLowerCase();
      const flatId = stay.flatId.toLowerCase();
      const bedIds = stay.allocatedBedIds.join(' ').toLowerCase();
      const query = searchTerm.trim().toLowerCase();

      if (
        query &&
        !stayId.includes(query) &&
        !residentName.includes(query) &&
        !residentCode.includes(query) &&
        !flatId.includes(query) &&
        !bedIds.includes(query)
      ) {
        return false;
      }

      if (selectedStatus !== 'ALL' && stay.status !== selectedStatus) {
        return false;
      }

      if (selectedFlat !== 'ALL' && stay.flatId !== selectedFlat) {
        return false;
      }

      if (selectedStayType !== 'ALL' && stay.stayType !== selectedStayType) {
        return false;
      }

      if (dateFrom && stay.checkInDate < dateFrom) {
        return false;
      }

      if (dateTo && stay.checkInDate > dateTo) {
        return false;
      }

      return true;
    });
  }, [stays, residentsMap, searchTerm, selectedStatus, selectedFlat, selectedStayType, dateFrom, dateTo]);

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: stays.length,
      active: stays.filter((s) => s.status === StayStatus.ACTIVE).length,
      onNotice: stays.filter((s) => s.status === StayStatus.ON_NOTICE).length,
      checkedOut: stays.filter((s) => s.status === StayStatus.CHECKED_OUT).length,
      planned: stays.filter((s) => s.status === StayStatus.PLANNED).length,
      closedOrCancelled: stays.filter(
        (s) => s.status === StayStatus.CLOSED || s.status === StayStatus.CANCELLED
      ).length,
    };
  }, [stays]);

  const getStatusChip = (status: string) => {
    switch (status) {
      case StayStatus.ACTIVE:
        return <Chip label="ACTIVE" color="success" size="small" icon={<CheckCircle />} />;
      case StayStatus.ON_NOTICE:
        return <Chip label="ON NOTICE" color="warning" size="small" icon={<Warning />} />;
      case StayStatus.CHECKED_OUT:
        return <Chip label="CHECKED OUT" color="default" size="small" icon={<Schedule />} />;
      case StayStatus.PLANNED:
        return <Chip label="PLANNED" color="info" size="small" icon={<CalendarMonth />} />;
      case StayStatus.CLOSED:
        return <Chip label="CLOSED" color="secondary" size="small" icon={<CheckCircle />} />;
      case StayStatus.CANCELLED:
        return <Chip label="CANCELLED" color="error" size="small" icon={<Cancel />} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const handleActivate = (stayId: string) => {
    try {
      stayCoordinator.activateStay({ stayId, reason: 'Manual activation from Registry' });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCancelPlanned = (stayId: string) => {
    const reason = prompt('Enter reason for cancelling this planned Stay:', 'Cancelled by operator');
    if (!reason) return;
    try {
      stayCoordinator.cancelPlannedStay({ stayId, cancellationDate: new Date().toISOString().split('T')[0], reason });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleCloseStay = (stayId: string) => {
    const reason = prompt('Enter reason for closing this Stay:', 'Administrative closure after settlement');
    if (reason === null) return;
    try {
      stayCoordinator.closeStay({ stayId, closedDate: new Date().toISOString().split('T')[0], reason: reason || 'Completed' });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} color="text.primary">
            Stay Registry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Authoritative registry of all past, present, and planned Stays
          </Typography>
        </Box>
      </Box>

      {/* Summary Metrics */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card variant="outlined">
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                TOTAL STAYS
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {metrics.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #2e7d32' }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                ACTIVE
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                {metrics.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #ed6c02' }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                ON NOTICE
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {metrics.onNotice}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #0288d1' }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                PLANNED
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                {metrics.planned}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #757575' }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                CHECKED OUT
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {metrics.checkedOut}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Card variant="outlined" sx={{ borderLeft: '4px solid #9c27b0' }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary">
                CLOSED / CANCELLED
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {metrics.closedOrCancelled}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search stay ID, resident, flat, bed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Select
              fullWidth
              size="small"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              displayEmpty
            >
              <MenuItem value="ALL">Status: All</MenuItem>
              <MenuItem value={StayStatus.PLANNED}>PLANNED</MenuItem>
              <MenuItem value={StayStatus.ACTIVE}>ACTIVE</MenuItem>
              <MenuItem value={StayStatus.ON_NOTICE}>ON NOTICE</MenuItem>
              <MenuItem value={StayStatus.CHECKED_OUT}>CHECKED OUT</MenuItem>
              <MenuItem value={StayStatus.CLOSED}>CLOSED</MenuItem>
              <MenuItem value={StayStatus.CANCELLED}>CANCELLED</MenuItem>
            </Select>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Select
              fullWidth
              size="small"
              value={selectedFlat}
              onChange={(e) => setSelectedFlat(e.target.value)}
              displayEmpty
            >
              <MenuItem value="ALL">Flat: All</MenuItem>
              {uniqueFlats.map((flat) => (
                <MenuItem key={flat} value={flat}>
                  {flat}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid size={{ xs: 6, md: 2 }}>
            <Select
              fullWidth
              size="small"
              value={selectedStayType}
              onChange={(e) => setSelectedStayType(e.target.value)}
              displayEmpty
            >
              <MenuItem value="ALL">Type: All</MenuItem>
              <MenuItem value="REGULAR">REGULAR</MenuItem>
              <MenuItem value="SHORT_TERM">SHORT TERM</MenuItem>
              <MenuItem value="TEMPORARY">TEMPORARY</MenuItem>
            </Select>
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 6, md: 1.5 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Registry Table */}
      <TableContainer component={Paper} variant="outlined">
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Stay ID</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Resident</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Flat / Bed</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Check-In Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Billing Anchor</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStays.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No Stays found matching the search criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredStays.map((stay) => {
                const resInfo = residentsMap.get(stay.residentId);
                const residentName = resInfo ? resInfo.fullName : stay.residentId;
                const residentCode = resInfo ? resInfo.residentCode : '';

                return (
                  <TableRow key={stay.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {stay.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stay.stayType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {residentName}
                      </Typography>
                      {residentCode && (
                        <Typography variant="caption" color="text.secondary">
                          {residentCode}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Bed fontSize="small" color="action" />
                        <Typography variant="body2">
                          {stay.flatId} / {stay.allocatedBedIds.join(', ') || 'Unassigned'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getStatusChip(stay.status)}</TableCell>
                    <TableCell>{stay.checkInDate}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${stay.billingAnchorDay}th of month`}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="View Stay Workspace">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/stays/${stay.id}`)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {stay.status === StayStatus.PLANNED && (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={() => handleActivate(stay.id)}
                            >
                              Activate
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleCancelPlanned(stay.id)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}

                        {(stay.status === StayStatus.ACTIVE || stay.status === StayStatus.ON_NOTICE) && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setBillingModalStay(stay)}
                          >
                            Change Anchor
                          </Button>
                        )}

                        {stay.status === StayStatus.CHECKED_OUT && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleCloseStay(stay.id)}
                          >
                            Close Stay
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Change Billing Cycle Modal */}
      {billingModalStay && (
        <ChangeBillingCycleModal
          open={Boolean(billingModalStay)}
          stay={billingModalStay}
          onClose={() => setBillingModalStay(null)}
          onSuccess={() => {
            setBillingModalStay(null);
            setRefreshTrigger((prev) => prev + 1);
          }}
          onChangeBillingCycle={(input) => stayCoordinator.changeBillingCycle(input)}
        />
      )}
    </Container>
  );
}
