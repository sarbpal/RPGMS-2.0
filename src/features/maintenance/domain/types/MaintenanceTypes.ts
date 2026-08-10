export type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CANCELLED';

export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type MaintenanceCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CARPENTRY'
  | 'APPLIANCE'
  | 'CIVIL_CLEANING'
  | 'OTHER';

export type ReporterType = 'RESIDENT' | 'STAFF' | 'OTHER';

export type PersonnelType = 'STAFF' | 'EXTERNAL';

export interface MaintenanceEventLog {
  readonly id: string;
  readonly ticketId: string;
  readonly eventType:
    | 'CREATED'
    | 'STATUS_CHANGED'
    | 'PRIORITY_CHANGED'
    | 'ASSIGNED'
    | 'RESOLVED'
    | 'CANCELLED';
  readonly timestamp: string; // ISO 8601
  readonly actorId: string;
  readonly actorName: string;
  readonly previousState?: string;
  readonly newState?: string;
  readonly notes?: string;
}

export interface MaintenanceSearchFilters {
  readonly ticketNumber?: string;
  readonly status?: MaintenanceStatus | 'PENDING' | 'ALL';
  readonly priority?: MaintenancePriority | 'ALL';
  readonly category?: MaintenanceCategory | 'ALL';
  readonly assignedToId?: string | 'ALL';
  readonly reporterType?: ReporterType | 'ALL';
  readonly flatId?: string;
  readonly areaId?: string;
  readonly bedId?: string;
  readonly stayId?: string;
  readonly reporterId?: string;

  // Date Range (Inclusive: From start-of-day, To end-of-day ISO string)
  readonly dateLoggedFrom?: string;
  readonly dateLoggedTo?: string;
  readonly dateResolvedFrom?: string;
  readonly dateResolvedTo?: string;

  // Financial Range
  readonly estimateFrom?: number;
  readonly estimateTo?: number;
  readonly actualCostFrom?: number;
  readonly actualCostTo?: number;

  // Text Search across ticketNumber, title, description, workDetails, notes
  readonly searchQuery?: string;
}

export interface BreakdownItem {
  readonly id?: string;
  readonly label: string;
  readonly count: number;
  readonly totalEstimateCost: number;
  readonly totalActualCost: number;
}

export interface MaintenancePeriodBreakdown {
  readonly period: string; // e.g. "2026-07" (YYYY-MM)
  readonly ticketCount: number;
  readonly resolvedCount: number;
  readonly pendingCount: number;
  readonly cancelledCount: number;
  readonly totalEstimateCost: number;
  readonly totalActualCost: number;
}

export interface MaintenanceAnalyticsResult {
  readonly financial: {
    readonly totalEstimatedCost: number;
    readonly totalActualCost: number;
    readonly costVariance: number; // actualCost - estimateCost
    readonly averageRepairCost: number;
    readonly highestCostRepairTicket?: {
      readonly ticketNumber: string;
      readonly amount: number;
    };
  };
  readonly performance: {
    readonly totalTickets: number;
    readonly pendingCount: number;
    readonly resolvedCount: number;
    readonly averageResolutionTimeHours: number;
  };

  readonly byStatus: readonly BreakdownItem[];
  readonly byPriority: readonly BreakdownItem[];
  readonly byCategory: readonly BreakdownItem[];
  readonly byFlat: readonly BreakdownItem[];
  readonly byArea: readonly BreakdownItem[];
  readonly byBed: readonly BreakdownItem[];
  readonly byResident: readonly BreakdownItem[];
  readonly byStay: readonly BreakdownItem[];
  readonly byPersonnel: readonly BreakdownItem[];
  readonly byPeriod: readonly MaintenancePeriodBreakdown[];
}

export interface TechnicianPerformanceMetrics {
  readonly personnelId: string;
  readonly personnelName: string;
  readonly totalAssigned: number;
  readonly totalCompleted: number;
  readonly totalPending: number;
  readonly totalCancelled: number;
  readonly totalActualCost: number;
  readonly averageResolutionTimeHours: number;
  readonly byCategory: readonly BreakdownItem[];
}
