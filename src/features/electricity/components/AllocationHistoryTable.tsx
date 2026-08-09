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
  Box,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Button,
} from '@mui/material';
import { ExpandMore, History, InfoOutlined, UndoOutlined } from '@mui/icons-material';
import type { HistoricalAllocationItem } from '../hooks/useSupplierBillAllocation';

export interface AllocationHistoryTableProps {
  items: HistoricalAllocationItem[];
  onOpenReversalModal?: (item: HistoricalAllocationItem) => void;
}

export function AllocationHistoryTable({ items, onOpenReversalModal }: AllocationHistoryTableProps) {
  if (!items || items.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
        <History color="disabled" sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="h6" color="text.secondary">
          No Confirmed Electricity Allocations
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Confirmed supplier electricity bill allocations will appear here as frozen historical audit records.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <History color="primary" /> Confirmed Electricity Allocation Audit History ({items.length})
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Flat & Invoice</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Billing Period</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Supplier Bill Amount</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Outcome & Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Confirmed By & Audit</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Participant Breakdown & Finance Posting</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {items.map((item) => {
              const { allocation, bill } = item;
              const isOwnerAbsorbed = allocation.allocationOutcome === 'OWNER_ABSORBED';
              const isReversed = allocation.status === 'REVERSED';
              const formattedAmount = allocation.totalSupplierAmount.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });

              return (
                <TableRow
                  key={allocation.id}
                  hover
                  sx={{
                    verticalAlign: 'top',
                    bgcolor: isReversed ? 'action.hover' : 'inherit',
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      Flat {allocation.flatId}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Supplier: {bill?.supplierName || 'N/A'}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main' }}>
                      #{bill?.supplierBillNumber || allocation.billId}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {allocation.periodStart} to {allocation.periodEnd}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tag: {allocation.periodStart.substring(0, 7)}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      ₹{formattedAmount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {allocation.totalSelectedShares} / {allocation.totalPotentialShares} shares
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label={allocation.allocationOutcome || 'CONFIRMED'}
                        color={isOwnerAbsorbed ? 'warning' : 'success'}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                      {isReversed && (
                        <Chip
                          label="REVERSED"
                          color="error"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 800 }}
                        />
                      )}
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {allocation.confirmedBy || 'System Operator'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {allocation.confirmedAt
                        ? new Date(allocation.confirmedAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Confirmed'}
                    </Typography>
                    {isReversed && (
                      <Box sx={{ mt: 1, p: 0.75, bgcolor: 'error.50', borderRadius: 1, border: '1px solid', borderColor: 'error.200' }}>
                        <Typography variant="caption" color="error.main" sx={{ fontWeight: 700, display: 'block' }}>
                          Reversed by: {allocation.reversedBy || 'Operator'}
                        </Typography>
                        {allocation.reversedAt && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            At: {new Date(allocation.reversedAt).toLocaleString('en-IN')}
                          </Typography>
                        )}
                        {allocation.reversalReason && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                            Reason: "{allocation.reversalReason}"
                          </Typography>
                        )}
                      </Box>
                    )}
                    {allocation.dataQualityIssues && allocation.dataQualityIssues.length > 0 && (
                      <Tooltip
                        title={`Data Quality Issues Acknowledged by ${allocation.dataQualityIssues[0].acknowledgedBy || 'Operator'}: ${allocation.dataQualityIssues.map((i) => i.message).join(' | ')}`}
                      >
                        <Chip
                          icon={<InfoOutlined fontSize="small" />}
                          label={`${allocation.dataQualityIssues.length} Quality Issue(s) Acknowledged`}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ mt: 0.5 }}
                        />
                      </Tooltip>
                    )}
                  </TableCell>

                  <TableCell>
                    {isOwnerAbsorbed ? (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        ₹0 resident charges. Entire amount absorbed by owner.
                      </Typography>
                    ) : (
                      <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <AccordionSummary expandIcon={<ExpandMore fontSize="small" />}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            View {allocation.participants.filter((p) => p.selectedShares > 0).length} Resident Participant(s)
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 1 }}>
                          {allocation.participants.map((p) => (
                            <Box
                              key={p.stayId}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                py: 0.5,
                                borderBottom: '1px dashed',
                                borderColor: 'divider',
                                '&:last-child': { borderBottom: 'none' },
                              }}
                            >
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                  {p.residentNameSnapshot || p.residentCode} ({p.selectedShares} share)
                                </Typography>
                                {p.financeBillId && (
                                  <Typography variant="caption" color="primary.main" sx={{ fontFamily: 'monospace' }}>
                                    Bill: {p.financeBillId} {isReversed ? '(Cancelled)' : ''}
                                  </Typography>
                                )}
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontWeight: 800,
                                  textDecoration: isReversed ? 'line-through' : 'none',
                                  color: isReversed ? 'text.disabled' : 'inherit',
                                }}
                              >
                                ₹{p.allocatedAmount.toFixed(2)}
                              </Typography>
                            </Box>
                          ))}
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </TableCell>

                  <TableCell align="center">
                    {!isReversed && onOpenReversalModal && (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        startIcon={<UndoOutlined />}
                        onClick={() => onOpenReversalModal(item)}
                        sx={{ textTransform: 'none', fontWeight: 700 }}
                      >
                        Reverse
                      </Button>
                    )}
                    {isReversed && (
                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        Reversed
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
