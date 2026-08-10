import { useState, useEffect } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { MaintenancePersonnel } from '../domain/entities/MaintenancePersonnel';
import type {
  MaintenanceCategory,
  MaintenancePriority,
  ReporterType,
} from '../domain/types/MaintenanceTypes';
import type { RegisterRequestDTO } from '../application/useCases/RegisterMaintenanceRequestUseCase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  personnelList: readonly MaintenancePersonnel[];
  onSubmit: (dto: RegisterRequestDTO) => Promise<void>;
  initialContext?: {
    flatId?: string;
    areaId?: string;
    bedId?: string;
    stayId?: string;
    reporterId?: string;
    reporterName?: string;
    reporterType?: ReporterType;
  };
}

export function RegisterMaintenanceModal({
  isOpen,
  onClose,
  personnelList,
  onSubmit,
  initialContext,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('PLUMBING');
  const [priority, setPriority] = useState<MaintenancePriority>('MEDIUM');
  const [reporterType, setReporterType] = useState<ReporterType>('STAFF');
  const [reporterName, setReporterName] = useState('');
  const [reporterId, setReporterId] = useState('');
  const [flatId, setFlatId] = useState('flat-101');
  const [areaId, setAreaId] = useState('');
  const [bedId, setBedId] = useState('');
  const [stayId, setStayId] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [estimateCost, setEstimateCost] = useState<number | ''>('');
  const [notes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialContext) {
      if (initialContext.flatId) setFlatId(initialContext.flatId);
      if (initialContext.areaId) setAreaId(initialContext.areaId);
      if (initialContext.bedId) setBedId(initialContext.bedId);
      if (initialContext.stayId) setStayId(initialContext.stayId);
      if (initialContext.reporterType) setReporterType(initialContext.reporterType);
      if (initialContext.reporterName) setReporterName(initialContext.reporterName);
      if (initialContext.reporterId) setReporterId(initialContext.reporterId);
    }
  }, [initialContext, isOpen]);

  const handleSubmit = async () => {
    try {
      setErrorMsg('');
      setIsSubmitting(true);

      const assigned = personnelList.find((p) => p.id === assignedToId);

      await onSubmit({
        title,
        description,
        category,
        priority,
        reporterType,
        reporterId: reporterId || undefined,
        reporterName,
        flatId,
        areaId: areaId || undefined,
        bedId: bedId || undefined,
        stayId: stayId || undefined,
        assignedToId: assignedToId || undefined,
        assignedToName: assigned ? assigned.name : undefined,
        estimateCost: estimateCost !== '' ? Number(estimateCost) : undefined,
        notes: notes || undefined,
        actorId: reporterId || 'current-user',
        actorName: reporterName || 'Operator',
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register maintenance request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>Log New Maintenance Request</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            label="Issue Title"
            required
            fullWidth
            size="small"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Leaking Geyser in Bathroom"
          />

          <TextField
            label="Detailed Description"
            required
            fullWidth
            multiline
            rows={3}
            size="small"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue, symptoms, and urgency..."
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(e.target.value as MaintenanceCategory)}
              >
                <MenuItem value="PLUMBING">Plumbing</MenuItem>
                <MenuItem value="ELECTRICAL">Electrical</MenuItem>
                <MenuItem value="CARPENTRY">Carpentry</MenuItem>
                <MenuItem value="APPLIANCE">Appliance</MenuItem>
                <MenuItem value="CIVIL_CLEANING">Civil & Cleaning</MenuItem>
                <MenuItem value="OTHER">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
              >
                <MenuItem value="LOW">Low</MenuItem>
                <MenuItem value="MEDIUM">Medium</MenuItem>
                <MenuItem value="HIGH">High</MenuItem>
                <MenuItem value="URGENT">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Reporter Type</InputLabel>
              <Select
                value={reporterType}
                label="Reporter Type"
                onChange={(e) => setReporterType(e.target.value as ReporterType)}
              >
                <MenuItem value="RESIDENT">Resident</MenuItem>
                <MenuItem value="STAFF">Staff / Operator</MenuItem>
                <MenuItem value="OTHER">Other Source</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Reporter Name"
              required
              fullWidth
              size="small"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Full name of reporter"
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Flat ID / Room No"
              required
              fullWidth
              size="small"
              value={flatId}
              onChange={(e) => setFlatId(e.target.value)}
              placeholder="e.g. flat-101"
            />

            {reporterType === 'RESIDENT' && (
              <TextField
                label="Stay ID"
                required
                fullWidth
                size="small"
                value={stayId}
                onChange={(e) => setStayId(e.target.value)}
                placeholder="e.g. stay-101"
              />
            )}
          </Stack>

          <FormControl fullWidth size="small">
            <InputLabel>Assign Technician (Optional)</InputLabel>
            <Select
              value={assignedToId}
              label="Assign Technician (Optional)"
              onChange={(e) => setAssignedToId(e.target.value)}
            >
              <MenuItem value="">Unassigned</MenuItem>
              {personnelList
                .filter((p) => p.isActive)
                .map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} ({p.type})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <TextField
            label="Estimated Cost (₹)"
            type="number"
            fullWidth
            size="small"
            value={estimateCost}
            onChange={(e) => setEstimateCost(e.target.value !== '' ? Number(e.target.value) : '')}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || !title || !description || !reporterName || !flatId}
        >
          Submit Ticket
        </Button>
      </DialogActions>
    </Dialog>
  );
}
