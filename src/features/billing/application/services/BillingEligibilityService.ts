import type { BillingClaimRepository } from '../../domain/interfaces/BillingClaimRepository';
import type { DiscoveredObligation } from '../../domain/valueObjects/DiscoveredObligation';
import type {
  ObligationEligibility,
  BillingEligibilitySummary,
} from '../../domain/valueObjects/EligibilityResult';

/**
 * Application Service that evaluates discovered obligations for claim eligibility.
 * Distinguishes uncommitted, committed, already-claimed, re-acquirable, and invalid obligations.
 */
export class BillingEligibilityService {
  private readonly claimRepository: BillingClaimRepository;

  constructor(claimRepository: BillingClaimRepository) {
    this.claimRepository = claimRepository;
  }

  /**
   * Evaluates a single DiscoveredObligation for claim eligibility.
   */
  async evaluateObligation(
    obligation: DiscoveredObligation,
    requestingRunId?: string,
    requestingOperationId?: string
  ): Promise<ObligationEligibility> {
    // 1. Basic field and amount validity check
    if (obligation.amount <= 0 || isNaN(obligation.amount)) {
      return {
        obligation,
        category: 'INELIGIBLE_INVALID',
        isClaimable: false,
        reason: 'Obligation amount must be strictly greater than zero.',
      };
    }

    // 2. Source-domain committed check (e.g. Confirmed Electricity allocation)
    if (obligation.isCommitted()) {
      return {
        obligation,
        category: 'COMMITTED_BY_SOURCE_DOMAIN',
        isClaimable: false,
        reason: 'Obligation has already been financially committed by its source domain.',
      };
    }

    // 3. Evaluate against active claims in repository
    const claim = await this.claimRepository.getClaimByObligationKey(obligation.obligationKey);

    if (!claim) {
      return {
        obligation,
        category: 'ELIGIBLE_FOR_CLAIM',
        isClaimable: true,
      };
    }

    if (claim.status === 'CLAIM_RELEASED') {
      return {
        obligation,
        category: 'REACQUIRABLE_RELEASED',
        isClaimable: true,
        activeClaim: claim,
      };
    }

    if (claim.status === 'CLAIM_COMMITTED') {
      return {
        obligation,
        category: 'COMMITTED_BY_SOURCE_DOMAIN',
        isClaimable: false,
        reason: `Obligation committed in Finance (Bill: ${claim.financialReferenceId || 'N/A'}).`,
        activeClaim: claim,
      };
    }

    if (claim.status === 'CLAIM_ACQUIRED') {
      if (
        requestingRunId &&
        requestingOperationId &&
        claim.billingRunId === requestingRunId &&
        claim.billingOperationId === requestingOperationId
      ) {
        return {
          obligation,
          category: 'IDEMPOTENT_ACTIVE_CLAIM',
          isClaimable: true,
          activeClaim: claim,
        };
      }

      return {
        obligation,
        category: 'ALREADY_CLAIMED_BY_OTHER',
        isClaimable: false,
        reason: `Obligation actively claimed by Run ${claim.billingRunId} (Operation ${claim.billingOperationId}).`,
        activeClaim: claim,
      };
    }

    return {
      obligation,
      category: 'INELIGIBLE_INVALID',
      isClaimable: false,
      reason: 'Unknown claim status.',
    };
  }

  /**
   * Evaluates a collection of discovered obligations and compiles an eligibility summary.
   */
  async evaluateBatch(
    obligations: DiscoveredObligation[],
    requestingRunId?: string,
    requestingOperationId?: string
  ): Promise<BillingEligibilitySummary> {
    const items: ObligationEligibility[] = [];
    let eligibleCount = 0;
    let eligibleAmount = 0;
    let committedCount = 0;
    let committedAmount = 0;
    let claimedCount = 0;
    let claimedAmount = 0;
    let ineligibleCount = 0;

    for (const obligation of obligations) {
      const item = await this.evaluateObligation(obligation, requestingRunId, requestingOperationId);
      items.push(item);

      switch (item.category) {
        case 'ELIGIBLE_FOR_CLAIM':
        case 'REACQUIRABLE_RELEASED':
        case 'IDEMPOTENT_ACTIVE_CLAIM':
          eligibleCount++;
          eligibleAmount += obligation.amount;
          break;
        case 'COMMITTED_BY_SOURCE_DOMAIN':
          committedCount++;
          committedAmount += obligation.amount;
          break;
        case 'ALREADY_CLAIMED_BY_OTHER':
          claimedCount++;
          claimedAmount += obligation.amount;
          break;
        case 'INELIGIBLE_INVALID':
          ineligibleCount++;
          break;
      }
    }

    return {
      totalDiscovered: obligations.length,
      eligibleCount,
      eligibleAmount: Number(eligibleAmount.toFixed(2)),
      committedCount,
      committedAmount: Number(committedAmount.toFixed(2)),
      claimedCount,
      claimedAmount: Number(claimedAmount.toFixed(2)),
      ineligibleCount,
      items,
    };
  }
}
