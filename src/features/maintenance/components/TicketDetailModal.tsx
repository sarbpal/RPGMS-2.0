import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import type { MaintenanceRequestItemViewModel } from '../application/models/MaintenanceWorkspaceViewModel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  ticket?: MaintenanceRequestItemViewModel;
  onUpdateStatus: (ticket: MaintenanceRequestItemViewModel) => void;
}

export function TicketDetailModal({ isOpen, onClose, ticket, onUpdateStatus }: Props) {
  if (!ticket) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
            Ticket Details: {ticket.ticketNumber}
          </Typography>
          <Chip label={ticket.status} color="primary" />
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* Header Summary */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
              gap: 2,
            }}
          >
            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
              <Typography color="text.secondary" variant="caption">
                Issue Title
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {ticket.title}
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                Category: <strong>{ticket.category}</strong> | Priority:{' '}
                <strong>{ticket.priority}</strong>
              </Typography>
            </Paper>

            <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider' }}>
              <Typography color="text.secondary" variant="caption">
                Location & Context
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {ticket.locationSummary}
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                Reporter: <strong>{ticket.reporterName}</strong> ({ticket.reporterType})
              </Typography>
            </Paper>
          </Box>

          {/* Issue Description & Work Details */}
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Issue Description
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                {ticket.description}
              </Typography>
            </Box>

            {ticket.workDetails && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Work Performed / Progress Details
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  {ticket.workDetails}
                </Typography>
              </Box>
            )}

            {ticket.resolutionNotes && (
              <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                  Resolution Notes
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'success.dark' }}>
                  {ticket.resolutionNotes}
                </Typography>
              </Box>
            )}

            {ticket.cancellationReason && (
              <Box sx={{ p: 2, bgcolor: 'action.disabledBackground', borderRadius: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Cancellation Reason
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                  {ticket.cancellationReason}
                </Typography>
              </Box>
            )}
          </Stack>

          <Divider />

          {/* Assigned Technician & Costs */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            <Box>
              <Typography color="text.secondary" variant="caption">
                Assigned Technician
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {ticket.assignedToName || 'Unassigned'}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary" variant="caption">
                Estimated Repair Cost
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {ticket.estimateCostFormatted || '--'}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary" variant="caption">
                Actual Cost of Repair
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.dark' }}>
                {ticket.actualCostFormatted || '--'}
              </Typography>
            </Box>
          </Box>

          <Divider />

          {/* Append-Only Audit Event Log Timeline */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Immutable Event History Log
            </Typography>

            <Stack spacing={1.5}>
              {ticket.history.map((evt) => (
                <Paper
                  key={evt.id}
                  elevation={0}
                  sx={{ p: 1.5, border: 1, borderColor: 'divider', bgcolor: 'action.hover' }}
                >
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      [{evt.eventType}] by {evt.actorName}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {new Date(evt.timestamp).toLocaleString('en-IN')}
                    </Typography>
                  </Stack>
                  {evt.notes && (
                    <Typography color="text.secondary" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                      {evt.notes}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {ticket.status !== 'RESOLVED' && ticket.status !== 'CANCELLED' && (
          <Button
            variant="contained"
            onClick={() => {
              onClose();
              onUpdateStatus(ticket);
            }}
          >
            Update Ticket Status
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
