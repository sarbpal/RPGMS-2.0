import { useState, useCallback, useMemo } from 'react';
import type { FinanceTimelineEvent, TimelineSummary } from '../types';
import { FinanceWorkspaceCoordinator } from '../application/coordinator/FinanceWorkspaceCoordinator';

export interface UseStayFinanceTimelineReturn {
  timeline: FinanceTimelineEvent[];
  summary: TimelineSummary;
  loading: boolean;
  refresh: () => void;
}

export function useStayFinanceTimeline(stayId: string | undefined): UseStayFinanceTimelineReturn {
  const [refreshCount, setRefreshCount] = useState(0);
  const coordinator = useMemo(() => new FinanceWorkspaceCoordinator(), []);

  const data = useMemo(() => {
    void refreshCount;
    if (!stayId) {

      return {
        timeline: [],
        summary: {
          totalBillsCount: 0,
          totalPaymentsCount: 0,
          outstandingBalance: 0,
          advanceCredit: 0,
          securityDepositHeld: 0,
          settlementStatus: 'NONE' as const,
        },
      };
    }
    const vm = coordinator.getStayFinanceViewModel(stayId);
    return {
      timeline: vm.timeline,
      summary: vm.summary,
    };
  }, [stayId, coordinator, refreshCount]);

  const refresh = useCallback(() => {
    setRefreshCount((prev) => prev + 1);
  }, []);

  return {
    timeline: data.timeline,
    summary: data.summary,
    loading: false,
    refresh,
  };
}
