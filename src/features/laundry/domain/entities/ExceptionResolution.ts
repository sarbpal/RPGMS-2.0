import { ResolutionOutcome } from '../valueObjects/ResolutionOutcome';
import { ResponsibleParty } from '../valueObjects/ResponsibleParty';

export interface ExceptionResolutionProps {
  id: string;
  exceptionId: string;
  outcome: ResolutionOutcome;
  resolverStaffId: string;
  resolvedAt: string;
  resolvedQuantity?: number;
  responsibleParty?: ResponsibleParty;
  notes?: string;
}

/**
 * ExceptionResolution is an immutable Child Record owned by LaundryException
 * recording the formal business decision and resolution outcome.
 */
export class ExceptionResolution {
  public readonly id: string;
  public readonly exceptionId: string;
  public readonly outcome: ResolutionOutcome;
  public readonly resolverStaffId: string;
  public readonly resolvedAt: string;
  public readonly resolvedQuantity?: number;
  public readonly responsibleParty?: ResponsibleParty;
  public readonly notes?: string;

  constructor(props: ExceptionResolutionProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('ExceptionResolution ID cannot be empty.');
    }
    if (!props.exceptionId || props.exceptionId.trim() === '') {
      throw new Error('ExceptionResolution exceptionId cannot be empty.');
    }
    if (!props.resolverStaffId || props.resolverStaffId.trim() === '') {
      throw new Error('ExceptionResolution resolverStaffId cannot be empty.');
    }
    if (!props.resolvedAt || props.resolvedAt.trim() === '') {
      throw new Error('ExceptionResolution resolvedAt cannot be empty.');
    }
    if (!props.outcome || props.outcome.trim() === '') {
      throw new Error('ExceptionResolution outcome cannot be empty.');
    }
    if (
      props.resolvedQuantity !== undefined &&
      (typeof props.resolvedQuantity !== 'number' ||
        isNaN(props.resolvedQuantity) ||
        props.resolvedQuantity < 0 ||
        !Number.isInteger(props.resolvedQuantity))
    ) {
      throw new Error('ExceptionResolution resolvedQuantity must be a non-negative integer.');
    }

    this.id = props.id.trim();
    this.exceptionId = props.exceptionId.trim();
    this.outcome = props.outcome;
    this.resolverStaffId = props.resolverStaffId.trim();
    this.resolvedAt = props.resolvedAt;
    this.resolvedQuantity = props.resolvedQuantity;
    this.responsibleParty = props.responsibleParty;
    this.notes = props.notes?.trim();

    Object.freeze(this);
  }

  public toJSON(): ExceptionResolutionProps {
    return {
      id: this.id,
      exceptionId: this.exceptionId,
      outcome: this.outcome,
      resolverStaffId: this.resolverStaffId,
      resolvedAt: this.resolvedAt,
      resolvedQuantity: this.resolvedQuantity,
      responsibleParty: this.responsibleParty,
      notes: this.notes,
    };
  }
}
