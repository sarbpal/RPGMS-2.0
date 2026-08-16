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

export interface QuickActionsProps {
  onRecordPayment?: () => void;
  onGenerateRent?: () => void;
  onAddLaundry?: () => void;
  onAddElectricity?: () => void;
  onTransferBed?: () => void;
  onGiveNotice?: () => void;
  onBeginCheckout?: () => void;
  onTransferFlat?: () => void;
  onAllocateAdditionalBed?: () => void;
  onReleaseBed?: () => void;
}

export function QuickActions({
  onRecordPayment,
  onGenerateRent,
  onAddLaundry,
  onAddElectricity,
  onTransferBed,
  onGiveNotice,
  onBeginCheckout,
  onTransferFlat,
  onAllocateAdditionalBed,
  onReleaseBed,
}: QuickActionsProps = {}) {
  const getClickHandler = (label: string) => {
    switch (label) {
      case 'Record Payment':
        return onRecordPayment;
      case 'Generate Monthly Rent':
        return onGenerateRent;
      case 'Add Laundry Charges':
        return onAddLaundry;
      case 'Add Electricity Charges':
        return onAddElectricity;
      case 'Transfer Bed':
        return onTransferBed;
      case 'Give Notice':
        return onGiveNotice;
      case 'Begin Checkout':
        return onBeginCheckout;
      case 'Transfer Flat':
        return onTransferFlat;
      case 'Allocate Additional Bed':
        return onAllocateAdditionalBed;
      case 'Release Bed':
        return onReleaseBed;
      default:
        return undefined;
    }
  };

  return (
    <Card elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          {actions.map((action) => {
            const handler = getClickHandler(action.label);
            return (
              <Button
                key={action.label}
                startIcon={action.icon}
                variant="outlined"
                size="small"
                onClick={handler}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                {action.label}
              </Button>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
