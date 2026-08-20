import { ServiceAllocation, type ServiceAllocationProps } from './ServiceAllocation';
import { ConditionObservation, type ConditionObservationProps } from './ConditionObservation';
import type { LaundryChargeRecord } from './LaundryChargeRecord';

export interface GarmentLineProps {
  id: string;
  transactionId: string;
  itemId: string;
  itemName?: string;
  physicalQuantity: number;
  returnedQuantity?: number;
  deliveredQuantity?: number;
  serviceAllocations?: (ServiceAllocation | ServiceAllocationProps)[];
  conditionObservations?: (ConditionObservation | ConditionObservationProps)[];
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
  private _returnedQuantity: number;
  private _deliveredQuantity: number;
  private _serviceAllocations: ServiceAllocation[];
  private _conditionObservations: ConditionObservation[];
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
      props.returnedQuantity !== undefined &&
      (typeof props.returnedQuantity !== 'number' ||
        isNaN(props.returnedQuantity) ||
        props.returnedQuantity < 0 ||
        !Number.isInteger(props.returnedQuantity) ||
        props.returnedQuantity > props.physicalQuantity)
    ) {
      throw new Error(
        `GarmentLine returnedQuantity must be an integer between 0 and physicalQuantity (${props.physicalQuantity}).`
      );
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
    this._returnedQuantity = props.returnedQuantity ?? 0;
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

    this._conditionObservations = [];
    if (props.conditionObservations && props.conditionObservations.length > 0) {
      for (const co of props.conditionObservations) {
        const obs = co instanceof ConditionObservation ? co : new ConditionObservation(co);
        this.addConditionObservation(obs);
      }
    }
  }

  get returnedQuantity(): number {
    return this._returnedQuantity;
  }

  get outstandingReturnQuantity(): number {
    return Math.max(0, this.physicalQuantity - this._returnedQuantity);
  }

  get deliveredQuantity(): number {
    return this._deliveredQuantity;
  }

  get serviceAllocations(): readonly ServiceAllocation[] {
    return [...this._serviceAllocations];
  }

  get conditionObservations(): readonly ConditionObservation[] {
    return [...this._conditionObservations];
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
   * Adds an immutable ConditionObservation to this GarmentLine.
   * Invariant: Affected quantity cannot exceed line physical piece count.
   */
  public addConditionObservation(observation: ConditionObservation): void {
    if (observation.garmentLineId !== this.id) {
      throw new Error(
        `ConditionObservation (${observation.id}) garmentLineId (${observation.garmentLineId}) does not match GarmentLine ID (${this.id}).`
      );
    }
    if (observation.affectedQuantity > this.physicalQuantity) {
      throw new Error(
        `ConditionObservation affectedQuantity (${observation.affectedQuantity}) cannot exceed GarmentLine physicalQuantity (${this.physicalQuantity}).`
      );
    }
    this._conditionObservations.push(observation);
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Records incremental physical return quantity for pieces on this line (L-06).
   * Invariant: Total returned quantity cannot exceed physical expected piece count.
   */
  public recordReturnQuantity(quantity: number): void {
    if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Return quantity must be a positive integer.');
    }
    if (this._returnedQuantity + quantity > this.physicalQuantity) {
      throw new Error(
        `Cannot return ${quantity} piece(s) for GarmentLine (${this.id}). Total returned quantity (${this._returnedQuantity + quantity}) would exceed physical expected quantity (${this.physicalQuantity}).`
      );
    }
    this._returnedQuantity += quantity;
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Records incremental delivery quantity for physical pieces on this line.
   * Total delivered quantity cannot exceed physical quantity.
   */
  public recordDeliveryQuantity(quantity: number): void {
    if (typeof quantity !== 'number' || isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('Delivery quantity must be a positive integer.');
    }
    if (this._deliveredQuantity + quantity > this.physicalQuantity) {
      throw new Error(
        `Delivered quantity (${this._deliveredQuantity + quantity}) cannot exceed physicalQuantity (${this.physicalQuantity}).`
      );
    }
    this._deliveredQuantity += quantity;
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Evaluates BR-L-012 chargeability across all child service allocations on this line.
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
      returnedQuantity: this._returnedQuantity,
      deliveredQuantity: this._deliveredQuantity,
      serviceAllocations: this._serviceAllocations.map((sa) => sa.toJSON()),
      conditionObservations: this._conditionObservations.map((co) => co.toJSON()),
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
