export interface BedAllocationProps {
  id: string;
  stayId: string;
  flatId: string;
  bedId: string;
  allocatedFrom: string;
  allocatedUntil?: string;
  status: 'ACTIVE' | 'RELEASED';
  createdAt?: string;
}

export class BedAllocation {
  readonly id: string;
  readonly stayId: string;
  readonly flatId: string;
  readonly bedId: string;
  readonly allocatedFrom: string;
  readonly allocatedUntil?: string;
  readonly status: 'ACTIVE' | 'RELEASED';
  readonly createdAt: string;

  constructor(props: BedAllocationProps) {
    this.id = props.id;
    this.stayId = props.stayId;
    this.flatId = props.flatId;
    this.bedId = props.bedId;
    this.allocatedFrom = props.allocatedFrom;
    this.allocatedUntil = props.allocatedUntil;
    this.status = props.status;
    this.createdAt = props.createdAt || new Date().toISOString();
  }
}
