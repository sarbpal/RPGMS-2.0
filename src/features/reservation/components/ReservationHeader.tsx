import React from 'react';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Button,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { ReservationStatusChip } from './ReservationStatusChip';
import {
  canEditReservation,
  canCancelReservation,
  canConvertReservation,
  isReservationFollowUpRequired,
} from '../domain/rules/reservationRules';

interface ReservationHeaderProps {
  reservation: Reservation;
  onEdit: () => void;
  onCancel: () => void;
  onConvert: () => void;
  onViewAdmission?: () => void;
}

export const ReservationHeader: React.FC<ReservationHeaderProps> = ({
  reservation,
  onEdit,
  onCancel,
  onConvert,
  onViewAdmission,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isFollowUp = isReservationFollowUpRequired(reservation, todayStr);
  const isArrivingToday =
    reservation.status === ReservationStatus.ACTIVE &&
    reservation.expectedJoiningDate === todayStr;

  const editCheck = canEditReservation(reservation.status);
  const cancelCheck = canCancelReservation(reservation.status);
  const convertCheck = canConvertReservation(reservation.status);

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
          }}
        >
          {/* 1. Identity-First Info Block */}
          <Stack spacing={0.75}>
            {/* Prospect Name - Primary Dominant Identity */}
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
              {reservation.prospectName}
            </Typography>

            {/* Secondary Identifiers & Status Row */}
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.75 }}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                  px: 1,
                  py: 0.35,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  letterSpacing: 0.5,
                }}
              >
                {reservation.reservationNumber}
              </Typography>

              <ReservationStatusChip status={reservation.status} />

              {isArrivingToday && (
                <Chip
                  label="Arriving Today"
                  size="small"
                  color="success"
                  icon={<EventAvailableIcon />}
                  sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700 }}
                />
              )}

              {isFollowUp && (
                <Chip
                  label="Follow-up Required"
                  size="small"
                  color="warning"
                  icon={<WarningAmberIcon />}
                  sx={{ height: 24, fontSize: '0.72rem', fontWeight: 700 }}
                />
              )}
            </Stack>
          </Stack>

          {/* 2. Compact Lifecycle-Aware Action Bar */}
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            {reservation.status === ReservationStatus.ACTIVE && (
              <>
                {/* Primary Action */}
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<HowToRegIcon />}
                  disabled={!convertCheck.allowed}
                  onClick={onConvert}
                  sx={{ fontWeight: 700, textTransform: 'none', px: 2 }}
                >
                  Convert to Admission
                </Button>

                {/* Secondary Action */}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  disabled={!editCheck.allowed}
                  onClick={onEdit}
                  sx={{ fontWeight: 600, textTransform: 'none' }}
                >
                  Edit
                </Button>

                {/* Destructive Action (Directly visible, lower visual weight) */}
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<CancelIcon />}
                  disabled={!cancelCheck.allowed}
                  onClick={onCancel}
                  sx={{ fontWeight: 600, textTransform: 'none' }}
                >
                  Cancel Reservation
                </Button>
              </>
            )}

            {reservation.status === ReservationStatus.CONVERTED && onViewAdmission && (
              <Button
                variant="contained"
                color="primary"
                size="small"
                endIcon={<ArrowForwardIcon />}
                onClick={onViewAdmission}
                sx={{ fontWeight: 700, textTransform: 'none', px: 2 }}
              >
                View Admission / Stay
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
