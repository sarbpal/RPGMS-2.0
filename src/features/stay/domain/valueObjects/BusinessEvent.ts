export interface BusinessEventProps {
  id: string;
  stayId: string;
  eventType: string;
  timestamp: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export class BusinessEvent {
  readonly id: string;
  readonly stayId: string;
  readonly eventType: string;
  readonly timestamp: string;
  readonly description: string;
  readonly metadata?: Record<string, unknown>;

  constructor(props: BusinessEventProps) {
    this.id = props.id;
    this.stayId = props.stayId;
    this.eventType = props.eventType;
    this.timestamp = props.timestamp;
    this.description = props.description;
    this.metadata = props.metadata;
  }
}
