import { ReturnLine, type ReturnLineProps } from './ReturnLine';

export interface LaundryReturnProps {
  id: string;
  transactionId: string;
  returnedLines: (ReturnLine | ReturnLineProps)[];
  returnedByStaffId: string;
  vendorId?: string;
  returnedAt: string;
  notes?: string;
}

/**
 * LaundryReturn is an immutable Child Entity representing one physical receipt of processed laundry
 * back into RPGMS custody, verified by staff piece count.
 *
 * Invariants:
 * 1. Permanently frozen upon creation; physical return facts cannot be silently edited.
 * 2. Multiple returns can occur cumulatively for the same LaundryTransaction.
 * 3. Returned != Delivered. Return establishes physical custody in RPGMS, not resident delivery.
 */
export class LaundryReturn {
  public readonly id: string;
  public readonly transactionId: string;
  public readonly returnedLines: readonly ReturnLine[];
  public readonly returnedByStaffId: string;
  public readonly vendorId?: string;
  public readonly returnedAt: string;
  public readonly notes?: string;

  constructor(props: LaundryReturnProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('LaundryReturn ID cannot be empty.');
    }
    if (!props.transactionId || props.transactionId.trim() === '') {
      throw new Error('LaundryReturn transactionId cannot be empty.');
    }
    if (!props.returnedByStaffId || props.returnedByStaffId.trim() === '') {
      throw new Error('LaundryReturn returnedByStaffId cannot be empty.');
    }
    if (!props.returnedAt || props.returnedAt.trim() === '') {
      throw new Error('LaundryReturn returnedAt cannot be empty.');
    }
    if (!props.returnedLines || props.returnedLines.length === 0) {
      throw new Error('LaundryReturn must contain at least one ReturnLine.');
    }

    this.id = props.id.trim();
    this.transactionId = props.transactionId.trim();
    this.returnedByStaffId = props.returnedByStaffId.trim();
    this.vendorId = props.vendorId?.trim();
    this.returnedAt = props.returnedAt;
    this.notes = props.notes?.trim();

    const lines = props.returnedLines.map((l) =>
      l instanceof ReturnLine ? l : new ReturnLine(l)
    );
    this.returnedLines = Object.freeze(lines);

    Object.freeze(this);
  }

  get totalReturnedQuantity(): number {
    return this.returnedLines.reduce((sum, line) => sum + line.returnedQuantity, 0);
  }

  public toJSON(): LaundryReturnProps {
    return {
      id: this.id,
      transactionId: this.transactionId,
      returnedLines: this.returnedLines.map((l) => l.toJSON()),
      returnedByStaffId: this.returnedByStaffId,
      vendorId: this.vendorId,
      returnedAt: this.returnedAt,
      notes: this.notes,
    };
  }
}
