import { reportingService as defaultReportingService, ReportingApplicationService } from '../../services/reportingService';
import { timelineService as defaultTimelineService, TimelineApplicationService } from '../../services/timelineService';
import { balanceEngine as defaultBalanceEngine, BalanceApplicationService } from '../../services/balanceEngine';
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
  private reportingService: ReportingApplicationService;
  private timelineService: TimelineApplicationService;
  private balanceEngine: BalanceApplicationService;

  constructor(
    reportingService: ReportingApplicationService = defaultReportingService,
    timelineService: TimelineApplicationService = defaultTimelineService,
    balanceEngine: BalanceApplicationService = defaultBalanceEngine
  ) {
    this.reportingService = reportingService;
    this.timelineService = timelineService;
    this.balanceEngine = balanceEngine;
  }

  /**
   * Constructs the ViewModel for Finance Workspace.
   */
  public createViewModel(activityLimit = 8): FinanceWorkspaceViewModel {
    const metrics = this.reportingService.getFinanceDashboard();
    const outstandingResidents = this.reportingService.getOutstandingResidents();
    const settlementsReport = this.reportingService.getSettlementReport();
    const activity = this.timelineService.getRecentFinanceActivity(activityLimit);

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
    const summary: FinanceSummary = this.balanceEngine.calculateFinanceSummary();
    return { summary };
  }

  /**
   * Retrieves recent financial activity events.
   */
  public getRecentActivity(limit = 10): FinanceTimelineEvent[] {
    return this.timelineService.getRecentFinanceActivity(limit);
  }

  /**
   * Retrieves stay-level financial view model.
   */
  public getStayFinanceViewModel(stayId: string): StayFinanceViewModel {
    const balances: StayBalance = this.balanceEngine.calculateStayBalances(stayId);
    const timeline: FinanceTimelineEvent[] = this.timelineService.getTimelineForStay(stayId);
    const summary: TimelineSummary = this.timelineService.getTimelineSummary(stayId);

    return {
      stayId,
      balances,
      timeline,
      summary,
    };
  }
}
