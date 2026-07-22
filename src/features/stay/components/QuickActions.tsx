import {
  Bolt,
  EventNote,
  ExitToApp,
  Hotel,
  LocalLaundryService,
  Payments,
  Receipt,
} from '@mui/icons-material';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';

const actions = [
  { label: 'Record Payment', icon: <Payments /> },
  { label: 'Generate Monthly Rent', icon: <Receipt /> },
  { label: 'Add Laundry Charges', icon: <LocalLaundryService /> },
  { label: 'Add Electricity Charges', icon: <Bolt /> },
  { label: 'Transfer Bed', icon: <Hotel /> },
  { label: 'Give Notice', icon: <EventNote /> },
  { label: 'Begin Checkout', icon: <ExitToApp /> },
];

export function QuickActions() {
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
