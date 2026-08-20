import { ResponsibleParty } from '../valueObjects/ResponsibleParty';

export interface ExceptionInvestigationProps {
  id: string;
  exceptionId: string;
  investigatorStaffId: string;
  startedAt: string;
  findings: string;
  evidenceUris?: string[];
  responsibleParty?: ResponsibleParty;
  completedAt?: string;
}

/**
 * ExceptionInvestigation is an immutable Child Record owned by LaundryException
 * capturing investigative findings, evidence references, and responsible party determination.
 */
export class ExceptionInvestigation {
  public readonly id: string;
  public readonly exceptionId: string;
  public readonly investigatorStaffId: string;
  public readonly startedAt: string;
  public readonly findings: string;
  public readonly evidenceUris: readonly string[];
  public readonly responsibleParty?: ResponsibleParty;
  public readonly completedAt?: string;

  constructor(props: ExceptionInvestigationProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('ExceptionInvestigation ID cannot be empty.');
    }
    if (!props.exceptionId || props.exceptionId.trim() === '') {
      throw new Error('ExceptionInvestigation exceptionId cannot be empty.');
    }
    if (!props.investigatorStaffId || props.investigatorStaffId.trim() === '') {
      throw new Error('ExceptionInvestigation investigatorStaffId cannot be empty.');
    }
    if (!props.startedAt || props.startedAt.trim() === '') {
      throw new Error('ExceptionInvestigation startedAt cannot be empty.');
    }
    if (!props.findings || props.findings.trim() === '') {
      throw new Error('ExceptionInvestigation findings cannot be empty.');
    }

    this.id = props.id.trim();
    this.exceptionId = props.exceptionId.trim();
    this.investigatorStaffId = props.investigatorStaffId.trim();
    this.startedAt = props.startedAt;
    this.findings = props.findings.trim();
    this.evidenceUris = Object.freeze(props.evidenceUris ? [...props.evidenceUris] : []);
    this.responsibleParty = props.responsibleParty;
    this.completedAt = props.completedAt;

    Object.freeze(this);
  }

  public toJSON(): ExceptionInvestigationProps {
    return {
      id: this.id,
      exceptionId: this.exceptionId,
      investigatorStaffId: this.investigatorStaffId,
      startedAt: this.startedAt,
      findings: this.findings,
      evidenceUris: [...this.evidenceUris],
      responsibleParty: this.responsibleParty,
      completedAt: this.completedAt,
    };
  }
}
