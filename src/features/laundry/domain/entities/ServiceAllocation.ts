import type { RateSnapshot } from '../valueObjects/RateSnapshot';

export type ServiceFulfillmentStatus = 'PENDING' | 'FULFILLED' | 'UNFULFILLED' | 'REWORK';

export interface ServiceAllocationProps {
  id: string;
  garmentLineId: string;
  serviceId: string;
  serviceName?: string;
  requestedQuantity: number;
  rateSnapshot?: RateSnapshot;
  fulfillmentStatus?: ServiceFulfillmentStatus;
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
 */
export class ServiceAllocation {
  public readonly id: string;
  public readonly garmentLineId: string;
  public readonly serviceId: string;
  public readonly serviceName?: string;
  public readonly requestedQuantity: number;
  private _rateSnapshot?: RateSnapshot;
  private _fulfillmentStatus: ServiceFulfillmentStatus;
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
    if (!props.createdAt || props.createdAt.trim() === '') {
      throw new Error('ServiceAllocation createdAt cannot be empty.');
    }

    this.id = props.id.trim();
    this.garmentLineId = props.garmentLineId.trim();
    this.serviceId = props.serviceId.trim();
    this.serviceName = props.serviceName?.trim();
    this.requestedQuantity = props.requestedQuantity;
    this._rateSnapshot = props.rateSnapshot;
    this._fulfillmentStatus = props.fulfillmentStatus ?? 'PENDING';
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  get rateSnapshot(): RateSnapshot | undefined {
    return this._rateSnapshot;
  }

  get fulfillmentStatus(): ServiceFulfillmentStatus {
    return this._fulfillmentStatus;
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

  public toJSON(): ServiceAllocationProps {
    return {
      id: this.id,
      garmentLineId: this.garmentLineId,
      serviceId: this.serviceId,
      serviceName: this.serviceName,
      requestedQuantity: this.requestedQuantity,
      rateSnapshot: this._rateSnapshot,
      fulfillmentStatus: this._fulfillmentStatus,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
