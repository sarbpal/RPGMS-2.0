import React from 'react';
import {
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatusChip } from './ReservationStatusChip';
import { EmptyState } from '../../../components/EmptyState';
import { isReservationFollowUpRequired } from '../domain/rules/reservationRules';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';

interface ReservationsTableProps {
  reservations: Reservation[];
  activeFilter?: string;
  searchQuery?: string;
  onSelectReservation?: (reservation: Reservation) => void;
  onNewReservation?: () => void;
  onClearSearch?: () => void;
}

export const ReservationsTable: React.FC<ReservationsTableProps> = ({
  reservations,
  activeFilter = 'ALL',
  searchQuery = '',
  onSelectReservation,
  onNewReservation,
  onClearSearch,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

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

  if (!reservations || reservations.length === 0) {
    if (searchQuery.trim()) {
      return (
        <EmptyState
          icon={<SearchOffIcon />}
          title="No Matching Reservations"
          description={`No reservations match your search "${searchQuery}".`}
          action={
            onClearSearch && (
              <Button
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={onClearSearch}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Clear Search
              </Button>
            )
          }
        />
      );
    }

    if (activeFilter === 'ARRIVING_TODAY' || activeFilter === 'TODAY') {
      return (
        <EmptyState
          icon={<EventBusyIcon />}
          title="No Reservations Arriving Today"
          description="There are no active reservations with an expected joining date of today."
        />
      );
    }

    if (activeFilter === 'FOLLOW_UP_REQUIRED') {
      return (
        <EmptyState
          icon={<CheckCircleOutlinedIcon color="success" />}
          title="No Follow-ups Required"
          description="There are no active reservations requiring follow-up."
        />
      );
    }

    if (activeFilter === 'ACTIVE') {
      return (
        <EmptyState
          icon={<EventBusyIcon />}
          title="No Active Reservations"
          description="There are currently no prospects awaiting admission."
          action={
            onNewReservation && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onNewReservation}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Create Reservation
              </Button>
            )
          }
        />
      );
    }

    if (activeFilter === 'CONVERTED') {
      return (
        <EmptyState
          icon={<EventBusyIcon />}
          title="No Converted Reservations"
          description="No reservations have been converted to admissions yet."
        />
      );
    }

    if (activeFilter === 'CANCELLED') {
      return (
        <EmptyState
          icon={<EventBusyIcon />}
          title="No Cancelled Reservations"
          description="No reservations have been cancelled."
        />
      );
    }

    return (
      <EmptyState
        icon={<EventBusyIcon />}
        title="No Reservations to Display"
        description="Your reservation pipeline is currently empty."
        action={
          onNewReservation && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={onNewReservation}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Create Reservation
            </Button>
          )
        }
      />
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2.5 }}>
      <Table sx={{ minWidth: 640 }} aria-label="reservations portfolio table">
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, py: 1.75 }}>Prospect Details</TableCell>
            <TableCell sx={{ fontWeight: 700, py: 1.75 }}>Expected Joining</TableCell>
            <TableCell sx={{ fontWeight: 700, py: 1.75 }}>Accommodation Preference</TableCell>
            <TableCell sx={{ fontWeight: 700, py: 1.75 }}>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {reservations.map((reservation) => {
            const isFollowUp = isReservationFollowUpRequired(reservation, todayStr);
            const isArrivingToday =
              reservation.status === ReservationStatus.ACTIVE &&
              reservation.expectedJoiningDate === todayStr;

            return (
              <TableRow
                key={reservation.id}
                hover
                onClick={() => onSelectReservation?.(reservation)}
                sx={{
                  cursor: 'pointer',
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
              >
                {/* 1. Name-First Visual Hierarchy */}
                <TableCell sx={{ py: 1.5 }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {reservation.prospectName}
                      </Typography>
                      {isArrivingToday && (
                        <Chip
                          label="Arriving Today"
                          size="small"
                          color="success"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      )}
                      {isFollowUp && (
                        <Chip
                          label="Follow-up"
                          size="small"
                          color="warning"
                          sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'primary.main',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                      }}
                    >
                      {reservation.reservationNumber}
                    </Typography>
                  </Stack>
                </TableCell>

                {/* 2. Expected Joining */}
                <TableCell sx={{ py: 1.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: isArrivingToday ? 700 : 500 }}>
                    {formatDate(reservation.expectedJoiningDate)}
                  </Typography>
                </TableCell>

                {/* 3. Preference */}
                <TableCell sx={{ py: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {reservation.accommodationPreference || '—'}
                  </Typography>
                </TableCell>

                {/* 4. Lifecycle Status */}
                <TableCell sx={{ py: 1.5 }}>
                  <ReservationStatusChip status={reservation.status} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
