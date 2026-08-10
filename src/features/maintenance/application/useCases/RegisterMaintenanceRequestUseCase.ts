import { MaintenanceRequest } from '../../domain/entities/MaintenanceRequest';
import type { MaintenanceRepository } from '../../domain/repositories/MaintenanceRepository';
import { maintenanceRules } from '../../domain/rules/maintenanceRules';
import type {
  MaintenanceCategory,
  MaintenancePriority,
  ReporterType,
} from '../../domain/types/MaintenanceTypes';

export interface RegisterRequestDTO {
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  reporterType: ReporterType;
  reporterId?: string;
  reporterName: string;
  flatId: string;
  areaId?: string;
  bedId?: string;
  stayId?: string;
  assignedToId?: string;
  assignedToName?: string;
  estimateCost?: number;
  notes?: string;
  actorId: string;
  actorName: string;
}

export class RegisterMaintenanceRequestUseCase {
  private maintenanceRepo: MaintenanceRepository;

  constructor(maintenanceRepo: MaintenanceRepository) {
    this.maintenanceRepo = maintenanceRepo;
  }

  async execute(dto: RegisterRequestDTO): Promise<MaintenanceRequest> {
    maintenanceRules.validateTitle(dto.title);
    maintenanceRules.validateDescription(dto.description);
    maintenanceRules.validateLocation(dto.flatId);
    maintenanceRules.validateReporter(dto.reporterType, dto.reporterName, dto.stayId);

    const ticketNumber = await this.maintenanceRepo.generateTicketNumber();
    const now = new Date().toISOString();
    const id = `mnt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const initialEvent = maintenanceRules.createEventLog(
      id,
      'CREATED',
      dto.actorId,
      dto.actorName,
      undefined,
      'OPEN',
      `Ticket created by ${dto.reporterName}`
    );

    const request = new MaintenanceRequest({
      id,
      ticketNumber,
      title: dto.title.trim(),
      description: dto.description.trim(),
      category: dto.category,
      priority: dto.priority,
      status: 'OPEN',
      reporterType: dto.reporterType,
      reporterId: dto.reporterId,
      reporterName: dto.reporterName.trim(),
      flatId: dto.flatId,
      areaId: dto.areaId,
      bedId: dto.bedId,
      stayId: dto.stayId,
      assignedToId: dto.assignedToId,
      assignedToName: dto.assignedToName,
      estimateCost: dto.estimateCost,
      notes: dto.notes ? dto.notes.trim() : undefined,
      createdAt: now,
      updatedAt: now,
      history: [initialEvent],
    });

    await this.maintenanceRepo.save(request);
    return request;
  }
}
