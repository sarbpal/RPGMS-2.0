import { Chip } from '@mui/material';
import type { ReservationStatus } from '../domain/valueObjects/ReservationStatus';

interface ReservationStatusChipProps {
  status: ReservationStatus | string;
}

export function ReservationStatusChip({ status }: ReservationStatusChipProps) {
  let label: string = status;
  let color: 'success' | 'info' | 'error' | 'warning' | 'default' = 'default';

  switch (status) {
    case 'ACTIVE':
      label = 'Active';
      color = 'success';
      break;
    case 'CONVERTED':
      label = 'Converted';
      color = 'info';
      break;
    case 'CANCELLED':
      label = 'Cancelled';
      color = 'error';
      break;
    case 'FOLLOW_UP_REQUIRED':
      label = 'Follow Up Required';
      color = 'warning';
      break;
    default:
      label = status;
      color = 'default';
      break;
  }

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      variant="outlined"
      sx={{ fontWeight: 600 }}
    />
  );
}
