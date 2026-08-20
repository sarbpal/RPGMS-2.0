export interface LaundryChargeRateProps {
  id: string;
  itemId: string;
  serviceId: string;
  rate: number;
  effectiveFrom: string;
  effectiveUntil?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * LaundryChargeRate defines the commercial rate for a Laundry Item + Laundry Service combination
 * within a defined effective period.
 *
 * Invariant: Master rates represent current/future pricing configuration.
 * Historical transactions freeze rates into RateSnapshot and are not altered by subsequent rate edits.
 */
export class LaundryChargeRate {
  public readonly id: string;
  public readonly itemId: string;
  public readonly serviceId: string;
  public readonly rate: number;
  public readonly effectiveFrom: string;
  public readonly effectiveUntil?: string;
  public readonly isActive: boolean;
  public readonly createdAt: string;
  public readonly updatedAt?: string;

  constructor(props: LaundryChargeRateProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('LaundryChargeRate ID cannot be empty.');
    }
    if (!props.itemId || props.itemId.trim() === '') {
      throw new Error('LaundryChargeRate itemId cannot be empty.');
    }
    if (!props.serviceId || props.serviceId.trim() === '') {
      throw new Error('LaundryChargeRate serviceId cannot be empty.');
    }
    if (typeof props.rate !== 'number' || isNaN(props.rate) || props.rate < 0) {
      throw new Error('LaundryChargeRate rate must be a non-negative number.');
    }
    if (!props.effectiveFrom || props.effectiveFrom.trim() === '') {
      throw new Error('LaundryChargeRate effectiveFrom cannot be empty.');
    }
    if (props.effectiveUntil && props.effectiveUntil < props.effectiveFrom) {
      throw new Error(`effectiveUntil (${props.effectiveUntil}) cannot be before effectiveFrom (${props.effectiveFrom}).`);
    }
    if (!props.createdAt || props.createdAt.trim() === '') {
      throw new Error('LaundryChargeRate createdAt cannot be empty.');
    }

    this.id = props.id.trim();
    this.itemId = props.itemId.trim();
    this.serviceId = props.serviceId.trim();
    this.rate = props.rate;
    this.effectiveFrom = props.effectiveFrom;
    this.effectiveUntil = props.effectiveUntil;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Checks if this rate is active and effective for a given ISO date/timestamp string.
   */
  public isEffectiveAt(dateStr: string): boolean {
    if (!this.isActive) return false;
    const targetDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const fromDate = this.effectiveFrom.includes('T') ? this.effectiveFrom.split('T')[0] : this.effectiveFrom;
    if (targetDate < fromDate) return false;

    if (this.effectiveUntil) {
      const untilDate = this.effectiveUntil.includes('T') ? this.effectiveUntil.split('T')[0] : this.effectiveUntil;
      if (targetDate > untilDate) return false;
    }

    return true;
  }

  public toJSON(): LaundryChargeRateProps {
    return {
      id: this.id,
      itemId: this.itemId,
      serviceId: this.serviceId,
      rate: this.rate,
      effectiveFrom: this.effectiveFrom,
      effectiveUntil: this.effectiveUntil,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
