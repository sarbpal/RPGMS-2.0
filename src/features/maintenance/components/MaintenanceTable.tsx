import { Visibility } from '@mui/icons-material';
import {
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import type { MaintenanceRequestItemViewModel } from '../application/models/MaintenanceWorkspaceViewModel';
import type {
  MaintenancePriority,
  MaintenanceStatus,
} from '../domain/types/MaintenanceTypes';

interface Props {
  requests: readonly MaintenanceRequestItemViewModel[];
  onViewTicket: (ticket: MaintenanceRequestItemViewModel) => void;
  onUpdateStatus: (ticket: MaintenanceRequestItemViewModel) => void;
}

export function MaintenanceTable({ requests, onViewTicket, onUpdateStatus }: Props) {
  const theme = useTheme();

  const getStatusChip = (status: MaintenanceStatus) => {
    switch (status) {
      case 'OPEN':
        return (
          <Chip
            label="Open"
            size="small"
            sx={{ bgcolor: theme.palette.info.light, color: theme.palette.info.dark, fontWeight: 600 }}
          />
        );
      case 'IN_PROGRESS':
        return (
          <Chip
            label="In Progress"
            size="small"
            sx={{ bgcolor: theme.palette.warning.light, color: theme.palette.warning.dark, fontWeight: 600 }}
          />
        );
      case 'RESOLVED':
        return (
          <Chip
            label="Resolved"
            size="small"
            sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.dark, fontWeight: 600 }}
          />
        );
      case 'CANCELLED':
        return (
          <Chip
            label="Cancelled"
            size="small"
            sx={{ bgcolor: theme.palette.action.disabledBackground, color: theme.palette.text.secondary }}
          />
        );
    }
  };

  const getPriorityChip = (priority: MaintenancePriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <Chip
            label="Urgent"
            size="small"
            color="error"
            variant="filled"
            sx={{ fontWeight: 700 }}
          />
        );
      case 'HIGH':
        return (
          <Chip
            label="High"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        );
      case 'MEDIUM':
        return <Chip label="Medium" size="small" variant="outlined" />;
      case 'LOW':
        return <Chip label="Low" size="small" variant="outlined" sx={{ color: 'text.secondary' }} />;
    }
  };

  if (requests.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: 1, borderColor: 'divider' }}>
        <Typography color="text.secondary" variant="h6">
          No maintenance requests match the selected filters.
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
          Try clearing filters or searching for a different keyword.
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
      <Table sx={{ minWidth: 800 }}>
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Ticket #</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Title & Category</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Reporter</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Assigned To</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Cost (Est / Act)</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((r) => (
            <TableRow
              key={r.id}
              hover
              onClick={() => onViewTicket(r)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                {r.ticketNumber}
              </TableCell>

              <TableCell>
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {r.title}
                  </Typography>
                  <Chip
                    label={r.category}
                    size="small"
                    variant="outlined"
                    sx={{ width: 'fit-content', fontSize: '0.7rem', height: 20 }}
                  />
                </Stack>
              </TableCell>

              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {r.locationSummary}
                </Typography>
              </TableCell>

              <TableCell>
                <Stack spacing={0.2}>
                  <Typography variant="body2">{r.reporterName}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    ({r.reporterType})
                  </Typography>
                </Stack>
              </TableCell>

              <TableCell>{getPriorityChip(r.priority)}</TableCell>

              <TableCell>{getStatusChip(r.status)}</TableCell>

              <TableCell>
                <Typography variant="body2">
                  {r.assignedToName || (
                    <Typography component="span" color="text.secondary" variant="caption">
                      Unassigned
                    </Typography>
                  )}
                </Typography>
              </TableCell>

              <TableCell>
                <Stack spacing={0.2}>
                  <Typography variant="body2">
                    {r.actualCostFormatted ? (
                      <strong style={{ color: theme.palette.success.dark }}>
                        {r.actualCostFormatted}
                      </strong>
                    ) : (
                      '--'
                    )}
                  </Typography>
                  {r.estimateCostFormatted && (
                    <Typography color="text.secondary" variant="caption">
                      Est: {r.estimateCostFormatted}
                    </Typography>
                  )}
                </Stack>
              </TableCell>

              <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                  <Tooltip title="View Request Details">
                    <IconButton size="small" onClick={() => onViewTicket(r)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {r.status !== 'RESOLVED' && r.status !== 'CANCELLED' && (
                    <Chip
                      label="Update Status"
                      size="small"
                      color="primary"
                      onClick={() => onUpdateStatus(r)}
                      sx={{ cursor: 'pointer' }}
                    />
                  )}
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
