import { Edit, Hotel, PersonAdd, Phone, UploadFile, Visibility } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';

interface ResidentQuickActionsProps {
  onEditProfile?: () => void;
  onNewOnboarding?: () => void;
}

export function ResidentQuickActions({ onEditProfile, onNewOnboarding }: ResidentQuickActionsProps) {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            startIcon={<Edit />}
            variant="outlined"
            size="small"
            onClick={onEditProfile}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Edit Profile
          </Button>
          <Button
            startIcon={<PersonAdd />}
            variant="contained"
            color="primary"
            size="small"
            onClick={onNewOnboarding}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Onboard New Resident
          </Button>
          <Button
            startIcon={<Visibility />}
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            View Active Stay
          </Button>
          <Button
            startIcon={<Hotel />}
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Start New Stay
          </Button>
          <Button
            startIcon={<UploadFile />}
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Upload Document
          </Button>
          <Button
            startIcon={<Phone />}
            variant="outlined"
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Contact Resident
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
