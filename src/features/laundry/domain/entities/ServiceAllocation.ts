import type { RateSnapshot } from '../valueObjects/RateSnapshot';
import { LaundryChargeRecord, type LaundryChargeRecordProps } from './LaundryChargeRecord';
import { calculateNewlyChargeableQuantity, buildBusinessChargeId } from '../rules/chargeabilityRules';

export type ServiceFulfillmentStatus = 'PENDING' | 'FULFILLED' | 'UNFULFILLED' | 'REWORK';

export interface ServiceAllocationProps {
  id: string;
  garmentLineId: string;
  serviceId: string;
  serviceName?: string;
  requestedQuantity: number;
  fulfilledQuantity?: number;
  rateSnapshot?: RateSnapshot;
  fulfillmentStatus?: ServiceFulfillmentStatus;
  charges?: (LaundryChargeRecord | LaundryChargeRecordProps)[];
  createdAt: string;
  updatedAt?: string;
}

/**
 * ServiceAllocation represents the requested operational service for a quantity of garments
 * within a GarmentLine (e.g. Wash & Fold, Ironing, Dry Cleaning).
 *
 * Invariant: ServiceAllocation is a Child Entity owned by GarmentLine.
 * Multiple ServiceAllocations on the same GarmentLine describe operations on the same physical pieces
 * and NEVER increase physical piece counts.
 * Service fulfillment and chargeability are tracked independently per ServiceAllocation.
 */
export class ServiceAllocation {
  public readonly id: string;
  public readonly garmentLineId: string;
  public readonly serviceId: string;
  public readonly serviceName?: string;
  public readonly requestedQuantity: number;
  private _fulfilledQuantity: number;
  private _rateSnapshot?: RateSnapshot;
  private _fulfillmentStatus: ServiceFulfillmentStatus;
  private _charges: LaundryChargeRecord[];
  public readonly createdAt: string;
  private _updatedAt?: string;

  constructor(props: ServiceAllocationProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('ServiceAllocation ID cannot be empty.');
    }
    if (!props.garmentLineId || props.garmentLineId.trim() === '') {
      throw new Error('ServiceAllocation garmentLineId cannot be empty.');
    }
    if (!props.serviceId || props.serviceId.trim() === '') {
      throw new Error('ServiceAllocation serviceId cannot be empty.');
    }
    if (
      typeof props.requestedQuantity !== 'number' ||
      isNaN(props.requestedQuantity) ||
      props.requestedQuantity <= 0 ||
      !Number.isInteger(props.requestedQuantity)
    ) {
      throw new Error('ServiceAllocation requestedQuantity must be a positive integer.');
    }
    if (
      props.fulfilledQuantity !== undefined &&
      (typeof props.fulfilledQuantity !== 'number' ||
        isNaN(props.fulfilledQuantity) ||
        props.fulfilledQuantity < 0 ||
        !Number.isInteger(props.fulfilledQuantity) ||
        props.fulfilledQuantity > props.requestedQuantity)
    ) {
      throw new Error(
        `ServiceAllocation fulfilledQuantity must be an integer between 0 and requestedQuantity (${props.requestedQuantity}).`
      );
    }
    if (!props.createdAt || props.createdAt.trim() === '') {
      throw new Error('ServiceAllocation createdAt cannot be empty.');
    }

    this.id = props.id.trim();
    this.garmentLineId = props.garmentLineId.trim();
    this.serviceId = props.serviceId.trim();
    this.serviceName = props.serviceName?.trim();
    this.requestedQuantity = props.requestedQuantity;
    this._fulfilledQuantity = props.fulfilledQuantity ?? 0;
    this._rateSnapshot = props.rateSnapshot;
    this._fulfillmentStatus =
      props.fulfillmentStatus ?? (this._fulfilledQuantity === this.requestedQuantity ? 'FULFILLED' : 'PENDING');
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;

    this._charges = [];
    if (props.charges && props.charges.length > 0) {
      for (const c of props.charges) {
        const record = c instanceof LaundryChargeRecord ? c : new LaundryChargeRecord(c);
        this._charges.push(record);
      }
    }
  }

  get fulfilledQuantity(): number {
    return this._fulfilledQuantity;
  }

  get rateSnapshot(): RateSnapshot | undefined {
    return this._rateSnapshot;
  }

  get fulfillmentStatus(): ServiceFulfillmentStatus {
    return this._fulfillmentStatus;
  }

  get charges(): readonly LaundryChargeRecord[] {
    return [...this._charges];
  }

  /**
   * Computed total quantity previously covered by authoritative charge records.
   */
  get previouslyChargedQuantity(): number {
    return this._charges.reduce((sum, c) => sum + c.quantity, 0);
  }

  get updatedAt(): string | undefined {
    return this._updatedAt;
  }

  /**
   * Attaches frozen commercial pricing RateSnapshot at collection confirmation.
   */
  public attachRateSnapshot(snapshot: RateSnapshot): void {
    this._rateSnapshot = snapshot;
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Records operational service fulfillment for an incremental piece quantity.
   */
  public recordFulfillment(quantityToFulfill: number, status?: ServiceFulfillmentStatus): void {
    if (
      typeof quantityToFulfill !== 'number' ||
      isNaN(quantityToFulfill) ||
      quantityToFulfill <= 0 ||
      !Number.isInteger(quantityToFulfill)
    ) {
      throw new Error('quantityToFulfill must be a positive integer.');
    }
    if (this._fulfilledQuantity + quantityToFulfill > this.requestedQuantity) {
      throw new Error(
        `Cannot fulfill ${quantityToFulfill} unit(s). Total fulfilled quantity (${this._fulfilledQuantity + quantityToFulfill}) would exceed requested quantity (${this.requestedQuantity}).`
      );
    }

    this._fulfilledQuantity += quantityToFulfill;
    if (status) {
      this._fulfillmentStatus = status;
    } else if (this._fulfilledQuantity === this.requestedQuantity) {
      this._fulfillmentStatus = 'FULFILLED';
    }
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Evaluates operational chargeability according to BR-L-012:
   * Newly Chargeable = max(0, min(Fulfilled, Delivered) - PreviouslyCharged)
   *
   * If newly chargeable quantity > 0, allocates next charge bracket and appends a LaundryChargeRecord.
   */
  public evaluateChargeability(deliveredQuantity: number, transactionId: string): LaundryChargeRecord | null {
    if (deliveredQuantity < 0) {
      throw new Error('deliveredQuantity cannot be negative.');
    }

    const newlyChargeable = calculateNewlyChargeableQuantity(
      this._fulfilledQuantity,
      deliveredQuantity,
      this.previouslyChargedQuantity
    );

    if (newlyChargeable <= 0) {
      return null;
    }

    if (!this._rateSnapshot) {
      throw new Error(
        `Cannot generate LaundryChargeRecord for service (${this.serviceId}) without a valid RateSnapshot.`
      );
    }

    const nextBracketIndex = this._charges.length + 1;
    const businessChargeId = buildBusinessChargeId(
      transactionId,
      this.garmentLineId,
      this.serviceId,
      nextBracketIndex
    );
    const unitRate = this._rateSnapshot.unitRate;
    const totalAmount = Number((newlyChargeable * unitRate).toFixed(2));
    const now = new Date().toISOString();

    const chargeRecord = new LaundryChargeRecord({
      businessChargeId,
      transactionId,
      garmentLineId: this.garmentLineId,
      serviceId: this.serviceId,
      bracketIndex: nextBracketIndex,
      quantity: newlyChargeable,
      unitRate,
      totalAmount,
      currency: this._rateSnapshot.currency,
      calculatedAt: now,
    });

    this._charges.push(chargeRecord);
    this._updatedAt = now;

    return chargeRecord;
  }

  public toJSON(): ServiceAllocationProps {
    return {
      id: this.id,
      garmentLineId: this.garmentLineId,
      serviceId: this.serviceId,
      serviceName: this.serviceName,
      requestedQuantity: this.requestedQuantity,
      fulfilledQuantity: this._fulfilledQuantity,
      rateSnapshot: this._rateSnapshot,
      fulfillmentStatus: this._fulfillmentStatus,
      charges: this._charges.map((c) => c.toJSON()),
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
