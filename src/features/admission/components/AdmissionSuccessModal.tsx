import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import HotelIcon from '@mui/icons-material/Hotel';
import PaymentsIcon from '@mui/icons-material/Payments';
import KeyIcon from '@mui/icons-material/Key';
import type { AdmissionResult } from '../application/models/AdmissionResult';

interface AdmissionSuccessModalProps {
  open: boolean;
  onClose: () => void;
  result: AdmissionResult | null;
  onViewResidentProfile?: (residentCode: string) => void;
  onViewStayWorkspace?: (stayId: string) => void;
}

export const AdmissionSuccessModal: React.FC<AdmissionSuccessModalProps> = ({
  open,
  onClose,
  result,
  onViewResidentProfile,
  onViewStayWorkspace,
}) => {
  if (!result) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, p: 1 } } }}>
      <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
        <CheckCircleIcon sx={{ fontSize: 56, color: '#16a34a', mb: 1 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a' }}>
          Admission Confirmed Successfully!
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Converted Reservation <strong>{result.reservationNumber}</strong> into Active Resident & Stay.
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ px: 3 }}>
        {/* Resident ID Badge (Refinement #5) */}
        <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: 2.5, backgroundColor: '#f0fdf4', border: '1.5px solid #16a34a' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <KeyIcon sx={{ mr: 1, color: '#16a34a' }} />
              <Box>
                <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 700, textTransform: 'uppercase' }}>
                  Generated Resident ID
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#14532d' }}>
                  {result.residentCode}
                </Typography>
              </Box>
            </Box>
            <Chip label="ACTIVE RESIDENT" color="success" size="small" sx={{ fontWeight: 700 }} />
          </Box>
        </Paper>

        {/* Stay & Accommodation Summary (Refinement #5) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <PersonIcon fontSize="small" sx={{ mr: 1, color: '#64748b' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>Resident</Typography>
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>{result.residentName}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Stay ID: {result.stayId}</Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <HotelIcon fontSize="small" sx={{ mr: 1, color: '#64748b' }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>Accommodation</Typography>
            </Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>{result.allocatedFlatNumber}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Beds: {result.allocatedBedNumbers.join(', ')}</Typography>
          </Paper>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Agreed Terms & Token Disposition Breakdown (Refinement #5) */}
        <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#f0f9ff', border: '1px solid #bae6fd' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: '#0369a1' }}>
            <PaymentsIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Financials & Token Adjustment</Typography>
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#0c4a6e', mb: 0.5 }}>
            Agreed Rent: ₹{result.agreedRent.toLocaleString('en-IN')} / mo | Deposit: ₹{result.agreedDeposit.toLocaleString('en-IN')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#0369a1', fontWeight: 600 }}>
            Token Applied: {result.appliedTokenDisposition} (₹{result.tokenAmount.toLocaleString('en-IN')})
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, justifyContent: 'space-between' }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Close
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onViewResidentProfile && (
            <Button
              variant="outlined"
              onClick={() => {
                onClose();
                onViewResidentProfile(result.residentCode);
              }}
              sx={{ fontWeight: 700 }}
            >
              View Resident Profile
            </Button>
          )}
          {onViewStayWorkspace && (
            <Button
              variant="contained"
              onClick={() => {
                onClose();
                onViewStayWorkspace(result.stayId);
              }}
              sx={{ fontWeight: 700 }}
            >
              View Stay Workspace
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};
