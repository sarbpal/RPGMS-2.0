import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CancelIcon from '@mui/icons-material/Cancel';
import HistoryIcon from '@mui/icons-material/History';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
  onViewHistory?: () => void;
}

export const ReservationHeader: React.FC<ReservationHeaderProps> = ({
  reservation,
  onEdit,
  onCancel,
  onConvert,
  onViewAdmission,
  onViewHistory,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

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

            {/* Overflow Menu (•••) */}
            <IconButton
              size="small"
              onClick={handleOpenMenu}
              aria-label="more reservation actions"
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={isMenuOpen}
              onClose={handleCloseMenu}
              slotProps={{ paper: { sx: { minWidth: 180, borderRadius: 2 } } }}
            >
              {reservation.status === ReservationStatus.ACTIVE && (
                <MenuItem
                  onClick={() => {
                    handleCloseMenu();
                    onCancel();
                  }}
                  disabled={!cancelCheck.allowed}
                  sx={{ color: 'error.main' }}
                >
                  <ListItemIcon sx={{ color: 'error.main' }}>
                    <CancelIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Cancel Reservation" />
                </MenuItem>
              )}

              <MenuItem
                onClick={() => {
                  handleCloseMenu();
                  onViewHistory?.();
                }}
              >
                <ListItemIcon>
                  <HistoryIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="View Edit History" />
              </MenuItem>
            </Menu>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};
