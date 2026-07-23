import { reportingService } from '../../services/reportingService';
import { timelineService } from '../../services/timelineService';
import { balanceEngine } from '../../services/balanceEngine';
import type {
  FinanceWorkspaceViewModel,
  StayFinanceViewModel,
  PropertyFinanceSummaryViewModel,
} from '../models/FinanceWorkspaceViewModel';
import type {
  FinanceTimelineEvent,
  FinanceSummary,
  StayBalance,
  TimelineSummary,
} from '../../types';

export class FinanceWorkspaceCoordinator {
  /**
   * Constructs the ViewModel for Finance Workspace.
   */
  public createViewModel(activityLimit = 8): FinanceWorkspaceViewModel {
    const metrics = reportingService.getFinanceDashboard();
    const outstandingResidents = reportingService.getOutstandingResidents();
    const settlementsReport = reportingService.getSettlementReport();
    const activity = timelineService.getRecentFinanceActivity(activityLimit);

    return {
      metrics,
      outstandingResidents,
      settlementsReport,
      activity,
    };
  }

  /**
   * Retrieves property-wide financial summary view model.
   */
  public getPropertyFinanceSummary(): PropertyFinanceSummaryViewModel {
    const summary: FinanceSummary = balanceEngine.calculateFinanceSummary();
    return { summary };
  }

  /**
   * Retrieves recent financial activity events.
   */
  public getRecentActivity(limit = 10): FinanceTimelineEvent[] {
    return timelineService.getRecentFinanceActivity(limit);
  }

  /**
   * Retrieves stay-level financial view model.
   */
  public getStayFinanceViewModel(stayId: string): StayFinanceViewModel {
    const balances: StayBalance = balanceEngine.calculateStayBalances(stayId);
    const timeline: FinanceTimelineEvent[] = timelineService.getTimelineForStay(stayId);
    const summary: TimelineSummary = timelineService.getTimelineSummary(stayId);

    return {
      stayId,
      balances,
      timeline,
      summary,
    };
  }
}
