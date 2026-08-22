import { useState, useCallback, useMemo } from 'react';
import type { FinanceTimelineEvent, StayBalance } from '../types';
import type { FinanceWorkspaceViewModel, PaymentHistoryItem } from '../application/models/FinanceWorkspaceViewModel';
import type { Resident } from '../../resident';
import type { Flat } from '../../accommodation/types';
import { FinanceWorkspaceCoordinator } from '../application/coordinator/FinanceWorkspaceCoordinator';

export type FinanceModalType =
  | 'RECEIVE_PAYMENT'
  | 'GENERATE_RENT'
  | 'ADD_LAUNDRY'
  | 'PROCESS_SETTLEMENT'
  | 'PARTIAL_DEPOSIT_RETURN'
  | 'DEPOSIT_DEDUCTION'
  | 'VIEW_LEDGER'
  | 'REVERSE_PAYMENT'
  | null;

export interface UseFinanceWorkspaceReturn {
  viewModel: FinanceWorkspaceViewModel;
  activity: FinanceTimelineEvent[];
  loading: boolean;
  activeModal: FinanceModalType;
  selectedResident: Resident | null;
  selectedStayId: string | undefined;
  selectedFlat: Flat | null;
  selectedBalances: StayBalance | null;
  selectedPayment: PaymentHistoryItem | null;
  coordinator: FinanceWorkspaceCoordinator;
  openModal: (
    modalType: FinanceModalType,
    resident?: Resident | null,
    stayId?: string,
    flat?: Flat | null,
    balances?: StayBalance | null,
    payment?: PaymentHistoryItem | null
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
  const [selectedBalances, setSelectedBalances] = useState<StayBalance | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistoryItem | null>(null);

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
      flat: Flat | null = null,
      balances: StayBalance | null = null,
      payment: PaymentHistoryItem | null = null
    ) => {
      setSelectedResident(resident);
      setSelectedStayId(stayId);
      setSelectedFlat(flat);
      setSelectedBalances(balances);
      setSelectedPayment(payment);
      setActiveModal(modalType);
    },
    []
  );

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedResident(null);
    setSelectedStayId(undefined);
    setSelectedFlat(null);
    setSelectedBalances(null);
    setSelectedPayment(null);
  }, []);

  return {
    viewModel,
    activity,
    loading: false,
    activeModal,
    selectedResident,
    selectedStayId,
    selectedFlat,
    selectedBalances,
    selectedPayment,
    coordinator: activeCoordinator,
    openModal,
    closeModal,
    refresh,
  };
}
