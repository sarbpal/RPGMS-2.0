export interface CollectionEvidenceProps {
  photoUris?: string[];
  collectedByStaffId: string;
  bagCount?: number;
  bagTagNumbers?: string[];
  notes?: string;
  residentVerified?: boolean;
  capturedAt: string;
}

/**
 * CollectionEvidence is an immutable Value Object representing physical collection evidence
 * (photographs, bag tags, notes, staff and resident verification) captured at Collection Confirmation.
 *
 * Invariant:
 * 1. Permanently immutable upon capture.
 * 2. Collection evidence references physical items as received at collection and is never rewritten
 *    to reflect later processing or delivery outcomes.
 */
export class CollectionEvidence {
  public readonly photoUris: readonly string[];
  public readonly collectedByStaffId: string;
  public readonly bagCount?: number;
  public readonly bagTagNumbers: readonly string[];
  public readonly notes?: string;
  public readonly residentVerified: boolean;
  public readonly capturedAt: string;

  constructor(props: CollectionEvidenceProps) {
    if (!props.collectedByStaffId || props.collectedByStaffId.trim() === '') {
      throw new Error('CollectionEvidence collectedByStaffId cannot be empty.');
    }
    if (!props.capturedAt || props.capturedAt.trim() === '') {
      throw new Error('CollectionEvidence capturedAt cannot be empty.');
    }
    if (
      props.bagCount !== undefined &&
      (typeof props.bagCount !== 'number' || isNaN(props.bagCount) || props.bagCount <= 0 || !Number.isInteger(props.bagCount))
    ) {
      throw new Error('CollectionEvidence bagCount must be a positive integer.');
    }

    this.collectedByStaffId = props.collectedByStaffId.trim();
    this.capturedAt = props.capturedAt;
    this.photoUris = Object.freeze(props.photoUris ? [...props.photoUris] : []);
    this.bagCount = props.bagCount;
    this.bagTagNumbers = Object.freeze(props.bagTagNumbers ? [...props.bagTagNumbers] : []);
    this.notes = props.notes?.trim();
    this.residentVerified = props.residentVerified ?? false;

    Object.freeze(this);
  }

  public toJSON(): CollectionEvidenceProps {
    return {
      photoUris: [...this.photoUris],
      collectedByStaffId: this.collectedByStaffId,
      bagCount: this.bagCount,
      bagTagNumbers: [...this.bagTagNumbers],
      notes: this.notes,
      residentVerified: this.residentVerified,
      capturedAt: this.capturedAt,
    };
  }
}
