import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Divider,
  Chip,
  Checkbox,
  FormGroup,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import type { Reservation } from '../../reservation/domain/entities/Reservation';
import { TokenDisposition } from '../domain/valueObjects/TokenDisposition';
import type { AdmissionDraft } from '../application/models/AdmissionDraft';
import { AdmissionCoordinator } from '../application/coordinator/AdmissionCoordinator';
import { AdmissionReadinessPanel } from './AdmissionReadinessPanel';
import { TokenAdjustmentPreview } from './TokenAdjustmentPreview';
import type { AdmissionResult } from '../application/models/AdmissionResult';
import { ResidentIdentityForm, type ResidentIdentityFormData } from '../../resident';

interface AdmissionWorkspaceModalProps {
  open: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  onAdmissionConfirmed: (result: AdmissionResult) => void;
  coordinator?: AdmissionCoordinator;
}

export const AdmissionWorkspaceModal: React.FC<AdmissionWorkspaceModalProps> = ({
  open,
  onClose,
  reservation,
  onAdmissionConfirmed,
  coordinator = new AdmissionCoordinator(),
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Section 2 State using Shared ResidentIdentityForm
  const [residentFormData, setResidentFormData] = useState<ResidentIdentityFormData>({
    fullName: '',
    mobileNumber: '',
    idProofType: 'Aadhaar',
    idProofNumber: '',
  });

  // Section 3 State
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [agreedRent, setAgreedRent] = useState<number | ''>(8000);
  const [agreedDeposit, setAgreedDeposit] = useState<number | ''>(6500);

  // Section 4 State
  const [flatId, setFlatId] = useState('flat-101');
  const [selectedBedIds, setSelectedBedIds] = useState<string[]>(['bed-101-a']);

  // Section 5 State
  const [tokenDisposition, setTokenDisposition] = useState<TokenDisposition>(
    TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT
  );
  const [notes] = useState('');

  // Section 4 Dynamic Accommodation Sourcing (CR-3.2)
  const availableFlats = coordinator.getAvailableFlats();
  const currentFlat = availableFlats.find((f) => f.id === flatId) || availableFlats[0];

  // Populate from reservation on open
  useEffect(() => {
    if (reservation && open) {
      const flats = coordinator.getAvailableFlats();
      const defaultFlat = flats.length > 0 ? flats[0] : null;
      const initialFlatId = defaultFlat ? defaultFlat.id : 'flat-101';
      const initialBedIds = defaultFlat && defaultFlat.vacantBeds.length > 0 ? [defaultFlat.vacantBeds[0].id] : ['bed-101-a'];

      setResidentFormData({
        fullName: reservation.prospectName || '',
        mobileNumber: reservation.mobileNumber || '',
        idProofType: 'Aadhaar',
        idProofNumber: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelationship: '',
      });
      setCheckInDate(reservation.expectedJoiningDate || todayStr);
      setAgreedRent(8000);
      setAgreedDeposit(6500);
      setFlatId(initialFlatId);
      setSelectedBedIds(initialBedIds);
      setTokenDisposition(
        reservation.tokenAmount && reservation.tokenAmount > 0
          ? TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT
          : TokenDisposition.LEAVE_PENDING
      );
    }
  }, [reservation, open]);

  if (!reservation) return null;

  const currentDraft: AdmissionDraft = {
    reservationId: reservation.id,
    residentName: residentFormData.fullName,
    mobileNumber: residentFormData.mobileNumber,
    emergencyContactName: residentFormData.emergencyContactName || '',
    emergencyContactRelationship: residentFormData.emergencyContactRelationship || '',
    emergencyContactPhone: residentFormData.emergencyContactPhone || '',
    permanentAddress: residentFormData.permanentAddressLine1 || '',
    idProofType: residentFormData.idProofType,
    idProofNumber: residentFormData.idProofNumber,
    checkInDate,
    agreedRent,
    agreedDeposit,
    flatId,
    bedIds: selectedBedIds,
    tokenDisposition,
    notes,
  };

  const readiness = coordinator.evaluateReadiness(currentDraft, reservation);
  const preview = coordinator.calculateTokenAdjustmentPreview(
    Number(agreedRent || 0),
    Number(agreedDeposit || 0),
    reservation.tokenAmount || 0,
    tokenDisposition
  );

  const handleFlatChange = (newFlatId: string) => {
    setFlatId(newFlatId);
    const target = availableFlats.find((f) => f.id === newFlatId);
    if (target && target.vacantBeds.length > 0) {
      setSelectedBedIds([target.vacantBeds[0].id]);
    } else {
      setSelectedBedIds([]);
    }
  };

  const handleBedToggle = (bedId: string) => {
    setSelectedBedIds((prev) =>
      prev.includes(bedId) ? prev.filter((id) => id !== bedId) : [...prev, bedId]
    );
  };

  const handleConfirm = () => {
    try {
      const selectedFlatObj = availableFlats.find((f) => f.id === flatId);
      const flatName = selectedFlatObj ? selectedFlatObj.name : 'Flat 101';
      const bedNames = selectedFlatObj
        ? selectedFlatObj.vacantBeds.filter((b) => selectedBedIds.includes(b.id)).map((b) => b.name)
        : selectedBedIds.map((id) => id.replace('bed-101-', 'Bed ').toUpperCase());

      const result = coordinator.confirmReservedAdmission(
        currentDraft,
        reservation,
        flatName,
        bedNames
      );
      onAdmissionConfirmed(result);
      onClose();
    } catch (err: any) {
      alert(`Admission Failed: ${err.message}`);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: '90vh' } } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 1, color: '#0f172a' }}>
        Reserved Admission Workspace ({reservation.reservationNumber})
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3 }}>
          {/* Main Left Input Column (Sections 1-5 simultaneously, Refinement #1) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Section 1: Reservation Context (Read-only Summary) */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
                Section 1: Active Reservation Context
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>
                {reservation.prospectName} ({reservation.reservationNumber})
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Mobile: {reservation.mobileNumber} | Token: {reservation.tokenAmount ? `₹${reservation.tokenAmount.toLocaleString('en-IN')}` : 'Waived'}
              </Typography>
              {reservation.accommodationPreference && (
                <Chip
                  icon={<StarIcon sx={{ fontSize: '16px !important' }} />}
                  label={`Preference: ${reservation.accommodationPreference}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mt: 1, fontWeight: 600 }}
                />
              )}
            </Paper>

            {/* Section 2: Resident Identity Details using Shared Component */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                Section 2: Resident Identity Details
              </Typography>
              <ResidentIdentityForm
                mode="onboarding"
                value={residentFormData}
                onChange={setResidentFormData}
              />
            </Box>

            <Divider />

            {/* Section 3: Commercial Terms */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                Section 3: Commercial Terms
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField
                  label="Check-in Date *"
                  type="date"
                  size="small"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  label="Monthly Rent (₹) *"
                  type="number"
                  size="small"
                  value={agreedRent}
                  onChange={(e) => setAgreedRent(e.target.value !== '' ? Number(e.target.value) : '')}
                />
                <TextField
                  label="Security Deposit (₹) *"
                  type="number"
                  size="small"
                  value={agreedDeposit}
                  onChange={(e) => setAgreedDeposit(e.target.value !== '' ? Number(e.target.value) : '')}
                />
              </Box>
            </Box>

            <Divider />

            {/* Section 4: Accommodation & Bed Selection */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                Section 4: Accommodation & Bed Allocation
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1.5 }}>
                <TextField
                  select
                  label="Select Flat *"
                  size="small"
                  value={flatId}
                  onChange={(e) => handleFlatChange(e.target.value)}
                >
                  {availableFlats.length > 0 ? (
                    availableFlats.map((f) => (
                      <MenuItem key={f.id} value={f.id}>
                        {f.name} ({f.vacantBeds.length} vacant beds)
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="flat-101">Flat 101 (1st Floor)</MenuItem>
                  )}
                </TextField>

                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 0.5 }}>
                    Select Vacant Bed(s) in {currentFlat ? currentFlat.name : 'Flat'} *
                  </Typography>
                  {currentFlat && currentFlat.vacantBeds.length > 0 ? (
                    <FormGroup row>
                      {currentFlat.vacantBeds.map((bed) => (
                        <FormControlLabel
                          key={bed.id}
                          control={
                            <Checkbox
                              checked={selectedBedIds.includes(bed.id)}
                              onChange={() => handleBedToggle(bed.id)}
                              size="small"
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{bed.name}</Typography>}
                        />
                      ))}
                    </FormGroup>
                  ) : (
                    <Typography variant="caption" color="error">
                      No vacant beds available in selected flat.
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Box>

            <Divider />

            {/* Section 5: Token Disposition & Decision Support Preview */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
                Section 5: Token Disposition Choice
              </Typography>

              {reservation.tokenAmount && reservation.tokenAmount > 0 ? (
                <FormControl component="fieldset" sx={{ mb: 2 }}>
                  <RadioGroup
                    value={tokenDisposition}
                    onChange={(e) => setTokenDisposition(e.target.value as TokenDisposition)}
                  >
                    <FormControlLabel
                      value={TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Adjust to Security Deposit</Typography>}
                    />
                    <FormControlLabel
                      value={TokenDisposition.ADJUST_TO_FIRST_RENT}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Adjust to First Month Rent</Typography>}
                    />
                    <FormControlLabel
                      value={TokenDisposition.LEAVE_PENDING}
                      control={<Radio size="small" />}
                      label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Leave Pending / No Adjustment</Typography>}
                    />
                  </RadioGroup>
                </FormControl>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
                  No token recorded. Token disposition skipped.
                </Typography>
              )}

              {/* Decision Support Token Adjustment Preview (Refinement #4) */}
              <TokenAdjustmentPreview
                agreedRent={Number(agreedRent || 0)}
                agreedDeposit={Number(agreedDeposit || 0)}
                tokenAmount={reservation.tokenAmount || 0}
                disposition={tokenDisposition}
                previewSummaryText={preview.summaryText}
                adjustedDepositBalance={preview.adjustedDepositBalance}
                adjustedRentBalance={preview.adjustedRentBalance}
              />
            </Box>
          </Box>

          {/* Right Column: Admission Readiness Checklist & Confirmation (Refinement #3) */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AdmissionReadinessPanel readiness={readiness} />

            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              disabled={!readiness.isReadyToConfirm}
              onClick={handleConfirm}
              sx={{ fontWeight: 800, py: 1.5, borderRadius: 2.5, fontSize: '1.05rem' }}
            >
              Confirm Admission
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
