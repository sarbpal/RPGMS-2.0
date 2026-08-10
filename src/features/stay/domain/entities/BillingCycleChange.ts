export type BillingCycleChangeStatus = 'REQUESTED' | 'APPROVED' | 'EFFECTIVE' | 'CANCELLED';

export interface BillingCycleChangeProps {
  changeId: string;
  stayId: string;
  previousBillingAnchor: number;
  requestedBillingAnchor: number;
  effectiveFrom: string;
  reason: string;
  status: BillingCycleChangeStatus;
  financialAdjustmentReference?: string;
  createdAt?: string;
  effectiveAt?: string;
}

export class BillingCycleChange {
  readonly changeId: string;
  readonly stayId: string;
  readonly previousBillingAnchor: number;
  readonly requestedBillingAnchor: number;
  readonly effectiveFrom: string;
  readonly reason: string;
  readonly status: BillingCycleChangeStatus;
  readonly financialAdjustmentReference?: string;
  readonly createdAt: string;
  readonly effectiveAt?: string;

  constructor(props: BillingCycleChangeProps) {
    this.changeId = props.changeId;
    this.stayId = props.stayId;
    this.previousBillingAnchor = props.previousBillingAnchor;
    this.requestedBillingAnchor = props.requestedBillingAnchor;
    this.effectiveFrom = props.effectiveFrom;
    this.reason = props.reason;
    this.status = props.status;
    this.financialAdjustmentReference = props.financialAdjustmentReference;
    this.createdAt = props.createdAt || new Date().toISOString();
    this.effectiveAt = props.effectiveAt;
  }
}
