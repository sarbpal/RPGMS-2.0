import {
  Bolt,
  EventNote,
  ExitToApp,
  Hotel,
  LocalLaundryService,
  Payments,
  Receipt,
  AccountBalance,
  AccountBalanceWallet,
  MoneyOff,
  ReceiptLong,
} from '@mui/icons-material';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';

export interface QuickActionsProps {
  onRecordPayment?: () => void;
  onGenerateRent?: () => void;
  onAddLaundry?: () => void;
  onAddElectricity?: () => void;
  onTransferBed?: () => void;
  onGiveNotice?: () => void;
  onBeginCheckout?: () => void;
  onOpenSettlement?: () => void;
  onTransferFlat?: () => void;
  onAllocateAdditionalBed?: () => void;
  onReleaseBed?: () => void;
  onPartialDepositReturn?: () => void;
  onDepositDeduction?: () => void;
  onViewLedger?: () => void;
  stayStatus?: string;
}

export function QuickActions({
  onRecordPayment,
  onGenerateRent,
  onAddLaundry,
  onAddElectricity,
  onTransferBed,
  onGiveNotice,
  onBeginCheckout,
  onOpenSettlement,
  onTransferFlat,
  onAllocateAdditionalBed,
  onReleaseBed,
  onPartialDepositReturn,
  onDepositDeduction,
  onViewLedger,
  stayStatus,
}: QuickActionsProps = {}) {
  const isCheckedOutOrClosed = stayStatus === 'CHECKED_OUT' || stayStatus === 'CLOSED';

  const defaultActions = [
    { label: 'Record Payment', icon: <Payments /> },
    { label: 'Generate Monthly Rent', icon: <Receipt /> },
    { label: 'Add Laundry Charges', icon: <LocalLaundryService /> },
    { label: 'Add Electricity Charges', icon: <Bolt /> },
    { label: 'Partial Deposit Return', icon: <AccountBalanceWallet /> },
    { label: 'Deposit Deduction', icon: <MoneyOff /> },
    { label: 'View Full Ledger', icon: <ReceiptLong /> },
    { label: 'Transfer Bed', icon: <Hotel /> },
    { label: 'Give Notice', icon: <EventNote /> },
    { label: 'Begin Checkout', icon: <ExitToApp /> },
  ];

  const postCheckoutActions = [
    { label: 'Record Payment', icon: <Payments /> },
    { label: 'Add Laundry Charges', icon: <LocalLaundryService /> },
    { label: 'Add Electricity Charges', icon: <Bolt /> },
    { label: 'Partial Deposit Return', icon: <AccountBalanceWallet /> },
    { label: 'Deposit Deduction', icon: <MoneyOff /> },
    { label: 'View Full Ledger', icon: <ReceiptLong /> },
    { label: 'Financial Settlement', icon: <AccountBalance /> },
  ];

  const actionsToRender = isCheckedOutOrClosed ? postCheckoutActions : defaultActions;

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
      case 'Partial Deposit Return':
        return onPartialDepositReturn;
      case 'Deposit Deduction':
        return onDepositDeduction;
      case 'View Full Ledger':
        return onViewLedger;
      case 'Transfer Bed':
        return onTransferBed;
      case 'Give Notice':
        return onGiveNotice;
      case 'Begin Checkout':
        return onBeginCheckout;
      case 'Financial Settlement':
        return onOpenSettlement;
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
          {actionsToRender.map((action) => {
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
