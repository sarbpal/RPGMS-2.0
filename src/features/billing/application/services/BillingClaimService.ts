import type { BillingClaimRepository } from '../../domain/interfaces/BillingClaimRepository';
import type { BillingClaim } from '../../domain/entities/BillingClaim';
import type { DiscoveredObligation } from '../../domain/valueObjects/DiscoveredObligation';
import { BillingClaimRules } from '../../domain/rules/BillingClaimRules';

export interface ClaimAcquisitionResult {
  readonly success: boolean;
  readonly claim?: BillingClaim;
  readonly reason?: string;
  readonly isIdempotent?: boolean;
  readonly isReacquired?: boolean;
}

export interface BatchClaimResult {
  readonly successfulClaims: BillingClaim[];
  readonly failedObligations: Array<{
    readonly obligation: DiscoveredObligation;
    readonly reason: string;
    readonly existingClaim?: BillingClaim;
  }>;
}

/**
 * Application Service orchestrating claim workflows.
 * Enforces pre-flight obligation validation and delegates atomic check-and-set claim acquisition
 * to the repository boundary.
 */
export class BillingClaimService {
  private readonly claimRepository: BillingClaimRepository;

  constructor(claimRepository: BillingClaimRepository) {
    this.claimRepository = claimRepository;
  }

  /**
   * Attempts to acquire an exclusive claim on an uncommitted obligation for a BillingOperation.
   * Atomic decision is executed at the repository acquisition boundary.
   */
  async acquireClaim(
    billingRunId: string,
    billingOperationId: string,
    obligation: DiscoveredObligation
  ): Promise<ClaimAcquisitionResult> {
    // 1. Pre-flight domain obligation validation (COMMITTED and non-positive amount rejection)
    const preflight = BillingClaimRules.validateObligationClaimability(obligation);
    if (!preflight.canClaim) {
      return {
        success: false,
        reason: preflight.reason,
      };
    }

    // 2. Delegate authoritative atomic check-and-set to the repository boundary
    const repoResult = await this.claimRepository.tryAcquireClaim({
      obligationKey: obligation.obligationKey,
      stayId: obligation.stayId,
      billingRunId,
      billingOperationId,
      amount: obligation.amount,
    });

    if (!repoResult.success) {
      return {
        success: false,
        claim: repoResult.claim,
        reason: repoResult.reason,
      };
    }

    return {
      success: true,
      claim: repoResult.claim,
      isIdempotent: repoResult.isIdempotent,
      isReacquired: repoResult.isReacquired,
    };
  }

  /**
   * Evaluates and acquires claims for a batch of discovered obligations.
   */
  async acquireBatchClaims(
    billingRunId: string,
    billingOperationId: string,
    obligations: DiscoveredObligation[]
  ): Promise<BatchClaimResult> {
    const successfulClaims: BillingClaim[] = [];
    const failedObligations: Array<{
      obligation: DiscoveredObligation;
      reason: string;
      existingClaim?: BillingClaim;
    }> = [];

    for (const obligation of obligations) {
      const result = await this.acquireClaim(billingRunId, billingOperationId, obligation);
      if (result.success && result.claim) {
        successfulClaims.push(result.claim);
      } else {
        failedObligations.push({
          obligation,
          reason: result.reason || 'UNKNOWN_CLAIM_FAILURE',
          existingClaim: result.claim,
        });
      }
    }

    return {
      successfulClaims,
      failedObligations,
    };
  }

  /**
   * Marks a claim as committed with its authoritative financial reference (e.g. Finance Bill ID).
   */
  async commitClaim(claimId: string, financialReferenceId: string): Promise<BillingClaim> {
    const claims = await this.claimRepository.listAllClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) {
      throw new Error(`BillingClaim ${claimId} not found.`);
    }

    claim.commitClaim(financialReferenceId);
    await this.claimRepository.saveClaim(claim);
    return claim;
  }

  /**
   * Releases an acquired claim upon a known non-financial processing failure.
   */
  async releaseClaim(claimId: string, reason: string): Promise<BillingClaim> {
    const claims = await this.claimRepository.listAllClaims();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim) {
      throw new Error(`BillingClaim ${claimId} not found.`);
    }

    claim.releaseClaim(reason);
    await this.claimRepository.saveClaim(claim);
    return claim;
  }

  /**
   * Retrieves active claim for an obligation key if present.
   */
  async getClaimByObligationKey(obligationKey: string): Promise<BillingClaim | null> {
    return this.claimRepository.getClaimByObligationKey(obligationKey);
  }
}
