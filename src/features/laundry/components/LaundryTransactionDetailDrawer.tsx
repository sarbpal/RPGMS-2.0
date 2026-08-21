import { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Stack,
  Chip,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Alert,
} from '@mui/material';
import {
  Close,
  Checklist,
  AccountCircle,
  Room,
  SearchOutlined,
  LocalShipping,
  AssignmentReturned,
  WarningAmber,
  CheckCircleOutlined,
} from '@mui/icons-material';
import type {
  LaundryTransactionDetailViewModel,
  ExceptionViewModel,
} from '../application/models/LaundryWorkspaceViewModel';

interface LaundryTransactionDetailDrawerProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirmCollection?: (detail: LaundryTransactionDetailViewModel) => void;
  onRecordInspection?: (detail: LaundryTransactionDetailViewModel) => void;
  onReleaseProcessing?: (detail: LaundryTransactionDetailViewModel) => void;
  onRecordReturn?: (detail: LaundryTransactionDetailViewModel) => void;
  onRecordDelivery?: (detail: LaundryTransactionDetailViewModel) => void;
  onRaiseException?: (detail: LaundryTransactionDetailViewModel) => void;
  onRecordInvestigation?: (detail: LaundryTransactionDetailViewModel, exception: ExceptionViewModel) => void;
  onResolveException?: (detail: LaundryTransactionDetailViewModel, exception: ExceptionViewModel) => void;
}

export function LaundryTransactionDetailDrawer({
  open,
  detail,
  isLoading,
  onClose,
  onConfirmCollection,
  onRecordInspection,
  onReleaseProcessing,
  onRecordReturn,
  onRecordDelivery,
  onRaiseException,
  onRecordInvestigation,
  onResolveException,
}: LaundryTransactionDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<number>(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 600, md: 720 },
            p: 0,
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* 1. Header Bar */}
      <Box sx={{ p: 2.5, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>
                {detail ? detail.id : 'Loading...'}
              </Typography>
              {detail && (
                <Chip
                  size="small"
                  label={detail.statusLabel}
                  color={detail.status === 'COMPLETED' ? 'success' : (detail.status === 'DRAFT' ? 'default' : 'primary')}
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Stack>
            {detail && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Created on {detail.createdAtFormatted}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onClose} size="small" aria-label="Close detail drawer">
            <Close />
          </IconButton>
        </Stack>

        {/* Resident & Room Summary */}
        {detail && (
          <Paper variant="outlined" sx={{ mt: 2, p: 1.5, borderRadius: 1.5, bgcolor: 'background.paper' }}>
            <GridSummary residentName={detail.residentName} residentCode={detail.residentCode} location={detail.locationSummary} />
          </Paper>
        )}

        {/* Physical Piece Reconciliation Counter */}
        {detail && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
            <Chip size="small" variant="outlined" label={`Collected: ${detail.totalPhysicalPieces}`} sx={{ fontWeight: 600 }} />
            <Chip size="small" variant="outlined" label={`Returned: ${detail.totalReturnedPieces}`} sx={{ fontWeight: 600 }} />
            <Chip size="small" variant="outlined" color="success" label={`Delivered: ${detail.totalDeliveredPieces}`} sx={{ fontWeight: 600 }} />
            {detail.totalResolvedPieces > 0 && (
              <Chip size="small" variant="outlined" color="info" label={`Resolved: ${detail.totalResolvedPieces}`} sx={{ fontWeight: 600 }} />
            )}
            <Chip
              size="small"
              color={detail.totalOutstandingPieces > 0 ? 'warning' : 'default'}
              label={`Outstanding: ${detail.totalOutstandingPieces}`}
              sx={{ fontWeight: 700 }}
            />
          </Stack>
        )}
      </Box>

      {/* 2. Multi-Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 44, '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' } }}
        >
          <Tab label="Garments & Services" />
          <Tab label="Processing & Custody" />
          <Tab label="Deliveries" />
          <Tab label={detail && detail.exceptions.length > 0 ? `Exceptions (${detail.exceptions.length})` : 'Exceptions'} />
          <Tab label="Commercial & Charges" />
          <Tab label="Audit Timeline" />
        </Tabs>
      </Box>

      {/* 3. Main Tab Content Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
        {isLoading && !detail ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !detail ? (
          <Typography color="text.secondary">No transaction selected.</Typography>
        ) : (
          <>
            {/* TAB 0: Garments & Services */}
            {activeTab === 0 && (
              <Stack spacing={3}>
                {/* Garment Lines Table */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
                    Garment Lines & Requested Services
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Pieces</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Requested Services</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="right">Est. Rate</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.garmentLines.map((line) => (
                          <TableRow key={line.id}>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {line.itemName}
                              </Typography>
                              {line.notes && (
                                <Typography variant="caption" color="text.secondary">
                                  {line.notes}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {line.physicalQuantity}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Stack spacing={0.5}>
                                {line.serviceAllocations.map((sa) => (
                                  <Box key={sa.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2">{sa.serviceName}</Typography>
                                    <Chip
                                      size="small"
                                      label={sa.fulfillmentStatus}
                                      color={sa.fulfillmentStatus === 'FULFILLED' ? 'success' : 'default'}
                                      sx={{ fontSize: '0.65rem', height: 18 }}
                                    />
                                  </Box>
                                ))}
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <Stack spacing={0.5} sx={{ alignItems: 'flex-end' }}>
                                {line.serviceAllocations.map((sa) => (
                                  <Typography key={sa.id} variant="body2" color="text.secondary">
                                    {sa.unitRateFormatted ? `${sa.unitRateFormatted}/pc` : 'Rate Pending'}
                                  </Typography>
                                ))}
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Collection Evidence & Bag Information */}
                {detail.collectionEvidence && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
                      Collection Intake Evidence
                    </Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Collected By Staff ID:</strong> {detail.collectionEvidence.collectedByStaffId}
                      </Typography>
                      {detail.collectionEvidence.bagCount !== undefined && (
                        <Typography variant="body2">
                          <strong>Bags Collected:</strong> {detail.collectionEvidence.bagCount}
                        </Typography>
                      )}
                      {detail.collectionEvidence.bagTagNumbers && detail.collectionEvidence.bagTagNumbers.length > 0 && (
                        <Typography variant="body2">
                          <strong>Bag Tags:</strong> {detail.collectionEvidence.bagTagNumbers.join(', ')}
                        </Typography>
                      )}
                      <Typography variant="body2">
                        <strong>Resident Verification:</strong> {detail.collectionEvidence.residentVerified ? 'Verified by Resident' : 'Not Verified'}
                      </Typography>
                      {detail.collectionEvidence.photoUris && detail.collectionEvidence.photoUris.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                            Intake Photographs ({detail.collectionEvidence.photoUris.length}):
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            {detail.collectionEvidence.photoUris.map((uri, i) => (
                              <Chip key={i} size="small" variant="outlined" label={uri} sx={{ fontSize: '0.75rem' }} />
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            )}

            {/* TAB 1: Processing & Custody */}
            {activeTab === 1 && (
              <Stack spacing={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
                    Route & Inspection Status
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">
                      <strong>Processing Route:</strong> {detail.processingRouteLabel || 'Not Selected'}
                    </Typography>
                    {detail.processingVendorId && (
                      <Typography variant="body2">
                        <strong>External Vendor ID:</strong> {detail.processingVendorId}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Inspection Sign-off:</strong> {detail.isInspected ? `Completed by ${detail.inspectedByStaffId} on ${detail.inspectedAtFormatted}` : 'Pending Pre-Processing Inspection'}
                    </Typography>
                    {detail.processingReleasedAtFormatted && (
                      <Typography variant="body2">
                        <strong>Released to Processing:</strong> {detail.processingReleasedAtFormatted} by {detail.processingReleasedByStaffId}
                      </Typography>
                    )}
                  </Stack>
                </Paper>

                {/* Custody Reconciliation Card */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: '#fbfcfd', borderColor: 'primary.light' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', color: 'text.secondary' }}>
                    Custody Reconciliation Status
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Expected Collected Pieces</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{detail.totalPhysicalPieces}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Cumulative Returned into Custody</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{detail.totalReturnedPieces}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Outstanding to Return</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: detail.totalPhysicalPieces - detail.totalReturnedPieces > 0 ? 'warning.main' : 'success.main' }}>
                        {Math.max(0, detail.totalPhysicalPieces - detail.totalReturnedPieces)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Chip
                    size="small"
                    color={
                      detail.totalReturnedPieces === detail.totalPhysicalPieces
                        ? 'success'
                        : detail.totalReturnedPieces > 0
                        ? 'warning'
                        : 'default'
                    }
                    label={
                      detail.totalReturnedPieces === detail.totalPhysicalPieces
                        ? 'Fully Reconciled & Returned'
                        : detail.totalReturnedPieces > 0
                        ? `Partially Returned (${Math.max(0, detail.totalPhysicalPieces - detail.totalReturnedPieces)} pcs remaining)`
                        : 'Awaiting Return from Processing'
                    }
                    sx={{ fontWeight: 700 }}
                  />
                </Paper>

                {/* Line-by-Line Custody Breakdown */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
                    Garment Lines Custody Breakdown
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Collected</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Returned</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Delivered</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Remaining to Return</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.garmentLines.map((line) => {
                          const remainingReturn = Math.max(0, line.physicalQuantity - line.returnedQuantity);
                          return (
                            <TableRow key={line.id}>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {line.itemName}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2">{line.physicalQuantity}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
                                  {line.returnedQuantity}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="body2">{line.deliveredQuantity}</Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  size="small"
                                  label={remainingReturn}
                                  color={remainingReturn > 0 ? 'warning' : 'default'}
                                  variant="outlined"
                                  sx={{ fontWeight: 700, fontSize: '0.75rem', height: 20 }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Returns History */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
                    Custody Return History ({detail.returns.length})
                  </Typography>
                  {detail.returns.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No clean return receipts recorded from processing yet.
                    </Typography>
                  ) : (
                    detail.returns.map((ret) => (
                      <Paper key={ret.id} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 1.5 }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Receipt #{ret.id} — {ret.totalReturnedPieces} Pieces Returned
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                              Received by Staff: {ret.returnedByStaffId} on {ret.returnedAtFormatted}
                            </Typography>
                          </Box>
                          <Chip size="small" variant="outlined" color="primary" label={`${ret.totalReturnedPieces} pcs`} sx={{ fontWeight: 700 }} />
                        </Stack>

                        {/* Returned Lines Breakdown */}
                        <Box sx={{ mt: 1.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {ret.returnedLines.map((rl, idx) => (
                              <Chip
                                key={idx}
                                size="small"
                                variant="outlined"
                                label={`${rl.itemName}: ${rl.returnedQuantity} pcs`}
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))}
                          </Stack>
                        </Box>

                        {ret.notes && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                            Notes: {ret.notes}
                          </Typography>
                        )}
                      </Paper>
                    ))
                  )}
                </Box>
              </Stack>
            )}

            {/* TAB 2: Deliveries */}
            {activeTab === 2 && (
              <Stack spacing={3}>
                {/* Delivery Summary Card */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: '#fbfdfb', borderColor: 'success.light' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, textTransform: 'uppercase', color: 'text.secondary' }}>
                    Delivery Handover Overview
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Total Delivered to Resident</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>{detail.totalDeliveredPieces}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Deliverable in Custody</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: detail.totalReturnedPieces > detail.totalDeliveredPieces ? 'primary.main' : 'text.secondary' }}>
                        {Math.max(0, detail.totalReturnedPieces - detail.totalDeliveredPieces)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary">Outstanding Order Pieces</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: detail.totalOutstandingPieces > 0 ? 'warning.main' : 'default' }}>
                        {detail.totalOutstandingPieces}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Delivery Receipts List */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
                    Delivery & Resident Handovers ({detail.deliveries.length})
                  </Typography>
                  {detail.deliveries.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No resident delivery handovers recorded yet.
                    </Typography>
                  ) : (
                    detail.deliveries.map((del) => (
                      <Paper key={del.id} variant="outlined" sx={{ p: 2, mb: 1.5, borderRadius: 1.5 }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              Delivery #{del.id} • {del.totalDeliveredPieces} Pieces Delivered
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                              Method: {del.handoverMethodLabel}
                              {del.roomNumber && ` (${del.roomNumber})`}
                              {` • Handed over by ${del.deliveredByStaffId} on ${del.deliveredAtFormatted}`}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            color={del.residentVerified ? 'success' : 'default'}
                            label={del.residentVerified ? 'Resident Verified' : (del.residentPresent ? 'Resident Present' : 'Placement Handover')}
                            sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                          />
                        </Stack>

                        {/* Delivered Lines Breakdown */}
                        <Box sx={{ mt: 1.5, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {del.deliveredLines.map((dl, idx) => (
                              <Chip
                                key={idx}
                                size="small"
                                variant="outlined"
                                label={`${dl.itemName}: ${dl.deliveredQuantity} pcs`}
                                sx={{ fontSize: '0.75rem' }}
                              />
                            ))}
                          </Stack>
                        </Box>

                        {del.evidenceUris && del.evidenceUris.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              Delivery Evidence References:
                            </Typography>
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                              {del.evidenceUris.map((uri, idx) => (
                                <Chip key={idx} size="small" variant="outlined" label={uri} sx={{ fontSize: '0.7rem' }} />
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {del.notes && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                            Notes: {del.notes}
                          </Typography>
                        )}
                      </Paper>
                    ))
                  )}
                </Box>
              </Stack>
            )}

            {/* TAB 3: Exceptions */}
            {activeTab === 3 && (
              <Stack spacing={2.5}>
                {/* Top Action Bar */}
                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                    Operational Exceptions & Disputes ({detail.exceptions.length})
                  </Typography>
                  {onRaiseException && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<WarningAmber />}
                      onClick={() => onRaiseException(detail)}
                      sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      Raise Exception
                    </Button>
                  )}
                </Stack>

                {detail.exceptions.length === 0 ? (
                  <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 1.5, bgcolor: 'grey.50' }}>
                    <Typography variant="body2" color="text.secondary">
                      No operational exceptions or discrepancies recorded on this order.
                    </Typography>
                  </Paper>
                ) : (
                  detail.exceptions.map((exc) => {
                    const isResolved = exc.status === 'RESOLVED';
                    const isUnderInvestigation = exc.status === 'UNDER_INVESTIGATION';

                    return (
                      <Paper
                        key={exc.id}
                        variant="outlined"
                        sx={{
                          p: 2.5,
                          borderRadius: 2,
                          borderColor: isResolved ? 'divider' : (exc.isBlocking ? 'error.main' : 'warning.main'),
                          borderWidth: isResolved ? 1 : 1.5,
                        }}
                      >
                        {/* Header: Type, Status, Blocking */}
                        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                #{exc.id} • {exc.typeLabel}
                              </Typography>
                              <Chip
                                size="small"
                                color={isResolved ? 'success' : (isUnderInvestigation ? 'info' : 'warning')}
                                label={exc.statusLabel}
                                sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                              />
                              {exc.isBlocking && (
                                <Chip
                                  size="small"
                                  color="error"
                                  icon={<WarningAmber fontSize="small" />}
                                  label="Blocking Delivery"
                                  sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                />
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                              Raised by {exc.raisedByStaffId} on {exc.raisedAtFormatted}
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Affected: ${exc.affectedQuantity} pc(s)`}
                            sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                          />
                        </Stack>

                        {/* Targeting Context (Garment Line / Service) */}
                        {(exc.itemName || exc.serviceName) && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {exc.itemName && (
                                <>
                                  Target Item: <strong>{exc.itemName}</strong>
                                </>
                              )}
                              {exc.serviceName && (
                                <>
                                  {' • '}Target Service: <strong>{exc.serviceName}</strong>
                                </>
                              )}
                            </Typography>
                          </Box>
                        )}

                        {/* Description */}
                        <Typography variant="body2" sx={{ mt: 1.5 }}>
                          {exc.description}
                        </Typography>

                        {/* Evidence References */}
                        {exc.evidenceUris && exc.evidenceUris.length > 0 && (
                          <Box sx={{ mt: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                              Evidence References:
                            </Typography>
                            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                              {exc.evidenceUris.map((uri, idx) => (
                                <Chip key={idx} size="small" variant="outlined" label={uri} sx={{ fontSize: '0.7rem' }} />
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {/* Investigation History Log */}
                        {exc.investigations && exc.investigations.length > 0 && (
                          <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1 }}>
                              Investigation History ({exc.investigations.length})
                            </Typography>
                            <Stack spacing={1}>
                              {exc.investigations.map((inv) => (
                                <Paper key={inv.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#fbfcfd' }}>
                                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                      Investigated by {inv.investigatorStaffId} on {inv.startedAtFormatted}
                                    </Typography>
                                    {inv.responsibleParty && (
                                      <Chip
                                        size="small"
                                        variant="outlined"
                                        color="info"
                                        label={`Responsible: ${inv.responsibleParty}`}
                                        sx={{ fontSize: '0.65rem', height: 20 }}
                                      />
                                    )}
                                  </Stack>
                                  <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.8rem' }}>
                                    {inv.findings}
                                  </Typography>
                                  {inv.evidenceUris && inv.evidenceUris.length > 0 && (
                                    <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                                      {inv.evidenceUris.map((uri, idx) => (
                                        <Chip key={idx} size="small" variant="outlined" label={uri} sx={{ fontSize: '0.65rem', height: 18 }} />
                                      ))}
                                    </Stack>
                                  )}
                                </Paper>
                              ))}
                            </Stack>
                          </Box>
                        )}

                        {/* Resolution Summary Banner */}
                        {exc.resolution && (
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f0fdf4', border: 1, borderColor: '#bbf7d0', borderRadius: 1.5 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                              <CheckCircleOutlined color="success" fontSize="small" sx={{ mt: 0.25 }} />
                              <Box sx={{ flex: 1 }}>
                                <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'success.dark' }}>
                                    Resolution: {exc.resolution.outcomeLabel}
                                  </Typography>
                                  {exc.resolution.resolvedQuantity !== undefined && exc.resolution.resolvedQuantity > 0 && (
                                    <Chip
                                      size="small"
                                      color="success"
                                      label={`Resolved: ${exc.resolution.resolvedQuantity} pcs`}
                                      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                                  Resolved by {exc.resolution.resolverStaffId} on {exc.resolution.resolvedAtFormatted}
                                  {exc.resolution.responsibleParty && ` • Attributed to: ${exc.resolution.responsibleParty}`}
                                </Typography>
                                {exc.resolution.notes && (
                                  <Typography variant="body2" sx={{ mt: 0.5, fontSize: '0.8rem', fontStyle: 'italic' }}>
                                    Notes: {exc.resolution.notes}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </Box>
                        )}

                        {/* Action Buttons for Active Exceptions */}
                        {!isResolved && (
                          <Box sx={{ mt: 2, pt: 1.5, borderTop: 1, borderColor: 'divider' }}>
                            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                              {onRecordInvestigation && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="primary"
                                  startIcon={<SearchOutlined />}
                                  onClick={() => onRecordInvestigation(detail, exc)}
                                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                                >
                                  Add Investigation
                                </Button>
                              )}
                              {onResolveException && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<CheckCircleOutlined />}
                                  onClick={() => onResolveException(detail, exc)}
                                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                                >
                                  Resolve Exception
                                </Button>
                              )}
                            </Stack>
                          </Box>
                        )}
                      </Paper>
                    );
                  })
                )}
              </Stack>
            )}

            {/* TAB 4: Commercial & Charges */}
            {activeTab === 4 && (
              <Stack spacing={3}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 1.5, bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
                    Financial Summary
                  </Typography>
                  <Stack direction="row" spacing={3}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Estimated Commercial Value
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {detail.totalEstimatedAmountFormatted}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Posted to Finance Ledger
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: detail.isFullyChargedAndPosted ? 'success.main' : 'text.primary' }}>
                        {detail.totalPostedAmountFormatted}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                  Charges are automatically evaluated per BR-L-012 when services are fulfilled and garments are physically delivered to the resident.
                </Alert>
              </Stack>
            )}

            {/* TAB 5: Audit Timeline */}
            {activeTab === 5 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                  Chronological Event Log ({detail.timeline.length})
                </Typography>
                {detail.timeline.map((evt) => (
                  <Paper key={evt.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {evt.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                          {evt.description}
                        </Typography>
                      </Box>
                      <Chip size="small" label={evt.timestampFormatted} variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </>
        )}
      </Box>

      {/* 4. Footer Action Bar */}
      {detail && (
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1 }}>
            {detail.status === 'DRAFT' && onConfirmCollection && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<Checklist />}
                onClick={() => onConfirmCollection(detail)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Confirm Collection Baseline
              </Button>
            )}

            {detail.status === 'COLLECTED' && !detail.isInspected && onRecordInspection && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<SearchOutlined />}
                onClick={() => onRecordInspection(detail)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Record Pre-Processing Inspection
              </Button>
            )}

            {detail.status === 'COLLECTED' && detail.isInspected && onReleaseProcessing && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<LocalShipping />}
                onClick={() => onReleaseProcessing(detail)}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Select Route & Release to Processing
              </Button>
            )}

            {/* Return Action: when order is in-process or partially returned / has unreturned pieces */}
            {(detail.status === 'IN_PROCESS' ||
              detail.status === 'RETURNED_PARTIAL' ||
              (detail.totalReturnedPieces < detail.totalPhysicalPieces &&
                detail.status !== 'DRAFT' &&
                detail.status !== 'COLLECTED' &&
                detail.status !== 'CANCELLED' &&
                detail.status !== 'COMPLETED')) &&
              onRecordReturn && (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AssignmentReturned />}
                  onClick={() => onRecordReturn(detail)}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Record Return from Processing
                </Button>
              )}

            {/* Delivery Action: when order has deliverable pieces in custody */}
            {detail.totalReturnedPieces > detail.totalDeliveredPieces &&
              detail.status !== 'DRAFT' &&
              detail.status !== 'COLLECTED' &&
              detail.status !== 'CANCELLED' &&
              onRecordDelivery && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<LocalShipping />}
                  onClick={() => onRecordDelivery(detail)}
                  sx={{ textTransform: 'none', fontWeight: 700 }}
                >
                  Record Resident Delivery
                </Button>
              )}

            {detail.status === 'COMPLETED' && (
              <Chip label="Order Completed" color="success" sx={{ fontWeight: 700 }} />
            )}
          </Stack>
        </Box>
      )}
    </Drawer>
  );
}

function GridSummary({ residentName, residentCode, location }: { residentName: string; residentCode: string; location: string }) {
  return (
    <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <AccountCircle color="action" />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {residentName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {residentCode}
          </Typography>
        </Box>
      </Stack>
      <Divider orientation="vertical" flexItem />
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Room color="action" />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {location}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Stay Location
          </Typography>
        </Box>
      </Stack>
    </Stack>
  );
}
