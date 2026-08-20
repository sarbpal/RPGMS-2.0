export interface DeliveryLineProps {
  garmentLineId: string;
  deliveredQuantity: number;
}

/**
 * DeliveryLine is an immutable Value Object representing physical pieces of a specific
 * GarmentLine delivered/handed over to a resident in a LaundryDelivery receipt.
 *
 * Invariant: Delivered quantity must be a positive integer.
 */
export class DeliveryLine {
  public readonly garmentLineId: string;
  public readonly deliveredQuantity: number;

  constructor(props: DeliveryLineProps) {
    if (!props.garmentLineId || props.garmentLineId.trim() === '') {
      throw new Error('DeliveryLine garmentLineId cannot be empty.');
    }
    if (
      typeof props.deliveredQuantity !== 'number' ||
      isNaN(props.deliveredQuantity) ||
      props.deliveredQuantity <= 0 ||
      !Number.isInteger(props.deliveredQuantity)
    ) {
      throw new Error('DeliveryLine deliveredQuantity must be a positive integer.');
    }

    this.garmentLineId = props.garmentLineId.trim();
    this.deliveredQuantity = props.deliveredQuantity;

    Object.freeze(this);
  }

  public toJSON(): DeliveryLineProps {
    return {
      garmentLineId: this.garmentLineId,
      deliveredQuantity: this.deliveredQuantity,
    };
  }
}
