import { MaintenanceRequest } from '../../domain/entities/MaintenanceRequest';
import type { MaintenanceRepository } from '../../domain/repositories/MaintenanceRepository';
import { maintenanceRules } from '../../domain/rules/maintenanceRules';
import type { MaintenanceStatus } from '../../domain/types/MaintenanceTypes';

export interface UpdateStatusDTO {
  requestId: string;
  targetStatus: MaintenanceStatus;
  resolutionNotes?: string;
  cancellationReason?: string;
  workDetails?: string;
  actualCost?: number;
  assignedToId?: string;
  assignedToName?: string;
  actorId: string;
  actorName: string;
}

export class UpdateMaintenanceStatusUseCase {
  private maintenanceRepo: MaintenanceRepository;

  constructor(maintenanceRepo: MaintenanceRepository) {
    this.maintenanceRepo = maintenanceRepo;
  }

  async execute(dto: UpdateStatusDTO): Promise<MaintenanceRequest> {
    const existing = await this.maintenanceRepo.findById(dto.requestId);
    if (!existing) {
      throw new Error(`Maintenance request with ID ${dto.requestId} not found.`);
    }

    maintenanceRules.validateStatusTransition(existing.status, {
      status: dto.targetStatus,
      resolutionNotes: dto.resolutionNotes,
      cancellationReason: dto.cancellationReason,
      actualCost: dto.actualCost,
      actorId: dto.actorId,
      actorName: dto.actorName,
    });

    const now = new Date().toISOString();
    const eventType =
      dto.targetStatus === 'RESOLVED'
        ? 'RESOLVED'
        : dto.targetStatus === 'CANCELLED'
          ? 'CANCELLED'
          : 'STATUS_CHANGED';

    const notes =
      dto.targetStatus === 'RESOLVED'
        ? dto.resolutionNotes
        : dto.targetStatus === 'CANCELLED'
          ? dto.cancellationReason
          : `Status changed from ${existing.status} to ${dto.targetStatus}`;

    const newEvent = maintenanceRules.createEventLog(
      existing.id,
      eventType,
      dto.actorId,
      dto.actorName,
      existing.status,
      dto.targetStatus,
      notes
    );

    const updatedProps = {
      ...existing.toJSON(),
      status: dto.targetStatus,
      assignedToId: dto.assignedToId !== undefined ? dto.assignedToId : existing.assignedToId,
      assignedToName: dto.assignedToName !== undefined ? dto.assignedToName : existing.assignedToName,
      workDetails: dto.workDetails !== undefined ? dto.workDetails : existing.workDetails,
      actualCost: dto.actualCost !== undefined ? dto.actualCost : existing.actualCost,
      resolvedAt: dto.targetStatus === 'RESOLVED' ? now : existing.resolvedAt,
      resolutionNotes:
        dto.targetStatus === 'RESOLVED'
          ? dto.resolutionNotes?.trim()
          : existing.resolutionNotes,
      cancelledAt: dto.targetStatus === 'CANCELLED' ? now : existing.cancelledAt,
      cancellationReason:
        dto.targetStatus === 'CANCELLED'
          ? dto.cancellationReason?.trim()
          : existing.cancellationReason,
      updatedAt: now,
      history: maintenanceRules.appendEvent(existing, newEvent),
    };

    const updatedRequest = new MaintenanceRequest(updatedProps);
    await this.maintenanceRepo.save(updatedRequest);
    return updatedRequest;
  }
}
