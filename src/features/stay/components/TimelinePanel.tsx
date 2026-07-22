import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';

const placeholderEvents = [
  {
    id: 'evt-1',
    title: 'Payment Received',
    description: '₹8,500 collected via UPI for July 2026 rent',
    date: '01-Jul-2026',
    type: 'PAYMENT',
    color: 'success' as const,
  },
  {
    id: 'evt-2',
    title: 'Monthly Rent Bill Generated',
    description: 'Rent invoice generated for July 2026 (₹8,500)',
    date: '01-Jul-2026',
    type: 'BILL',
    color: 'error' as const,
  },
  {
    id: 'evt-3',
    title: 'Electricity Charge Posted',
    description: 'Flat 103 electricity split share added (₹450)',
    date: '15-Jun-2026',
    type: 'CHARGE',
    color: 'warning' as const,
  },
  {
    id: 'evt-4',
    title: 'Stay Started (Check-in)',
    description: 'Resident checked in and allocated to Flat 103 / Bed H2',
    date: '12-Mar-2026',
    type: 'CHECK_IN',
    color: 'info' as const,
  },
];

export function TimelinePanel() {
  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          Recent Timeline
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Chronological activity stream of events for this stay.
        </Typography>

        <List disablePadding>
          {placeholderEvents.map((evt, idx) => (
            <Box key={evt.id}>
              {idx > 0 && <Divider component="li" />}
              <ListItem sx={{ py: 1.5, px: 1 }}>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Chip
                        label={evt.type}
                        size="small"
                        color={evt.color}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {evt.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 'auto !important' }}
                      >
                        {evt.date}
                      </Typography>
                    </Stack>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {evt.description}
                    </Typography>
                  }
                />
              </ListItem>
            </Box>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
