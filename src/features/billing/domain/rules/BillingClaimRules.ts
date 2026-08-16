import type { DiscoveredObligation } from '../valueObjects/DiscoveredObligation';
import type { BillingClaim } from '../entities/BillingClaim';

export interface ClaimValidationResult {
  readonly canAcquire: boolean;
  readonly reason?:
    | 'CANNOT_CLAIM_COMMITTED_OBLIGATION'
    | 'OBLIGATION_ALREADY_COMMITTED_IN_FINANCE'
    | 'OBLIGATION_CLAIMED_BY_COMPETING_OPERATION'
    | 'INVALID_OBLIGATION_AMOUNT';
  readonly isNew?: boolean;
  readonly isIdempotent?: boolean;
  readonly isReacquired?: boolean;
  readonly existingClaim?: BillingClaim;
}

export interface ObligationClaimabilityResult {
  readonly canClaim: boolean;
  readonly reason?: 'CANNOT_CLAIM_COMMITTED_OBLIGATION' | 'INVALID_OBLIGATION_AMOUNT';
}

/**
 * Domain rules enforcing the FIRST CLAIM WINS concurrency and idempotency invariants.
 */
export class BillingClaimRules {
  /**
   * Pre-flight check on obligation eligibility before attempting claim acquisition.
   */
  static validateObligationClaimability(obligation: DiscoveredObligation): ObligationClaimabilityResult {
    if (obligation.isCommitted()) {
      return {
        canClaim: false,
        reason: 'CANNOT_CLAIM_COMMITTED_OBLIGATION',
      };
    }
    if (obligation.amount <= 0) {
      return {
        canClaim: false,
        reason: 'INVALID_OBLIGATION_AMOUNT',
      };
    }
    return { canClaim: true };
  }

  /**
   * Validates whether a DiscoveredObligation can be claimed by a BillingOperation.
   */
  static validateClaimAcquisition(
    obligation: DiscoveredObligation,
    existingClaim: BillingClaim | null,
    requestingRunId: string,
    requestingOperationId: string
  ): ClaimValidationResult {
    // Invariant 1: COMMITTED obligations can never enter Billing Claim processing
    if (obligation.isCommitted()) {
      return {
        canAcquire: false,
        reason: 'CANNOT_CLAIM_COMMITTED_OBLIGATION',
      };
    }

    // Invariant 2: Obligation amount must be strictly positive
    if (obligation.amount <= 0) {
      return {
        canAcquire: false,
        reason: 'INVALID_OBLIGATION_AMOUNT',
      };
    }

    // Invariant 3: No existing claim -> Fresh claim acquisition
    if (!existingClaim) {
      return {
        canAcquire: true,
        isNew: true,
      };
    }

    // Invariant 4: Existing claim was released (prior failed attempt without financial commit) -> Can reacquire
    if (existingClaim.status === 'CLAIM_RELEASED') {
      return {
        canAcquire: true,
        isReacquired: true,
        existingClaim,
      };
    }

    // Invariant 5: Existing claim is already financially committed -> Block permanently
    if (existingClaim.status === 'CLAIM_COMMITTED') {
      return {
        canAcquire: false,
        reason: 'OBLIGATION_ALREADY_COMMITTED_IN_FINANCE',
        existingClaim,
      };
    }

    // Invariant 6: Existing claim is acquired by the exact same operation -> Idempotent success
    if (
      existingClaim.status === 'CLAIM_ACQUIRED' &&
      existingClaim.billingRunId === requestingRunId &&
      existingClaim.billingOperationId === requestingOperationId
    ) {
      return {
        canAcquire: true,
        isIdempotent: true,
        existingClaim,
      };
    }

    // Invariant 7: Existing claim is active and owned by another operation/run -> First Claim Wins, reject
    return {
      canAcquire: false,
      reason: 'OBLIGATION_CLAIMED_BY_COMPETING_OPERATION',
      existingClaim,
    };
  }
}
