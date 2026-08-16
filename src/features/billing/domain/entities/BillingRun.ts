import type { BillingRunStatus } from '../valueObjects/BillingTypes';
import { BillingOperation, type BillingOperationProps } from './BillingOperation';

export interface BillingRunProps {
  id: string;
  periodStart: string;
  periodEnd: string;
  operatorId: string;
  status?: BillingRunStatus;
  retryOfRunId?: string;
  eligibilityCutoff?: string;
  operations?: (BillingOperation | BillingOperationProps)[];
  notes?: string;
  createdAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  stoppedAt?: string;
  updatedAt?: string;
}

/**
 * Aggregate Root representing an operator-initiated billing execution over a selected period.
 */
export class BillingRun {
  readonly id: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly operatorId: string;
  readonly retryOfRunId?: string;
  private _status: BillingRunStatus;
  private _eligibilityCutoff?: string;
  private _operations: BillingOperation[];
  private _notes?: string;
  readonly createdAt: string;
  private _confirmedAt?: string;
  private _completedAt?: string;
  private _stoppedAt?: string;
  private _updatedAt: string;

  constructor(props: BillingRunProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('BillingRun requires a valid id.');
    }
    if (!props.periodStart || props.periodStart.trim() === '') {
      throw new Error('BillingRun requires a valid periodStart date.');
    }
    if (!props.periodEnd || props.periodEnd.trim() === '') {
      throw new Error('BillingRun requires a valid periodEnd date.');
    }
    if (props.periodStart > props.periodEnd) {
      throw new Error(`Invalid billing period: periodStart (${props.periodStart}) cannot be after periodEnd (${props.periodEnd}).`);
    }
    if (!props.operatorId || props.operatorId.trim() === '') {
      throw new Error('BillingRun requires a valid operatorId.');
    }

    this.id = props.id;
    this.periodStart = props.periodStart;
    this.periodEnd = props.periodEnd;
    this.operatorId = props.operatorId;
    this.retryOfRunId = props.retryOfRunId;
    this._status = props.status || 'DRAFT_PREVIEW';
    this._eligibilityCutoff = props.eligibilityCutoff;
    this._operations = (props.operations || []).map((op) =>
      op instanceof BillingOperation ? op : new BillingOperation(op)
    );
    this._notes = props.notes;
    this.createdAt = props.createdAt || new Date().toISOString();
    this._confirmedAt = props.confirmedAt;
    this._completedAt = props.completedAt;
    this._stoppedAt = props.stoppedAt;
    this._updatedAt = props.updatedAt || this.createdAt;
  }

  get status(): BillingRunStatus {
    return this._status;
  }

  get eligibilityCutoff(): string | undefined {
    return this._eligibilityCutoff;
  }

  get operations(): readonly BillingOperation[] {
    return [...this._operations];
  }

  get notes(): string | undefined {
    return this._notes;
  }

  get confirmedAt(): string | undefined {
    return this._confirmedAt;
  }

  get completedAt(): string | undefined {
    return this._completedAt;
  }

  get stoppedAt(): string | undefined {
    return this._stoppedAt;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  get totalOperations(): number {
    return this._operations.length;
  }

  get totalAmountBilled(): number {
    return Number(
      this._operations
        .filter((op) => op.status === 'SUCCESS')
        .reduce((sum, op) => sum + op.totalAmount, 0)
        .toFixed(2)
    );
  }

  get successfulOperationsCount(): number {
    return this._operations.filter((op) => op.status === 'SUCCESS' || op.status === 'NO_CHARGES').length;
  }

  get failedOperationsCount(): number {
    return this._operations.filter((op) => op.status === 'FAILED' || op.status === 'CLAIM_FAILED').length;
  }

  get recoveryRequiredCount(): number {
    return this._operations.filter((op) => op.status === 'RECOVERY_REQUIRED').length;
  }

  addOperation(operation: BillingOperation): void {
    if (this._status !== 'DRAFT_PREVIEW' && this._status !== 'CONFIRMED') {
      throw new Error(`Cannot add operation to BillingRun ${this.id} while in status ${this._status}.`);
    }
    const existing = this._operations.find((op) => op.stayId === operation.stayId);
    if (existing) {
      throw new Error(`BillingRun ${this.id} already contains an operation for Stay ${operation.stayId}.`);
    }
    this._operations.push(operation);
    this._updatedAt = new Date().toISOString();
  }

  getOperation(operationId: string): BillingOperation | undefined {
    return this._operations.find((op) => op.id === operationId);
  }

  getOperationByStayId(stayId: string): BillingOperation | undefined {
    return this._operations.find((op) => op.stayId === stayId);
  }

  confirm(cutoffTimestamp?: string): void {
    if (this._status !== 'DRAFT_PREVIEW') {
      throw new Error(`Cannot confirm BillingRun ${this.id} from status ${this._status}. Must be in DRAFT_PREVIEW.`);
    }
    const now = new Date().toISOString();
    this._status = 'CONFIRMED';
    this._eligibilityCutoff = cutoffTimestamp || now;
    this._confirmedAt = now;
    this._updatedAt = now;
  }

  startProcessing(timestamp?: string): void {
    if (this._status !== 'CONFIRMED') {
      throw new Error(`Cannot start processing BillingRun ${this.id} from status ${this._status}. Must be CONFIRMED.`);
    }
    const now = timestamp || new Date().toISOString();
    this._status = 'PROCESSING';
    this._updatedAt = now;
  }

  requestStop(timestamp?: string): void {
    if (this._status !== 'PROCESSING') {
      throw new Error(`Cannot request stop on BillingRun ${this.id} from status ${this._status}. Must be PROCESSING.`);
    }
    const now = timestamp || new Date().toISOString();
    this._status = 'STOPPING';
    this._stoppedAt = now;
    this._updatedAt = now;
  }

  cancel(reason?: string, timestamp?: string): void {
    if (this._status !== 'DRAFT_PREVIEW' && this._status !== 'CONFIRMED') {
      throw new Error(`Cannot cancel BillingRun ${this.id} from status ${this._status}. Only unstarted runs can be cancelled.`);
    }
    const now = timestamp || new Date().toISOString();
    this._status = 'CANCELLED';
    this._notes = reason ? `${this._notes ? this._notes + ' | ' : ''}Cancelled: ${reason}` : this._notes;
    this._completedAt = now;
    this._updatedAt = now;
  }

  /**
   * Finalizes the run based on individual operation outcomes once all operations are terminal.
   */
  finalize(timestamp?: string): void {
    if (this._status !== 'PROCESSING' && this._status !== 'STOPPING') {
      throw new Error(`Cannot finalize BillingRun ${this.id} from status ${this._status}.`);
    }

    const nonTerminal = this._operations.filter((op) => !op.isTerminal());
    if (nonTerminal.length > 0) {
      throw new Error(`Cannot finalize BillingRun ${this.id}: ${nonTerminal.length} operations are still non-terminal.`);
    }

    const now = timestamp || new Date().toISOString();
    const total = this._operations.length;
    const successes = this._operations.filter((op) => op.status === 'SUCCESS' || op.status === 'NO_CHARGES').length;
    const hasFailures = this._operations.some(
      (op) => op.status === 'FAILED' || op.status === 'CLAIM_FAILED' || op.status === 'RECOVERY_REQUIRED' || op.status === 'NOT_PROCESSED'
    );

    if (total === 0 || (successes === total && !hasFailures)) {
      this._status = 'COMPLETED';
    } else if (successes > 0 && hasFailures) {
      this._status = 'PARTIALLY_COMPLETED';
    } else {
      this._status = 'FAILED';
    }

    this._completedAt = now;
    this._updatedAt = now;
  }

  toJSON(): BillingRunProps {
    return {
      id: this.id,
      periodStart: this.periodStart,
      periodEnd: this.periodEnd,
      operatorId: this.operatorId,
      status: this._status,
      retryOfRunId: this.retryOfRunId,
      eligibilityCutoff: this._eligibilityCutoff,
      operations: this._operations.map((op) => op.toJSON()),
      notes: this._notes,
      createdAt: this.createdAt,
      confirmedAt: this._confirmedAt,
      completedAt: this._completedAt,
      stoppedAt: this._stoppedAt,
      updatedAt: this._updatedAt,
    };
  }
}
