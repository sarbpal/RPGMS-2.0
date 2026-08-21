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
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Close,
  Checklist,
  AccountCircle,
  Room,
} from '@mui/icons-material';
import type { LaundryTransactionDetailViewModel } from '../application/models/LaundryWorkspaceViewModel';

interface LaundryTransactionDetailDrawerProps {
  open: boolean;
  detail: LaundryTransactionDetailViewModel | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirmCollection?: (detail: LaundryTransactionDetailViewModel) => void;
}

export function LaundryTransactionDetailDrawer({
  open,
  detail,
  isLoading,
  onClose,
  onConfirmCollection,
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
          <Tab label="Exceptions" />
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

                {/* Returns History */}
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, textTransform: 'uppercase', color: 'text.secondary' }}>
                    Custody Return History ({detail.returns.length})
                  </Typography>
                  {detail.returns.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No clean return deliveries recorded from processing yet.
                    </Typography>
                  ) : (
                    detail.returns.map((ret) => (
                      <Paper key={ret.id} variant="outlined" sx={{ p: 1.5, mb: 1, borderRadius: 1.5 }}>
                        <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Return #{ret.id} — {ret.totalReturnedPieces} Pieces
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {ret.returnedAtFormatted}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Received by Staff: {ret.returnedByStaffId}
                        </Typography>
                      </Paper>
                    ))
                  )}
                </Box>
              </Stack>
            )}

            {/* TAB 2: Deliveries */}
            {activeTab === 2 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                  Delivery & Resident Handovers ({detail.deliveries.length})
                </Typography>
                {detail.deliveries.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No resident delivery handovers recorded yet.
                  </Typography>
                ) : (
                  detail.deliveries.map((del) => (
                    <Paper key={del.id} variant="outlined" sx={{ p: 2, borderRadius: 1.5 }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            Delivery #{del.id} • {del.totalDeliveredPieces} Pieces
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Method: {del.handoverMethodLabel} • Handed over by {del.deliveredByStaffId} on {del.deliveredAtFormatted}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          color={del.residentVerified ? 'success' : 'default'}
                          label={del.residentVerified ? 'Resident Verified' : 'Placement Handover'}
                          sx={{ fontSize: '0.7rem' }}
                        />
                      </Stack>
                    </Paper>
                  ))
                )}
              </Stack>
            )}

            {/* TAB 3: Exceptions */}
            {activeTab === 3 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary' }}>
                  Operational Exceptions & Disputes ({detail.exceptions.length})
                </Typography>
                {detail.exceptions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No exceptions raised on this order.
                  </Typography>
                ) : (
                  detail.exceptions.map((exc) => (
                    <Paper key={exc.id} variant="outlined" sx={{ p: 2, borderRadius: 1.5, borderColor: exc.status === 'RESOLVED' ? 'divider' : 'error.light' }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {exc.typeLabel} ({exc.affectedQuantity} pc)
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {exc.description}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          color={exc.status === 'RESOLVED' ? 'success' : 'error'}
                          label={exc.statusLabel}
                          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                        />
                      </Stack>
                      {exc.resolution && (
                        <Box sx={{ mt: 1.5, p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                          <Typography variant="caption" color="success.dark" sx={{ fontWeight: 600, display: 'block' }}>
                            Resolution: {exc.resolution.outcomeLabel} by {exc.resolution.resolverStaffId}
                          </Typography>
                          {exc.resolution.notes && (
                            <Typography variant="caption" color="text.secondary">
                              {exc.resolution.notes}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Paper>
                  ))
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
                  Charges are automatically calculated per BR-L-012 when services are fulfilled and garments are physically delivered to the resident.
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
          <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
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
            {detail.status !== 'DRAFT' && (
              <Tooltip title="Lifecycle inspection, return, delivery, and charge posting workflows will be enabled in L-12 through L-15">
                <span>
                  <Button variant="outlined" disabled sx={{ textTransform: 'none' }}>
                    Lifecycle Actions (L-12+)
                  </Button>
                </span>
              </Tooltip>
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
