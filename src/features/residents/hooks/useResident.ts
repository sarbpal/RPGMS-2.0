import { useState, useCallback, useMemo } from 'react';
import { DocumentType, type Resident } from '../types';
import type { Flat } from '../../accommodation/types';
import { residentService } from '../services/residentService';
import { toTitleCase } from '../utils/formatters';

export interface ResidentEditForm {
  fullName: string;
  mobileNumber: string;
  documentType: DocumentType;
  documentNumber: string;
  agreedRent: number | '';
  agreedDeposit: number | '';
}

export interface UseResidentReturn {
  resident: Resident | undefined;
  selectedFlat: Flat | undefined;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editForm: ResidentEditForm;
  setEditForm: React.Dispatch<React.SetStateAction<ResidentEditForm>>;
  touched: {
    fullName: boolean;
    mobileNumber: boolean;
    documentNumber: boolean;
  };
  setTouched: React.Dispatch<
    React.SetStateAction<{
      fullName: boolean;
      mobileNumber: boolean;
      documentNumber: boolean;
    }>
  >;
  errors: {
    fullName: string;
    mobileNumber: string;
    documentNumber: string;
  };
  isValid: boolean;
  snackbarOpen: boolean;
  setSnackbarOpen: (open: boolean) => void;
  handleStartEdit: () => void;
  handleCancelEdit: () => void;
  handleSave: () => void;
  formatJoiningDate: (dateStr: string) => string;
  formatDate: (isoString: string) => string;
}

export function useResident(id: string | undefined): UseResidentReturn {
  const [residents, setResidents] = useState<Resident[]>(() => residentService.getResidents());
  const [flats] = useState<Flat[]>(() => residentService.getFlats());

  const resident = useMemo(() => residents.find((r) => r.id === id), [residents, id]);
  const selectedFlat = useMemo(() => flats.find((f) => f.id === resident?.flatId), [flats, resident?.flatId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ResidentEditForm>({
    fullName: '',
    mobileNumber: '',
    documentType: DocumentType.AADHAAR,
    documentNumber: '',
    agreedRent: 0,
    agreedDeposit: 0,
  });

  const [touched, setTouched] = useState({
    fullName: false,
    mobileNumber: false,
    documentNumber: false,
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Field validation checks for Edit Form
  const errors = useMemo(
    () => ({
      fullName: touched.fullName && editForm.fullName.trim() === '' ? 'Full name is required' : '',
      mobileNumber: touched.mobileNumber && editForm.mobileNumber.trim() === '' ? 'Mobile number is required' : '',
      documentNumber: touched.documentNumber && editForm.documentNumber.trim() === '' ? 'Document number is required' : '',
    }),
    [touched, editForm]
  );

  const isValid = useMemo(
    () =>
      editForm.fullName.trim() !== '' &&
      editForm.mobileNumber.trim() !== '' &&
      editForm.documentNumber.trim() !== '' &&
      (editForm.agreedRent === '' || editForm.agreedRent >= 0) &&
      (editForm.agreedDeposit === '' || editForm.agreedDeposit >= 0),
    [editForm]
  );

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

  const handleStartEdit = useCallback(() => {
    if (!resident) return;
    setEditForm({
      fullName: resident.fullName,
      mobileNumber: resident.mobileNumber,
      documentType: resident.documentType,
      documentNumber: resident.documentNumber,
      agreedRent: resident.agreedRent,
      agreedDeposit: resident.agreedDeposit,
    });
    setTouched({
      fullName: false,
      mobileNumber: false,
      documentNumber: false,
    });
    setIsEditing(true);
  }, [resident]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSave = useCallback(() => {
    setTouched({
      fullName: true,
      mobileNumber: true,
      documentNumber: true,
    });

    if (!resident || !isValid) return;

    const updated = residentService.updateResident(resident.id, {
      fullName: toTitleCase(editForm.fullName),
      mobileNumber: editForm.mobileNumber.trim(),
      documentType: editForm.documentType,
      documentNumber: editForm.documentNumber.trim(),
      agreedRent: editForm.agreedRent === '' ? 0 : editForm.agreedRent,
      agreedDeposit: editForm.agreedDeposit === '' ? 0 : editForm.agreedDeposit,
    });

    if (updated) {
      setResidents(residentService.getResidents());
      setIsEditing(false);
      setSnackbarOpen(true);
    }
  }, [resident, isValid, editForm]);

  return {
    resident,
    selectedFlat,
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    touched,
    setTouched,
    errors,
    isValid,
    snackbarOpen,
    setSnackbarOpen,
    handleStartEdit,
    handleCancelEdit,
    handleSave,
    formatJoiningDate,
    formatDate,
  };
}
