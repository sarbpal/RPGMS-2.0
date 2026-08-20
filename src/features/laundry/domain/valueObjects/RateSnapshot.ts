export interface RateSnapshotProps {
  unitRate: number;
  capturedAt: string;
  chargeMasterRateId: string;
  currency?: string;
}

/**
 * RateSnapshot is an immutable Value Object representing historical commercial pricing
 * captured at Collection Confirmation.
 *
 * Invariant: RateSnapshot is permanently frozen upon creation. Subsequent changes to
 * LaundryChargeRate in the master catalog do not alter existing transaction snapshots.
 */
export class RateSnapshot {
  public readonly unitRate: number;
  public readonly capturedAt: string;
  public readonly chargeMasterRateId: string;
  public readonly currency: string;

  constructor(props: RateSnapshotProps) {
    if (typeof props.unitRate !== 'number' || isNaN(props.unitRate) || props.unitRate < 0) {
      throw new Error('RateSnapshot unitRate must be a non-negative number.');
    }
    if (!props.capturedAt || props.capturedAt.trim() === '') {
      throw new Error('RateSnapshot capturedAt cannot be empty.');
    }
    if (!props.chargeMasterRateId || props.chargeMasterRateId.trim() === '') {
      throw new Error('RateSnapshot chargeMasterRateId cannot be empty.');
    }

    this.unitRate = props.unitRate;
    this.capturedAt = props.capturedAt;
    this.chargeMasterRateId = props.chargeMasterRateId.trim();
    this.currency = props.currency || 'INR';

    // Enforce runtime immutability
    Object.freeze(this);
  }

  public toJSON(): RateSnapshotProps {
    return {
      unitRate: this.unitRate,
      capturedAt: this.capturedAt,
      chargeMasterRateId: this.chargeMasterRateId,
      currency: this.currency,
    };
  }
}
