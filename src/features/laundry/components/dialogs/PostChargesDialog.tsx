import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  Alert,
  Divider,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Receipt,
  Person,
  Room,
  CheckCircleOutlined,
} from '@mui/icons-material';
import type {
  LaundryTransactionDetailViewModel,
  PostChargesResultViewModel,
  LaundryChargeRecordViewModel,
} from '../../application/models/LaundryWorkspaceViewModel';
import type { PostChargesDTO } from '../../application/dtos/laundryDTOs';

export interface PostChargesDialogProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  onClose: () => void;
  onSubmit: (dto: PostChargesDTO) => Promise<PostChargesResultViewModel>;
}

export function PostChargesDialog({
  open,
  detail,
  onClose,
  onSubmit,
}: PostChargesDialogProps) {
  const [staffId, setStaffId] = useState('STAFF-001');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<PostChargesResultViewModel | null>(null);

  useEffect(() => {
    if (open) {
      setStaffId('STAFF-001');
      setIsSubmitting(false);
      setErrorMessage(null);
      setSuccessResult(null);
    }
  }, [open, detail]);

  if (!detail) {
    return null;
  }

  // Filter pending charges
  const pendingCharges: readonly LaundryChargeRecordViewModel[] = detail.charges
    ? detail.charges.filter((c) => c.status === 'PENDING_POSTING')
    : [];

  const alreadyPostedCharges: readonly LaundryChargeRecordViewModel[] = detail.charges
    ? detail.charges.filter((c) => c.status === 'POSTED')
    : [];

  const totalPendingAmount = pendingCharges.reduce((acc, c) => acc + c.totalAmount, 0);

  const handleSubmit = async () => {
    if (!staffId.trim()) {
      setErrorMessage('Staff ID is required to authorize Finance posting.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await onSubmit({
        transactionId: detail.id,
        staffId: staffId.trim(),
      });

      if (result.success) {
        setSuccessResult(result);
      } else {
        setErrorMessage(result.failureReason || 'Failed to post charges to Finance.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while posting charges.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1.5, color: 'primary.main', display: 'flex' }}>
            <AccountBalanceWallet />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Post Laundry Charges to Finance
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Transaction: {detail.id} • Stay: {detail.stayId}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Success State */}
          {successResult && (
            <Paper variant="outlined" sx={{ p: 2.5, bgcolor: '#f6ffed', borderColor: 'success.main', borderRadius: 2 }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
                <CheckCircleOutlined color="success" sx={{ fontSize: 32, mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'success.dark' }}>
                    Finance Posting Successful
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                    Successfully posted {successResult.postedChargesCount} charge record(s) totaling{' '}
                    <strong>{successResult.totalAmountPostedFormatted}</strong> to the Finance Ledger.
                  </Typography>
                  {successResult.charges.length > 0 && (
                    <Box sx={{ mt: 1.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 0.5 }}>
                        Generated Finance Bills:
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {successResult.charges.map((c) => (
                          <Chip
                            key={c.businessChargeId}
                            size="small"
                            icon={<Receipt fontSize="small" />}
                            label={`${c.businessChargeId} → Bill: ${c.financeBillId || 'Created'}`}
                            color="success"
                            variant="outlined"
                            sx={{ fontSize: '0.75rem' }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              </Stack>
            </Paper>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Alert severity="error" onClose={() => setErrorMessage(null)}>
              {errorMessage}
            </Alert>
          )}

          {!successResult && (
            <>
              {/* Resident & Stay Context */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Person color="action" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {detail.residentName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Code: {detail.residentCode} • Resident ID: {detail.residentId}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                    <Room color="action" />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {detail.locationSummary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Stay ID: {detail.stayId}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Paper>

              {/* Informational Alert */}
              <Alert severity="info" sx={{ fontSize: '0.825rem' }}>
                Posting evaluates all delivered service charges per <strong>BR-L-012</strong> and creates official Finance
                Bills in the Unified Stay Ledger. Idempotency is guaranteed by <code>businessChargeId</code>.
              </Alert>

              {/* Pending Charges Breakdown */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
                  Pending Charges to Post ({pendingCharges.length})
                </Typography>

                {pendingCharges.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 2.5, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary">
                      No pending unposted charges found on this order.
                    </Typography>
                    {alreadyPostedCharges.length > 0 && (
                      <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                        {alreadyPostedCharges.length} charge record(s) already posted to Finance ({detail.totalPostedAmountFormatted}).
                      </Typography>
                    )}
                  </Paper>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Item & Service</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Charge Key</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Quantity</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Unit Rate</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Total Amount</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {pendingCharges.map((charge) => (
                          <TableRow key={charge.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {charge.itemName || 'Garment'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {charge.serviceName || charge.serviceId}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {charge.businessChargeId}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{charge.quantity} pcs</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2">{charge.unitRateFormatted}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {charge.totalAmountFormatted}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                size="small"
                                label={charge.statusLabel}
                                color="warning"
                                sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>

              {/* Posting Amount Summary Card */}
              {pendingCharges.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f0f7ff', borderColor: 'primary.light', borderRadius: 1.5 }}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                        Total Amount to Bill
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        ₹{totalPendingAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Delivered Charges: {pendingCharges.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Currency: {pendingCharges[0]?.currency || 'INR'}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              )}

              <Divider />

              {/* Staff Identification */}
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label="Authorizing Staff ID"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="e.g. STAFF-001"
                  required
                  disabled={isSubmitting}
                  helperText="Staff ID authorizing the charge posting to the resident's ledger."
                />
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {successResult ? (
          <Button variant="contained" color="primary" onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700 }}>
            Close
          </Button>
        ) : (
          <>
            <Button onClick={onClose} disabled={isSubmitting} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <AccountBalanceWallet />}
              onClick={handleSubmit}
              disabled={isSubmitting || !staffId.trim() || pendingCharges.length === 0}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              {isSubmitting ? 'Posting to Finance...' : 'Post Charges to Finance'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
