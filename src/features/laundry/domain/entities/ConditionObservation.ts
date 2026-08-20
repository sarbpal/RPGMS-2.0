export interface ConditionObservationProps {
  id: string;
  garmentLineId: string;
  observationType?: string;
  description: string;
  affectedQuantity: number;
  evidenceUris?: string[];
  observedByStaffId: string;
  observedAt: string;
}

/**
 * ConditionObservation is an immutable Child Entity representing a physical defect,
 * pre-existing condition, or stain observed during pre-processing inspection.
 *
 * Invariants:
 * 1. Permanently frozen upon creation.
 * 2. Does not alter the physical collected quantity of the GarmentLine.
 * 3. Affected quantity must be a positive integer not exceeding physical garment quantity.
 */
export class ConditionObservation {
  public readonly id: string;
  public readonly garmentLineId: string;
  public readonly observationType?: string;
  public readonly description: string;
  public readonly affectedQuantity: number;
  public readonly evidenceUris: readonly string[];
  public readonly observedByStaffId: string;
  public readonly observedAt: string;

  constructor(props: ConditionObservationProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('ConditionObservation ID cannot be empty.');
    }
    if (!props.garmentLineId || props.garmentLineId.trim() === '') {
      throw new Error('ConditionObservation garmentLineId cannot be empty.');
    }
    if (!props.description || props.description.trim() === '') {
      throw new Error('ConditionObservation description cannot be empty.');
    }
    if (
      typeof props.affectedQuantity !== 'number' ||
      isNaN(props.affectedQuantity) ||
      props.affectedQuantity <= 0 ||
      !Number.isInteger(props.affectedQuantity)
    ) {
      throw new Error('ConditionObservation affectedQuantity must be a positive integer.');
    }
    if (!props.observedByStaffId || props.observedByStaffId.trim() === '') {
      throw new Error('ConditionObservation observedByStaffId cannot be empty.');
    }
    if (!props.observedAt || props.observedAt.trim() === '') {
      throw new Error('ConditionObservation observedAt cannot be empty.');
    }

    this.id = props.id.trim();
    this.garmentLineId = props.garmentLineId.trim();
    this.observationType = props.observationType?.trim();
    this.description = props.description.trim();
    this.affectedQuantity = props.affectedQuantity;
    this.evidenceUris = Object.freeze(props.evidenceUris ? [...props.evidenceUris] : []);
    this.observedByStaffId = props.observedByStaffId.trim();
    this.observedAt = props.observedAt;

    Object.freeze(this);
  }

  public toJSON(): ConditionObservationProps {
    return {
      id: this.id,
      garmentLineId: this.garmentLineId,
      observationType: this.observationType,
      description: this.description,
      affectedQuantity: this.affectedQuantity,
      evidenceUris: [...this.evidenceUris],
      observedByStaffId: this.observedByStaffId,
      observedAt: this.observedAt,
    };
  }
}
