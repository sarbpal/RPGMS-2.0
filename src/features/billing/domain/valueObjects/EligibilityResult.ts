import type { DiscoveredObligation } from './DiscoveredObligation';
import type { BillingClaim } from '../entities/BillingClaim';

export type EligibilityCategory =
  | 'ELIGIBLE_FOR_CLAIM'
  | 'COMMITTED_BY_SOURCE_DOMAIN'
  | 'ALREADY_CLAIMED_BY_OTHER'
  | 'IDEMPOTENT_ACTIVE_CLAIM'
  | 'REACQUIRABLE_RELEASED'
  | 'INELIGIBLE_INVALID';

export interface ObligationEligibility {
  readonly obligation: DiscoveredObligation;
  readonly category: EligibilityCategory;
  readonly isClaimable: boolean;
  readonly reason?: string;
  readonly activeClaim?: BillingClaim;
}

export interface BillingEligibilitySummary {
  readonly totalDiscovered: number;
  readonly eligibleCount: number;
  readonly eligibleAmount: number;
  readonly committedCount: number;
  readonly committedAmount: number;
  readonly claimedCount: number;
  readonly claimedAmount: number;
  readonly ineligibleCount: number;
  readonly items: readonly ObligationEligibility[];
}
