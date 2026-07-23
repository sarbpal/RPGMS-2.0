import { useState, useCallback, useMemo } from 'react';
import type { FinanceSummary } from '../types';
import { FinanceWorkspaceCoordinator } from '../application/coordinator/FinanceWorkspaceCoordinator';

export interface UseFinanceSummaryReturn {
  summary: FinanceSummary;
  loading: boolean;
  refresh: () => void;
}

export function useFinanceSummary(): UseFinanceSummaryReturn {
  const [refreshCount, setRefreshCount] = useState(0);
  const coordinator = useMemo(() => new FinanceWorkspaceCoordinator(), []);

  const summary = useMemo(() => {
    void refreshCount;
    return coordinator.getPropertyFinanceSummary().summary;
  }, [coordinator, refreshCount]);


  const refresh = useCallback(() => {
    setRefreshCount((prev) => prev + 1);
  }, []);

  return {
    summary,
    loading: false,
    refresh,
  };
}
