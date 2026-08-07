export type AllocationMethod = 'EQUAL_SPLIT' | 'OCCUPANCY_WEIGHTED';

export interface ConsumptionAllocationProps {
  flatId: string;
  stayId: string;
  residentId: string;
  readingPeriod: string;
  allocatedUnits: number;
  allocatedAmount: number;
  allocationMethod: AllocationMethod;
  remarks?: string;
}

export class ConsumptionAllocation {
  public readonly flatId: string;
  public readonly stayId: string;
  public readonly residentId: string;
  public readonly readingPeriod: string;
  public readonly allocatedUnits: number;
  public readonly allocatedAmount: number;
  public readonly allocationMethod: AllocationMethod;
  public readonly remarks?: string;

  constructor(props: ConsumptionAllocationProps) {
    if (!props.flatId || props.flatId.trim() === '') {
      throw new Error('ConsumptionAllocation flatId cannot be empty.');
    }
    if (!props.stayId || props.stayId.trim() === '') {
      throw new Error('ConsumptionAllocation stayId cannot be empty.');
    }
    if (props.allocatedAmount < 0) {
      throw new Error('ConsumptionAllocation allocatedAmount cannot be negative.');
    }

    this.flatId = props.flatId;
    this.stayId = props.stayId;
    this.residentId = props.residentId;
    this.readingPeriod = props.readingPeriod;
    this.allocatedUnits = Number(props.allocatedUnits.toFixed(2));
    this.allocatedAmount = Number(props.allocatedAmount.toFixed(2));
    this.allocationMethod = props.allocationMethod;
    this.remarks = props.remarks;
  }
}
