import { LaundryExceptionType } from '../valueObjects/LaundryExceptionType';
import { LaundryExceptionStatus } from '../valueObjects/LaundryExceptionStatus';
import { ExceptionInvestigation, type ExceptionInvestigationProps } from './ExceptionInvestigation';
import { ExceptionResolution, type ExceptionResolutionProps } from './ExceptionResolution';
import { ResolutionOutcome } from '../valueObjects/ResolutionOutcome';
import { ResponsibleParty } from '../valueObjects/ResponsibleParty';

export interface LaundryExceptionProps {
  id: string;
  transactionId: string;
  garmentLineId?: string;
  serviceId?: string;
  type: LaundryExceptionType;
  description: string;
  affectedQuantity: number;
  status?: LaundryExceptionStatus;
  isBlocking?: boolean;
  raisedByStaffId: string;
  raisedAt: string;
  evidenceUris?: string[];
  investigations?: (ExceptionInvestigation | ExceptionInvestigationProps)[];
  resolution?: ExceptionResolution | ExceptionResolutionProps;
  updatedAt?: string;
}

export interface AddInvestigationParams {
  investigationId?: string;
  investigatorStaffId: string;
  findings: string;
  startedAt?: string;
  evidenceUris?: string[];
  responsibleParty?: ResponsibleParty;
  completedAt?: string;
}

export interface ResolveParams {
  resolutionId?: string;
  outcome: ResolutionOutcome;
  resolverStaffId: string;
  resolvedAt?: string;
  resolvedQuantity?: number;
  responsibleParty?: ResponsibleParty;
  notes?: string;
}

/**
 * LaundryException is a Child Entity owned by LaundryTransaction representing
 * an operational discrepancy, quality issue, damage, or service failure.
 *
 * Invariants:
 * 1. Follows lifecycle: OPEN -> UNDER_INVESTIGATION -> RESOLVED.
 * 2. Owns its historical investigations and formal resolution.
 * 3. Does not modify historical collection or return facts.
 */
export class LaundryException {
  public readonly id: string;
  public readonly transactionId: string;
  public readonly garmentLineId?: string;
  public readonly serviceId?: string;
  public readonly type: LaundryExceptionType;
  public readonly description: string;
  public readonly affectedQuantity: number;
  private _status: LaundryExceptionStatus;
  public readonly isBlocking: boolean;
  public readonly raisedByStaffId: string;
  public readonly raisedAt: string;
  public readonly evidenceUris: readonly string[];
  private _investigations: ExceptionInvestigation[];
  private _resolution?: ExceptionResolution;
  private _updatedAt?: string;

  constructor(props: LaundryExceptionProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('LaundryException ID cannot be empty.');
    }
    if (!props.transactionId || props.transactionId.trim() === '') {
      throw new Error('LaundryException transactionId cannot be empty.');
    }
    if (!props.description || props.description.trim() === '') {
      throw new Error('LaundryException description cannot be empty.');
    }
    if (!props.raisedByStaffId || props.raisedByStaffId.trim() === '') {
      throw new Error('LaundryException raisedByStaffId cannot be empty.');
    }
    if (!props.raisedAt || props.raisedAt.trim() === '') {
      throw new Error('LaundryException raisedAt cannot be empty.');
    }
    if (
      typeof props.affectedQuantity !== 'number' ||
      isNaN(props.affectedQuantity) ||
      props.affectedQuantity <= 0 ||
      !Number.isInteger(props.affectedQuantity)
    ) {
      throw new Error('LaundryException affectedQuantity must be a positive integer.');
    }
    if (!Object.values(LaundryExceptionType).includes(props.type)) {
      throw new Error(`Invalid LaundryExceptionType (${props.type}).`);
    }

    this.id = props.id.trim();
    this.transactionId = props.transactionId.trim();
    this.garmentLineId = props.garmentLineId?.trim();
    this.serviceId = props.serviceId?.trim();
    this.type = props.type;
    this.description = props.description.trim();
    this.affectedQuantity = props.affectedQuantity;
    this._status = props.status ?? LaundryExceptionStatus.OPEN;
    this.isBlocking = props.isBlocking ?? (props.type === LaundryExceptionType.IDENTITY_DISPUTE);
    this.raisedByStaffId = props.raisedByStaffId.trim();
    this.raisedAt = props.raisedAt;
    this.evidenceUris = Object.freeze(props.evidenceUris ? [...props.evidenceUris] : []);
    this._updatedAt = props.updatedAt;

    this._investigations = [];
    if (props.investigations && props.investigations.length > 0) {
      for (const inv of props.investigations) {
        const item = inv instanceof ExceptionInvestigation ? inv : new ExceptionInvestigation(inv);
        this._investigations.push(item);
      }
    }

    if (props.resolution) {
      this._resolution =
        props.resolution instanceof ExceptionResolution
          ? props.resolution
          : new ExceptionResolution(props.resolution);
      this._status = LaundryExceptionStatus.RESOLVED;
    }
  }

  get status(): LaundryExceptionStatus {
    return this._status;
  }

  get investigations(): readonly ExceptionInvestigation[] {
    return [...this._investigations];
  }

  get resolution(): ExceptionResolution | undefined {
    return this._resolution;
  }

  get updatedAt(): string | undefined {
    return this._updatedAt;
  }

  /**
   * Adds an investigation fact and transitions status to UNDER_INVESTIGATION.
   */
  public addInvestigation(params: AddInvestigationParams): ExceptionInvestigation {
    if (this._status === LaundryExceptionStatus.RESOLVED) {
      throw new Error(`Cannot add investigation to already RESOLVED exception (${this.id}).`);
    }

    const invId = params.investigationId ?? `INV-${this.id}-${String(this._investigations.length + 1).padStart(2, '0')}`;
    const startedAt = params.startedAt ?? new Date().toISOString();

    const investigation = new ExceptionInvestigation({
      id: invId,
      exceptionId: this.id,
      investigatorStaffId: params.investigatorStaffId,
      startedAt,
      findings: params.findings,
      evidenceUris: params.evidenceUris,
      responsibleParty: params.responsibleParty,
      completedAt: params.completedAt,
    });

    this._investigations.push(investigation);
    this._status = LaundryExceptionStatus.UNDER_INVESTIGATION;
    this._updatedAt = new Date().toISOString();

    return investigation;
  }

  /**
   * Resolves the exception with a formal business outcome and transitions status to RESOLVED.
   */
  public resolve(params: ResolveParams): ExceptionResolution {
    if (this._status === LaundryExceptionStatus.RESOLVED) {
      throw new Error(`Exception (${this.id}) is already RESOLVED.`);
    }

    const resId = params.resolutionId ?? `RES-${this.id}`;
    const resolvedAt = params.resolvedAt ?? new Date().toISOString();

    const resolution = new ExceptionResolution({
      id: resId,
      exceptionId: this.id,
      outcome: params.outcome,
      resolverStaffId: params.resolverStaffId,
      resolvedAt,
      resolvedQuantity: params.resolvedQuantity,
      responsibleParty: params.responsibleParty,
      notes: params.notes,
    });

    this._resolution = resolution;
    this._status = LaundryExceptionStatus.RESOLVED;
    this._updatedAt = resolvedAt;

    return resolution;
  }

  public toJSON(): LaundryExceptionProps {
    return {
      id: this.id,
      transactionId: this.transactionId,
      garmentLineId: this.garmentLineId,
      serviceId: this.serviceId,
      type: this.type,
      description: this.description,
      affectedQuantity: this.affectedQuantity,
      status: this._status,
      isBlocking: this.isBlocking,
      raisedByStaffId: this.raisedByStaffId,
      raisedAt: this.raisedAt,
      evidenceUris: [...this.evidenceUris],
      investigations: this._investigations.map((i) => i.toJSON()),
      resolution: this._resolution?.toJSON(),
      updatedAt: this._updatedAt,
    };
  }
}
