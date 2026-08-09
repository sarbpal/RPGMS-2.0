import { useState, useCallback, useEffect } from 'react';
import {
  SupplierBillAllocationService,
  type CreateSupplierBillInput,
  type ParticipantShareAdjustmentInput,
} from '../services/supplierBillAllocationService';
import { defaultElectricityRepository } from '../infrastructure/repositories/InMemoryElectricityRepository';
import type { ElectricityAllocation, AllocationDataQualityIssue } from '../domain/entities/ElectricityAllocation';
import type { ElectricityBill } from '../domain/entities/ElectricityBill';

export interface HistoricalAllocationItem {
  allocation: ElectricityAllocation;
  bill: ElectricityBill | null;
}

export function useSupplierBillAllocation(
  service: SupplierBillAllocationService = new SupplierBillAllocationService()
) {
  const [selectedFlatId, setSelectedFlatId] = useState<string>('');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
  const [draftAllocation, setDraftAllocation] = useState<ElectricityAllocation | null>(null);
  const [supplierBill, setSupplierBill] = useState<ElectricityBill | null>(null);
  const [historicalAllocations, setHistoricalAllocations] = useState<HistoricalAllocationItem[]>([]);
  const [dataQualityIssues, setDataQualityIssues] = useState<AllocationDataQualityIssue[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    try {
      const allAllocations = defaultElectricityRepository.getAllocations();
      const allBills = defaultElectricityRepository.getBills();

      // Find active draft allocation for current flat filter if selected
      const currentDraft = allAllocations.find(
        (a) => a.status === 'DRAFT' && (!selectedFlatId || a.flatId === selectedFlatId)
      ) || null;

      if (currentDraft) {
        setDraftAllocation(currentDraft);
        const linkedBill = allBills.find((b) => b.id === currentDraft.billId) || null;
        setSupplierBill(linkedBill);
        setDataQualityIssues([...currentDraft.dataQualityIssues]);
      } else {
        setDraftAllocation(null);
        setSupplierBill(null);
        setDataQualityIssues([]);
      }

      // Pair all confirmed and reversed allocations with bill metadata for history display
      const historyList: HistoricalAllocationItem[] = allAllocations
        .filter(
          (a) => (a.status === 'CONFIRMED' || a.status === 'REVERSED') && (!selectedFlatId || a.flatId === selectedFlatId)
        )
        .map((allocation) => {
          const bill = allBills.find((b) => b.id === allocation.billId) || null;
          return { allocation, bill };
        })
        .sort((a, b) => (b.allocation.createdAt || '').localeCompare(a.allocation.createdAt || ''));

      setHistoricalAllocations(historyList);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load electricity allocations.');
    } finally {
      setLoading(false);
    }
  }, [selectedFlatId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const [reversalTarget, setReversalTarget] = useState<HistoricalAllocationItem | null>(null);

  const openEntryModal = () => setIsEntryModalOpen(true);
  const closeEntryModal = () => setIsEntryModalOpen(false);

  const openReversalModal = (item: HistoricalAllocationItem) => setReversalTarget(item);
  const closeReversalModal = () => setReversalTarget(null);

  const createDraftBill = (
    input: CreateSupplierBillInput,
    flatId: string,
    periodStart: string,
    periodEnd: string
  ) => {
    setError(null);
    setSuccessMessage(null);
    const result = service.createDraftAllocation(input, flatId, periodStart, periodEnd);
    if (result.success && result.allocation && result.bill) {
      setDraftAllocation(result.allocation);
      setSupplierBill(result.bill);
      setDataQualityIssues(result.dataQualityIssues);
      setWarnings(result.warnings || []);
      setIsEntryModalOpen(false);
      refresh();
      return true;
    } else {
      setError(result.errors.join(' '));
      setWarnings(result.warnings || []);
      return false;
    }
  };

  const updateParticipantShares = (adjustments: ParticipantShareAdjustmentInput[]) => {
    if (!draftAllocation) return false;
    setError(null);
    setSuccessMessage(null);
    try {
      const result = service.updateDraftShares(draftAllocation.id, adjustments);
      if (result.success && result.allocation) {
        setDraftAllocation(result.allocation);
        setDataQualityIssues(result.dataQualityIssues);
        refresh();
        return true;
      } else {
        setError(result.errors.join(' '));
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update participant shares.');
      return false;
    }
  };

  const confirmAllocation = (confirmedBy: string, operatorNotes?: string) => {
    if (!draftAllocation) return false;
    setError(null);
    setSuccessMessage(null);
    const result = service.confirmAllocation(draftAllocation.id, confirmedBy, operatorNotes);
    if (result.success && result.allocation) {
      const outcome = result.allocation.allocationOutcome;
      setSuccessMessage(
        outcome === 'OWNER_ABSORBED'
          ? 'Supplier electricity bill confirmed as OWNER_ABSORBED. No resident receivables generated.'
          : 'Electricity bill allocation confirmed and resident utility bills successfully posted to Finance!'
      );
      setDraftAllocation(null);
      setSupplierBill(null);
      setDataQualityIssues([]);
      setWarnings([]);
      refresh();
      return true;
    } else {
      setError(result.errors.join(' '));
      return false;
    }
  };

  const reverseAllocation = (allocationId: string, reversedBy: string, reversalReason?: string) => {
    setError(null);
    setSuccessMessage(null);
    const result = service.reverseAllocation(allocationId, reversedBy, reversalReason);
    if (result.success && result.allocation) {
      setSuccessMessage(`Electricity allocation '${allocationId}' was successfully reversed.`);
      closeReversalModal();
      refresh();
      return true;
    } else {
      setError(result.errors.join(' '));
      return false;
    }
  };

  return {
    selectedFlatId,
    setSelectedFlatId,
    isEntryModalOpen,
    openEntryModal,
    closeEntryModal,
    reversalTarget,
    openReversalModal,
    closeReversalModal,
    draftAllocation,
    supplierBill,
    historicalAllocations,
    dataQualityIssues,
    loading,
    error,
    warnings,
    successMessage,
    createDraftBill,
    updateParticipantShares,
    confirmAllocation,
    reverseAllocation,
    refresh,
  };
}
