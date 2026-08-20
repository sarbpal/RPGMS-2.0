import { ServiceAllocation, type ServiceAllocationProps } from './ServiceAllocation';

export interface GarmentLineProps {
  id: string;
  transactionId: string;
  itemId: string;
  itemName?: string;
  physicalQuantity: number;
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
    if (!props.createdAt || props.createdAt.trim() === '') {
      throw new Error('GarmentLine createdAt cannot be empty.');
    }

    this.id = props.id.trim();
    this.transactionId = props.transactionId.trim();
    this.itemId = props.itemId.trim();
    this.itemName = props.itemName?.trim();
    this.physicalQuantity = props.physicalQuantity;
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

  public toJSON(): GarmentLineProps {
    return {
      id: this.id,
      transactionId: this.transactionId,
      itemId: this.itemId,
      itemName: this.itemName,
      physicalQuantity: this.physicalQuantity,
      serviceAllocations: this._serviceAllocations.map((sa) => sa.toJSON()),
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
