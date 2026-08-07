import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  Alert,
  Box,
  Divider,
  Paper,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Bolt, CheckCircle } from '@mui/icons-material';
import { Meter } from '../domain';
import { ElectricityApplicationService, defaultElectricityService } from '../services/electricityService';

export interface RecordMeterReadingModalProps {
  open: boolean;
  onClose: () => void;
  meter: Meter | null;
  service?: ElectricityApplicationService;
  onSuccess?: () => void;
}

export const RecordMeterReadingModal: React.FC<RecordMeterReadingModalProps> = ({
  open,
  onClose,
  meter,
  service = defaultElectricityService,
  onSuccess,
}) => {
  const [readingPeriod, setReadingPeriod] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [currentReadingInput, setCurrentReadingInput] = useState<string>('');
  const [remarksInput, setRemarksInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  useEffect(() => {
    if (meter) {
      setCurrentReadingInput(String(meter.lastReadingValue));
      setErrorAlert(null);
    }
  }, [meter]);

  if (!meter) return null;

  const currentReadingNum = parseFloat(currentReadingInput);
  const isReadingValid =
    !isNaN(currentReadingNum) && currentReadingNum >= meter.lastReadingValue;

  // Generate Stage 1 preview on demand
  const preview = isReadingValid
    ? service.generateReadingPreview(meter.id, currentReadingNum, readingPeriod)
    : null;

  const handleSubmit = () => {
    setErrorAlert(null);
    if (!isReadingValid) {
      setErrorAlert(
        `Current reading (${currentReadingInput}) cannot be less than previous reading (${meter.lastReadingValue}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = service.recordMeterReading(
        meter.id,
        currentReadingNum,
        readingPeriod,
        new Date().toISOString().split('T')[0],
        'Property Manager',
        remarksInput
      );

      if (result.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorAlert(result.errors.join(' | '));
      }
    } catch (err: any) {
      setErrorAlert(err.message || 'An unexpected error occurred during meter reading submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700 }}>
        <Bolt color="warning" /> Record Electricity Meter Reading
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {errorAlert && <Alert severity="error">{errorAlert}</Alert>}

          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Meter Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {meter.meterNumber}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Previous Reading
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {meter.lastReadingValue} kWh
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Reading Period (YYYY-MM)"
              value={readingPeriod}
              onChange={(e) => setReadingPeriod(e.target.value)}
              fullWidth
              size="small"
              placeholder="2026-08"
            />
            <TextField
              label="Current Reading (kWh)"
              type="number"
              value={currentReadingInput}
              onChange={(e) => setCurrentReadingInput(e.target.value)}
              fullWidth
              size="small"
              error={!isReadingValid && currentReadingInput !== ''}
              helperText={
                !isReadingValid && currentReadingInput !== ''
                  ? `Must be >= ${meter.lastReadingValue}`
                  : 'Monotonic meter reading'
              }
            />
          </Stack>

          <TextField
            label="Remarks / Notes (Optional)"
            value={remarksInput}
            onChange={(e) => setRemarksInput(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
          />

          {/* Stage 1 Preview Calculation Output */}
          {preview && preview.success && (
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', borderColor: 'primary.light' }}>
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                Stage 1 Allocation Preview
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Units Consumed:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {preview.unitsConsumed} kWh
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Calculated Bill:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                    ₹{preview.totalBillAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Flat Occupant Split Allocations ({preview.eligibleStays.length} active stays):
                </Typography>
                {preview.eligibleStays.length === 0 ? (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    No active residents found in flat. Zero billing created.
                  </Alert>
                ) : (
                  preview.eligibleStays.map((st) => (
                    <Box
                      key={st.stayId}
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <Typography variant="caption">{st.residentName}</Typography>
                      <Chip
                        label={`₹${st.allocatedAmount.toFixed(2)} (${st.allocatedUnits} kWh)`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  ))
                )}
              </Stack>
            </Paper>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
          disabled={isSubmitting || !isReadingValid}
        >
          Confirm & Post Utility Bills
        </Button>
      </DialogActions>
    </Dialog>
  );
};
