import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Chip,
  TextField,
  Stack,
  Divider,
  Tooltip,
} from '@mui/material';
import { Edit, CheckCircle, Warning, HelpOutlined } from '@mui/icons-material';
import type { ElectricityAllocation, AllocationDataQualityIssue } from '../domain/entities/ElectricityAllocation';
import type { ElectricityBill } from '../domain/entities/ElectricityBill';
import type { ParticipantShareAdjustmentInput } from '../services/supplierBillAllocationService';

export interface DraftAllocationReviewPanelProps {
  allocation: ElectricityAllocation;
  bill: ElectricityBill | null;
  dataQualityIssues?: AllocationDataQualityIssue[];
  warnings?: string[];
  onUpdateShares: (adjustments: ParticipantShareAdjustmentInput[]) => boolean;
  onConfirm: (confirmedBy: string, operatorNotes?: string) => boolean;
}

export function DraftAllocationReviewPanel({
  allocation,
  bill,
  dataQualityIssues = [],
  warnings = [],
  onUpdateShares,
  onConfirm,
}: DraftAllocationReviewPanelProps) {
  const [operatorId, setOperatorId] = useState<string>('op-operator-01');
  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Local state for interactive share inputs
  const [sharesMap, setSharesMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    allocation.participants.forEach((p) => {
      map[p.stayId] = p.selectedShares;
    });
    return map;
  });

  const handleShareInputChange = (stayId: string, newShareVal: number, maxPotential: number) => {
    setValidationError(null);
    if (isNaN(newShareVal) || newShareVal < 0) return;
    if (newShareVal > maxPotential) {
      setValidationError(`Selected shares cannot exceed potential shares (${maxPotential}) for stay ${stayId}.`);
      return;
    }

    const updatedMap = { ...sharesMap, [stayId]: newShareVal };
    setSharesMap(updatedMap);

    const adjustments: ParticipantShareAdjustmentInput[] = Object.entries(updatedMap).map(
      ([sId, val]) => ({
        stayId: sId,
        selectedShares: val,
      })
    );

    onUpdateShares(adjustments);
  };

  const handleConfirmClick = () => {
    setValidationError(null);
    if (!operatorId.trim()) {
      setValidationError('Operator identity (confirmedBy) is required to confirm an allocation.');
      return;
    }
    onConfirm(operatorId.trim(), operatorNotes.trim() || undefined);
  };

  const formattedAmount = allocation.totalSupplierAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const isOwnerAbsorbed = allocation.totalSelectedShares === 0;

  return (
    <Card variant="outlined" sx={{ border: '2px solid', borderColor: 'warning.main', mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Edit color="warning" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Draft Supplier Bill Allocation Review — {bill?.supplierName || 'Supplier Bill'}
              </Typography>
            </Box>
            <Chip label="DRAFT REVIEW" color="warning" sx={{ fontWeight: 800 }} />
          </Box>
        }
        subheader={`Flat: ${allocation.flatId} | Invoice #${bill?.supplierBillNumber || allocation.billId} | Billing Period: ${allocation.periodStart} to ${allocation.periodEnd}`}
        sx={{ bgcolor: 'warning.50', pb: 1 }}
      />
      <Divider />

      <CardContent>
        <Stack spacing={2.5}>
          {validationError && <Alert severity="error">{validationError}</Alert>}

          {warnings.length > 0 && (
            <Alert severity="warning">
              {warnings.map((w, idx) => (
                <div key={idx}>{w}</div>
              ))}
            </Alert>
          )}

          {dataQualityIssues.length > 0 && (
            <Alert severity="info" icon={<Warning />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Historical Occupancy Data Quality Issues Identified ({dataQualityIssues.length}):
              </Typography>
              {dataQualityIssues.map((issue, idx) => (
                <Typography key={idx} variant="body2" sx={{ mt: 0.5 }}>
                  • [{issue.issueType}] {issue.message} (Stay: {issue.stayId})
                </Typography>
              ))}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Note: Confirming this allocation will permanently record operator acknowledgement of these data quality issues.
              </Typography>
            </Alert>
          )}

          {/* Supplier Bill Summary Bar */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Total Supplier Bill
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  ₹{formattedAmount}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Potential Shares
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {allocation.totalPotentialShares} beds
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Selected Shares
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: isOwnerAbsorbed ? 'error.main' : 'success.main' }}>
                  {allocation.totalSelectedShares} shares
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                  Amount Per Share
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: 'info.main' }}>
                  ₹{allocation.amountPerShare.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Candidate Participants Review Table */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Candidate Historical Participants & Share Selection
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Resident</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Stay ID</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Potential Shares
                    <Tooltip title="1 occupied bed = 1 potential share">
                      <HelpOutlined fontSize="small" sx={{ ml: 0.5, verticalAlign: 'middle' }} />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>
                    Selected Shares (Operator Control)
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Allocated Amount (₹)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allocation.participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No historical resident stays discovered for this billing period.
                    </TableCell>
                  </TableRow>
                ) : (
                  allocation.participants.map((p) => (
                    <TableRow key={p.stayId} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {p.residentNameSnapshot || p.residentCode || 'Resident'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Code: {p.residentCode || p.residentId}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {p.stayId}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip label={`${p.potentialShares} bed(s)`} size="small" variant="outlined" />
                      </TableCell>

                      <TableCell align="center">
                        <TextField
                          type="number"
                          size="small"
                          value={sharesMap[p.stayId] ?? p.selectedShares}
                          onChange={(e) =>
                            handleShareInputChange(
                              p.stayId,
                              parseInt(e.target.value, 10) || 0,
                              p.potentialShares
                            )
                          }
                          sx={{ width: 80 }}
                        />
                      </TableCell>

                      <TableCell align="right" sx={{ fontWeight: 700 }}>
                        ₹{p.allocatedAmount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Allocation Outcome Preview Banner */}
          {isOwnerAbsorbed ? (
            <Alert severity="warning" icon={<Warning />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Allocation Outcome: OWNER_ABSORBED (Total Selected Shares = 0)
              </Typography>
              No resident receivables will be generated. The entire supplier bill (₹{formattedAmount}) will be recorded as owner-absorbed expenses in electricity history.
            </Alert>
          ) : (
            <Alert severity="success" icon={<CheckCircle />}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Allocation Outcome: RESIDENT_ALLOCATED (Total Selected Shares = {allocation.totalSelectedShares})
              </Typography>
              Reconciliation Check: Total Allocated Amount (₹
              {allocation.participants.reduce((sum, p) => sum + p.allocatedAmount, 0).toFixed(2)}) == Supplier Bill Amount (₹{formattedAmount})
              {allocation.remainderPaise > 0 && ` (Includes ${allocation.remainderPaise} paise remainder distributed deterministically).`}
            </Alert>
          )}

          <Divider />

          {/* Confirmation Form Controls */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
              Confirm Allocation & Post to Finance
            </Typography>

            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="Operator Identity (confirmedBy)"
                  size="small"
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  placeholder="e.g. op-admin-01"
                  required
                  sx={{ minWidth: 250 }}
                />
                <TextField
                  label="Operator Notes (Optional)"
                  size="small"
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="e.g. Monthly bill split approved"
                  sx={{ flexGrow: 1 }}
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                {isOwnerAbsorbed ? (
                  <Button
                    variant="contained"
                    color="warning"
                    startIcon={<CheckCircle />}
                    onClick={handleConfirmClick}
                    sx={{ fontWeight: 800 }}
                  >
                    Confirm Owner Absorbed (₹0 Resident Receivables)
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={handleConfirmClick}
                    sx={{ fontWeight: 800 }}
                  >
                    Confirm Allocation & Post Finance Utility Bills
                  </Button>
                )}
              </Box>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
