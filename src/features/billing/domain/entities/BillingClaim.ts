import type { BillingClaimStatus } from '../valueObjects/BillingTypes';

export interface BillingClaimProps {
  id: string;
  obligationKey: string;
  stayId: string;
  billingRunId: string;
  billingOperationId: string;
  amount: number;
  status?: BillingClaimStatus;
  claimedAt?: string;
  committedAt?: string;
  releasedAt?: string;
  releaseReason?: string;
  financialReferenceId?: string;
}

/**
 * Aggregate Root / Entity representing an authoritative operational lock over an obligation.
 *
 * First-Claim-Wins Invariant:
 * - A BillingClaim exclusively reserves an obligation for a specific BillingOperation.
 * - An active claim prevents all competing Billing Runs from claiming or posting the obligation.
 */
export class BillingClaim {
  readonly id: string;
  readonly obligationKey: string;
  readonly stayId: string;
  readonly billingRunId: string;
  readonly billingOperationId: string;
  readonly amount: number;
  private _status: BillingClaimStatus;
  readonly claimedAt: string;
  private _committedAt?: string;
  private _releasedAt?: string;
  private _releaseReason?: string;
  private _financialReferenceId?: string;

  constructor(props: BillingClaimProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('BillingClaim requires a valid id.');
    }
    if (!props.obligationKey || props.obligationKey.trim() === '') {
      throw new Error('BillingClaim requires a valid obligationKey.');
    }
    if (!props.stayId || props.stayId.trim() === '') {
      throw new Error('BillingClaim requires a valid stayId.');
    }
    if (!props.billingRunId || props.billingRunId.trim() === '') {
      throw new Error('BillingClaim requires a valid billingRunId.');
    }
    if (!props.billingOperationId || props.billingOperationId.trim() === '') {
      throw new Error('BillingClaim requires a valid billingOperationId.');
    }
    if (typeof props.amount !== 'number' || isNaN(props.amount) || props.amount <= 0) {
      throw new Error('BillingClaim amount must be a positive number greater than zero.');
    }

    this.id = props.id;
    this.obligationKey = props.obligationKey;
    this.stayId = props.stayId;
    this.billingRunId = props.billingRunId;
    this.billingOperationId = props.billingOperationId;
    this.amount = Number(props.amount.toFixed(2));
    this._status = props.status || 'CLAIM_ACQUIRED';
    this.claimedAt = props.claimedAt || new Date().toISOString();
    this._committedAt = props.committedAt;
    this._releasedAt = props.releasedAt;
    this._releaseReason = props.releaseReason;
    this._financialReferenceId = props.financialReferenceId;
  }

  get status(): BillingClaimStatus {
    return this._status;
  }

  get committedAt(): string | undefined {
    return this._committedAt;
  }

  get releasedAt(): string | undefined {
    return this._releasedAt;
  }

  get releaseReason(): string | undefined {
    return this._releaseReason;
  }

  get financialReferenceId(): string | undefined {
    return this._financialReferenceId;
  }

  /**
   * Returns true if the claim is currently active (either acquired or committed).
   * Active claims block competing runs from acquiring new claims on the same obligation.
   */
  isActive(): boolean {
    return this._status === 'CLAIM_ACQUIRED' || this._status === 'CLAIM_COMMITTED';
  }

  /**
   * Transitions the claim to CLAIM_COMMITTED upon successful Finance Bill/Ledger creation.
   */
  commitClaim(financialReferenceId: string, timestamp?: string): void {
    if (!financialReferenceId || financialReferenceId.trim() === '') {
      throw new Error('commitClaim requires a valid financialReferenceId (e.g. Finance Bill ID).');
    }

    if (this._status === 'CLAIM_COMMITTED') {
      // Idempotent confirmation if referencing same bill
      if (this._financialReferenceId === financialReferenceId) {
        return;
      }
      throw new Error(`BillingClaim ${this.id} is already committed with financialReferenceId ${this._financialReferenceId}.`);
    }

    if (this._status === 'CLAIM_RELEASED') {
      throw new Error(`Cannot commit released BillingClaim ${this.id}.`);
    }

    this._status = 'CLAIM_COMMITTED';
    this._financialReferenceId = financialReferenceId;
    this._committedAt = timestamp || new Date().toISOString();
  }

  /**
   * Releases an acquired claim if the operation failed without financial commitment,
   * returning the obligation to future eligibility pools.
   */
  releaseClaim(reason: string, timestamp?: string): void {
    if (!reason || reason.trim() === '') {
      throw new Error('releaseClaim requires a non-empty reason.');
    }

    if (this._status === 'CLAIM_COMMITTED') {
      throw new Error(`Cannot release committed financial BillingClaim ${this.id}.`);
    }

    if (this._status === 'CLAIM_RELEASED') {
      return; // Already released
    }

    this._status = 'CLAIM_RELEASED';
    this._releaseReason = reason;
    this._releasedAt = timestamp || new Date().toISOString();
  }

  toJSON(): BillingClaimProps {
    return {
      id: this.id,
      obligationKey: this.obligationKey,
      stayId: this.stayId,
      billingRunId: this.billingRunId,
      billingOperationId: this.billingOperationId,
      amount: this.amount,
      status: this._status,
      claimedAt: this.claimedAt,
      committedAt: this._committedAt,
      releasedAt: this._releasedAt,
      releaseReason: this._releaseReason,
      financialReferenceId: this._financialReferenceId,
    };
  }
}
