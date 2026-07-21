import { useState, useCallback, useEffect } from 'react';
import type { FinanceSummary } from '../types';
import { balanceEngine } from '../services/balanceEngine';

export interface UseFinanceSummaryReturn {
  summary: FinanceSummary;
  loading: boolean;
  refresh: () => void;
}

export function useFinanceSummary(): UseFinanceSummaryReturn {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<FinanceSummary>({
    totalCollected: 0,
    totalOutstanding: 0,
    totalDepositHeld: 0,
    totalAdvanceCredit: 0,
  });

  const refresh = useCallback(() => {
    setLoading(true);
    setSummary(balanceEngine.calculateFinanceSummary());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    summary,
    loading,
    refresh,
  };
}
