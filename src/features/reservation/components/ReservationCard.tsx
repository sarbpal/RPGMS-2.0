import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PaymentsIcon from '@mui/icons-material/Payments';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { calculateOverdueDays, canEditReservation } from '../domain/rules/reservationRules';

interface ReservationCardProps {
  reservation: Reservation;
  onEdit: (reservation: Reservation) => void;
  onOpen: (reservation: Reservation) => void;
  onCancelRequest?: (reservation: Reservation) => void;
  onConvertAdmission?: (reservation: Reservation) => void; // CR-2.4 Admission trigger
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
  onEdit,
  onOpen,
  onCancelRequest,
  onConvertAdmission,
}) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const { isOverdue, overdueDays } = calculateOverdueDays(
    reservation.expectedJoiningDate,
    todayStr
  );
  const isToday = reservation.expectedJoiningDate === todayStr;
  const isTomorrow = reservation.expectedJoiningDate === tomorrowStr;

  const isEditable = canEditReservation(reservation.status).allowed;
  const isFollowUpRequired = reservation.status === ReservationStatus.FOLLOW_UP_REQUIRED;
  const isActive = reservation.status === ReservationStatus.ACTIVE;

  const getStatusChip = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.ACTIVE:
        return <Chip label="ACTIVE" size="small" color="primary" sx={{ fontWeight: 700 }} />;
      case ReservationStatus.FOLLOW_UP_REQUIRED:
        return <Chip label="FOLLOW-UP REQUIRED" size="small" color="warning" sx={{ fontWeight: 700 }} />;
      case ReservationStatus.CONVERTED:
        return <Chip label="CONVERTED" size="small" color="success" sx={{ fontWeight: 700 }} />;
      case ReservationStatus.CANCELLED:
        return <Chip label="CANCELLED" size="small" color="error" sx={{ fontWeight: 700 }} />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const isMobileDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isMobileDevice) {
      window.location.href = `tel:${reservation.mobileNumber}`;
    } else {
      navigator.clipboard.writeText(reservation.mobileNumber);
      setSnackbarOpen(true);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        opacity: reservation.status === ReservationStatus.CANCELLED ? 0.75 : 1,
        '&:hover': {
          boxShadow: '0 8px 24px rgba(148, 163, 184, 0.12)',
          borderColor: '#cbd5e1',
        },
      }}
    >
      {/* Top Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', letterSpacing: 0.5 }}>
          {reservation.reservationNumber}
        </Typography>
        {getStatusChip(reservation.status)}
      </Box>

      {/* Decision Support Badges */}
      <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {isOverdue && (reservation.status === ReservationStatus.ACTIVE || reservation.status === ReservationStatus.FOLLOW_UP_REQUIRED) && (
          <Chip
            icon={<WarningAmberIcon />}
            label={`Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`}
            size="small"
            sx={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              fontWeight: 700,
              border: '1px solid #fca5a5',
            }}
          />
        )}
        {isToday && (reservation.status === ReservationStatus.ACTIVE || reservation.status === ReservationStatus.FOLLOW_UP_REQUIRED) && (
          <Chip
            label="Arriving Today"
            size="small"
            sx={{
              backgroundColor: '#d1fae5',
              color: '#065f46',
              fontWeight: 700,
              border: '1px solid #6ee7b7',
            }}
          />
        )}
        {isTomorrow && (reservation.status === ReservationStatus.ACTIVE || reservation.status === ReservationStatus.FOLLOW_UP_REQUIRED) && (
          <Chip
            label="Arriving Tomorrow"
            size="small"
            sx={{
              backgroundColor: '#fef3c7',
              color: '#92400e',
              fontWeight: 700,
              border: '1px solid #fde68a',
            }}
          />
        )}
      </Box>

      {/* Prospect Name & Phone Icon */}
      <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
        {reservation.prospectName}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Tooltip title="Click to copy number / call">
          <IconButton size="small" onClick={handlePhoneClick} sx={{ p: 0.5, mr: 0.5, color: '#0284c7' }}>
            <LocalPhoneIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography
          variant="body2"
          onClick={handlePhoneClick}
          sx={{
            color: '#0284c7',
            fontWeight: 600,
            cursor: 'pointer',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {reservation.mobileNumber}
        </Typography>
      </Box>

      {/* Emphasized Expected Joining Date */}
      <Box sx={{ mb: 1.5, p: 1.2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: '#475569' }}>
          <CalendarMonthIcon fontSize="small" sx={{ mr: 1, color: '#64748b' }} />
          <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
            Expected Joining
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', ml: 3.5, mt: 0.2 }}>
          {new Date(reservation.expectedJoiningDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Typography>
      </Box>

      {/* Accommodation Preference */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <HomeWorkIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} />
        <Typography variant="body2" sx={{ color: '#334155' }}>
          <Box component="span" sx={{ fontWeight: 600 }}>Pref: </Box>
          {reservation.accommodationPreference || 'None specified'}
        </Typography>
      </Box>

      {/* Token Amount */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
        <PaymentsIcon fontSize="small" sx={{ mr: 1, color: '#94a3b8' }} />
        <Typography variant="body2" sx={{ color: '#334155' }}>
          <Box component="span" sx={{ fontWeight: 600 }}>Token Amount: </Box>
          {reservation.tokenAmount && reservation.tokenAmount > 0
            ? `₹${reservation.tokenAmount.toLocaleString('en-IN')}`
            : 'Waived'}
        </Typography>
      </Box>

      {/* Primary Convert to Admission Action for ACTIVE and FOLLOW_UP_REQUIRED Reservations (CR-2.4 & REF-003) */}
      {(isActive || isFollowUpRequired) && onConvertAdmission && (
        <Box sx={{ mb: 1.5 }}>
          <Button
            variant="contained"
            color="success"
            fullWidth
            size="small"
            startIcon={<HowToRegIcon />}
            onClick={() => onConvertAdmission(reservation)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, py: 0.8 }}
          >
            Convert to Admission
          </Button>
        </Box>
      )}

      {/* Footer Actions */}
      <Box sx={{ display: 'flex', gap: 1, pt: 1.5, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
        {isEditable && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={() => onEdit(reservation)}
            sx={{ flex: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Edit
          </Button>
        )}

        {isEditable && onCancelRequest && (
          <Tooltip title="Cancel Reservation">
            <IconButton
              size="small"
              color="error"
              onClick={() => onCancelRequest(reservation)}
              sx={{ border: '1px solid #fca5a5', borderRadius: 2 }}
            >
              <CancelIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

        <Button
          variant={isEditable ? 'contained' : 'outlined'}
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => onOpen(reservation)}
          sx={{ flex: isEditable ? 1 : 12, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Open
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Mobile number {reservation.mobileNumber} copied to clipboard!
        </Alert>
      </Snackbar>
    </Paper>
  );
};
