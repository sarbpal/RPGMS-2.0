import { useState, useCallback, useEffect } from 'react';
import type { FinanceTimelineEvent } from '../types';
import { timelineService } from '../services/timelineService';

export interface UseFinanceActivityReturn {
  activity: FinanceTimelineEvent[];
  loading: boolean;
  refresh: () => void;
}

export function useFinanceActivity(limit = 10): UseFinanceActivityReturn {
  const [loading, setLoading] = useState(false);
  const [activity, setActivity] = useState<FinanceTimelineEvent[]>([]);

  const refresh = useCallback(() => {
    setLoading(true);
    setActivity(timelineService.getRecentFinanceActivity(limit));
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    activity,
    loading,
    refresh,
  };
}
