export interface ReturnLineProps {
  garmentLineId: string;
  returnedQuantity: number;
}

/**
 * ReturnLine is an immutable Value Object representing physical pieces of a specific
 * GarmentLine received back into RPGMS custody in a LaundryReturn receipt.
 *
 * Invariant: Returned quantity must be a positive integer.
 */
export class ReturnLine {
  public readonly garmentLineId: string;
  public readonly returnedQuantity: number;

  constructor(props: ReturnLineProps) {
    if (!props.garmentLineId || props.garmentLineId.trim() === '') {
      throw new Error('ReturnLine garmentLineId cannot be empty.');
    }
    if (
      typeof props.returnedQuantity !== 'number' ||
      isNaN(props.returnedQuantity) ||
      props.returnedQuantity <= 0 ||
      !Number.isInteger(props.returnedQuantity)
    ) {
      throw new Error('ReturnLine returnedQuantity must be a positive integer.');
    }

    this.garmentLineId = props.garmentLineId.trim();
    this.returnedQuantity = props.returnedQuantity;

    Object.freeze(this);
  }

  public toJSON(): ReturnLineProps {
    return {
      garmentLineId: this.garmentLineId,
      returnedQuantity: this.returnedQuantity,
    };
  }
}
