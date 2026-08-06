import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatusChip } from './ReservationStatusChip';
import { EmptyState } from '../../../components/EmptyState';

interface ReservationsTableProps {
  reservations: Reservation[];
  onSelectReservation?: (reservation: Reservation) => void;
}

export function ReservationsTable({
  reservations,
  onSelectReservation,
}: ReservationsTableProps) {
  if (!reservations || reservations.length === 0) {
    return (
      <EmptyState
        title="No Reservations Found"
        description="There are currently no reservation records in the repository."
      />
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTokenStatus = (amount?: number) => {
    if (amount && amount > 0) {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return 'No Token';
  };

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table sx={{ minWidth: 700 }} aria-label="reservations table">
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Reservation #</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Prospect Name</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Expected Joining</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Preference</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Token Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow
              key={reservation.id}
              hover
              onClick={() => onSelectReservation?.(reservation)}
              sx={{
                cursor: 'pointer',
                '&:last-child td, &:last-child th': { border: 0 },
              }}
            >
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    fontFamily: 'monospace',
                  }}
                >
                  {reservation.reservationNumber}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {reservation.prospectName}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {reservation.mobileNumber}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  {formatDate(reservation.expectedJoiningDate)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {reservation.accommodationPreference || '—'}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: reservation.tokenAmount && reservation.tokenAmount > 0 ? 600 : 400,
                    color: reservation.tokenAmount && reservation.tokenAmount > 0 ? 'success.main' : 'text.secondary',
                  }}
                >
                  {formatTokenStatus(reservation.tokenAmount)}
                </Typography>
              </TableCell>
              <TableCell>
                <ReservationStatusChip status={reservation.status} />
              </TableCell>
              <TableCell>
                <Typography variant="body2" color="text.secondary">
                  {formatDate(reservation.createdAt)}
                </Typography>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
