export interface AllocationParticipantProps {
  id: string;
  allocationId: string;
  stayId: string;
  residentId: string;
  residentCode: string;
  residentNameSnapshot: string;
  flatId: string;
  potentialShares: number;
  selectedShares: number;
  allocatedAmount: number;
  financeBillId?: string;
  remarks?: string;
}

/**
 * Child Entity owned strictly by ElectricityAllocation aggregate.
 * Captures historical participant snapshot and share calculations.
 * Identity is stable (id = participantAllocationId) for Finance ledger references.
 */
export class AllocationParticipant {
  readonly id: string;
  readonly allocationId: string;
  readonly stayId: string;
  readonly residentId: string;
  readonly residentCode: string;
  readonly residentNameSnapshot: string;
  readonly flatId: string;
  readonly potentialShares: number;
  readonly selectedShares: number;
  readonly allocatedAmount: number;
  readonly financeBillId?: string;
  readonly remarks?: string;

  constructor(props: AllocationParticipantProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('AllocationParticipant requires a valid id.');
    }
    if (!props.allocationId || props.allocationId.trim() === '') {
      throw new Error('AllocationParticipant requires an allocationId.');
    }
    if (!props.stayId || props.stayId.trim() === '') {
      throw new Error('AllocationParticipant requires a stayId.');
    }
    if (!props.residentId || props.residentId.trim() === '') {
      throw new Error('AllocationParticipant requires a residentId.');
    }
    if (typeof props.potentialShares !== 'number' || props.potentialShares < 0) {
      throw new Error('AllocationParticipant potentialShares must be a non-negative integer.');
    }
    if (typeof props.selectedShares !== 'number' || props.selectedShares < 0) {
      throw new Error('AllocationParticipant selectedShares must be a non-negative integer.');
    }
    if (props.selectedShares > props.potentialShares) {
      throw new Error(
        `selectedShares (${props.selectedShares}) cannot exceed potentialShares (${props.potentialShares}).`
      );
    }
    if (typeof props.allocatedAmount !== 'number' || isNaN(props.allocatedAmount) || props.allocatedAmount < 0) {
      throw new Error('AllocationParticipant allocatedAmount must be a non-negative number.');
    }

    this.id = props.id;
    this.allocationId = props.allocationId;
    this.stayId = props.stayId;
    this.residentId = props.residentId;
    this.residentCode = props.residentCode || 'UNASSIGNED';
    this.residentNameSnapshot = props.residentNameSnapshot || `Resident (${props.residentId})`;
    this.flatId = props.flatId;
    this.potentialShares = Math.floor(props.potentialShares);
    this.selectedShares = Math.floor(props.selectedShares);
    this.allocatedAmount = Number(props.allocatedAmount.toFixed(2));
    this.financeBillId = props.financeBillId;
    this.remarks = props.remarks;
  }
}
