import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  TextField,
  Typography,
  Box,
  Paper,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { AssignmentReturned, VerifiedUser } from '@mui/icons-material';
import type { LaundryTransactionDetailViewModel } from '../../application/models/LaundryWorkspaceViewModel';
import type { RecordReturnDTO, ReturnedLineDTO } from '../../application/dtos/laundryDTOs';

interface RecordReturnDialogProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  onClose: () => void;
  onSubmit: (dto: RecordReturnDTO) => Promise<any>;
}

export function RecordReturnDialog({
  open,
  detail,
  onClose,
  onSubmit,
}: RecordReturnDialogProps) {
  const [staffId, setStaffId] = useState<string>('STAFF-001');
  const [returnedAt, setReturnedAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [lineQuantities, setLineQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && detail) {
      setStaffId('STAFF-001');
      setReturnedAt(new Date().toISOString().slice(0, 16));
      setNotes('');
      setError(null);
      setIsSubmitting(false);

      // Default line quantities to remaining unreturned pieces
      const initial: Record<string, number> = {};
      for (const line of detail.garmentLines) {
        const remaining = Math.max(0, line.physicalQuantity - line.returnedQuantity);
        initial[line.id] = remaining;
      }
      setLineQuantities(initial);
    }
  }, [open, detail]);

  if (!detail) {
    return null;
  }

  const handleQuantityChange = (lineId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setLineQuantities((prev) => ({
      ...prev,
      [lineId]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  const handleFillAllRemaining = () => {
    const filled: Record<string, number> = {};
    for (const line of detail.garmentLines) {
      filled[line.id] = Math.max(0, line.physicalQuantity - line.returnedQuantity);
    }
    setLineQuantities(filled);
  };

  const handleClearAll = () => {
    const cleared: Record<string, number> = {};
    for (const line of detail.garmentLines) {
      cleared[line.id] = 0;
    }
    setLineQuantities(cleared);
  };

  const totalPiecesInThisReceipt = Object.values(lineQuantities).reduce((sum, q) => sum + (q || 0), 0);

  const handleSubmit = async () => {
    if (!staffId.trim()) {
      setError('Receiving Staff Member ID is required.');
      return;
    }

    const returnedLines: ReturnedLineDTO[] = [];
    for (const line of detail.garmentLines) {
      const qty = lineQuantities[line.id] || 0;
      if (qty > 0) {
        returnedLines.push({
          garmentLineId: line.id,
          returnedQuantity: qty,
        });
      }
    }

    if (returnedLines.length === 0) {
      setError('Please specify a positive returned quantity for at least one garment line.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const dto: RecordReturnDTO = {
        transactionId: detail.id,
        staffId: staffId.trim(),
        returnedAt: returnedAt ? new Date(returnedAt).toISOString() : new Date().toISOString(),
        returnedLines: Object.freeze(returnedLines),
        notes: notes ? notes.trim() : undefined,
      };

      await onSubmit(dto);
    } catch (err: any) {
      setError(err?.message || 'Failed to record return receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentReturned color="primary" /> Record Return from Processing ({detail.id})
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Transaction Context Card */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1.5 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }} spacing={1}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {detail.residentName} ({detail.residentCode}) — {detail.locationSummary}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                  Processing Route: {detail.processingRouteLabel || detail.processingRoute || 'Unassigned'}
                  {detail.processingVendorId && ` (${detail.processingVendorId})`}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip size="small" variant="outlined" label={`Collected: ${detail.totalPhysicalPieces} pcs`} sx={{ fontWeight: 600 }} />
                <Chip size="small" variant="outlined" color="primary" label={`Returned: ${detail.totalReturnedPieces} pcs`} sx={{ fontWeight: 600 }} />
              </Stack>
            </Stack>
          </Paper>

          {/* Staff ID & Return Timestamp */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Receiving Staff ID *"
              size="small"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. STAFF-001"
              required
              helperText="Operational accountability for physical custody intake"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Return Date & Time"
              type="datetime-local"
              size="small"
              value={returnedAt}
              onChange={(e) => setReturnedAt(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          {/* Garment Lines Return Table */}
          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                Garment Lines Return Quantities
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="text" onClick={handleFillAllRemaining} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
                  Fill All Remaining
                </Button>
                <Button size="small" variant="text" color="inherit" onClick={handleClearAll} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
                  Clear
                </Button>
              </Stack>
            </Stack>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Collected</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Already Returned</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Remaining</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right" width={160}>
                      Return This Receipt
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.garmentLines.map((line) => {
                    const remaining = Math.max(0, line.physicalQuantity - line.returnedQuantity);
                    const currentVal = lineQuantities[line.id] ?? 0;
                    return (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {line.itemName}
                          </Typography>
                          {line.notes && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {line.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{line.physicalQuantity}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                            {line.returnedQuantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={remaining}
                            color={remaining > 0 ? 'warning' : 'default'}
                            variant="outlined"
                            sx={{ fontWeight: 700, fontSize: '0.75rem', height: 22 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={currentVal}
                            onChange={(e) => handleQuantityChange(line.id, e.target.value)}
                            slotProps={{
                              htmlInput: {
                                min: 0,
                                step: 1,
                                style: { textAlign: 'right', fontWeight: 700 },
                              },
                            }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              * Client-side quantity limits provide immediate user guidance only. The application/domain layer remains authoritative and independently enforces cumulative return invariants.
            </Typography>
          </Box>

          {/* Custody Receipt Summary */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fbfcfd', borderRadius: 1.5, borderColor: 'primary.light' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: 'center' }} spacing={1}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Total Pieces in This Receipt: {totalPiecesInThisReceipt}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cumulative Returned after submission: {detail.totalReturnedPieces + totalPiecesInThisReceipt} / {detail.totalPhysicalPieces} pieces
                </Typography>
              </Box>
              <Chip
                size="small"
                color={detail.totalReturnedPieces + totalPiecesInThisReceipt >= detail.totalPhysicalPieces ? 'success' : 'primary'}
                label={detail.totalReturnedPieces + totalPiecesInThisReceipt >= detail.totalPhysicalPieces ? 'Full Return' : 'Partial Return'}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Paper>

          <Divider />

          {/* Notes */}
          <TextField
            label="Return / Custody Notes"
            multiline
            rows={2}
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Received 5 shirts ironed and folded from vendor"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          startIcon={<VerifiedUser />}
          onClick={handleSubmit}
          disabled={isSubmitting || !staffId.trim() || totalPiecesInThisReceipt <= 0}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {isSubmitting ? 'Recording Return...' : `Record Return Receipt (${totalPiecesInThisReceipt} pcs)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
