import type { DiscoveredObligation } from '../valueObjects/DiscoveredObligation';

export interface MaterialChangeCheckResult {
  readonly hasMaterialChanges: boolean;
  readonly deltaDetails: string[];
}

/**
 * Domain rule detecting material financial and scope changes between
 * a Billing Preview snapshot and authoritative revalidation at Eligibility Cutoff.
 *
 * Rules:
 * - Any Stay added or removed is a material change.
 * - Any Obligation added or removed is a material change.
 * - Any monetary amount change > ₹0.00 is a material change.
 * - Any commitment status transition (e.g. UNCOMMITTED -> COMMITTED) is a material change.
 */
export class MaterialChangeRules {
  static detectMaterialChanges(
    previewObligations: readonly DiscoveredObligation[],
    revalidatedObligations: readonly DiscoveredObligation[]
  ): MaterialChangeCheckResult {
    const deltaDetails: string[] = [];

    const previewMap = new Map<string, DiscoveredObligation>();
    for (const ob of previewObligations) {
      previewMap.set(ob.obligationKey, ob);
    }

    const revalMap = new Map<string, DiscoveredObligation>();
    for (const ob of revalidatedObligations) {
      revalMap.set(ob.obligationKey, ob);
    }

    // 1. Obligations removed
    for (const [key, prevOb] of previewMap) {
      if (!revalMap.has(key)) {
        deltaDetails.push(`Obligation removed: ${key} (${prevOb.description}, amount: ₹${prevOb.amount})`);
      }
    }

    // 2. Obligations added
    for (const [key, revalOb] of revalMap) {
      if (!previewMap.has(key)) {
        deltaDetails.push(`Obligation added: ${key} (${revalOb.description}, amount: ₹${revalOb.amount})`);
      }
    }

    // 3. Amount or Commitment status changes
    for (const [key, prevOb] of previewMap) {
      const revalOb = revalMap.get(key);
      if (revalOb) {
        if (prevOb.amount !== revalOb.amount) {
          deltaDetails.push(`Amount changed for ${key}: ₹${prevOb.amount} -> ₹${revalOb.amount}`);
        }
        if (prevOb.commitmentStatus !== revalOb.commitmentStatus) {
          deltaDetails.push(
            `Commitment status changed for ${key}: ${prevOb.commitmentStatus} -> ${revalOb.commitmentStatus}`
          );
        }
      }
    }

    return {
      hasMaterialChanges: deltaDetails.length > 0,
      deltaDetails,
    };
  }
}
