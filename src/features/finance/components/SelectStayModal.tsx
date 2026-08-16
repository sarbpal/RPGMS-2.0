import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  Stack,
  IconButton,
} from '@mui/material';
import { Search, Close, Person, ArrowForward } from '@mui/icons-material';
import type { SelectableStayItem } from '../application/coordinator/FinanceWorkspaceCoordinator';
import type { FinanceModalType } from '../hooks/useFinanceWorkspace';
import { formatCurrency } from '../utils/currencyFormatters';

export interface SelectStayModalProps {
  open: boolean;
  actionType: FinanceModalType;
  stays: SelectableStayItem[];
  onSelectStay: (stay: SelectableStayItem) => void;
  onClose: () => void;
}

export function SelectStayModal({
  open,
  actionType,
  stays,
  onSelectStay,
  onClose,
}: SelectStayModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const actionTitle = useMemo(() => {
    switch (actionType) {
      case 'RECEIVE_PAYMENT':
        return 'Receive Payment — Select Resident / Stay';
      case 'GENERATE_RENT':
        return 'Generate Rent — Select Resident / Stay';
      case 'ADD_LAUNDRY':
        return 'Add Extra Charge — Select Resident / Stay';
      case 'PROCESS_SETTLEMENT':
        return 'Process Settlement — Select Resident / Stay';
      default:
        return 'Select Target Resident / Stay';
    }
  }, [actionType]);

  const actionSubtitle = useMemo(() => {
    switch (actionType) {
      case 'RECEIVE_PAYMENT':
        return 'Choose the active resident account receiving the payment.';
      case 'GENERATE_RENT':
        return 'Choose the active resident stay to generate a monthly rent invoice for.';
      case 'ADD_LAUNDRY':
        return 'Choose the resident stay to post additional ancillary or laundry charges.';
      case 'PROCESS_SETTLEMENT':
        return 'Choose the resident stay (active or on-notice) to process checkout settlement.';
      default:
        return 'Choose an active resident stay to continue.';
    }
  }, [actionType]);

  const filteredStays = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stays;
    return stays.filter(
      (s) =>
        s.residentName.toLowerCase().includes(q) ||
        s.residentCode.toLowerCase().includes(q) ||
        s.flatName.toLowerCase().includes(q) ||
        s.allocatedBedsLabel.toLowerCase().includes(q) ||
        s.stayId.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
    );
  }, [stays, searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleSelect = (stay: SelectableStayItem) => {
    setSearchQuery('');
    onSelectStay(stay);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {actionTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {actionSubtitle}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" aria-label="close">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2.5 }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by resident name, resident code (e.g. R00124), flat or bed..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" color="action" />
                  </InputAdornment>
                ),
              },
            }}
            autoFocus
          />

          {filteredStays.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Person sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                No Matching Stays Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {stays.length === 0
                  ? 'There are no active or on-notice stays currently recorded in the system.'
                  : 'Try searching with a different name, resident code, flat number, or bed identifier.'}
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 380, borderRadius: 2 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Resident</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Accommodation</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Rent / mo
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Outstanding
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStays.map((stay) => (
                    <TableRow
                      key={stay.stayId}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleSelect(stay)}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {stay.residentName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stay.residentCode} • {stay.stayId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{stay.flatName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {stay.allocatedBedsLabel}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={stay.status.replace(/_/g, ' ')}
                          size="small"
                          color={stay.status === 'ACTIVE' ? 'success' : 'warning'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">
                          {stay.agreedRent > 0 ? formatCurrency(stay.agreedRent) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 700,
                            color: stay.currentBalance > 0 ? 'error.main' : 'success.main',
                          }}
                        >
                          {formatCurrency(stay.currentBalance)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          endIcon={<ArrowForward fontSize="small" />}
                          onClick={() => handleSelect(stay)}
                          sx={{ textTransform: 'none', py: 0.5 }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
