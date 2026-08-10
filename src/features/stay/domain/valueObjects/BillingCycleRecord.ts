export interface BillingCycleRecordProps {
  id: string;
  stayId: string;
  billingAnchorDay: number;
  effectiveFrom: string;
  effectiveTo?: string;
  changeId?: string;
  notes?: string;
  createdAt?: string;
}

export class BillingCycleRecord {
  readonly id: string;
  readonly stayId: string;
  readonly billingAnchorDay: number;
  readonly effectiveFrom: string;
  readonly effectiveTo?: string;
  readonly changeId?: string;
  readonly notes?: string;
  readonly createdAt: string;

  constructor(props: BillingCycleRecordProps) {
    this.id = props.id;
    this.stayId = props.stayId;
    this.billingAnchorDay = props.billingAnchorDay;
    this.effectiveFrom = props.effectiveFrom;
    this.effectiveTo = props.effectiveTo;
    this.changeId = props.changeId;
    this.notes = props.notes;
    this.createdAt = props.createdAt || new Date().toISOString();
  }
}
