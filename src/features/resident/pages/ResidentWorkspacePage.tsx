import { useMemo, useState, useEffect } from 'react';
import { Container, Grid, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useParams } from 'react-router-dom';
import { ResidentWorkspaceCoordinator } from '../application/coordinator/ResidentWorkspaceCoordinator';
import { ContactInformationCard } from '../components/ContactInformationCard';
import { DocumentsCard } from '../components/DocumentsCard';
import { EmergencyContactCard } from '../components/EmergencyContactCard';
import { ResidentHeader } from '../components/ResidentHeader';
import { ResidentQuickActions } from '../components/ResidentQuickActions';
import { ResidentSummaryCard } from '../components/ResidentSummaryCard';
import { ResidentIdentityForm, type ResidentIdentityFormData } from '../components/ResidentIdentityForm';

export default function ResidentWorkspacePage() {
  const { residentId } = useParams<{ residentId: string }>();

  const coordinator = useMemo(() => new ResidentWorkspaceCoordinator(), []);
  const viewModel = useMemo(
    () => coordinator.createViewModel(residentId || ''),
    [coordinator, residentId]
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  const [profileFormData, setProfileFormData] = useState<ResidentIdentityFormData>({
    fullName: '',
    mobileNumber: '',
    idProofType: 'Aadhaar',
    idProofNumber: '',
  });

  const [onboardingFormData, setOnboardingFormData] = useState<ResidentIdentityFormData>({
    fullName: '',
    mobileNumber: '',
    idProofType: 'Aadhaar',
    idProofNumber: '',
  });

  useEffect(() => {
    if (viewModel) {
      setProfileFormData({
        id: viewModel.header.residentId,
        residentCode: viewModel.summary.residentCode,
        fullName: viewModel.header.fullName,
        mobileNumber: viewModel.contactInformation.primaryMobile,
        alternateMobileNumber: viewModel.contactInformation.alternateMobile !== 'N/A' ? viewModel.contactInformation.alternateMobile : '',
        email: viewModel.contactInformation.email !== 'N/A' ? viewModel.contactInformation.email : '',
        idProofType: 'Aadhaar',
        idProofNumber: '1234-5678-9012',
        permanentAddressLine1: viewModel.contactInformation.permanentAddress !== 'N/A' ? viewModel.contactInformation.permanentAddress : '',
        emergencyContactName: viewModel.emergencyContact.contactName !== 'N/A' ? viewModel.emergencyContact.contactName : '',
        emergencyContactRelationship: viewModel.emergencyContact.relationship !== 'N/A' ? viewModel.emergencyContact.relationship : 'Father',
        emergencyContactPhone: viewModel.emergencyContact.emergencyPhone !== 'N/A' ? viewModel.emergencyContact.emergencyPhone : '',
        occupationType: viewModel.summary.occupation,
        bloodGroup: viewModel.summary.bloodGroup,
        status: viewModel.header.status,
      });
    }
  }, [viewModel]);

  const handleOpenEditModal = () => setIsEditModalOpen(true);
  const handleOpenOnboardingModal = () => {
    setOnboardingFormData({
      fullName: '',
      mobileNumber: '',
      idProofType: 'Aadhaar',
      idProofNumber: '',
    });
    setIsOnboardingModalOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <Stack spacing={3}>
        {/* 1. Resident Header */}
        <ResidentHeader data={viewModel.header} />

        {/* 2. Quick Actions */}
        <ResidentQuickActions
          onEditProfile={handleOpenEditModal}
          onNewOnboarding={handleOpenOnboardingModal}
        />

        {/* 3. Summary & Contact Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <ResidentSummaryCard data={viewModel.summary} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ContactInformationCard data={viewModel.contactInformation} />
          </Grid>
        </Grid>

        {/* 4. Documents & Emergency Contact Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <DocumentsCard documents={viewModel.documents} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <EmergencyContactCard data={viewModel.emergencyContact} />
          </Grid>
        </Grid>
      </Stack>

      {/* Edit Resident Profile Modal (Complete Resident Profile Mode) */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: '90vh' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Edit Complete Resident Profile ({viewModel.header.fullName})
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <ResidentIdentityForm
            mode="profile"
            value={profileFormData}
            onChange={setProfileFormData}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsEditModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsEditModalOpen(false)}
            sx={{ fontWeight: 700 }}
          >
            Save Profile Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Resident Onboarding Modal (Onboarding Mode) */}
      <Dialog
        open={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          New Resident Onboarding
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <ResidentIdentityForm
            mode="onboarding"
            value={onboardingFormData}
            onChange={setOnboardingFormData}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setIsOnboardingModalOpen(false)} sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setIsOnboardingModalOpen(false)}
            sx={{ fontWeight: 700 }}
          >
            Complete Onboarding
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
