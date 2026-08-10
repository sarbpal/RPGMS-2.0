import { useState } from 'react';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { MaintenancePersonnel } from '../domain/entities/MaintenancePersonnel';
import type { PersonnelType } from '../domain/types/MaintenanceTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  personnelList: readonly MaintenancePersonnel[];
  onCreatePersonnel: (data: {
    name: string;
    phone: string;
    type: PersonnelType;
    doorId?: string;
    address?: string;
    notes?: string;
  }) => Promise<void>;
  onToggleStatus: (id: string) => Promise<void>;
}

export function ManagePersonnelModal({
  isOpen,
  onClose,
  personnelList,
  onCreatePersonnel,
  onToggleStatus,
}: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<PersonnelType>('STAFF');
  const [doorId, setDoorId] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreate = async () => {
    try {
      setErrorMsg('');
      setIsSubmitting(true);

      await onCreatePersonnel({
        name,
        phone,
        type,
        doorId: doorId || undefined,
        address: address || undefined,
        notes: notes || undefined,
      });

      setName('');
      setPhone('');
      setDoorId('');
      setAddress('');
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add personnel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Maintenance Personnel / Service Providers
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          {/* Add New Personnel Form */}
          <Paper elevation={0} sx={{ p: 2, border: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Add New Technician / Service Provider
            </Typography>

            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Full Name"
                  required
                  size="small"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                />

                <TextField
                  label="Phone Number"
                  required
                  size="small"
                  fullWidth
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                />

                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={type}
                    label="Type"
                    onChange={(e) => setType(e.target.value as PersonnelType)}
                  >
                    <MenuItem value="STAFF">Internal Staff</MenuItem>
                    <MenuItem value="EXTERNAL">External Provider</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Door ID Reference (Optional)"
                  size="small"
                  fullWidth
                  value={doorId}
                  onChange={(e) => setDoorId(e.target.value)}
                  placeholder="e.g. STAFF-KEY-01"
                />

                <TextField
                  label="Address (Optional)"
                  size="small"
                  fullWidth
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Vendor shop address..."
                />
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
                <TextField
                  label="Notes / Specialization"
                  size="small"
                  fullWidth
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Plumbing specialist, available weekdays"
                />

                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={isSubmitting || !name.trim() || !phone.trim()}
                  sx={{ minWidth: 150, height: 40 }}
                >
                  Add Personnel
                </Button>
              </Stack>
            </Stack>
          </Paper>

          {/* Personnel Table */}
          <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Door ID / Address</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {personnelList.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.type}
                        size="small"
                        color={p.type === 'STAFF' ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{p.phone}</TableCell>
                    <TableCell>{p.doorId || p.address || '--'}</TableCell>
                    <TableCell>
                      <Chip
                        label={p.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={p.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color={p.isActive ? 'warning' : 'success'}
                        onClick={() => onToggleStatus(p.id)}
                      >
                        {p.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
