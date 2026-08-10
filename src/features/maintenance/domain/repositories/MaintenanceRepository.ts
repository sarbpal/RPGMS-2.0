import type { MaintenanceRequest } from '../entities/MaintenanceRequest';
import type {
  MaintenanceAnalyticsResult,
  MaintenanceSearchFilters,
  TechnicianPerformanceMetrics,
} from '../types/MaintenanceTypes';

export interface MaintenanceRepository {
  findById(id: string): Promise<MaintenanceRequest | null>;
  findByTicketNumber(ticketNumber: string): Promise<MaintenanceRequest | null>;
  search(filters: MaintenanceSearchFilters): Promise<readonly MaintenanceRequest[]>;
  getAnalytics(filters?: MaintenanceSearchFilters): Promise<MaintenanceAnalyticsResult>;
  getTechnicianMetrics(
    personnelId: string,
    filters?: MaintenanceSearchFilters
  ): Promise<TechnicianPerformanceMetrics>;
  save(request: MaintenanceRequest): Promise<void>;
  generateTicketNumber(): Promise<string>;
}
