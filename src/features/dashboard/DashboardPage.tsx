import { useNavigate } from 'react-router-dom';
import {
  Build,
  Hotel,
  Payments,
  PersonAdd,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';

interface SummaryCard {
  label: string;
  value: string;
}

interface QuickAction {
  label: string;
  icon: ReactNode;
  onClick?: (navigate: ReturnType<typeof useNavigate>) => void;
}

const summaryCards: SummaryCard[] = [
  { label: 'Occupancy', value: '--' },
  { label: 'Residents', value: '--' },
  { label: 'Outstanding Dues', value: '₹ --' },
  { label: 'Monthly Collection', value: '₹ --' },
];

const quickActions: QuickAction[] = [
  { label: 'Add Resident', icon: <PersonAdd />, onClick: (nav) => nav('/residents') },
  { label: 'Record Payment', icon: <Payments />, onClick: (nav) => nav('/finance') },
  { label: 'Occupancy', icon: <Hotel />, onClick: (nav) => nav('/accommodation') },
  { label: 'Add Complaint', icon: <Build />, onClick: (nav) => nav('/maintenance') },
];

export function DashboardPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 4 }}>
      <Stack spacing={0.5} sx={{ mb: 4 }}>
        <Typography variant="h4">Dashboard</Typography>
        <Typography color="text.secondary">
          Welcome to RPGMS 2.0
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {summaryCards.map((card) => (
          <Card
            key={card.label}
            elevation={0}
            sx={{ border: 1, borderColor: 'divider', height: '100%' }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography color="text.secondary" variant="body2">
                {card.label}
              </Typography>
              <Typography sx={{ mt: 1 }} variant="h4">
                {card.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box sx={{ mt: 5 }}>
        <Typography variant="h5">Quick Actions</Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          {quickActions.map((action) => (
            <Button
              key={action.label}
              startIcon={action.icon}
              variant="contained"
              onClick={() => action.onClick && action.onClick(navigate)}
            >
              {action.label}
            </Button>
          ))}
        </Box>
      </Box>
    </Container>
  );
}
