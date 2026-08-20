import { ServiceAllocation, type ServiceAllocationProps } from './ServiceAllocation';
import type { LaundryChargeRecord } from './LaundryChargeRecord';

export interface GarmentLineProps {
  id: string;
  transactionId: string;
  itemId: string;
  itemName?: string;
  physicalQuantity: number;
  deliveredQuantity?: number;
  serviceAllocations?: (ServiceAllocation | ServiceAllocationProps)[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * GarmentLine represents a physical piece quantity of a recognized Laundry Item
 * with uniform requested services within a Laundry Transaction.
 *
 * Invariant: Physical pieces are counted once. Multiple requested services on this line
 * are tracked via child ServiceAllocations and do not multiply physical piece count.
 */
export class GarmentLine {
  public readonly id: string;
  public readonly transactionId: string;
  public readonly itemId: string;
  public readonly itemName?: string;
  public readonly physicalQuantity: number;
  private _deliveredQuantity: number;
  private _serviceAllocations: ServiceAllocation[];
  public readonly notes?: string;
  public readonly createdAt: string;
  private _updatedAt?: string;

  constructor(props: GarmentLineProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('GarmentLine ID cannot be empty.');
    }
    if (!props.transactionId || props.transactionId.trim() === '') {
      throw new Error('GarmentLine transactionId cannot be empty.');
    }
    if (!props.itemId || props.itemId.trim() === '') {
      throw new Error('GarmentLine itemId cannot be empty.');
    }
    if (
      typeof props.physicalQuantity !== 'number' ||
      isNaN(props.physicalQuantity) ||
      props.physicalQuantity <= 0 ||
      !Number.isInteger(props.physicalQuantity)
    ) {
      throw new Error('GarmentLine physicalQuantity must be a positive integer.');
    }
    if (
      props.deliveredQuantity !== undefined &&
      (typeof props.deliveredQuantity !== 'number' ||
        isNaN(props.deliveredQuantity) ||
        props.deliveredQuantity < 0 ||
        !Number.isInteger(props.deliveredQuantity) ||
        props.deliveredQuantity > props.physicalQuantity)
    ) {
      throw new Error(
        `GarmentLine deliveredQuantity must be an integer between 0 and physicalQuantity (${props.physicalQuantity}).`
      );
    }
    if (!props.createdAt || props.createdAt.trim() === '') {
      throw new Error('GarmentLine createdAt cannot be empty.');
    }

    this.id = props.id.trim();
    this.transactionId = props.transactionId.trim();
    this.itemId = props.itemId.trim();
    this.itemName = props.itemName?.trim();
    this.physicalQuantity = props.physicalQuantity;
    this._deliveredQuantity = props.deliveredQuantity ?? 0;
    this.notes = props.notes?.trim();
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;

    this._serviceAllocations = [];
    if (props.serviceAllocations && props.serviceAllocations.length > 0) {
      for (const sa of props.serviceAllocations) {
        const allocation = sa instanceof ServiceAllocation ? sa : new ServiceAllocation(sa);
        this.addServiceAllocation(allocation);
      }
    }
  }

  get deliveredQuantity(): number {
    return this._deliveredQuantity;
  }

  get serviceAllocations(): readonly ServiceAllocation[] {
    return [...this._serviceAllocations];
  }

  get updatedAt(): string | undefined {
    return this._updatedAt;
  }

  /**
   * Adds a ServiceAllocation child entity to this GarmentLine.
   * Enforces that service quantity does not exceed physical garment quantity
   * and prevents duplicate service allocations for the same service.
   */
  public addServiceAllocation(allocation: ServiceAllocation): void {
    if (allocation.garmentLineId !== this.id) {
      throw new Error(
        `ServiceAllocation (${allocation.id}) garmentLineId (${allocation.garmentLineId}) does not match GarmentLine ID (${this.id}).`
      );
    }
    if (allocation.requestedQuantity > this.physicalQuantity) {
      throw new Error(
        `ServiceAllocation requestedQuantity (${allocation.requestedQuantity}) cannot exceed GarmentLine physicalQuantity (${this.physicalQuantity}).`
      );
    }
    const duplicate = this._serviceAllocations.find((sa) => sa.serviceId === allocation.serviceId);
    if (duplicate) {
      throw new Error(
        `Duplicate service allocation for service (${allocation.serviceId}) on GarmentLine (${this.id}).`
      );
    }
    this._serviceAllocations.push(allocation);
    this._updatedAt = new Date().toISOString();
  }

  public removeServiceAllocation(serviceId: string): void {
    const idx = this._serviceAllocations.findIndex((sa) => sa.serviceId === serviceId);
    if (idx >= 0) {
      this._serviceAllocations.splice(idx, 1);
      this._updatedAt = new Date().toISOString();
    }
  }

  public getServiceAllocation(serviceId: string): ServiceAllocation | undefined {
    return this._serviceAllocations.find((sa) => sa.serviceId === serviceId);
  }

  /**
   * Records incremental delivery quantity for physical pieces on this line.
   */
  public recordDeliveryQuantity(quantity: number): void {
    if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Delivered quantity must be a positive integer.');
    }
    if (this._deliveredQuantity + quantity > this.physicalQuantity) {
      throw new Error(
        `Cannot deliver ${quantity} piece(s). Total delivered quantity (${this._deliveredQuantity + quantity}) would exceed physical quantity (${this.physicalQuantity}).`
      );
    }
    this._deliveredQuantity += quantity;
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Evaluates BR-L-012 chargeability across all service allocations for this GarmentLine.
   */
  public evaluateChargeability(transactionId: string): LaundryChargeRecord[] {
    const generatedCharges: LaundryChargeRecord[] = [];
    for (const alloc of this._serviceAllocations) {
      const charge = alloc.evaluateChargeability(this._deliveredQuantity, transactionId);
      if (charge) {
        generatedCharges.push(charge);
      }
    }
    return generatedCharges;
  }

  public toJSON(): GarmentLineProps {
    return {
      id: this.id,
      transactionId: this.transactionId,
      itemId: this.itemId,
      itemName: this.itemName,
      physicalQuantity: this.physicalQuantity,
      deliveredQuantity: this._deliveredQuantity,
      serviceAllocations: this._serviceAllocations.map((sa) => sa.toJSON()),
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
