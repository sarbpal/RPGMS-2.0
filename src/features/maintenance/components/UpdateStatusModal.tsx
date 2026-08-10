import { useState, useEffect } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { MaintenancePersonnel } from '../domain/entities/MaintenancePersonnel';
import type { MaintenanceRequestItemViewModel } from '../application/models/MaintenanceWorkspaceViewModel';
import type { MaintenanceStatus } from '../domain/types/MaintenanceTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticket?: MaintenanceRequestItemViewModel;
  personnelList: readonly MaintenancePersonnel[];
  onSubmit: (data: {
    targetStatus: MaintenanceStatus;
    resolutionNotes?: string;
    cancellationReason?: string;
    workDetails?: string;
    actualCost?: number;
    assignedToId?: string;
    assignedToName?: string;
  }) => Promise<void>;
}

export function UpdateStatusModal({
  isOpen,
  onClose,
  ticket,
  personnelList,
  onSubmit,
}: Props) {
  const [targetStatus, setTargetStatus] = useState<MaintenanceStatus>('IN_PROGRESS');
  const [assignedToId, setAssignedToId] = useState('');
  const [workDetails, setWorkDetails] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [cancellationReason, setCancellationReason] = useState('');
  const [actualCost, setActualCost] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (ticket) {
      setTargetStatus(ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status);
      setAssignedToId(ticket.assignedToId || '');
      setWorkDetails(ticket.workDetails || '');
      setResolutionNotes(ticket.resolutionNotes || '');
      setCancellationReason(ticket.cancellationReason || '');
      setActualCost(ticket.actualCost !== undefined ? ticket.actualCost : '');
    }
  }, [ticket, isOpen]);

  if (!ticket) return null;

  const handleSubmit = async () => {
    try {
      setErrorMsg('');
      setIsSubmitting(true);

      const assigned = personnelList.find((p) => p.id === assignedToId);

      await onSubmit({
        targetStatus,
        resolutionNotes: targetStatus === 'RESOLVED' ? resolutionNotes : undefined,
        cancellationReason: targetStatus === 'CANCELLED' ? cancellationReason : undefined,
        workDetails,
        actualCost: actualCost !== '' ? Number(actualCost) : undefined,
        assignedToId: assignedToId || undefined,
        assignedToName: assigned ? assigned.name : undefined,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Update Ticket Status: {ticket.ticketNumber}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <FormControl fullWidth size="small">
            <InputLabel>New Status</InputLabel>
            <Select
              value={targetStatus}
              label="New Status"
              onChange={(e) => setTargetStatus(e.target.value as MaintenanceStatus)}
            >
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Assigned Technician</InputLabel>
            <Select
              value={assignedToId}
              label="Assigned Technician"
              onChange={(e) => setAssignedToId(e.target.value)}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {personnelList.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name} ({p.type}) {!p.isActive ? '[Inactive]' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Work Performed / Details"
            fullWidth
            multiline
            rows={2}
            size="small"
            value={workDetails}
            onChange={(e) => setWorkDetails(e.target.value)}
            placeholder="Describe maintenance work done or steps taken..."
          />

          {targetStatus === 'RESOLVED' && (
            <TextField
              label="Resolution Notes"
              required
              fullWidth
              multiline
              rows={2}
              size="small"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Mandatory notes explaining how the issue was resolved..."
            />
          )}

          {targetStatus === 'CANCELLED' && (
            <TextField
              label="Cancellation Reason"
              required
              fullWidth
              multiline
              rows={2}
              size="small"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Mandatory reason for cancelling this request..."
            />
          )}

          <TextField
            label="Actual Cost of Repair (₹)"
            type="number"
            fullWidth
            size="small"
            value={actualCost}
            onChange={(e) => setActualCost(e.target.value !== '' ? Number(e.target.value) : '')}
            placeholder="Final repair cost in INR"
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            (targetStatus === 'RESOLVED' && !resolutionNotes.trim()) ||
            (targetStatus === 'CANCELLED' && !cancellationReason.trim())
          }
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
