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
  Tabs,
  Tab,
} from '@mui/material';
import { Bolt, Speed, ReceiptLong } from '@mui/icons-material';
import { useElectricityWorkspace } from './hooks/useElectricityWorkspace';
import { useSupplierBillAllocation } from './hooks/useSupplierBillAllocation';
import { RecordMeterReadingModal } from './components/RecordMeterReadingModal';
import { SupplierBillEntryModal } from './components/SupplierBillEntryModal';
import { DraftAllocationReviewPanel } from './components/DraftAllocationReviewPanel';
import { AllocationHistoryTable } from './components/AllocationHistoryTable';

export default function ElectricityPage() {
  const [tabIndex, setTabIndex] = useState<number>(0);

  // Hook 1: Physical Sub-Meter Engine (FR-6 Analytics)
  const {
    meterItems,
    tariff,
    totalMetersCount,
    activeMetersCount,
    totalReadingsRecorded,
    activeModalMeter,
    openReadingModal,
    closeReadingModal,
    refresh: refreshPhysical,
  } = useElectricityWorkspace();

  // Hook 2: Supplier Bill Allocation Engine (Primary Ritu PG Workflow)
  const {
    isEntryModalOpen,
    openEntryModal,
    closeEntryModal,
    draftAllocation,
    supplierBill,
    historicalAllocations,
    dataQualityIssues,
    error,
    warnings,
    successMessage,
    createDraftBill,
    updateParticipantShares,
    confirmAllocation,
  } = useSupplierBillAllocation();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');

  const handlePhysicalSuccess = () => {
    refreshPhysical();
    setSnackbarMsg('Meter reading recorded and electricity utility bills posted successfully!');
    setSnackbarOpen(true);
  };

  return (
    <Stack spacing={3}>
      {/* Workspace Main Header */}
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Bolt color="warning" fontSize="large" /> Electricity Operations Workspace
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Manage actual supplier bill allocations to resident ledgers and monitor flat physical sub-meters.
            </Typography>
          </Box>

          {tabIndex === 0 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ReceiptLong />}
              onClick={openEntryModal}
              sx={{ fontWeight: 700 }}
            >
              Enter Supplier Bill
            </Button>
          ) : (
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
          )}
        </Box>

        {/* Dual-Tab Workspace Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs
            value={tabIndex}
            onChange={(_, newValue) => setTabIndex(newValue)}
            aria-label="Electricity workspace navigation tabs"
          >
            <Tab
              icon={<ReceiptLong />}
              iconPosition="start"
              label="Supplier Bill Allocations (Primary)"
              sx={{ fontWeight: 700 }}
            />
            <Tab
              icon={<Speed />}
              iconPosition="start"
              label="Physical Sub-Meters (FR-6 Analytics)"
              sx={{ fontWeight: 700 }}
            />
          </Tabs>
        </Box>
      </Paper>

      {/* Alert Notifications */}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      {/* ========================================================================= */}
      {/* TAB 0: SUPPLIER BILL ALLOCATIONS WORKSPACE (PRIMARY RITU PG WORKFLOW)      */}
      {/* ========================================================================= */}
      {tabIndex === 0 && (
        <Stack spacing={3}>
          {/* Active Draft Allocation Review Panel */}
          {draftAllocation && (
            <DraftAllocationReviewPanel
              allocation={draftAllocation}
              bill={supplierBill}
              dataQualityIssues={dataQualityIssues}
              warnings={warnings}
              onUpdateShares={updateParticipantShares}
              onConfirm={confirmAllocation}
            />
          )}

          {/* Supplier Bill Entry Modal Dialog */}
          <SupplierBillEntryModal
            open={isEntryModalOpen}
            onClose={closeEntryModal}
            onSubmit={createDraftBill}
          />

          {/* Confirmed Allocation History Table */}
          <AllocationHistoryTable items={historicalAllocations} />
        </Stack>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PHYSICAL SUB-METERS WORKSPACE (FR-6 ANALYTICAL CONSUMPTION ENGINE)  */}
      {/* ========================================================================= */}
      {tabIndex === 1 && (
        <Stack spacing={3}>
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
                  ₹{tariff ? tariff.ratePerUnit : '0.00'}/kWh
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Sub-Meters Table */}
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Meter Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Flat</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Last Reading (kWh)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {meterItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No sub-meters registered.
                    </TableCell>
                  </TableRow>
                ) : (
                  meterItems.map(({ meter, flat }) => (
                    <TableRow key={meter.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{meter.meterNumber}</TableCell>
                      <TableCell>
                        <Chip label={meter.meterType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{flat ? flat.name : meter.flatId}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        {meter.lastReadingValue} kWh
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={meter.status}
                          size="small"
                          color={meter.status === 'ACTIVE' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Record New Reading">
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

          {/* Record Reading Modal */}
          {activeModalMeter && (
            <RecordMeterReadingModal
              open={Boolean(activeModalMeter)}
              meter={activeModalMeter}
              onClose={closeReadingModal}
              onSuccess={handlePhysicalSuccess}
            />
          )}
        </Stack>
      )}

      {/* Common Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert severity="success" onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
