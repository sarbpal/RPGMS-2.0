import type { ChargeType } from './BillingTypes';

/**
 * Value Object encapsulating a deterministic obligation identity.
 *
 * Rules:
 * 1. Must be stable across repeated discoveries, Billing Runs, retries, and restarts.
 * 2. Must NOT include random UUIDs, run IDs, operation IDs, or execution timestamps.
 * 3. Format: `<CHARGE_TYPE>:<STAY_ID>:<SOURCE_IDENTIFIER>`
 */
export class ObligationKey {
  readonly value: string;
  readonly chargeType: ChargeType;
  readonly stayId: string;
  readonly sourceIdentifier: string;

  private constructor(value: string, chargeType: ChargeType, stayId: string, sourceIdentifier: string) {
    this.value = value;
    this.chargeType = chargeType;
    this.stayId = stayId;
    this.sourceIdentifier = sourceIdentifier;
  }

  /**
   * Deterministically constructs an ObligationKey.
   */
  static create(chargeType: ChargeType, stayId: string, sourceIdentifier: string): ObligationKey {
    if (!chargeType || typeof chargeType !== 'string') {
      throw new Error('ObligationKey requires a valid chargeType.');
    }
    const cleanStayId = stayId?.trim();
    if (!cleanStayId) {
      throw new Error('ObligationKey requires a valid non-empty stayId.');
    }
    const cleanSourceId = sourceIdentifier?.trim();
    if (!cleanSourceId) {
      throw new Error('ObligationKey requires a valid non-empty sourceIdentifier.');
    }

    const value = `${chargeType.toUpperCase()}:${cleanStayId}:${cleanSourceId}`;
    return new ObligationKey(value, chargeType, cleanStayId, cleanSourceId);
  }

  /**
   * Parses an existing formatted key string into an ObligationKey instance.
   */
  static parse(key: string): ObligationKey {
    if (!key || typeof key !== 'string') {
      throw new Error('Invalid obligation key string.');
    }
    const parts = key.split(':');
    if (parts.length < 3) {
      throw new Error(`Invalid obligation key format: "${key}". Expected "<CHARGE_TYPE>:<STAY_ID>:<SOURCE_IDENTIFIER>".`);
    }

    const chargeType = parts[0] as ChargeType;
    const stayId = parts[1];
    const sourceIdentifier = parts.slice(2).join(':'); // Handle any colons in sourceIdentifier

    return ObligationKey.create(chargeType, stayId, sourceIdentifier);
  }

  /**
   * Deterministic helper for monthly rent cycles.
   * e.g. "RENT:STAY-101:2026-08-15"
   */
  static forRent(stayId: string, rentAnniversaryDate: string): ObligationKey {
    return ObligationKey.create('RENT', stayId, rentAnniversaryDate);
  }

  /**
   * Deterministic helper for electricity allocation participants.
   * e.g. "ELECTRICITY:STAY-101:ALLOC-PART-001"
   */
  static forElectricity(stayId: string, participantAllocationId: string): ObligationKey {
    return ObligationKey.create('ELECTRICITY', stayId, participantAllocationId);
  }

  /**
   * Deterministic helper for laundry service entries.
   * e.g. "LAUNDRY:STAY-101:LND-001"
   */
  static forLaundry(stayId: string, laundryEntryId: string): ObligationKey {
    return ObligationKey.create('LAUNDRY', stayId, laundryEntryId);
  }

  equals(other: ObligationKey | string | null | undefined): boolean {
    if (!other) return false;
    const otherValue = typeof other === 'string' ? other : other.value;
    return this.value === otherValue;
  }

  toString(): string {
    return this.value;
  }
}
