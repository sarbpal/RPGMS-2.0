import {
  Alert,
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
import {
  Build as BuildIcon,
  CheckCircle as CompleteIcon,
  Hotel as HotelIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
} from '@mui/icons-material';

import type { Bed } from '../domain';
import { BedStatus, canBlockBed, canCompleteMaintenance, canStartMaintenance, canUnblockBed } from '../domain';

interface BedDetailsDialogProps {
  open: boolean;
  bed: Bed | null;
  flatId?: string;
  flatName?: string;
  areaName?: string;
  onClose: () => void;
  onBlockBed: (flatId: string, bedId: string) => void;
  onUnblockBed: (flatId: string, bedId: string) => void;
  onStartMaintenance: (flatId: string, bedId: string) => void;
  onCompleteMaintenance: (flatId: string, bedId: string) => void;
}

export function BedDetailsDialog({
  open,
  bed,
  flatId,
  flatName,
  areaName,
  onClose,
  onBlockBed,
  onUnblockBed,
  onStartMaintenance,
  onCompleteMaintenance,
}: BedDetailsDialogProps) {
  if (!bed) return null;

  const getStatusChip = (status: BedStatus) => {
    switch (status) {
      case BedStatus.VACANT:
        return <Chip color="success" label="Vacant" variant="outlined" sx={{ fontWeight: 600 }} />;
      case BedStatus.OCCUPIED:
        return <Chip color="primary" label="Occupied" sx={{ fontWeight: 600 }} />;
      case BedStatus.ON_NOTICE:
        return <Chip color="warning" label="On Notice" sx={{ fontWeight: 600 }} />;
      case BedStatus.RESERVED:
        return <Chip color="info" label="Reserved" sx={{ fontWeight: 600 }} />;
      case BedStatus.MAINTENANCE:
        return <Chip color="error" label="Maintenance" variant="outlined" sx={{ fontWeight: 600 }} />;
      case BedStatus.BLOCKED:
        return <Chip color="error" label="Blocked" sx={{ fontWeight: 600 }} />;
      default:
        return <Chip label={status} sx={{ fontWeight: 600 }} />;
    }
  };

  const blockCheck = canBlockBed(bed);
  const unblockCheck = canUnblockBed(bed);
  const startMaintCheck = canStartMaintenance(bed);
  const completeMaintCheck = canCompleteMaintenance(bed);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HotelIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Bed {bed.id}
            </Typography>
          </Box>
          {getStatusChip(bed.status)}
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5 }}>
        <Stack spacing={3}>
          {/* Section 1: Details First */}
          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
                  Flat
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {flatName || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
                  Area
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {areaName || 'N/A'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
                  Default Rent
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  ₹{bed.defaultRent || 0} / mo
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
                  Default Deposit
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  ₹{bed.defaultDeposit || 0}
                </Typography>
              </Box>

              <Box sx={{ gridColumn: 'span 2' }}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 500 }}>
                  Occupant Status
                </Typography>
                {bed.residentName ? (
                  <Typography variant="body1" color="primary.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                    {bed.residentName}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                    No resident currently assigned
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          {/* Section 2: Business Operations */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Available Business Operations
            </Typography>

            {bed.status === BedStatus.OCCUPIED || bed.status === BedStatus.ON_NOTICE ? (
              <Alert severity="info">
                Bed status is managed via Stay lifecycle operations (Check-in, Checkout, Notice). Manual status changes are prohibited while occupied.
              </Alert>
            ) : (
              <Stack spacing={1.5}>
                {blockCheck.allowed && flatId && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LockIcon />}
                    onClick={() => handleAction(() => onBlockBed(flatId, bed.id))}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Block Bed (Administrative Hold)
                  </Button>
                )}

                {unblockCheck.allowed && flatId && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<UnlockIcon />}
                    onClick={() => handleAction(() => onUnblockBed(flatId, bed.id))}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Unblock Bed (Release to Vacant)
                  </Button>
                )}

                {startMaintCheck.allowed && flatId && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<BuildIcon />}
                    onClick={() => handleAction(() => onStartMaintenance(flatId, bed.id))}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Put Bed into Maintenance
                  </Button>
                )}

                {completeMaintCheck.allowed && flatId && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CompleteIcon />}
                    onClick={() => handleAction(() => onCompleteMaintenance(flatId, bed.id))}
                    fullWidth
                    sx={{ justifyContent: 'flex-start' }}
                  >
                    Complete Maintenance (Release to Vacant)
                  </Button>
                )}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
