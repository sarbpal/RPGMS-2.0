import type { BillingOperationOutcome } from '../valueObjects/BillingTypes';

export interface BillingOperationProps {
  id: string;
  billingRunId: string;
  stayId: string;
  residentId: string;
  residentCode?: string;
  status?: BillingOperationOutcome;
  obligationKeys?: string[];
  totalAmount?: number;
  failureReason?: string;
  recoveryNotes?: string;
  financialBillId?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Entity representing an individual processing attempt for a Stay within a BillingRun.
 */
export class BillingOperation {
  readonly id: string;
  readonly billingRunId: string;
  readonly stayId: string;
  readonly residentId: string;
  readonly residentCode: string;
  private _status: BillingOperationOutcome;
  private _obligationKeys: string[];
  private _totalAmount: number;
  private _failureReason?: string;
  private _recoveryNotes?: string;
  private _financialBillId?: string;
  private _startedAt?: string;
  private _completedAt?: string;
  readonly createdAt: string;
  private _updatedAt: string;

  constructor(props: BillingOperationProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('BillingOperation requires a valid id.');
    }
    if (!props.billingRunId || props.billingRunId.trim() === '') {
      throw new Error('BillingOperation requires a valid billingRunId.');
    }
    if (!props.stayId || props.stayId.trim() === '') {
      throw new Error('BillingOperation requires a valid stayId.');
    }
    if (!props.residentId || props.residentId.trim() === '') {
      throw new Error('BillingOperation requires a valid residentId.');
    }

    this.id = props.id;
    this.billingRunId = props.billingRunId;
    this.stayId = props.stayId;
    this.residentId = props.residentId;
    this.residentCode = props.residentCode || '';
    this._status = props.status || 'PENDING';
    this._obligationKeys = props.obligationKeys ? [...props.obligationKeys] : [];
    this._totalAmount = props.totalAmount || 0;
    this._failureReason = props.failureReason;
    this._recoveryNotes = props.recoveryNotes;
    this._financialBillId = props.financialBillId;
    this._startedAt = props.startedAt;
    this._completedAt = props.completedAt;
    this.createdAt = props.createdAt || new Date().toISOString();
    this._updatedAt = props.updatedAt || this.createdAt;
  }

  get status(): BillingOperationOutcome {
    return this._status;
  }

  get obligationKeys(): readonly string[] {
    return [...this._obligationKeys];
  }

  get totalAmount(): number {
    return this._totalAmount;
  }

  get failureReason(): string | undefined {
    return this._failureReason;
  }

  get recoveryNotes(): string | undefined {
    return this._recoveryNotes;
  }

  get financialBillId(): string | undefined {
    return this._financialBillId;
  }

  get startedAt(): string | undefined {
    return this._startedAt;
  }

  get completedAt(): string | undefined {
    return this._completedAt;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  isTerminal(): boolean {
    return (
      this._status === 'SUCCESS' ||
      this._status === 'NO_CHARGES' ||
      this._status === 'NOT_PROCESSED' ||
      this._status === 'FAILED' ||
      this._status === 'CLAIM_FAILED' ||
      this._status === 'RECOVERY_REQUIRED'
    );
  }

  markClaimed(obligationKeys: string[], totalAmount: number, timestamp?: string): void {
    if (this._status !== 'PENDING') {
      throw new Error(`Cannot transition operation ${this.id} from ${this._status} to CLAIMED.`);
    }
    this._obligationKeys = [...obligationKeys];
    this._totalAmount = Number(totalAmount.toFixed(2));
    this._status = 'CLAIMED';
    this._updatedAt = timestamp || new Date().toISOString();
  }

  startProcessing(timestamp?: string): void {
    if (this._status !== 'CLAIMED' && this._status !== 'PENDING') {
      throw new Error(`Cannot start processing operation ${this.id} from status ${this._status}.`);
    }
    this._status = 'PROCESSING';
    this._startedAt = timestamp || new Date().toISOString();
    this._updatedAt = this._startedAt;
  }

  markSuccess(financialBillId: string, timestamp?: string): void {
    if (this._status !== 'PROCESSING' && this._status !== 'CLAIMED') {
      throw new Error(`Cannot mark operation ${this.id} as SUCCESS from status ${this._status}.`);
    }
    if (!financialBillId || financialBillId.trim() === '') {
      throw new Error('markSuccess requires a valid financialBillId.');
    }
    this._status = 'SUCCESS';
    this._financialBillId = financialBillId;
    this._completedAt = timestamp || new Date().toISOString();
    this._updatedAt = this._completedAt;
  }

  markNoCharges(timestamp?: string): void {
    if (this._status !== 'PENDING' && this._status !== 'PROCESSING') {
      throw new Error(`Cannot mark operation ${this.id} as NO_CHARGES from status ${this._status}.`);
    }
    this._status = 'NO_CHARGES';
    this._totalAmount = 0;
    this._completedAt = timestamp || new Date().toISOString();
    this._updatedAt = this._completedAt;
  }

  markNotProcessed(reason?: string, timestamp?: string): void {
    if (this.isTerminal()) {
      throw new Error(`Cannot mark terminal operation ${this.id} (${this._status}) as NOT_PROCESSED.`);
    }
    this._status = 'NOT_PROCESSED';
    this._failureReason = reason;
    this._completedAt = timestamp || new Date().toISOString();
    this._updatedAt = this._completedAt;
  }

  markFailed(reason: string, timestamp?: string): void {
    if (!reason || reason.trim() === '') {
      throw new Error('markFailed requires a valid failure reason.');
    }
    if (this._status === 'SUCCESS') {
      throw new Error(`Cannot mark successfully completed operation ${this.id} as FAILED.`);
    }
    this._status = 'FAILED';
    this._failureReason = reason;
    this._completedAt = timestamp || new Date().toISOString();
    this._updatedAt = this._completedAt;
  }

  markClaimFailed(reason: string, timestamp?: string): void {
    if (this._status !== 'PENDING' && this._status !== 'CLAIMED') {
      throw new Error(`Cannot mark operation ${this.id} as CLAIM_FAILED from status ${this._status}.`);
    }
    this._status = 'CLAIM_FAILED';
    this._failureReason = reason;
    this._completedAt = timestamp || new Date().toISOString();
    this._updatedAt = this._completedAt;
  }

  markRecoveryRequired(reason: string, notes?: string, timestamp?: string): void {
    if (!reason || reason.trim() === '') {
      throw new Error('markRecoveryRequired requires a reason explaining financial uncertainty.');
    }
    this._status = 'RECOVERY_REQUIRED';
    this._failureReason = reason;
    this._recoveryNotes = notes;
    this._completedAt = timestamp || new Date().toISOString();
    this._updatedAt = this._completedAt;
  }

  /**
   * Resolves an uncertain operation as COMMITTED after verifying authoritative Finance evidence.
   * Transitions status to SUCCESS, attaches the financialBillId, and preserves audit notes.
   */
  resolveCommitted(financialBillId: string, notes: string, timestamp?: string): void {
    if (this._status !== 'RECOVERY_REQUIRED') {
      throw new Error(
        `Cannot resolve operation ${this.id} as COMMITTED from status ${this._status}. Must be in RECOVERY_REQUIRED.`
      );
    }
    if (!financialBillId || financialBillId.trim() === '') {
      throw new Error('resolveCommitted requires a valid, non-empty financialBillId.');
    }

    const now = timestamp || new Date().toISOString();
    this._status = 'SUCCESS';
    this._financialBillId = financialBillId.trim();
    this._recoveryNotes = notes
      ? this._recoveryNotes
        ? `${this._recoveryNotes} | Resolved COMMITTED: ${notes.trim()}`
        : `Resolved COMMITTED: ${notes.trim()}`
      : this._recoveryNotes;
    this._completedAt = now;
    this._updatedAt = now;
  }

  /**
   * Resolves an uncertain operation as NOT_COMMITTED after conclusive verification that no financial posting occurred.
   * Transitions status to FAILED and records mandatory operator reason.
   */
  resolveNotCommitted(reason: string, notes?: string, timestamp?: string): void {
    if (this._status !== 'RECOVERY_REQUIRED') {
      throw new Error(
        `Cannot resolve operation ${this.id} as NOT_COMMITTED from status ${this._status}. Must be in RECOVERY_REQUIRED.`
      );
    }
    if (!reason || reason.trim() === '') {
      throw new Error('resolveNotCommitted requires a valid reason explaining why no financial commitment occurred.');
    }

    const now = timestamp || new Date().toISOString();
    this._status = 'FAILED';
    this._failureReason = reason.trim();
    const resolutionAudit = notes ? `${reason.trim()} (${notes.trim()})` : reason.trim();
    this._recoveryNotes = this._recoveryNotes
      ? `${this._recoveryNotes} | Resolved NOT_COMMITTED: ${resolutionAudit}`
      : `Resolved NOT_COMMITTED: ${resolutionAudit}`;
    this._completedAt = now;
    this._updatedAt = now;
  }

  toJSON(): BillingOperationProps {
    return {
      id: this.id,
      billingRunId: this.billingRunId,
      stayId: this.stayId,
      residentId: this.residentId,
      residentCode: this.residentCode,
      status: this._status,
      obligationKeys: [...this._obligationKeys],
      totalAmount: this._totalAmount,
      failureReason: this._failureReason,
      recoveryNotes: this._recoveryNotes,
      financialBillId: this._financialBillId,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
