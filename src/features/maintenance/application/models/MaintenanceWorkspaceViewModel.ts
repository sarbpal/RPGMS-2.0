import type { MaintenancePersonnel } from '../../domain/entities/MaintenancePersonnel';
import type {
  MaintenanceAnalyticsResult,
  MaintenanceCategory,
  MaintenanceEventLog,
  MaintenancePriority,
  MaintenanceStatus,
  ReporterType,
  TechnicianPerformanceMetrics,
} from '../../domain/types/MaintenanceTypes';

export interface MaintenanceMetricsViewModel {
  readonly totalOpen: number;
  readonly inProgress: number;
  readonly urgentHighPriority: number;
  readonly resolvedThisMonth: number;
}

export interface MaintenanceRequestItemViewModel {
  readonly id: string;
  readonly ticketNumber: string;
  readonly title: string;
  readonly description: string;
  readonly category: MaintenanceCategory;
  readonly priority: MaintenancePriority;
  readonly status: MaintenanceStatus;
  readonly reporterName: string;
  readonly reporterType: ReporterType;
  readonly reporterId?: string;
  readonly flatId: string;
  readonly areaId?: string;
  readonly bedId?: string;
  readonly stayId?: string;
  readonly locationSummary: string; // e.g., "Flat 101 - Bedroom A"
  readonly assignedToId?: string;
  readonly assignedToName?: string;
  readonly workDetails?: string;
  readonly estimateCost?: number;
  readonly estimateCostFormatted?: string;
  readonly actualCost?: number;
  readonly actualCostFormatted?: string;
  readonly notes?: string;
  readonly createdAt: string;
  readonly createdAtFormatted: string;
  readonly resolvedAt?: string;
  readonly resolvedAtFormatted?: string;
  readonly resolutionNotes?: string;
  readonly cancellationReason?: string;
  readonly history: readonly MaintenanceEventLog[];
}

export interface MaintenanceWorkspaceViewModel {
  readonly metrics: MaintenanceMetricsViewModel;
  readonly requests: readonly MaintenanceRequestItemViewModel[];
  readonly personnelList: readonly MaintenancePersonnel[];
  readonly analytics?: MaintenanceAnalyticsResult;
  readonly selectedTechnicianMetrics?: TechnicianPerformanceMetrics;
}
