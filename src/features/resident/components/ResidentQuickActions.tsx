import { useNavigate } from 'react-router-dom';
import { Edit, Visibility, UploadFile, PersonAddAlt1 } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';

interface ResidentQuickActionsProps {
  stayId?: string;
  onEditProfile?: () => void;
  onAddDocument?: () => void;
  onAddEmergencyContact?: () => void;
}

export function ResidentQuickActions({
  stayId,
  onEditProfile,
  onAddDocument,
  onAddEmergencyContact,
}: ResidentQuickActionsProps) {
  const navigate = useNavigate();

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
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
            Edit Resident Profile
          </Button>

          {stayId && (
            <Button
              startIcon={<Visibility />}
              variant="contained"
              color="primary"
              size="small"
              onClick={() => navigate(`/stay/${stayId}`)}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Open Stay Workspace
            </Button>
          )}

          <Button
            startIcon={<UploadFile />}
            variant="outlined"
            size="small"
            onClick={onAddDocument}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Add Document
          </Button>

          <Button
            startIcon={<PersonAddAlt1 />}
            variant="outlined"
            size="small"
            onClick={onAddEmergencyContact}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Add Emergency Contact
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
