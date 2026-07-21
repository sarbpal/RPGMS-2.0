import { useState, useCallback, useEffect } from 'react';
import type { FinanceTimelineEvent, TimelineSummary } from '../types';
import { timelineService } from '../services/timelineService';

export interface UseStayFinanceTimelineReturn {
  timeline: FinanceTimelineEvent[];
  summary: TimelineSummary;
  loading: boolean;
  refresh: () => void;
}

export function useStayFinanceTimeline(stayId: string | undefined): UseStayFinanceTimelineReturn {
  const [loading, setLoading] = useState(false);
  const [timeline, setTimeline] = useState<FinanceTimelineEvent[]>([]);
  const [summary, setSummary] = useState<TimelineSummary>({
    totalBillsCount: 0,
    totalPaymentsCount: 0,
    outstandingBalance: 0,
    advanceCredit: 0,
    securityDepositHeld: 0,
    settlementStatus: 'NONE',
  });

  const refresh = useCallback(() => {
    if (!stayId) {
      setTimeline([]);
      return;
    }
    setLoading(true);
    setTimeline(timelineService.getTimelineForStay(stayId));
    setSummary(timelineService.getTimelineSummary(stayId));
    setLoading(false);
  }, [stayId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    timeline,
    summary,
    loading,
    refresh,
  };
}
