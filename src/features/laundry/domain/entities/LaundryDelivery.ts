import { DeliveryLine, type DeliveryLineProps } from './DeliveryLine';
import { DeliveryHandoverMethod } from '../valueObjects/DeliveryHandoverMethod';

export interface LaundryDeliveryProps {
  id: string;
  transactionId: string;
  deliveredLines: (DeliveryLine | DeliveryLineProps)[];
  handoverMethod: DeliveryHandoverMethod;
  deliveredByStaffId: string;
  deliveredAt: string;
  residentPresent?: boolean;
  residentVerified?: boolean;
  roomNumber?: string;
  evidenceUris?: string[];
  notes?: string;
}

/**
 * LaundryDelivery is an immutable Child Entity representing one physical handover of returned laundry
 * to a resident (via DIRECT_HANDOVER or ROOM_PLACEMENT).
 *
 * Invariants:
 * 1. Permanently frozen upon creation; physical delivery facts cannot be mutated.
 * 2. Handover method must be DIRECT_HANDOVER or ROOM_PLACEMENT.
 * 3. Delivered quantity connects to L-03 BR-L-012 chargeability reconciliation.
 */
export class LaundryDelivery {
  public readonly id: string;
  public readonly transactionId: string;
  public readonly deliveredLines: readonly DeliveryLine[];
  public readonly handoverMethod: DeliveryHandoverMethod;
  public readonly deliveredByStaffId: string;
  public readonly deliveredAt: string;
  public readonly residentPresent: boolean;
  public readonly residentVerified: boolean;
  public readonly roomNumber?: string;
  public readonly evidenceUris: readonly string[];
  public readonly notes?: string;

  constructor(props: LaundryDeliveryProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('LaundryDelivery ID cannot be empty.');
    }
    if (!props.transactionId || props.transactionId.trim() === '') {
      throw new Error('LaundryDelivery transactionId cannot be empty.');
    }
    if (!props.deliveredByStaffId || props.deliveredByStaffId.trim() === '') {
      throw new Error('LaundryDelivery deliveredByStaffId cannot be empty.');
    }
    if (!props.deliveredAt || props.deliveredAt.trim() === '') {
      throw new Error('LaundryDelivery deliveredAt cannot be empty.');
    }
    if (
      props.handoverMethod !== DeliveryHandoverMethod.DIRECT_HANDOVER &&
      props.handoverMethod !== DeliveryHandoverMethod.ROOM_PLACEMENT
    ) {
      throw new Error(`Invalid handoverMethod (${props.handoverMethod}). Allowed: DIRECT_HANDOVER, ROOM_PLACEMENT.`);
    }
    if (!props.deliveredLines || props.deliveredLines.length === 0) {
      throw new Error('LaundryDelivery must contain at least one DeliveryLine.');
    }

    this.id = props.id.trim();
    this.transactionId = props.transactionId.trim();
    this.handoverMethod = props.handoverMethod;
    this.deliveredByStaffId = props.deliveredByStaffId.trim();
    this.deliveredAt = props.deliveredAt;
    this.residentPresent = props.residentPresent ?? (props.handoverMethod === DeliveryHandoverMethod.DIRECT_HANDOVER);
    this.residentVerified = props.residentVerified ?? false;
    this.roomNumber = props.roomNumber?.trim();
    this.evidenceUris = Object.freeze(props.evidenceUris ? [...props.evidenceUris] : []);
    this.notes = props.notes?.trim();

    const lines = props.deliveredLines.map((l) =>
      l instanceof DeliveryLine ? l : new DeliveryLine(l)
    );
    this.deliveredLines = Object.freeze(lines);

    Object.freeze(this);
  }

  get totalDeliveredQuantity(): number {
    return this.deliveredLines.reduce((sum, line) => sum + line.deliveredQuantity, 0);
  }

  public toJSON(): LaundryDeliveryProps {
    return {
      id: this.id,
      transactionId: this.transactionId,
      deliveredLines: this.deliveredLines.map((l) => l.toJSON()),
      handoverMethod: this.handoverMethod,
      deliveredByStaffId: this.deliveredByStaffId,
      deliveredAt: this.deliveredAt,
      residentPresent: this.residentPresent,
      residentVerified: this.residentVerified,
      roomNumber: this.roomNumber,
      evidenceUris: [...this.evidenceUris],
      notes: this.notes,
    };
  }
}
