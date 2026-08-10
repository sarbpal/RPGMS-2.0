import { MaintenanceRequest } from '../../domain/entities/MaintenanceRequest';
import type { MaintenanceRepository } from '../../domain/repositories/MaintenanceRepository';
import type {
  BreakdownItem,
  MaintenanceAnalyticsResult,
  MaintenancePeriodBreakdown,
  MaintenanceSearchFilters,
  TechnicianPerformanceMetrics,
} from '../../domain/types/MaintenanceTypes';
import { maintenanceSeedData } from '../data/maintenanceSeedData';

const STORAGE_KEY = 'rpgms_maintenance_requests_v1';

export class InMemoryMaintenanceRepository implements MaintenanceRepository {
  private requestsMap = new Map<string, MaintenanceRequest>();

  constructor() {
    this.loadStorage();
  }

  private loadStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((item) => {
              this.requestsMap.set(item.id, new MaintenanceRequest(item));
            });
            return;
          }
        }
      }
    } catch {
      // Fallback to seed data
    }

    maintenanceSeedData.forEach((props) => {
      this.requestsMap.set(props.id, new MaintenanceRequest(props));
    });
    this.persist();
  }

  private persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const array = Array.from(this.requestsMap.values()).map((r) => r.toJSON());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
      }
    } catch {
      // Storage error ignored
    }
  }

  async findById(id: string): Promise<MaintenanceRequest | null> {
    return this.requestsMap.get(id) || null;
  }

  async findByTicketNumber(ticketNumber: string): Promise<MaintenanceRequest | null> {
    const trimmed = ticketNumber.trim().toUpperCase();
    for (const req of this.requestsMap.values()) {
      if (req.ticketNumber.toUpperCase() === trimmed) {
        return req;
      }
    }
    return null;
  }

  async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    let maxSeq = 0;
    const prefix = `MNT-${year}-`;

    for (const req of this.requestsMap.values()) {
      if (req.ticketNumber.startsWith(prefix)) {
        const numPart = parseInt(req.ticketNumber.substring(prefix.length), 10);
        if (!isNaN(numPart) && numPart > maxSeq) {
          maxSeq = numPart;
        }
      }
    }

    const nextSeq = maxSeq + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  async save(request: MaintenanceRequest): Promise<void> {
    this.requestsMap.set(request.id, request);
    this.persist();
  }

  async search(filters: MaintenanceSearchFilters): Promise<readonly MaintenanceRequest[]> {
    let results = Array.from(this.requestsMap.values());

    if (filters.ticketNumber && filters.ticketNumber.trim()) {
      const query = filters.ticketNumber.trim().toLowerCase();
      results = results.filter((r) => r.ticketNumber.toLowerCase().includes(query));
    }

    if (filters.status && filters.status !== 'ALL') {
      if (filters.status === 'PENDING') {
        results = results.filter((r) => r.status === 'OPEN' || r.status === 'IN_PROGRESS');
      } else {
        results = results.filter((r) => r.status === filters.status);
      }
    }

    if (filters.priority && filters.priority !== 'ALL') {
      results = results.filter((r) => r.priority === filters.priority);
    }

    if (filters.category && filters.category !== 'ALL') {
      results = results.filter((r) => r.category === filters.category);
    }

    if (filters.assignedToId && filters.assignedToId !== 'ALL') {
      results = results.filter((r) => r.assignedToId === filters.assignedToId);
    }

    if (filters.reporterType && filters.reporterType !== 'ALL') {
      results = results.filter((r) => r.reporterType === filters.reporterType);
    }

    if (filters.flatId) {
      results = results.filter((r) => r.flatId === filters.flatId);
    }

    if (filters.areaId) {
      results = results.filter((r) => r.areaId === filters.areaId);
    }

    if (filters.bedId) {
      results = results.filter((r) => r.bedId === filters.bedId);
    }

    if (filters.stayId) {
      results = results.filter((r) => r.stayId === filters.stayId);
    }

    if (filters.reporterId) {
      results = results.filter((r) => r.reporterId === filters.reporterId);
    }

    // Inclusive Date Range Filtering
    if (filters.dateLoggedFrom) {
      const fromTime = new Date(filters.dateLoggedFrom).setHours(0, 0, 0, 0);
      results = results.filter((r) => new Date(r.createdAt).getTime() >= fromTime);
    }

    if (filters.dateLoggedTo) {
      const toTime = new Date(filters.dateLoggedTo).setHours(23, 59, 59, 999);
      results = results.filter((r) => new Date(r.createdAt).getTime() <= toTime);
    }

    if (filters.dateResolvedFrom) {
      const fromTime = new Date(filters.dateResolvedFrom).setHours(0, 0, 0, 0);
      results = results.filter(
        (r) => r.resolvedAt && new Date(r.resolvedAt).getTime() >= fromTime
      );
    }

    if (filters.dateResolvedTo) {
      const toTime = new Date(filters.dateResolvedTo).setHours(23, 59, 59, 999);
      results = results.filter(
        (r) => r.resolvedAt && new Date(r.resolvedAt).getTime() <= toTime
      );
    }

    // Financial Range Filtering
    if (filters.estimateFrom !== undefined) {
      results = results.filter(
        (r) => r.estimateCost !== undefined && r.estimateCost >= filters.estimateFrom!
      );
    }

    if (filters.estimateTo !== undefined) {
      results = results.filter(
        (r) => r.estimateCost !== undefined && r.estimateCost <= filters.estimateTo!
      );
    }

    if (filters.actualCostFrom !== undefined) {
      results = results.filter(
        (r) => r.actualCost !== undefined && r.actualCost >= filters.actualCostFrom!
      );
    }

    if (filters.actualCostTo !== undefined) {
      results = results.filter(
        (r) => r.actualCost !== undefined && r.actualCost <= filters.actualCostTo!
      );
    }

    // Full-Text Keyword Search
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.trim().toLowerCase();
      results = results.filter(
        (r) =>
          r.ticketNumber.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.workDetails && r.workDetails.toLowerCase().includes(q)) ||
          (r.notes && r.notes.toLowerCase().includes(q)) ||
          r.reporterName.toLowerCase().includes(q) ||
          (r.assignedToName && r.assignedToName.toLowerCase().includes(q))
      );
    }

    // Sort newest first by default
    results.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return Object.freeze(results);
  }

  async getAnalytics(
    filters: MaintenanceSearchFilters = {}
  ): Promise<MaintenanceAnalyticsResult> {
    const list = await this.search(filters);

    let totalEst = 0;
    let totalAct = 0;
    let highestCostTicket: { ticketNumber: string; amount: number } | undefined;
    let totalResolutionHours = 0;
    let resolvedWithDurationCount = 0;

    let pendingCount = 0;
    let resolvedCount = 0;

    const statusMap = new Map<string, { count: number; est: number; act: number }>();
    const priorityMap = new Map<string, { count: number; est: number; act: number }>();
    const categoryMap = new Map<string, { count: number; est: number; act: number }>();
    const flatMap = new Map<string, { count: number; est: number; act: number }>();
    const areaMap = new Map<string, { count: number; est: number; act: number }>();
    const bedMap = new Map<string, { count: number; est: number; act: number }>();
    const residentMap = new Map<string, { count: number; est: number; act: number }>();
    const stayMap = new Map<string, { count: number; est: number; act: number }>();
    const personnelMap = new Map<string, { count: number; est: number; act: number }>();
    const periodMap = new Map<
      string,
      { count: number; resolved: number; pending: number; cancelled: number; est: number; act: number }
    >();

    const updateGroup = (
      map: Map<string, { count: number; est: number; act: number }>,
      key: string,
      est: number,
      act: number
    ) => {
      const current = map.get(key) || { count: 0, est: 0, act: 0 };
      map.set(key, {
        count: current.count + 1,
        est: current.est + est,
        act: current.act + act,
      });
    };

    list.forEach((req) => {
      const est = req.estimateCost || 0;
      const act = req.actualCost || 0;

      totalEst += est;
      totalAct += act;

      if (act > 0 && (!highestCostTicket || act > highestCostTicket.amount)) {
        highestCostTicket = { ticketNumber: req.ticketNumber, amount: act };
      }

      if (req.status === 'OPEN' || req.status === 'IN_PROGRESS') {
        pendingCount++;
      } else if (req.status === 'RESOLVED') {
        resolvedCount++;
        if (req.resolvedAt) {
          const diffMs =
            new Date(req.resolvedAt).getTime() - new Date(req.createdAt).getTime();
          if (diffMs > 0) {
            totalResolutionHours += diffMs / (1000 * 60 * 60);
            resolvedWithDurationCount++;
          }
        }
      }

      // Groupings
      updateGroup(statusMap, req.status, est, act);
      updateGroup(priorityMap, req.priority, est, act);
      updateGroup(categoryMap, req.category, est, act);
      updateGroup(flatMap, req.flatId, est, act);

      if (req.areaId) updateGroup(areaMap, req.areaId, est, act);
      if (req.bedId) updateGroup(bedMap, req.bedId, est, act);
      if (req.reporterName) updateGroup(residentMap, req.reporterName, est, act);
      if (req.stayId) updateGroup(stayMap, req.stayId, est, act);
      if (req.assignedToName) updateGroup(personnelMap, req.assignedToName, est, act);

      // Period grouping (YYYY-MM)
      const periodKey = req.createdAt.substring(0, 7); // e.g. "2026-07"
      const periodData = periodMap.get(periodKey) || {
        count: 0,
        resolved: 0,
        pending: 0,
        cancelled: 0,
        est: 0,
        act: 0,
      };
      periodMap.set(periodKey, {
        count: periodData.count + 1,
        resolved: periodData.resolved + (req.status === 'RESOLVED' ? 1 : 0),
        pending: periodData.pending + (req.status === 'OPEN' || req.status === 'IN_PROGRESS' ? 1 : 0),
        cancelled: periodData.cancelled + (req.status === 'CANCELLED' ? 1 : 0),
        est: periodData.est + est,
        act: periodData.act + act,
      });
    });

    const toBreakdownList = (
      map: Map<string, { count: number; est: number; act: number }>
    ): BreakdownItem[] => {
      return Array.from(map.entries()).map(([label, data]) => ({
        label,
        count: data.count,
        totalEstimateCost: data.est,
        totalActualCost: data.act,
      }));
    };

    const periodBreakdown: MaintenancePeriodBreakdown[] = Array.from(periodMap.entries())
      .map(([period, data]) => ({
        period,
        ticketCount: data.count,
        resolvedCount: data.resolved,
        pendingCount: data.pending,
        cancelledCount: data.cancelled,
        totalEstimateCost: data.est,
        totalActualCost: data.act,
      }))
      .sort((a, b) => b.period.localeCompare(a.period));

    return {
      financial: {
        totalEstimatedCost: totalEst,
        totalActualCost: totalAct,
        costVariance: totalAct - totalEst,
        averageRepairCost: resolvedCount > 0 ? Math.round(totalAct / resolvedCount) : 0,
        highestCostRepairTicket: highestCostTicket,
      },
      performance: {
        totalTickets: list.length,
        pendingCount,
        resolvedCount,
        averageResolutionTimeHours:
          resolvedWithDurationCount > 0
            ? Math.round((totalResolutionHours / resolvedWithDurationCount) * 10) / 10
            : 0,
      },
      byStatus: toBreakdownList(statusMap),
      byPriority: toBreakdownList(priorityMap),
      byCategory: toBreakdownList(categoryMap),
      byFlat: toBreakdownList(flatMap),
      byArea: toBreakdownList(areaMap),
      byBed: toBreakdownList(bedMap),
      byResident: toBreakdownList(residentMap),
      byStay: toBreakdownList(stayMap),
      byPersonnel: toBreakdownList(personnelMap),
      byPeriod: periodBreakdown,
    };
  }

  async getTechnicianMetrics(
    personnelId: string,
    filters: MaintenanceSearchFilters = {}
  ): Promise<TechnicianPerformanceMetrics> {
    const mergedFilters: MaintenanceSearchFilters = {
      ...filters,
      assignedToId: personnelId,
    };
    const list = await this.search(mergedFilters);

    let totalAssigned = list.length;
    let totalCompleted = 0;
    let totalPending = 0;
    let totalCancelled = 0;
    let totalActualCost = 0;
    let totalHours = 0;
    let durationCount = 0;

    const catMap = new Map<string, { count: number; est: number; act: number }>();

    list.forEach((req) => {
      const act = req.actualCost || 0;
      totalActualCost += act;

      if (req.status === 'RESOLVED') {
        totalCompleted++;
        if (req.resolvedAt) {
          const diffMs = new Date(req.resolvedAt).getTime() - new Date(req.createdAt).getTime();
          if (diffMs > 0) {
            totalHours += diffMs / (1000 * 60 * 60);
            durationCount++;
          }
        }
      } else if (req.status === 'OPEN' || req.status === 'IN_PROGRESS') {
        totalPending++;
      } else if (req.status === 'CANCELLED') {
        totalCancelled++;
      }

      const current = catMap.get(req.category) || { count: 0, est: 0, act: 0 };
      catMap.set(req.category, {
        count: current.count + 1,
        est: current.est + (req.estimateCost || 0),
        act: current.act + act,
      });
    });

    const first = list[0];
    const personnelName = first?.assignedToName || 'Technician';

    return {
      personnelId,
      personnelName,
      totalAssigned,
      totalCompleted,
      totalPending,
      totalCancelled,
      totalActualCost,
      averageResolutionTimeHours:
        durationCount > 0 ? Math.round((totalHours / durationCount) * 10) / 10 : 0,
      byCategory: Array.from(catMap.entries()).map(([label, data]) => ({
        label,
        count: data.count,
        totalEstimateCost: data.est,
        totalActualCost: data.act,
      })),
    };
  }
}
