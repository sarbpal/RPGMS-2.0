import type { BillingClaim } from '../entities/BillingClaim';

export interface TryAcquireClaimParams {
  readonly obligationKey: string;
  readonly stayId: string;
  readonly billingRunId: string;
  readonly billingOperationId: string;
  readonly amount: number;
  readonly claimedAt?: string;
}

export type TryAcquireClaimResult =
  | {
      readonly success: true;
      readonly claim: BillingClaim;
      readonly isNew?: boolean;
      readonly isIdempotent?: boolean;
      readonly isReacquired?: boolean;
    }
  | {
      readonly success: false;
      readonly claim: BillingClaim;
      readonly reason:
        | 'OBLIGATION_CLAIMED_BY_COMPETING_OPERATION'
        | 'OBLIGATION_ALREADY_COMMITTED_IN_FINANCE';
    };

export interface BillingClaimRepository {
  /**
   * Authoritative atomic check-and-set operation.
   * Enforces FIRST CLAIM WINS and guarantees that two operations cannot simultaneously acquire an active claim.
   */
  tryAcquireClaim(params: TryAcquireClaimParams): Promise<TryAcquireClaimResult>;

  saveClaim(claim: BillingClaim): Promise<void>;
  getClaimByObligationKey(obligationKey: string): Promise<BillingClaim | null>;
  getClaimsByRunId(billingRunId: string): Promise<BillingClaim[]>;
  getClaimsByOperationId(billingOperationId: string): Promise<BillingClaim[]>;
  hasActiveClaim(obligationKey: string): Promise<boolean>;
  listAllClaims(): Promise<BillingClaim[]>;
}
