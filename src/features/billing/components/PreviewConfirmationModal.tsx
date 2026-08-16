import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  PlayArrowOutlined,
  RefreshOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import type {
  BillingPreviewViewModel,
  StayBillingPreviewSummary,
} from '../application/models/BillingWorkspaceViewModel';

interface PreviewConfirmationModalProps {
  readonly open: boolean;
  readonly preview: BillingPreviewViewModel | null;
  readonly isSubmitting: boolean;
  readonly onClose: () => void;
  readonly onRevalidate: (runId: string) => void;
  readonly onConfirmAndStart: (runId: string, forceConfirm?: boolean) => void;
}

function StayRow({ stay }: { readonly stay: StayBillingPreviewSummary }) {
  const [open, setOpen] = useState(false);

  const getStatusColor = (status: string) => {
    if (status === 'BILLABLE') return 'success';
    if (status === 'ALREADY_COMMITTED') return 'info';
    return 'default';
  };

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell width={50}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ fontWeight: 600 }}>{stay.stayId}</TableCell>
        <TableCell>{stay.residentName} ({stay.residentCode})</TableCell>
        <TableCell align="center">
          <Chip label={stay.status} size="small" color={getStatusColor(stay.status)} variant="outlined" />
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 600, color: stay.eligibleAmount > 0 ? 'success.main' : 'text.primary' }}>
          ₹{stay.eligibleAmount.toLocaleString('en-IN')}
        </TableCell>
        <TableCell align="right" sx={{ color: 'text.secondary' }}>
          ₹{stay.committedAmount.toLocaleString('en-IN')}
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 600 }}>
                Discovered Charges Breakdown ({stay.charges.length} items)
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Charge Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Eligibility Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stay.charges.map((charge) => (
                    <TableRow key={charge.obligationKey}>
                      <TableCell sx={{ fontWeight: 500 }}>{charge.chargeType}</TableCell>
                      <TableCell>{charge.description}</TableCell>
                      <TableCell>{charge.category}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        ₹{charge.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={charge.commitmentStatus === 'COMMITTED' ? 'COMMITTED (Electricity)' : charge.isEligible ? 'ELIGIBLE' : 'INELIGIBLE'}
                          color={charge.commitmentStatus === 'COMMITTED' ? 'info' : charge.isEligible ? 'success' : 'default'}
                          variant="filled"
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                        {charge.eligibilityReason || 'Eligible for billing'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export function PreviewConfirmationModal({
  open,
  preview,
  isSubmitting,
  onClose,
  onRevalidate,
  onConfirmAndStart,
}: PreviewConfirmationModalProps) {
  const [acknowledgedDeltas, setAcknowledgedDeltas] = useState(false);

  if (!preview) return null;

  const handleStart = () => {
    onConfirmAndStart(preview.runId, acknowledgedDeltas);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Billing Preview & Confirmation</span>
        <Chip label={`Draft: ${preview.runId}`} size="small" variant="outlined" />
      </DialogTitle>

      <DialogContent dividers>
        {/* KPI Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Total Eligible Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                ₹{preview.totalEligibleAmount.toLocaleString('en-IN')}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Billable Stays / Total Stays
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {preview.eligibleStaysCount} / {preview.affectedStaysCount}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Observed Committed Charges
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'info.main' }}>
                ₹{preview.totalCommittedAmount.toLocaleString('en-IN')}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Material Change Alert */}
        {preview.hasMaterialChanges && (
          <Alert severity="warning" icon={<WarningAmberOutlined />} sx={{ mb: 3 }}>
            <AlertTitle sx={{ fontWeight: 600 }}>Material Changes Detected Since Preview</AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Obligations or amounts have changed since initial draft creation. Please review the deltas below:
            </Typography>
            <List dense sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 0.5, border: '1px solid #ffcc80' }}>
              {preview.deltaDetails.map((delta, idx) => (
                <ListItem key={idx} sx={{ py: 0.2 }}>
                  <ListItemText primary={delta} />
                </ListItem>
              ))}
            </List>
            <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                onClick={() => setAcknowledgedDeltas(!acknowledgedDeltas)}
              >
                {acknowledgedDeltas ? '✓ Changes Acknowledged' : 'Acknowledge & Allow Force Confirmation'}
              </Button>
            </Box>
          </Alert>
        )}

        {/* Stays Table */}
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Stays & Obligation Breakdown
        </Typography>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell width={50} />
                <TableCell>Stay ID</TableCell>
                <TableCell>Resident</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Eligible Amount</TableCell>
                <TableCell align="right">Committed (Observed)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {preview.stays.map((stay) => (
                <StayRow key={stay.stayId} stay={stay} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button
          startIcon={isSubmitting ? <CircularProgress size={18} /> : <RefreshOutlined />}
          onClick={() => onRevalidate(preview.runId)}
          disabled={isSubmitting}
        >
          Revalidate Live State
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <PlayArrowOutlined />}
            onClick={handleStart}
            disabled={isSubmitting || (!preview.canConfirm && !acknowledgedDeltas) || preview.eligibleStaysCount === 0}
            sx={{ fontWeight: 600 }}
          >
            Confirm & Start Run
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
