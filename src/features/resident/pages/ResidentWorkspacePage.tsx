import { useMemo, useState } from 'react';
import { Container, Grid, Stack, Dialog, DialogTitle, DialogContent, DialogActions, Button, Link } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { ResidentWorkspaceCoordinator } from '../application/coordinator/ResidentWorkspaceCoordinator';
import { ResidentHeader } from '../components/ResidentHeader';
import { ResidentQuickActions } from '../components/ResidentQuickActions';
import { CurrentStaySummaryCard } from '../components/CurrentStaySummaryCard';
import { PersonalInformationCard } from '../components/PersonalInformationCard';
import { ContactInformationCard } from '../components/ContactInformationCard';
import { AddressCard } from '../components/AddressCard';
import { EmergencyContactCard } from '../components/EmergencyContactCard';
import { DocumentsCard } from '../components/DocumentsCard';
import { ResidentIdentityForm, type ResidentIdentityFormData } from '../components/ResidentIdentityForm';

export default function ResidentWorkspacePage() {
  const { residentId } = useParams<{ residentId: string }>();

  const coordinator = useMemo(() => new ResidentWorkspaceCoordinator(), []);
  const viewModel = useMemo(
    () => coordinator.createViewModel(residentId || ''),
    [coordinator, residentId]
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [profileFormData, setProfileFormData] = useState<ResidentIdentityFormData>({
    fullName: '',
    mobileNumber: '',
    idProofType: 'Aadhaar',
    idProofNumber: '',
  });

  const handleOpenEditModal = () => {
    if (viewModel) {
      setProfileFormData({
        id: viewModel.header.residentId,
        residentCode: viewModel.personalInformation.residentCode,
        fullName: viewModel.personalInformation.fullName,
        mobileNumber: viewModel.contactInformation.primaryMobile,
        alternateMobileNumber: viewModel.contactInformation.alternateMobile !== 'N/A' ? viewModel.contactInformation.alternateMobile : '',
        email: viewModel.contactInformation.email !== 'N/A' ? viewModel.contactInformation.email : '',
        idProofType: 'Aadhaar',
        idProofNumber: '1234-5678-9012',
        permanentAddressLine1: viewModel.address.permanentAddress !== 'N/A' ? viewModel.address.permanentAddress : '',
        emergencyContactName: viewModel.emergencyContact.contactName !== 'N/A' ? viewModel.emergencyContact.contactName : '',
        emergencyContactRelationship: viewModel.emergencyContact.relationship !== 'N/A' ? viewModel.emergencyContact.relationship : 'Father',
        emergencyContactPhone: viewModel.emergencyContact.emergencyPhone !== 'N/A' ? viewModel.emergencyContact.emergencyPhone : '',
        occupationType: viewModel.personalInformation.occupation,
        bloodGroup: viewModel.personalInformation.bloodGroup,
        status: viewModel.header.status,
      });
    }
    setIsEditModalOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 10, pb: 4 }}>
      <Stack spacing={2.5}>
        {/* Workspace Navigation: Lightweight Back to Residents link */}
        <Link
          component={RouterLink}
          to="/residents"
          underline="hover"
          color="text.secondary"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            fontWeight: 600,
            fontSize: '0.875rem',
            width: 'fit-content',
            '&:hover': { color: 'primary.main' },
          }}
        >
          <ArrowBack sx={{ fontSize: '1.1rem' }} />
          Back to Residents
        </Link>

        {/* Operational Workspace Top Block: Resident Header -> Quick Actions -> Current Stay Summary */}
        <Stack spacing={2}>
          <ResidentHeader data={viewModel.header} />
          <ResidentQuickActions
            stayId={viewModel.currentStay.hasActiveStay ? viewModel.currentStay.stayId : undefined}
            onEditProfile={handleOpenEditModal}
          />
          <CurrentStaySummaryCard data={viewModel.currentStay} />
        </Stack>

        {/* Information Sections Grid */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <PersonalInformationCard data={viewModel.personalInformation} onEdit={handleOpenEditModal} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <ContactInformationCard data={viewModel.contactInformation} />
          </Grid>
        </Grid>

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <AddressCard data={viewModel.address} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <EmergencyContactCard data={viewModel.emergencyContact} />
          </Grid>
        </Grid>

        <DocumentsCard documents={viewModel.documents} />
      </Stack>

      {/* Edit Resident Profile Modal */}
      <Dialog
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3, maxHeight: '90vh' } } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          Edit Resident Profile ({viewModel.header.fullName})
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
    </Container>
  );
}
