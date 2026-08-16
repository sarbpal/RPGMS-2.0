import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  AlertTitle,
  TextField,
  CircularProgress,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircleOutlined,
  CancelOutlined,
  HelpOutlineOutlined,
} from '@mui/icons-material';
import type {
  BillingOperationDetailViewModel,
  RecoveryEvidenceViewModel,
  MatchedFinanceBillViewModel,
  MatchedLedgerEntryViewModel,
} from '../application/models/BillingWorkspaceViewModel';

interface RecoveryWorkbenchModalProps {
  readonly open: boolean;
  readonly isSubmitting: boolean;
  readonly unresolvedOperations: readonly BillingOperationDetailViewModel[];
  readonly onClose: () => void;
  readonly onInspectEvidence: (operationId: string) => Promise<RecoveryEvidenceViewModel>;
  readonly onResolveCommitted: (
    operationId: string,
    financialBillId: string,
    operatorId: string,
    notes: string
  ) => Promise<void>;
  readonly onResolveNotCommitted: (
    operationId: string,
    operatorId: string,
    reason: string,
    notes?: string
  ) => Promise<void>;
}

export function RecoveryWorkbenchModal({
  open,
  isSubmitting,
  unresolvedOperations,
  onClose,
  onInspectEvidence,
  onResolveCommitted,
  onResolveNotCommitted,
}: RecoveryWorkbenchModalProps) {
  const [selectedOpId, setSelectedOpId] = useState<string>('');
  const [evidence, setEvidence] = useState<RecoveryEvidenceViewModel | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState<boolean>(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  // Resolution Dialog State
  const [actionType, setActionType] = useState<'COMMITTED' | 'NOT_COMMITTED' | null>(null);
  const [operatorId, setOperatorId] = useState<string>('OPERATOR');
  const [resolutionReason, setResolutionReason] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  useEffect(() => {
    if (unresolvedOperations.length > 0) {
      if (!selectedOpId || !unresolvedOperations.some((op) => op.id === selectedOpId)) {
        setSelectedOpId(unresolvedOperations[0].id);
      }
    } else {
      setSelectedOpId('');
      setEvidence(null);
    }
  }, [unresolvedOperations, selectedOpId]);

  useEffect(() => {
    if (selectedOpId && open) {
      setLoadingEvidence(true);
      setEvidenceError(null);
      onInspectEvidence(selectedOpId)
        .then((ev) => {
          setEvidence(ev);
          setLoadingEvidence(false);
        })
        .catch((err) => {
          setEvidenceError(err instanceof Error ? err.message : String(err));
          setLoadingEvidence(false);
        });
    }
  }, [selectedOpId, open, onInspectEvidence]);

  const handleOpenAction = (type: 'COMMITTED' | 'NOT_COMMITTED') => {
    setActionType(type);
    if (type === 'COMMITTED') {
      setResolutionNotes('Verified active Bill and double-entry ledger postings in Finance.');
    } else {
      setResolutionReason('Conclusively confirmed no Finance Bill was created for this operation.');
      setResolutionNotes('');
    }
  };

  const handleConfirmResolution = async () => {
    if (!evidence) return;

    if (actionType === 'COMMITTED') {
      const billId = evidence.recommendedBillId || evidence.matchedBills[0]?.id;
      if (!billId) return;
      await onResolveCommitted(evidence.operation.id, billId, operatorId.trim(), resolutionNotes.trim());
      setActionType(null);
    } else if (actionType === 'NOT_COMMITTED') {
      if (!resolutionReason.trim()) return;
      await onResolveNotCommitted(
        evidence.operation.id,
        operatorId.trim(),
        resolutionReason.trim(),
        resolutionNotes.trim() || undefined
      );
      setActionType(null);
    }
  };

  const getAssessmentChip = (assessment: string) => {
    switch (assessment) {
      case 'COMMITTED':
        return (
          <Chip
            icon={<CheckCircleOutlined />}
            label="Finance Evidence: COMMITTED"
            color="success"
            sx={{ fontWeight: 600 }}
          />
        );
      case 'NOT_COMMITTED':
        return (
          <Chip
            icon={<CancelOutlined />}
            label="Finance Evidence: NOT COMMITTED"
            color="info"
            sx={{ fontWeight: 600 }}
          />
        );
      case 'UNKNOWN':
      default:
        return (
          <Chip
            icon={<HelpOutlineOutlined />}
            label="Finance Evidence: UNKNOWN / INCONCLUSIVE"
            color="warning"
            sx={{ fontWeight: 600 }}
          />
        );
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Recovery Workbench</span>
          <Chip
            label={`${unresolvedOperations.length} Uncertain Outcome(s)`}
            color={unresolvedOperations.length > 0 ? 'error' : 'default'}
            size="small"
          />
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {unresolvedOperations.length === 0 ? (
            <Alert severity="success" sx={{ m: 3 }}>
              Zero recovery exceptions pending. All historical operations are conclusively settled or committed.
            </Alert>
          ) : (
            <Grid container sx={{ minHeight: 480 }}>
              {/* Left Column: Operation List */}
              <Grid size={{ xs: 12, md: 4 }} sx={{ borderRight: 1, borderColor: 'divider' }}>
                <Typography variant="subtitle2" sx={{ p: 2, bgcolor: 'grey.50', fontWeight: 600 }}>
                  Unresolved Operations
                </Typography>
                <Divider />
                <List sx={{ p: 0, maxHeight: 420, overflow: 'auto' }}>
                  {unresolvedOperations.map((op) => (
                    <ListItemButton
                      key={op.id}
                      selected={op.id === selectedOpId}
                      onClick={() => setSelectedOpId(op.id)}
                      sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {op.residentName || op.residentCode || op.stayId} (₹{op.totalAmount.toLocaleString('en-IN')})
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Run: {op.billingRunId} | Stay: {op.stayId}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Grid>

              {/* Right Column: Evidence & Resolution Panel */}
              <Grid size={{ xs: 12, md: 8 }} sx={{ p: 3, maxHeight: 480, overflow: 'auto' }}>
                {loadingEvidence ? (
                  <Alert severity="info" icon={<CircularProgress size={20} />}>
                    Querying authoritative Finance repository evidence...
                  </Alert>
                ) : evidenceError ? (
                  <Alert severity="error">{evidenceError}</Alert>
                ) : evidence ? (
                  <>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                      Investigation: {evidence.residentName} ({evidence.stayId})
                    </Typography>

                    <Alert severity="error" sx={{ mb: 2 }}>
                      <AlertTitle sx={{ fontWeight: 600 }}>Dispatch Failure Reason</AlertTitle>
                      {evidence.operation.failureReason || 'Technical exception during Finance bill creation.'}
                    </Alert>

                    {/* Evidence Assessment Banner */}
                    <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                      <Grid container spacing={2} sx={{ alignItems: 'center' }}>
                        <Grid size={{ xs: 12, sm: 6 }}>{getAssessmentChip(evidence.assessment)}</Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Expected Bill Amount
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            ₹{evidence.operation.totalAmount.toLocaleString('en-IN')}
                          </Typography>
                        </Grid>
                      </Grid>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {evidence.assessmentExplanation}
                      </Typography>
                    </Paper>

                    {/* Matched Finance Bills */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Matched Finance Bills ({evidence.matchedBills.length})
                    </Typography>
                    {evidence.matchedBills.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'grey.100' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Bill #</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Remarks</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {evidence.matchedBills.map((b: MatchedFinanceBillViewModel) => (
                              <TableRow key={b.id}>
                                <TableCell sx={{ fontWeight: 600 }}>{b.billNumber}</TableCell>
                                <TableCell>{b.period}</TableCell>
                                <TableCell>₹{b.totalAmount.toLocaleString('en-IN')}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={b.status}
                                    size="small"
                                    color={b.status === 'CANCELLED' ? 'error' : 'success'}
                                  />
                                </TableCell>
                                <TableCell>{b.remarks || '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                        No matching Bill records found in Finance repository for this Stay and obligation period.
                      </Typography>
                    )}

                    {/* Matched Double-Entry Ledger Postings */}
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Matched Ledger Entries ({evidence.matchedLedgerEntries.length})
                    </Typography>
                    {evidence.matchedLedgerEntries.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: 'grey.100' }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600 }}>Posting Date</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Account</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Debit</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Credit</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Ref ID</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {evidence.matchedLedgerEntries.map((le: MatchedLedgerEntryViewModel) => (
                              <TableRow key={le.id}>
                                <TableCell>{le.postingDate}</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>{le.account}</TableCell>
                                <TableCell>{le.debit > 0 ? `₹${le.debit.toLocaleString('en-IN')}` : '—'}</TableCell>
                                <TableCell>{le.credit > 0 ? `₹${le.credit.toLocaleString('en-IN')}` : '—'}</TableCell>
                                <TableCell>{le.referenceId}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                        No associated ledger entries found in Unified Stay Ledger.
                      </Typography>
                    )}

                    {/* Action Buttons */}
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Authoritative Resolution Actions
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            disabled={evidence.assessment !== 'COMMITTED' || isSubmitting}
                            onClick={() => handleOpenAction('COMMITTED')}
                            startIcon={<CheckCircleOutlined />}
                          >
                            Resolve as Committed
                          </Button>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Commits claims, sets status SUCCESS, prohibits retry.
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            disabled={evidence.assessment !== 'NOT_COMMITTED' || isSubmitting}
                            onClick={() => handleOpenAction('NOT_COMMITTED')}
                            startIcon={<CancelOutlined />}
                          >
                            Resolve as Not Committed
                          </Button>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Releases claims, sets status FAILED, enables retry run.
                          </Typography>
                        </Grid>
                      </Grid>
                      {evidence.assessment === 'UNKNOWN' && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Resolution is locked because Finance evidence is inconclusive. Perform a manual audit of Finance records before resolving.
                        </Alert>
                      )}
                    </Paper>
                  </>
                ) : null}
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isSubmitting}>
            Close Workbench
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation & Audit Form Dialog */}
      {actionType && (
        <Dialog open={true} onClose={() => setActionType(null)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ fontWeight: 600 }}>
            {actionType === 'COMMITTED' ? 'Confirm Resolve as Committed' : 'Confirm Resolve as Not Committed'}
          </DialogTitle>
          <DialogContent dividers>
            <Alert severity={actionType === 'COMMITTED' ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {actionType === 'COMMITTED'
                ? 'This action will permanently commit claims and link the Finance Bill. The operation will never be retried.'
                : 'This action will release claims and mark the operation as failed. The obligations will become eligible for a Retry Run.'}
            </Alert>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Operator ID"
                  fullWidth
                  required
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                />
              </Grid>

              {actionType === 'NOT_COMMITTED' && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    label="Mandatory Reason"
                    fullWidth
                    required
                    multiline
                    rows={2}
                    value={resolutionReason}
                    onChange={(e) => setResolutionReason(e.target.value)}
                    placeholder="e.g. Conclusively verified no bill was created in Finance repository"
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Audit Notes (Optional)"
                  fullWidth
                  multiline
                  rows={2}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setActionType(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color={actionType === 'COMMITTED' ? 'success' : 'error'}
              onClick={handleConfirmResolution}
              disabled={
                isSubmitting ||
                !operatorId.trim() ||
                (actionType === 'NOT_COMMITTED' && !resolutionReason.trim())
              }
            >
              {isSubmitting ? 'Applying...' : 'Confirm Resolution'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
