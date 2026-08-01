import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Divider,
  Paper,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PaymentsIcon from '@mui/icons-material/Payments';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { calculateOverdueDays, canEditReservation, canCancelReservation } from '../domain/rules/reservationRules';

interface ReservationDetailModalProps {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onEdit: (reservation: Reservation) => void;
  onCancelRequest?: (reservation: Reservation) => void;
  onConvertAdmission?: (reservation: Reservation) => void;
}

export const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  open,
  onClose,
  reservation,
  onEdit,
  onCancelRequest,
  onConvertAdmission,
}) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  if (!reservation) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const { isOverdue, overdueDays } = calculateOverdueDays(reservation.expectedJoiningDate, todayStr);
  const isEditable = canEditReservation(reservation.status).allowed;
  const isCancellable = canCancelReservation(reservation.status).allowed;

  const handlePhoneClick = () => {
    const isMobileDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isMobileDevice) {
      window.location.href = `tel:${reservation.mobileNumber}`;
    } else {
      navigator.clipboard.writeText(reservation.mobileNumber);
      setSnackbarOpen(true);
    }
  };

  // Helper function to return business icon for audit history timeline (Refinement #5)
  const getAuditIcon = (action: string) => {
    switch (action) {
      case 'Reservation Created':
        return <AddCircleOutlinedIcon fontSize="small" sx={{ color: '#0284c7', mr: 1 }} />;
      case 'Reservation Updated':
        return <EditNoteIcon fontSize="small" sx={{ color: '#6366f1', mr: 1 }} />;
      case 'Joining Date Updated':
        return <EventIcon fontSize="small" sx={{ color: '#d97706', mr: 1 }} />;
      case 'Token Updated':
        return <PaymentsIcon fontSize="small" sx={{ color: '#059669', mr: 1 }} />;
      case 'Reservation Cancelled':
        return <CancelIcon fontSize="small" sx={{ color: '#dc2626', mr: 1 }} />;
      case 'Status Updated':
        return <AutorenewIcon fontSize="small" sx={{ color: '#8b5cf6', mr: 1 }} />;
      default:
        return <HistoryIcon fontSize="small" sx={{ color: '#64748b', mr: 1 }} />;
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 480 }, p: 3 } } }}>
      {/* Drawer Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
          Reservation Details ({reservation.reservationNumber})
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Prominently Displayed Expected Joining Date */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: 3,
          backgroundColor: '#f0f9ff',
          border: '1.5px solid #0284c7',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', color: '#0369a1', mb: 0.5 }}>
          <CalendarMonthIcon sx={{ mr: 1, fontSize: 24 }} />
          <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Prominent Expected Joining Date
          </Typography>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c4a6e', ml: 4 }}>
          {new Date(reservation.expectedJoiningDate).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Typography>

        {isOverdue && (reservation.status === ReservationStatus.ACTIVE || reservation.status === ReservationStatus.FOLLOW_UP_REQUIRED) && (
          <Box sx={{ mt: 1.5, ml: 4 }}>
            <Chip
              icon={<WarningAmberIcon />}
              label={`Overdue by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'}`}
              size="small"
              sx={{ backgroundColor: '#fee2e2', color: '#991b1b', fontWeight: 700 }}
            />
          </Box>
        )}
      </Paper>

      {/* Prospect Information */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 1.5 }}>
        Prospect Identity
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PersonIcon sx={{ mr: 1.5, color: '#64748b' }} />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Prospect Name</Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>{reservation.prospectName}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title="Click to copy number / call">
            <IconButton onClick={handlePhoneClick} size="small" sx={{ p: 0.5, mr: 1, color: '#0284c7' }}>
              <LocalPhoneIcon />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Mobile Number</Typography>
            <Typography
              variant="subtitle1"
              onClick={handlePhoneClick}
              sx={{ fontWeight: 700, color: '#0284c7', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
              {reservation.mobileNumber}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Preferences & Token Info */}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', mb: 1.5 }}>
        Preferences & Token
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <HomeWorkIcon sx={{ mr: 1.5, color: '#64748b', mt: 0.3 }} />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Accommodation Preference</Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
              {reservation.accommodationPreference || 'None specified'}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <PaymentsIcon sx={{ mr: 1.5, color: '#64748b', mt: 0.3 }} />
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>Token Payment</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0f172a' }}>
              {reservation.tokenAmount && reservation.tokenAmount > 0
                ? `₹${reservation.tokenAmount.toLocaleString('en-IN')}`
                : 'Waived'}
            </Typography>
            {reservation.tokenReceivedOn && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Received On: {reservation.tokenReceivedOn}
              </Typography>
            )}
            {reservation.tokenRemarks && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Remarks: {reservation.tokenRemarks}
              </Typography>
            )}
          </Box>
        </Box>

        {reservation.notes && (
          <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block' }}>Notes</Typography>
            <Typography variant="body2" sx={{ color: '#334155' }}>{reservation.notes}</Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Audit History Timeline with Business Icons (Refinement #5) */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
        <HistoryIcon sx={{ mr: 1, color: '#64748b' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
          Audit History Timeline
        </Typography>
      </Box>

      <Box sx={{ mb: 4 }}>
        {reservation.auditLog.map((log, index) => (
          <Box key={index} sx={{ mb: 2, pl: 2, borderLeft: '2px solid #cbd5e1', position: 'relative' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {getAuditIcon(log.action)}
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                {log.action} — {new Date(log.timestamp).toLocaleString()}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', ml: 3.5, mt: 0.2 }}>
              {log.details}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Drawer Action Buttons (Read-Only Enforcement) */}
      <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {(reservation.status === ReservationStatus.ACTIVE || reservation.status === ReservationStatus.FOLLOW_UP_REQUIRED) && onConvertAdmission && (
          <Button
            variant="contained"
            color="success"
            fullWidth
            startIcon={<HowToRegIcon />}
            onClick={() => {
              onClose();
              onConvertAdmission(reservation);
            }}
            sx={{ fontWeight: 800, py: 1.2 }}
          >
            Convert to Admission
          </Button>
        )}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {isCancellable && onCancelRequest && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => {
                onClose();
                onCancelRequest(reservation);
              }}
              sx={{ fontWeight: 700, py: 1 }}
            >
              Cancel Reservation
            </Button>
          )}
          {isEditable ? (
            <Button
              variant="contained"
              fullWidth
              startIcon={<EditIcon />}
              onClick={() => {
                onClose();
                onEdit(reservation);
              }}
              sx={{ fontWeight: 700, py: 1 }}
            >
              Edit Reservation
            </Button>
          ) : (
            <Button variant="outlined" disabled fullWidth sx={{ fontWeight: 700, py: 1 }}>
              Read-Only ({reservation.status})
            </Button>
          )}
        </Box>
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
    </Drawer>
  );
};
