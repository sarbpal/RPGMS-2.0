import { GarmentLine, type GarmentLineProps } from './GarmentLine';
import { LaundryTransactionStatus } from '../valueObjects/LaundryTransactionStatus';
import { LaundryBusinessEvent, type LaundryBusinessEventProps } from '../valueObjects/LaundryBusinessEvent';

export interface LaundryTransactionProps {
  id: string;
  stayId: string;
  residentId: string;
  status?: LaundryTransactionStatus;
  garmentLines?: (GarmentLine | GarmentLineProps)[];
  businessEvents?: (LaundryBusinessEvent | LaundryBusinessEventProps)[];
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * LaundryTransaction is the Aggregate Root representing one operational laundry relationship
 * for a resident's Stay.
 *
 * Invariants:
 * 1. Belongs to exactly one Stay and one Resident.
 * 2. Owns GarmentLine entities and controls all child state mutations.
 * 3. Physical pieces are counted once across GarmentLines.
 * 4. Records immutable LaundryBusinessEvent audit facts, beginning with LaundryTransactionCreated.
 */
export class LaundryTransaction {
  public readonly id: string;
  public readonly stayId: string;
  public readonly residentId: string;
  private _status: LaundryTransactionStatus;
  private _garmentLines: GarmentLine[];
  private _businessEvents: LaundryBusinessEvent[];
  public readonly notes?: string;
  public readonly createdAt: string;
  private _updatedAt?: string;

  constructor(props: LaundryTransactionProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('LaundryTransaction ID cannot be empty.');
    }
    if (!props.stayId || props.stayId.trim() === '') {
      throw new Error('LaundryTransaction stayId cannot be empty.');
    }
    if (!props.residentId || props.residentId.trim() === '') {
      throw new Error('LaundryTransaction residentId cannot be empty.');
    }

    this.id = props.id.trim();
    this.stayId = props.stayId.trim();
    this.residentId = props.residentId.trim();
    this._status = props.status ?? LaundryTransactionStatus.DRAFT;
    this.notes = props.notes?.trim();
    this.createdAt = props.createdAt ?? new Date().toISOString();
    this._updatedAt = props.updatedAt;

    // Initialize GarmentLines
    this._garmentLines = [];
    if (props.garmentLines && props.garmentLines.length > 0) {
      for (const gl of props.garmentLines) {
        const line = gl instanceof GarmentLine ? gl : new GarmentLine(gl);
        this.addGarmentLine(line);
      }
    }

    // Initialize BusinessEvents
    this._businessEvents = [];
    if (props.businessEvents && props.businessEvents.length > 0) {
      for (const be of props.businessEvents) {
        const event = be instanceof LaundryBusinessEvent ? be : new LaundryBusinessEvent(be);
        this._businessEvents.push(event);
      }
    } else {
      // Record the authoritative creation event
      this.recordBusinessEvent({
        id: `EVT-${this.id}-CREATED`,
        transactionId: this.id,
        eventType: 'LaundryTransactionCreated',
        timestamp: this.createdAt,
        description: `Laundry transaction ${this.id} created for Stay ${this.stayId} in ${this._status} status.`,
        metadata: {
          stayId: this.stayId,
          residentId: this.residentId,
          initialStatus: this._status,
          initialGarmentLineCount: this._garmentLines.length,
        },
      });
    }
  }

  get status(): LaundryTransactionStatus {
    return this._status;
  }

  get garmentLines(): readonly GarmentLine[] {
    return [...this._garmentLines];
  }

  get businessEvents(): readonly LaundryBusinessEvent[] {
    return [...this._businessEvents];
  }

  get updatedAt(): string | undefined {
    return this._updatedAt;
  }

  /**
   * Calculates the total physical piece count across all garment lines.
   * A physical garment is counted exactly once regardless of how many services apply to it.
   */
  get totalPhysicalPieces(): number {
    return this._garmentLines.reduce((sum, line) => sum + line.physicalQuantity, 0);
  }

  /**
   * Adds a GarmentLine child entity to the transaction.
   */
  public addGarmentLine(line: GarmentLine): void {
    if (line.transactionId !== this.id) {
      throw new Error(
        `GarmentLine (${line.id}) transactionId (${line.transactionId}) does not match LaundryTransaction ID (${this.id}).`
      );
    }
    const duplicate = this._garmentLines.find((gl) => gl.id === line.id);
    if (duplicate) {
      throw new Error(`GarmentLine with ID (${line.id}) already exists on LaundryTransaction (${this.id}).`);
    }
    this._garmentLines.push(line);
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Removes a GarmentLine from the transaction.
   */
  public removeGarmentLine(lineId: string): void {
    const idx = this._garmentLines.findIndex((gl) => gl.id === lineId);
    if (idx >= 0) {
      this._garmentLines.splice(idx, 1);
      this._updatedAt = new Date().toISOString();
    }
  }

  /**
   * Retrieves a specific GarmentLine by ID.
   */
  public getGarmentLine(lineId: string): GarmentLine | undefined {
    return this._garmentLines.find((gl) => gl.id === lineId);
  }

  /**
   * Appends an immutable LaundryBusinessEvent to the transaction history.
   */
  public recordBusinessEvent(eventProps: LaundryBusinessEventProps): void {
    const event = new LaundryBusinessEvent(eventProps);
    if (event.transactionId !== this.id) {
      throw new Error(
        `BusinessEvent (${event.id}) transactionId (${event.transactionId}) does not match LaundryTransaction ID (${this.id}).`
      );
    }
    this._businessEvents.push(event);
    this._updatedAt = new Date().toISOString();
  }

  public toJSON(): LaundryTransactionProps {
    return {
      id: this.id,
      stayId: this.stayId,
      residentId: this.residentId,
      status: this._status,
      garmentLines: this._garmentLines.map((gl) => gl.toJSON()),
      businessEvents: this._businessEvents.map((be) => be.toJSON()),
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
