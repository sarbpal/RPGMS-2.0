import type { MaintenanceRepository } from '../../domain/repositories/MaintenanceRepository';
import type { MaintenancePersonnelRepository } from '../../domain/repositories/MaintenancePersonnelRepository';
import type { AccommodationRepository } from '../../../accommodation';
import type { StayRepository } from '../../../stay';
import type { ResidentRepository } from '../../../resident';

import { InMemoryMaintenanceRepository } from '../../infrastructure/repositories/InMemoryMaintenanceRepository';
import { InMemoryMaintenancePersonnelRepository } from '../../infrastructure/repositories/InMemoryMaintenancePersonnelRepository';
import { InMemoryAccommodationRepository } from '../../../accommodation';
import { InMemoryStayRepository } from '../../../stay';
import { InMemoryResidentRepository } from '../../../resident';

import type { MaintenanceRequest } from '../../domain/entities/MaintenanceRequest';
import type {
  MaintenanceSearchFilters,
  TechnicianPerformanceMetrics,
} from '../../domain/types/MaintenanceTypes';
import type {
  MaintenanceMetricsViewModel,
  MaintenanceRequestItemViewModel,
  MaintenanceWorkspaceViewModel,
} from '../models/MaintenanceWorkspaceViewModel';

import { RegisterMaintenanceRequestUseCase, type RegisterRequestDTO } from '../useCases/RegisterMaintenanceRequestUseCase';
import { UpdateMaintenanceStatusUseCase, type UpdateStatusDTO } from '../useCases/UpdateMaintenanceStatusUseCase';
import { ManagePersonnelUseCase, type CreatePersonnelDTO } from '../useCases/ManagePersonnelUseCase';

export class MaintenanceWorkspaceCoordinator {
  private maintenanceRepo: MaintenanceRepository;
  private personnelRepo: MaintenancePersonnelRepository;
  private accommodationRepo: AccommodationRepository;
  private stayRepo: StayRepository;
  private residentRepo: ResidentRepository;
  private registerUseCase: RegisterMaintenanceRequestUseCase;
  private updateStatusUseCase: UpdateMaintenanceStatusUseCase;
  private managePersonnelUseCase: ManagePersonnelUseCase;

  constructor(
    maintenanceRepo?: MaintenanceRepository,
    personnelRepo?: MaintenancePersonnelRepository,
    accommodationRepo?: AccommodationRepository,
    stayRepo?: StayRepository,
    residentRepo?: ResidentRepository
  ) {
    this.maintenanceRepo = maintenanceRepo || new InMemoryMaintenanceRepository();
    this.personnelRepo = personnelRepo || new InMemoryMaintenancePersonnelRepository();
    this.accommodationRepo = accommodationRepo || new InMemoryAccommodationRepository();
    this.stayRepo = stayRepo || new InMemoryStayRepository();
    this.residentRepo = residentRepo || new InMemoryResidentRepository();

    this.registerUseCase = new RegisterMaintenanceRequestUseCase(this.maintenanceRepo);
    this.updateStatusUseCase = new UpdateMaintenanceStatusUseCase(this.maintenanceRepo);
    this.managePersonnelUseCase = new ManagePersonnelUseCase(this.personnelRepo);
  }

  async createViewModel(
    filters: MaintenanceSearchFilters = {}
  ): Promise<MaintenanceWorkspaceViewModel> {
    const requests = await this.maintenanceRepo.search(filters);
    const personnelList = await this.personnelRepo.findAll(true);
    const analytics = await this.maintenanceRepo.getAnalytics(filters);

    const allRequests = await this.maintenanceRepo.search({});
    const totalOpen = allRequests.filter((r) => r.status === 'OPEN').length;
    const inProgress = allRequests.filter((r) => r.status === 'IN_PROGRESS').length;
    const urgentHighPriority = allRequests.filter(
      (r) =>
        (r.status === 'OPEN' || r.status === 'IN_PROGRESS') &&
        (r.priority === 'URGENT' || r.priority === 'HIGH')
    ).length;

    const currentMonthPrefix = new Date().toISOString().substring(0, 7);
    const resolvedThisMonth = allRequests.filter(
      (r) =>
        r.status === 'RESOLVED' &&
        r.resolvedAt &&
        r.resolvedAt.startsWith(currentMonthPrefix)
    ).length;

    const metrics: MaintenanceMetricsViewModel = {
      totalOpen,
      inProgress,
      urgentHighPriority,
      resolvedThisMonth,
    };

    const requestItems: MaintenanceRequestItemViewModel[] = await Promise.all(
      requests.map((r) => this.enrichRequestItem(r))
    );

    return {
      metrics,
      requests: Object.freeze(requestItems),
      personnelList,
      analytics,
    };
  }

  private async enrichRequestItem(
    r: MaintenanceRequest
  ): Promise<MaintenanceRequestItemViewModel> {
    const flatDisplayId = r.flatId.replace(/^flat-/i, '');
    let locationSummary = `Flat ${flatDisplayId}`;
    try {
      const flat = await this.accommodationRepo.findById(r.flatId);
      if (flat) {
        locationSummary = `Flat ${flat.name}`;
        if (r.areaId) {
          const area = flat.areas.find((a) => a.id === r.areaId);
          if (area) {
            locationSummary += ` - ${area.name}`;
          }
        }
        if (r.bedId) {
          let bedCode = r.bedId;
          flat.areas.forEach((a) => {
            const b = a.beds.find((bed) => bed.id === r.bedId);
            if (b) bedCode = b.name;
          });
          locationSummary += ` (${bedCode})`;
        }
      }
    } catch {
      // Fallback
    }

    return {
      id: r.id,
      ticketNumber: r.ticketNumber,
      title: r.title,
      description: r.description,
      category: r.category,
      priority: r.priority,
      status: r.status,
      reporterName: r.reporterName,
      reporterType: r.reporterType,
      reporterId: r.reporterId,
      flatId: r.flatId,
      areaId: r.areaId,
      bedId: r.bedId,
      stayId: r.stayId,
      locationSummary,
      assignedToId: r.assignedToId,
      assignedToName: r.assignedToName,
      workDetails: r.workDetails,
      estimateCost: r.estimateCost,
      estimateCostFormatted:
        r.estimateCost !== undefined ? `₹${r.estimateCost.toLocaleString('en-IN')}` : undefined,
      actualCost: r.actualCost,
      actualCostFormatted:
        r.actualCost !== undefined ? `₹${r.actualCost.toLocaleString('en-IN')}` : undefined,
      notes: r.notes,
      createdAt: r.createdAt,
      createdAtFormatted: new Date(r.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      resolvedAt: r.resolvedAt,
      resolvedAtFormatted: r.resolvedAt
        ? new Date(r.resolvedAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : undefined,
      resolutionNotes: r.resolutionNotes,
      cancellationReason: r.cancellationReason,
      history: r.history,
    };
  }

  async getTechnicianMetrics(
    personnelId: string,
    filters: MaintenanceSearchFilters = {}
  ): Promise<TechnicianPerformanceMetrics> {
    return this.maintenanceRepo.getTechnicianMetrics(personnelId, filters);
  }

  async registerRequest(dto: RegisterRequestDTO): Promise<MaintenanceRequest> {
    return this.registerUseCase.execute(dto);
  }

  async updateStatus(dto: UpdateStatusDTO): Promise<MaintenanceRequest> {
    return this.updateStatusUseCase.execute(dto);
  }

  async createPersonnel(dto: CreatePersonnelDTO) {
    return this.managePersonnelUseCase.createPersonnel(dto);
  }

  async togglePersonnelStatus(id: string) {
    return this.managePersonnelUseCase.toggleActiveStatus(id);
  }

  getStayRepo(): StayRepository {
    return this.stayRepo;
  }

  getResidentRepo(): ResidentRepository {
    return this.residentRepo;
  }
}
