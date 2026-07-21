import { useState, useCallback, useMemo } from 'react';
import type { ResidentWithActiveStay } from '../types';
import type { Flat } from '../../accommodation/types';
import { residentService } from '../services/residentService';

export interface UseResidentReturn {
  resident: ResidentWithActiveStay | undefined;
  selectedFlat: Flat | undefined;
  editingSection: string | null;
  startEditingSection: (section: string) => void;
  cancelEditingSection: () => void;
  saveSection: (updates: Partial<ResidentWithActiveStay>, sectionName?: string) => void;
  snackbarOpen: boolean;
  setSnackbarOpen: (open: boolean) => void;
  snackbarMessage: string;
  formatJoiningDate: (dateStr: string) => string;
  formatDate: (isoString: string) => string;
}

export function useResident(id: string | undefined): UseResidentReturn {
  const [residents, setResidents] = useState<ResidentWithActiveStay[]>(() =>
    residentService.getResidentsWithActiveStay()
  );
  const [flats] = useState<Flat[]>(() => residentService.getFlats());

  const resident = useMemo(() => residents.find((r) => r.id === id), [residents, id]);
  const selectedFlat = useMemo(() => flats.find((f) => f.id === resident?.flatId), [flats, resident?.flatId]);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const formatJoiningDate = useCallback((dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  }, []);

  const formatDate = useCallback((isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  }, []);

  const startEditingSection = useCallback((section: string) => {
    setEditingSection(section);
  }, []);

  const cancelEditingSection = useCallback(() => {
    setEditingSection(null);
  }, []);

  const saveSection = useCallback(
    (updates: Partial<ResidentWithActiveStay>, sectionName = 'Profile section') => {
      if (!resident) return;

      const updated = residentService.updateResidentWithActiveStay(resident.id, updates);
      if (updated) {
        setResidents(residentService.getResidentsWithActiveStay());
        setEditingSection(null);
        setSnackbarMessage(`${sectionName} updated successfully!`);
        setSnackbarOpen(true);
      }
    },
    [resident]
  );

  return {
    resident,
    selectedFlat,
    editingSection,
    startEditingSection,
    cancelEditingSection,
    saveSection,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    formatJoiningDate,
    formatDate,
  };
}
