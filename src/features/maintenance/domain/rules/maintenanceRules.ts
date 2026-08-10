import { MaintenanceRequest } from '../entities/MaintenanceRequest';
import type {
  MaintenanceEventLog,
  MaintenanceStatus,
} from '../types/MaintenanceTypes';

export interface CreateRequestInput {
  title: string;
  description: string;
  flatId: string;
  reporterType: 'RESIDENT' | 'STAFF' | 'OTHER';
  reporterName: string;
  stayId?: string;
}

export interface UpdateStatusInput {
  status: MaintenanceStatus;
  resolutionNotes?: string;
  workDetails?: string;
  actualCost?: number;
  cancellationReason?: string;
  actorId: string;
  actorName: string;
}

export const maintenanceRules = {
  validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Maintenance request title is required and cannot be empty.');
    }
  },

  validateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new Error('Maintenance request description is required and cannot be empty.');
    }
  },

  validateLocation(flatId: string): void {
    if (!flatId || flatId.trim().length === 0) {
      throw new Error('Maintenance request must specify a valid Flat.');
    }
  },

  validateReporter(reporterType: 'RESIDENT' | 'STAFF' | 'OTHER', reporterName: string, stayId?: string): void {
    if (!reporterName || reporterName.trim().length === 0) {
      throw new Error('Reporter name is required.');
    }
    if (reporterType === 'RESIDENT' && (!stayId || stayId.trim().length === 0)) {
      throw new Error('Resident-reported maintenance request must be associated with a valid Stay.');
    }
  },

  canTransitionStatus(currentStatus: MaintenanceStatus, targetStatus: MaintenanceStatus): boolean {
    if (currentStatus === targetStatus) return true;

    // Terminal states cannot be changed
    if (currentStatus === 'RESOLVED' || currentStatus === 'CANCELLED') {
      return false;
    }

    if (currentStatus === 'OPEN') {
      return targetStatus === 'IN_PROGRESS' || targetStatus === 'RESOLVED' || targetStatus === 'CANCELLED';
    }

    if (currentStatus === 'IN_PROGRESS') {
      return targetStatus === 'OPEN' || targetStatus === 'RESOLVED' || targetStatus === 'CANCELLED';
    }

    return false;
  },

  validateStatusTransition(currentStatus: MaintenanceStatus, input: UpdateStatusInput): void {
    if (!this.canTransitionStatus(currentStatus, input.status)) {
      throw new Error(
        `Invalid status transition from ${currentStatus} to ${input.status}. Closed tickets cannot be reopened.`
      );
    }

    if (input.status === 'RESOLVED') {
      if (!input.resolutionNotes || input.resolutionNotes.trim().length === 0) {
        throw new Error('Resolution notes are required when resolving a maintenance request.');
      }
    }

    if (input.status === 'CANCELLED') {
      if (!input.cancellationReason || input.cancellationReason.trim().length === 0) {
        throw new Error('Cancellation reason is required when cancelling a maintenance request.');
      }
    }

    if (input.actualCost !== undefined && input.actualCost < 0) {
      throw new Error('Actual cost cannot be negative.');
    }
  },

  createEventLog(
    ticketId: string,
    eventType: MaintenanceEventLog['eventType'],
    actorId: string,
    actorName: string,
    previousState?: string,
    newState?: string,
    notes?: string
  ): MaintenanceEventLog {
    return Object.freeze({
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketId,
      eventType,
      timestamp: new Date().toISOString(),
      actorId,
      actorName,
      previousState,
      newState,
      notes,
    });
  },

  appendEvent(request: MaintenanceRequest, event: MaintenanceEventLog): readonly MaintenanceEventLog[] {
    return Object.freeze([...request.history, event]);
  },
};
