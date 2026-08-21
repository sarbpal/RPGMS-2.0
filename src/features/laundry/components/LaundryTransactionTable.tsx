import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  Button,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  WarningAmber,
  Store,
  HomeWork,
  Checklist,
  SearchOutlined,
} from '@mui/icons-material';
import type { LaundryTransactionSummaryViewModel } from '../application/models/LaundryWorkspaceViewModel';
import { EmptyState } from '../../../components/EmptyState';

interface LaundryTransactionTableProps {
  transactions: readonly LaundryTransactionSummaryViewModel[];
  selectedTransactionId: string | null;
  onSelectTransaction: (id: string) => void;
  onConfirmCollection: (tx: LaundryTransactionSummaryViewModel) => void;
  onRecordInspection?: (tx: LaundryTransactionSummaryViewModel) => void;
  onReleaseProcessing?: (tx: LaundryTransactionSummaryViewModel) => void;
  onOpenCreateDraft?: () => void;
}

export function LaundryTransactionTable({
  transactions,
  selectedTransactionId,
  onSelectTransaction,
  onConfirmCollection,
  onRecordInspection,
  onReleaseProcessing: _onReleaseProcessing,
  onOpenCreateDraft,
}: LaundryTransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No Laundry Transactions Found"
        description="No orders match the current filter or search criteria. Try resetting filters or create a new collection draft."
        action={
          onOpenCreateDraft && (
            <Button variant="contained" color="primary" onClick={onOpenCreateDraft} sx={{ textTransform: 'none' }}>
              Create Collection Draft
            </Button>
          )
        }
      />
    );
  }

  const getStatusChipColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'DRAFT':
        return 'default';
      case 'COLLECTED':
        return 'info';
      case 'IN_PROCESS':
        return 'secondary';
      case 'RETURNED_PARTIAL':
      case 'RETURNED_FULL':
        return 'primary';
      case 'DELIVERED_PARTIAL':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
      <Table sx={{ minWidth: 800 }} aria-label="laundry transactions table">
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Order ID & Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Resident & Room</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="center">
              Piece Reconciliation
            </TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Route</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">
              Commercial / Charges
            </TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="center">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((tx) => {
            const isSelected = selectedTransactionId === tx.id;
            return (
              <TableRow
                key={tx.id}
                hover
                selected={isSelected}
                onClick={() => onSelectTransaction(tx.id)}
                sx={{
                  cursor: 'pointer',
                  '&.Mui-selected': { bgcolor: 'primary.50' },
                  '&.Mui-selected:hover': { bgcolor: 'primary.100' },
                }}
              >
                {/* 1. ID & Date */}
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {tx.id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tx.createdAtFormatted}
                  </Typography>
                </TableCell>

                {/* 2. Resident & Room */}
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {tx.residentName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {tx.residentCode} • {tx.locationSummary}
                  </Typography>
                </TableCell>

                {/* 3. Piece Counts */}
                <TableCell align="center">
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Tooltip title="Total Physical Pieces Collected">
                      <Chip
                        size="small"
                        label={`Tot: ${tx.totalPhysicalPieces}`}
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </Tooltip>
                    <Tooltip title="Total Delivered Pieces">
                      <Chip
                        size="small"
                        label={`Del: ${tx.totalDeliveredPieces}`}
                        color={tx.totalDeliveredPieces > 0 ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                      />
                    </Tooltip>
                    {tx.totalOutstandingPieces > 0 && (
                      <Tooltip title="Outstanding Pieces in Custody / Processing">
                        <Chip
                          size="small"
                          label={`Out: ${tx.totalOutstandingPieces}`}
                          color="warning"
                          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>

                {/* 4. Processing Route */}
                <TableCell>
                  {tx.processingRoute ? (
                    <Chip
                      size="small"
                      icon={tx.processingRoute === 'IN_HOUSE' ? <HomeWork fontSize="small" /> : <Store fontSize="small" />}
                      label={tx.processingRouteLabel || tx.processingRoute}
                      variant="outlined"
                      color={tx.processingRoute === 'IN_HOUSE' ? 'info' : 'secondary'}
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Unassigned
                    </Typography>
                  )}
                </TableCell>

                {/* 5. Status & Exceptions */}
                <TableCell>
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                    <Chip
                      size="small"
                      label={tx.statusLabel}
                      color={getStatusChipColor(tx.status)}
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                    {tx.hasOpenExceptions && (
                      <Tooltip title={`${tx.openExceptionsCount} Open Exception(s)`}>
                        <Chip
                          size="small"
                          icon={<WarningAmber fontSize="small" />}
                          label={tx.openExceptionsCount}
                          color="error"
                          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>

                {/* 6. Commercial / Charges */}
                <TableCell align="right">
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {tx.totalEstimatedAmountFormatted}
                  </Typography>
                  <Typography variant="caption" color={tx.isFullyChargedAndPosted ? 'success.main' : 'text.secondary'}>
                    {tx.isFullyChargedAndPosted ? 'Posted to Finance' : `Posted: ${tx.totalPostedAmountFormatted}`}
                  </Typography>
                </TableCell>

                {/* 7. Action Button */}
                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                    {tx.status === 'DRAFT' ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        startIcon={<Checklist />}
                        onClick={() => onConfirmCollection(tx)}
                        sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.5 }}
                      >
                        Confirm
                      </Button>
                    ) : tx.status === 'COLLECTED' && onRecordInspection ? (
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<SearchOutlined />}
                        onClick={() => onRecordInspection(tx)}
                        sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.5 }}
                      >
                        Inspect
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => onSelectTransaction(tx.id)}
                        sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.5 }}
                      >
                        Details
                      </Button>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
