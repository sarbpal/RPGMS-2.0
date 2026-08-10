import type {
  MaintenanceCategory,
  MaintenanceEventLog,
  MaintenancePriority,
  MaintenanceStatus,
  ReporterType,
} from '../types/MaintenanceTypes';

export interface MaintenanceRequestProps {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reporterType: ReporterType;
  reporterId?: string;
  reporterName: string;
  flatId: string;
  areaId?: string;
  bedId?: string;
  stayId?: string;
  assignedToId?: string;
  assignedToName?: string;
  workDetails?: string;
  estimateCost?: number;
  actualCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  history?: readonly MaintenanceEventLog[];
}

export class MaintenanceRequest {
  readonly id: string;
  readonly ticketNumber: string;
  readonly title: string;
  readonly description: string;
  readonly category: MaintenanceCategory;
  readonly priority: MaintenancePriority;
  readonly status: MaintenanceStatus;
  readonly reporterType: ReporterType;
  readonly reporterId?: string;
  readonly reporterName: string;
  readonly flatId: string;
  readonly areaId?: string;
  readonly bedId?: string;
  readonly stayId?: string;
  readonly assignedToId?: string;
  readonly assignedToName?: string;
  readonly workDetails?: string;
  readonly estimateCost?: number;
  readonly actualCost?: number;
  readonly notes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly resolvedAt?: string;
  readonly resolutionNotes?: string;
  readonly cancelledAt?: string;
  readonly cancellationReason?: string;
  readonly history: readonly MaintenanceEventLog[];

  constructor(props: MaintenanceRequestProps) {
    this.id = props.id;
    this.ticketNumber = props.ticketNumber;
    this.title = props.title;
    this.description = props.description;
    this.category = props.category;
    this.priority = props.priority;
    this.status = props.status;
    this.reporterType = props.reporterType;
    this.reporterId = props.reporterId;
    this.reporterName = props.reporterName;
    this.flatId = props.flatId;
    this.areaId = props.areaId;
    this.bedId = props.bedId;
    this.stayId = props.stayId;
    this.assignedToId = props.assignedToId;
    this.assignedToName = props.assignedToName;
    this.workDetails = props.workDetails;
    this.estimateCost = props.estimateCost;
    this.actualCost = props.actualCost;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.resolvedAt = props.resolvedAt;
    this.resolutionNotes = props.resolutionNotes;
    this.cancelledAt = props.cancelledAt;
    this.cancellationReason = props.cancellationReason;
    this.history = props.history ? Object.freeze([...props.history]) : Object.freeze([]);
  }

  toJSON(): MaintenanceRequestProps {
    return {
      id: this.id,
      ticketNumber: this.ticketNumber,
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      status: this.status,
      reporterType: this.reporterType,
      reporterId: this.reporterId,
      reporterName: this.reporterName,
      flatId: this.flatId,
      areaId: this.areaId,
      bedId: this.bedId,
      stayId: this.stayId,
      assignedToId: this.assignedToId,
      assignedToName: this.assignedToName,
      workDetails: this.workDetails,
      estimateCost: this.estimateCost,
      actualCost: this.actualCost,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      resolvedAt: this.resolvedAt,
      resolutionNotes: this.resolutionNotes,
      cancelledAt: this.cancelledAt,
      cancellationReason: this.cancellationReason,
      history: [...this.history],
    };
  }
}
