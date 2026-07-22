import { Edit, Hotel, Phone, UploadFile, Visibility } from '@mui/icons-material';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';

const actions = [
  { label: 'Edit Profile', icon: <Edit /> },
  { label: 'View Active Stay', icon: <Visibility /> },
  { label: 'Start New Stay', icon: <Hotel /> },
  { label: 'Upload Document', icon: <UploadFile /> },
  { label: 'Contact Resident', icon: <Phone /> },
];

export function ResidentQuickActions() {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {actions.map((action) => (
            <Button
              key={action.label}
              startIcon={action.icon}
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
