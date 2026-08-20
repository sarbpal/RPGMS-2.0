export type LaundryEventType =
  | 'LaundryTransactionCreated'
  | 'LaundryCollectionConfirmed'
  | 'LaundryConditionObserved'
  | 'LaundryProcessingReleased'
  | 'LaundryReturned'
  | 'LaundryDelivered'
  | 'LaundryExceptionRaised'
  | 'LaundryExceptionResolved'
  | 'LaundryChargeRaised'
  | 'LaundryTransactionCompleted'
  | 'LaundryTransactionCancelled';

export interface LaundryBusinessEventProps {
  id: string;
  transactionId: string;
  eventType: LaundryEventType;
  timestamp: string;
  description: string;
  metadata?: Record<string, unknown>;
}

/**
 * LaundryBusinessEvent represents an immutable historical business fact
 * that occurred during the operational lifecycle of a Laundry Transaction.
 */
export class LaundryBusinessEvent {
  public readonly id: string;
  public readonly transactionId: string;
  public readonly eventType: LaundryEventType;
  public readonly timestamp: string;
  public readonly description: string;
  public readonly metadata?: Readonly<Record<string, unknown>>;

  constructor(props: LaundryBusinessEventProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('LaundryBusinessEvent ID cannot be empty.');
    }
    if (!props.transactionId || props.transactionId.trim() === '') {
      throw new Error('LaundryBusinessEvent transactionId cannot be empty.');
    }
    if (!props.eventType || props.eventType.trim() === '') {
      throw new Error('LaundryBusinessEvent eventType cannot be empty.');
    }
    if (!props.timestamp || props.timestamp.trim() === '') {
      throw new Error('LaundryBusinessEvent timestamp cannot be empty.');
    }
    if (!props.description || props.description.trim() === '') {
      throw new Error('LaundryBusinessEvent description cannot be empty.');
    }

    this.id = props.id.trim();
    this.transactionId = props.transactionId.trim();
    this.eventType = props.eventType;
    this.timestamp = props.timestamp;
    this.description = props.description.trim();
    this.metadata = props.metadata ? Object.freeze({ ...props.metadata }) : undefined;

    Object.freeze(this);
  }

  public toJSON(): LaundryBusinessEventProps {
    return {
      id: this.id,
      transactionId: this.transactionId,
      eventType: this.eventType,
      timestamp: this.timestamp,
      description: this.description,
      metadata: this.metadata ? { ...this.metadata } : undefined,
    };
  }
}
