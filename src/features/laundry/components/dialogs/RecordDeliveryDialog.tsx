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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
} from '@mui/material';
import { LocalShipping, CheckCircle, HomeWork, Person } from '@mui/icons-material';
import type { LaundryTransactionDetailViewModel } from '../../application/models/LaundryWorkspaceViewModel';
import type { RecordDeliveryDTO, DeliveredLineDTO } from '../../application/dtos/laundryDTOs';
import { DeliveryHandoverMethod } from '../../domain/valueObjects/DeliveryHandoverMethod';

interface RecordDeliveryDialogProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  onClose: () => void;
  onSubmit: (dto: RecordDeliveryDTO) => Promise<any>;
}

export function RecordDeliveryDialog({
  open,
  detail,
  onClose,
  onSubmit,
}: RecordDeliveryDialogProps) {
  const [staffId, setStaffId] = useState<string>('STAFF-001');
  const [deliveredAt, setDeliveredAt] = useState<string>(() => new Date().toISOString().slice(0, 16));
  const [handoverMethod, setHandoverMethod] = useState<DeliveryHandoverMethod>(DeliveryHandoverMethod.DIRECT_HANDOVER);
  const [residentPresent, setResidentPresent] = useState<boolean>(true);
  const [residentVerified, setResidentVerified] = useState<boolean>(true);
  const [roomNumber, setRoomNumber] = useState<string>('');
  const [photoUrisText, setPhotoUrisText] = useState<string>('');
  const [lineQuantities, setLineQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && detail) {
      setStaffId('STAFF-001');
      setDeliveredAt(new Date().toISOString().slice(0, 16));
      setHandoverMethod(DeliveryHandoverMethod.DIRECT_HANDOVER);
      setResidentPresent(true);
      setResidentVerified(true);
      setRoomNumber(detail.locationSummary || '');
      setPhotoUrisText('');
      setNotes('');
      setError(null);
      setIsSubmitting(false);

      // Default line quantities to available deliverable in custody (returned - delivered)
      const initial: Record<string, number> = {};
      for (const line of detail.garmentLines) {
        const available = Math.max(0, line.returnedQuantity - line.deliveredQuantity);
        initial[line.id] = available;
      }
      setLineQuantities(initial);
    }
  }, [open, detail]);

  if (!detail) {
    return null;
  }

  const handleHandoverMethodChange = (newMethod: DeliveryHandoverMethod) => {
    setHandoverMethod(newMethod);
    if (newMethod === DeliveryHandoverMethod.DIRECT_HANDOVER) {
      setResidentPresent(true);
      setResidentVerified(true);
    } else {
      setResidentPresent(false);
      setResidentVerified(false);
      if (!roomNumber) {
        setRoomNumber(detail.locationSummary || '');
      }
    }
  };

  const handleQuantityChange = (lineId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setLineQuantities((prev) => ({
      ...prev,
      [lineId]: isNaN(parsed) ? 0 : Math.max(0, parsed),
    }));
  };

  const handleFillAllAvailable = () => {
    const filled: Record<string, number> = {};
    for (const line of detail.garmentLines) {
      filled[line.id] = Math.max(0, line.returnedQuantity - line.deliveredQuantity);
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

  const totalPiecesInThisDelivery = Object.values(lineQuantities).reduce((sum, q) => sum + (q || 0), 0);

  const handleSubmit = async () => {
    if (!staffId.trim()) {
      setError('Delivery Staff Member ID is required.');
      return;
    }
    if (!handoverMethod) {
      setError('Handover method is required.');
      return;
    }

    const deliveredLines: DeliveredLineDTO[] = [];
    for (const line of detail.garmentLines) {
      const qty = lineQuantities[line.id] || 0;
      if (qty > 0) {
        deliveredLines.push({
          garmentLineId: line.id,
          deliveredQuantity: qty,
        });
      }
    }

    if (deliveredLines.length === 0) {
      setError('Please specify a positive delivered quantity for at least one garment line.');
      return;
    }

    const photoUris = photoUrisText
      ? photoUrisText.split(',').map((u) => u.trim()).filter(Boolean)
      : undefined;

    setError(null);
    setIsSubmitting(true);

    try {
      const dto: RecordDeliveryDTO = {
        transactionId: detail.id,
        staffId: staffId.trim(),
        deliveredAt: deliveredAt ? new Date(deliveredAt).toISOString() : new Date().toISOString(),
        deliveredLines: Object.freeze(deliveredLines),
        handoverMethod,
        residentPresent,
        residentVerified,
        roomNumber: handoverMethod === DeliveryHandoverMethod.ROOM_PLACEMENT ? roomNumber.trim() : undefined,
        photoUris,
        notes: notes ? notes.trim() : undefined,
      };

      await onSubmit(dto);
    } catch (err: any) {
      setError(err?.message || 'Failed to record delivery handover.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalShipping color="success" /> Record Resident Delivery Handover ({detail.id})
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
                  Total Collected: {detail.totalPhysicalPieces} pcs • Returned to Custody: {detail.totalReturnedPieces} pcs • Already Delivered: {detail.totalDeliveredPieces} pcs
                </Typography>
              </Box>
              <Chip
                size="small"
                color={detail.totalReturnedPieces > detail.totalDeliveredPieces ? 'success' : 'default'}
                label={`${detail.totalReturnedPieces - detail.totalDeliveredPieces} pcs Deliverable in Custody`}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Paper>

          {/* Staff ID & Delivery Timestamp */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Delivery Staff ID *"
              size="small"
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              placeholder="e.g. STAFF-001"
              required
              helperText="Operational accountability for physical resident handover"
              sx={{ flex: 1 }}
            />
            <TextField
              label="Delivery Date & Time"
              type="datetime-local"
              size="small"
              value={deliveredAt}
              onChange={(e) => setDeliveredAt(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          {/* Handover Method Selector */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1 }}>
                Handover Method *
              </FormLabel>
              <RadioGroup
                row
                value={handoverMethod}
                onChange={(e) => handleHandoverMethodChange(e.target.value as DeliveryHandoverMethod)}
              >
                <FormControlLabel
                  value={DeliveryHandoverMethod.DIRECT_HANDOVER}
                  control={<Radio size="small" color="primary" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Person fontSize="small" color="primary" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Direct Handover (In Person)
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value={DeliveryHandoverMethod.ROOM_PLACEMENT}
                  control={<Radio size="small" color="primary" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <HomeWork fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Room Placement (Resident Room/Bed)
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>

            <Divider sx={{ my: 1.5 }} />

            {/* Contextual Handover Controls */}
            {handoverMethod === DeliveryHandoverMethod.DIRECT_HANDOVER ? (
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={residentPresent}
                      onChange={(e) => setResidentPresent(e.target.checked)}
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Resident was present in person at handover</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={residentVerified}
                      onChange={(e) => setResidentVerified(e.target.checked)}
                      size="small"
                      color="success"
                    />
                  }
                  label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Resident verified piece count and accepted handover</Typography>}
                />
              </Stack>
            ) : (
              <Stack spacing={2}>
                <TextField
                  label="Room / Bed Location Reference *"
                  size="small"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder="e.g. Flat 302 / Bed A"
                  helperText="Physical placement room identifier where garments were deposited"
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={residentPresent}
                        onChange={(e) => setResidentPresent(e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">Resident Present</Typography>}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={residentVerified}
                        onChange={(e) => setResidentVerified(e.target.checked)}
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">Pre-acknowledged by Resident</Typography>}
                  />
                </Stack>
                <TextField
                  label="Placement Photo Evidence URI(s)"
                  size="small"
                  value={photoUrisText}
                  onChange={(e) => setPhotoUrisText(e.target.value)}
                  placeholder="evidence://delivery-room-302.jpg"
                  helperText="Optional comma-separated placement evidence URIs"
                />
              </Stack>
            )}
          </Paper>

          {/* Garment Lines Delivery Table */}
          <Box>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                Garment Lines Delivery Quantities
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="text" onClick={handleFillAllAvailable} sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
                  Deliver All Available
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
                    <TableCell sx={{ fontWeight: 700 }} align="center">Returned to Custody</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Already Delivered</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Available to Deliver</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right" width={160}>
                      Deliver This Receipt
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.garmentLines.map((line) => {
                    const available = Math.max(0, line.returnedQuantity - line.deliveredQuantity);
                    const currentVal = lineQuantities[line.id] ?? 0;
                    return (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {line.itemName}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{line.returnedQuantity}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" color="text.secondary">
                            {line.deliveredQuantity}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={available}
                            color={available > 0 ? 'success' : 'default'}
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
              * Client-side quantity limits provide immediate user guidance only. The application/domain layer remains authoritative and independently enforces delivery invariants and BR-L-012 chargeability.
            </Typography>
          </Box>

          {/* Delivery Summary */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fbfdfb', borderRadius: 1.5, borderColor: 'success.light' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: 'center' }} spacing={1}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Total Pieces in This Delivery: {totalPiecesInThisDelivery}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Cumulative Delivered after submission: {detail.totalDeliveredPieces + totalPiecesInThisDelivery} / {detail.totalPhysicalPieces} pieces
                </Typography>
              </Box>
              <Chip
                size="small"
                color="success"
                label={`${totalPiecesInThisDelivery} pcs to deliver`}
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Paper>

          <Divider />

          {/* Notes */}
          <TextField
            label="Delivery / Handover Notes"
            multiline
            rows={2}
            size="small"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Handed over directly to resident in room 302"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircle />}
          onClick={handleSubmit}
          disabled={isSubmitting || !staffId.trim() || totalPiecesInThisDelivery <= 0}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          {isSubmitting ? 'Confirming Delivery...' : `Confirm Delivery Handover (${totalPiecesInThisDelivery} pcs)`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
