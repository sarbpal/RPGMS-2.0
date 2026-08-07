import { useState } from 'react';
import {
  Stack,
  Typography,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import { Bolt, Speed } from '@mui/icons-material';
import { useElectricityWorkspace } from './hooks/useElectricityWorkspace';
import { RecordMeterReadingModal } from './components/RecordMeterReadingModal';

export default function ElectricityPage() {
  const {
    meterItems,
    tariff,
    totalMetersCount,
    activeMetersCount,
    totalReadingsRecorded,
    activeModalMeter,
    openReadingModal,
    closeReadingModal,
    refresh,
  } = useElectricityWorkspace();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const handleSuccess = () => {
    refresh();
    setSnackbarMsg('Meter reading recorded and electricity utility bills posted successfully!');
    setSnackbarOpen(true);
  };

  return (
    <Stack spacing={3}>
      {/* Workspace Header */}
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Bolt color="warning" fontSize="large" /> Electricity Operations Workspace
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Monitor flat sub-meters, record periodic consumption readings, and allocate utility bills to active resident ledgers.
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="warning"
            startIcon={<Speed />}
            onClick={() => meterItems.length > 0 && openReadingModal(meterItems[0].meter)}
            disabled={meterItems.length === 0}
            sx={{ fontWeight: 700 }}
          >
            Record Reading
          </Button>
        </Box>
      </Paper>

      {/* Overview Cards Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Total Active Meters
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'primary.main' }}>
              {activeMetersCount} / {totalMetersCount}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Recorded Readings Count
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'success.main' }}>
              {totalReadingsRecorded}
            </Typography>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Active Tariff Rate
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: 'warning.main' }}>
              ₹{tariff ? tariff.ratePerUnit : 8.5} <Typography component="span" variant="caption">/ kWh</Typography>
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Property Meters Table */}
      <Paper variant="outlined">
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Property Sub-Meters
          </Typography>
        </Box>

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Meter Number</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Assigned Location</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Last Reading (kWh)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {meterItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      No electricity meters configured.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                meterItems.map(({ meter, flat }) => (
                  <TableRow key={meter.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {meter.meterNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {flat ? flat.name : meter.flatId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={meter.meterType === 'FLAT_SHARED' ? 'Flat Shared' : 'Bed Dedicated'}
                        size="small"
                        variant="outlined"
                        color={meter.meterType === 'FLAT_SHARED' ? 'primary' : 'info'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {meter.lastReadingValue} kWh
                      </Typography>
                      {meter.lastReadingDate && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {meter.lastReadingDate}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={meter.status}
                        size="small"
                        color={meter.status === 'ACTIVE' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Record New Meter Reading">
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={() => openReadingModal(meter)}
                        >
                          <Speed fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Record Meter Reading Modal */}
      {activeModalMeter && (
        <RecordMeterReadingModal
          open={Boolean(activeModalMeter)}
          meter={activeModalMeter}
          onClose={closeReadingModal}
          onSuccess={handleSuccess}
        />
      )}

      {/* Snackbar Alert */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
