import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Typography,
  Box,
} from '@mui/material';
import type { DepositTransaction, DepositTransactionType } from '../domain';

interface DepositLedgerTableProps {
  transactions: DepositTransaction[];
}

const getTransactionChip = (type: DepositTransactionType) => {
  switch (type) {
    case 'DEPOSIT_RECEIPT':
      return <Chip label="Deposit Receipt" color="success" size="small" />;
    case 'PARTIAL_RETURN':
      return <Chip label="Partial Return" color="info" size="small" />;
    case 'DEPOSIT_DEDUCTION':
      return <Chip label="Damage Deduction" color="warning" size="small" />;
    case 'SETTLEMENT_CLEARANCE':
      return <Chip label="Settlement Clearance" color="default" size="small" />;
    default:
      return <Chip label={type} size="small" />;
  }
};

const formatCurrency = (val: number) => `₹${val.toLocaleString('en-IN')}`;

export const DepositLedgerTable: React.FC<DepositLedgerTableProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No deposit account transactions recorded yet.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Transaction Type</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align="right">
              Amount
            </TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Method / Reason</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Recorded By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id} hover>
              <TableCell>{tx.postingDate}</TableCell>
              <TableCell>{getTransactionChip(tx.transactionType)}</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                {formatCurrency(tx.amount)}
              </TableCell>
              <TableCell>{tx.paymentMethod || tx.reason || '-'}</TableCell>
              <TableCell>{tx.remarks || '-'}</TableCell>
              <TableCell>{tx.createdBy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
