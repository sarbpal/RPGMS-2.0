import { useState, useCallback, useMemo } from 'react';
import type { FinanceTimelineEvent } from '../types';
import { FinanceWorkspaceCoordinator } from '../application/coordinator/FinanceWorkspaceCoordinator';

export interface UseFinanceActivityReturn {
  activity: FinanceTimelineEvent[];
  loading: boolean;
  refresh: () => void;
}

export function useFinanceActivity(limit = 10): UseFinanceActivityReturn {
  const [refreshCount, setRefreshCount] = useState(0);
  const coordinator = useMemo(() => new FinanceWorkspaceCoordinator(), []);

  const activity = useMemo(() => {
    void refreshCount;
    return coordinator.getRecentActivity(limit);
  }, [coordinator, limit, refreshCount]);


  const refresh = useCallback(() => {
    setRefreshCount((prev) => prev + 1);
  }, []);

  return {
    activity,
    loading: false,
    refresh,
  };
}
