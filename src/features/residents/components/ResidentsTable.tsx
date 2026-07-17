import { Edit as EditIcon } from '@mui/icons-material';
import {
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import { ResidentStatus } from '../types';
import type { Resident } from '../types';

interface ResidentsTableProps {
  residents: Resident[];
  onEdit: (resident: Resident) => void;
}

export function ResidentsTable({ residents, onEdit }: ResidentsTableProps) {
  const getStatusChipColor = (status: ResidentStatus) => {
    switch (status) {
      case ResidentStatus.ACTIVE:
        return 'success';
      case ResidentStatus.ON_NOTICE:
        return 'warning';
      case ResidentStatus.CHECKED_OUT:
        return 'default';
      case ResidentStatus.ALUMNI:
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'grey.300',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
      }}
    >
      <Table sx={{ minWidth: 650 }} aria-label="residents table">
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Resident ID</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Mobile Number</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Flat</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Assigned Beds</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Joining Date</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {residents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                No residents found.
              </TableCell>
            </TableRow>
          ) : (
            residents.map((resident) => (
              <TableRow key={resident.id} hover>
                <TableCell>{resident.personalInfo.residentId}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>
                  {resident.personalInfo.fullName}
                </TableCell>
                <TableCell>{resident.personalInfo.mobileNumber}</TableCell>
                <TableCell>{resident.personalInfo.email || '-'}</TableCell>
                <TableCell>Flat {resident.flatId}</TableCell>
                <TableCell>
                  {resident.assignedBedIds.map((bedId) => bedId.replace(`${resident.flatId}-`, '')).join(', ')}
                </TableCell>
                <TableCell>{resident.joiningDate}</TableCell>
                <TableCell>
                  <Chip
                    label={resident.status}
                    color={getStatusChipColor(resident.status)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    startIcon={<EditIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => onEdit(resident)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
