import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { CalendarMonth, Edit } from '@mui/icons-material';
import { Stay } from '../domain/entities/Stay';

interface BillingCycleHistoryCardProps {
  stay: Stay;
  onChangeBillingCycle: () => void;
}

export function BillingCycleHistoryCard({
  stay,
  onChangeBillingCycle,
}: BillingCycleHistoryCardProps) {
  const records = stay.billingCycleRecords;
  const changes = stay.billingCycleChanges;

  const isChangeAllowed =
    stay.status === 'PLANNED' || stay.status === 'ACTIVE' || stay.status === 'ON_NOTICE';

  return (
    <Card variant="outlined" sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonth color="primary" />
<Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Billing Cycle History
            </Typography>
          </Box>
          {isChangeAllowed && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Edit />}
              onClick={onChangeBillingCycle}
            >
              Change Billing Cycle
            </Button>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, bgcolor: 'action.hover', p: 1.5, borderRadius: 1 }}>
<Typography variant="body2" sx={{ fontWeight: 'medium' }}>
            Current Billing Anchor:
          </Typography>
          <Chip
            label={`${stay.billingAnchorDay}th of month`}
            color="primary"
            size="small"
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            Check-In Date: {stay.checkInDate} (Immutable)
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} gutterBottom>
          Historical Billing Cycles
        </Typography>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
<TableCell sx={{ fontWeight: 'bold' }}>Anchor Day</TableCell>
<TableCell sx={{ fontWeight: 'bold' }}>Effective Period</TableCell>
<TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
<TableCell sx={{ fontWeight: 'bold' }}>Financial Adj Ref</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((bcr, index) => {
                const isCurrent = !bcr.effectiveTo;
                const change = changes.find((c) => c.changeId === bcr.changeId);

                return (
                  <TableRow key={bcr.id || index}>
                    <TableCell>
<Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Day {bcr.billingAnchorDay}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {bcr.effectiveFrom} {bcr.effectiveTo ? `to ${bcr.effectiveTo}` : 'onward'}
                    </TableCell>
                    <TableCell>
                      {isCurrent ? (
                        <Chip label="Current" color="success" size="small" variant="outlined" />
                      ) : (
                        <Chip label="Historical" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      {change?.financialAdjustmentReference ? (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {change.financialAdjustmentReference}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {changes.length > 0 && (
          <Box sx={{ mt: 3 }}>
<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} gutterBottom>
              Change Requests & History
            </Typography>
            {changes.map((c) => (
              <Box
                key={c.changeId}
                sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
<Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Anchor Day {c.previousBillingAnchor} → Day {c.requestedBillingAnchor}
                  </Typography>
                  <Chip label={c.status} size="small" color={c.status === 'EFFECTIVE' ? 'success' : 'default'} />
                </Box>
<Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Effective From: {c.effectiveFrom} | Reason: {c.reason}
                </Typography>
                {c.financialAdjustmentReference && (
<Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                    Financial Adjustment Reference: {c.financialAdjustmentReference}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
