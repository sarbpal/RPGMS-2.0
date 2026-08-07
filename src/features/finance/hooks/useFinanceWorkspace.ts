import { useState, useCallback, useMemo } from 'react';
import type { FinanceTimelineEvent } from '../types';
import type { FinanceWorkspaceViewModel } from '../application/models/FinanceWorkspaceViewModel';
import type { Resident } from '../../resident';
import type { Flat } from '../../accommodation/types';
import { FinanceWorkspaceCoordinator } from '../application/coordinator/FinanceWorkspaceCoordinator';

export type FinanceModalType =
  | 'RECEIVE_PAYMENT'
  | 'GENERATE_RENT'
  | 'ADD_LAUNDRY'
  | 'PROCESS_SETTLEMENT'
  | null;

export interface UseFinanceWorkspaceReturn {
  viewModel: FinanceWorkspaceViewModel;
  activity: FinanceTimelineEvent[];
  loading: boolean;
  activeModal: FinanceModalType;
  selectedResident: Resident | null;
  selectedStayId: string | undefined;
  selectedFlat: Flat | null;
  openModal: (
    modalType: FinanceModalType,
    resident?: Resident | null,
    stayId?: string,
    flat?: Flat | null
  ) => void;
  closeModal: () => void;
  refresh: () => void;
}

export function useFinanceWorkspace(
  activityLimit = 8,
  coordinator?: FinanceWorkspaceCoordinator
): UseFinanceWorkspaceReturn {
  const [refreshCount, setRefreshCount] = useState(0);
  const [activeModal, setActiveModal] = useState<FinanceModalType>(null);
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [selectedStayId, setSelectedStayId] = useState<string | undefined>(undefined);
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);

  const activeCoordinator = useMemo(
    () => coordinator || new FinanceWorkspaceCoordinator(),
    [coordinator]
  );

  const viewModel = useMemo(() => {
    void refreshCount;
    return activeCoordinator.createViewModel(activityLimit);
  }, [activeCoordinator, activityLimit, refreshCount]);

  const activity = useMemo(() => {
    void refreshCount;
    return activeCoordinator.getRecentActivity(activityLimit);
  }, [activeCoordinator, activityLimit, refreshCount]);

  const refresh = useCallback(() => {
    setRefreshCount((prev) => prev + 1);
  }, []);

  const openModal = useCallback(
    (
      modalType: FinanceModalType,
      resident: Resident | null = null,
      stayId?: string,
      flat: Flat | null = null
    ) => {
      setSelectedResident(resident);
      setSelectedStayId(stayId);
      setSelectedFlat(flat);
      setActiveModal(modalType);
    },
    []
  );

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedResident(null);
    setSelectedStayId(undefined);
    setSelectedFlat(null);
  }, []);

  return {
    viewModel,
    activity,
    loading: false,
    activeModal,
    selectedResident,
    selectedStayId,
    selectedFlat,
    openModal,
    closeModal,
    refresh,
  };
}
