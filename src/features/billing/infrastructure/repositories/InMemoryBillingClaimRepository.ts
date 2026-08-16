import type {
  BillingClaimRepository,
  TryAcquireClaimParams,
  TryAcquireClaimResult,
} from '../../domain/interfaces/BillingClaimRepository';
import { BillingClaim } from '../../domain/entities/BillingClaim';

/**
 * In-memory implementation of BillingClaimRepository for MVP.
 * Enforces atomic check-and-set semantics for obligation claims at the repository boundary.
 */
export class InMemoryBillingClaimRepository implements BillingClaimRepository {
  private claims: Map<string, BillingClaim> = new Map(); // claimId -> BillingClaim
  private obligationToClaimMap: Map<string, string> = new Map(); // obligationKey -> claimId

  /**
   * Authoritative atomic check-and-set claim acquisition.
   * Executed as one synchronous atomic operation over internal in-memory maps.
   */
  async tryAcquireClaim(params: TryAcquireClaimParams): Promise<TryAcquireClaimResult> {
    const existingClaimId = this.obligationToClaimMap.get(params.obligationKey);
    const existingClaim = existingClaimId ? this.claims.get(existingClaimId) || null : null;

    // 1. If existing claim is already committed in Finance -> Hard block
    if (existingClaim && existingClaim.status === 'CLAIM_COMMITTED') {
      return {
        success: false,
        claim: existingClaim,
        reason: 'OBLIGATION_ALREADY_COMMITTED_IN_FINANCE',
      };
    }

    // 2. If existing claim is actively acquired:
    if (existingClaim && existingClaim.status === 'CLAIM_ACQUIRED') {
      // Idempotency: same operation asking again
      if (
        existingClaim.billingRunId === params.billingRunId &&
        existingClaim.billingOperationId === params.billingOperationId
      ) {
        return {
          success: true,
          claim: existingClaim,
          isIdempotent: true,
        };
      }

      // Concurrency conflict: competing operation/run attempting to claim
      return {
        success: false,
        claim: existingClaim,
        reason: 'OBLIGATION_CLAIMED_BY_COMPETING_OPERATION',
      };
    }

    // 3. Either no claim exists OR prior claim was RELEASED (retryable)
    const isReacquired = existingClaim?.status === 'CLAIM_RELEASED';
    const claimId = `CLM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newClaim = new BillingClaim({
      id: claimId,
      obligationKey: params.obligationKey,
      stayId: params.stayId,
      billingRunId: params.billingRunId,
      billingOperationId: params.billingOperationId,
      amount: params.amount,
      status: 'CLAIM_ACQUIRED',
      claimedAt: params.claimedAt || new Date().toISOString(),
    });

    // Atomic insertion into both indices
    this.claims.set(newClaim.id, newClaim);
    this.obligationToClaimMap.set(newClaim.obligationKey, newClaim.id);

    return {
      success: true,
      claim: newClaim,
      isNew: !isReacquired,
      isReacquired,
    };
  }

  async saveClaim(claim: BillingClaim): Promise<void> {
    this.claims.set(claim.id, claim);
    this.obligationToClaimMap.set(claim.obligationKey, claim.id);
  }

  async getClaimByObligationKey(obligationKey: string): Promise<BillingClaim | null> {
    const claimId = this.obligationToClaimMap.get(obligationKey);
    if (!claimId) return null;
    return this.claims.get(claimId) || null;
  }

  async getClaimsByRunId(billingRunId: string): Promise<BillingClaim[]> {
    return Array.from(this.claims.values()).filter((c) => c.billingRunId === billingRunId);
  }

  async getClaimsByOperationId(billingOperationId: string): Promise<BillingClaim[]> {
    return Array.from(this.claims.values()).filter((c) => c.billingOperationId === billingOperationId);
  }

  async hasActiveClaim(obligationKey: string): Promise<boolean> {
    const claim = await this.getClaimByObligationKey(obligationKey);
    return claim ? claim.isActive() : false;
  }

  async listAllClaims(): Promise<BillingClaim[]> {
    return Array.from(this.claims.values());
  }

  /**
   * Test helper to clear repository state
   */
  clear(): void {
    this.claims.clear();
    this.obligationToClaimMap.clear();
  }
}

export const defaultBillingClaimRepository = new InMemoryBillingClaimRepository();
