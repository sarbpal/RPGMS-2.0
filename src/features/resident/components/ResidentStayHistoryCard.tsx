import { useMemo } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { History, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { stayWorkflowComposition } from '../../../app/composition/stayWorkflowComposition';
import { StayStatus } from '../../stay/domain/valueObjects/StayStatus';

interface ResidentStayHistoryCardProps {
  residentId: string;
}

const stayCoordinator = stayWorkflowComposition.stayWorkspaceCoordinator;

export function ResidentStayHistoryCard({ residentId }: ResidentStayHistoryCardProps) {
  const navigate = useNavigate();

  const stays = useMemo(() => {
    return stayCoordinator.getStaysForResident(residentId);
  }, [residentId]);

  const getStatusChip = (status: string) => {
    switch (status) {
      case StayStatus.ACTIVE:
        return <Chip label="ACTIVE" color="success" size="small" />;
      case StayStatus.ON_NOTICE:
        return <Chip label="ON NOTICE" color="warning" size="small" />;
      case StayStatus.CHECKED_OUT:
        return <Chip label="CHECKED OUT" color="default" size="small" />;
      case StayStatus.PLANNED:
        return <Chip label="PLANNED" color="info" size="small" />;
      case StayStatus.CLOSED:
        return <Chip label="CLOSED" color="secondary" size="small" />;
      case StayStatus.CANCELLED:
        return <Chip label="CANCELLED" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <History color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Resident Stay History
          </Typography>
          <Chip label={`${stays.length} Stay${stays.length === 1 ? '' : 's'}`} size="small" sx={{ ml: 'auto' }} />
        </Box>

        {stays.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No stay history recorded for this resident.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Stay ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Flat / Bed</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Check-In Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Checkout Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Billing Anchor</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }} align="right">
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stays.map((stay) => (
                  <TableRow key={stay.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }} color="primary">
                        {stay.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {stay.stayType}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {stay.flatId} / {stay.allocatedBedIds.join(', ') || 'Unassigned'}
                    </TableCell>
                    <TableCell>{getStatusChip(stay.status)}</TableCell>
                    <TableCell>{stay.checkInDate}</TableCell>
                    <TableCell>{stay.actualCheckoutDate || stay.expectedCheckoutDate || '—'}</TableCell>
                    <TableCell>Day {stay.billingAnchorDay}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/stays/${stay.id}`)}
                      >
                        View Stay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
