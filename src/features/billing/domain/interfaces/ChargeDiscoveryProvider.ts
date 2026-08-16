import type { ChargeType } from '../valueObjects/BillingTypes';
import type { DiscoveredObligation } from '../valueObjects/DiscoveredObligation';

/**
 * Generic Discovery Provider Contract (Architecture Section 10).
 * Source-domain adapters implement this interface to normalize and present domain obligations.
 */
export interface ChargeDiscoveryProvider {
  readonly providerKey: string;
  readonly chargeType: ChargeType;

  /**
   * Discovers all obligations within the date range for specified Stays.
   * If stayIds is omitted, empty, or undefined, discovers obligations property-wide across all candidate Stays.
   *
   * @param stayIds Target Stays to evaluate (optional; empty or omitted indicates property-wide)
   * @param periodStart Selected billing period start date (YYYY-MM-DD)
   * @param periodEnd Selected billing period end date (YYYY-MM-DD)
   * @param cutoffTimestamp Authoritative eligibility cutoff timestamp (ISO)
   */
  discoverObligations(
    stayIds: string[] | undefined,
    periodStart: string,
    periodEnd: string,
    cutoffTimestamp: string
  ): Promise<DiscoveredObligation[]>;
}
