import { AllocationParticipant, type AllocationParticipantProps } from '../valueObjects/AllocationParticipant';

export type AllocationStatus = 'DRAFT' | 'CONFIRMED' | 'REVERSED';
export type AllocationOutcome = 'RESIDENT_ALLOCATED' | 'OWNER_ABSORBED';

export interface AllocationDataQualityIssue {
  stayId: string;
  residentId: string;
  issueType: 'MISSING_RESIDENT_RECORD' | 'ORPHANED_STAY' | 'INVALID_BED_ALLOCATION';
  message: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  operatorNotes?: string;
}

export interface ElectricityAllocationProps {
  id: string;
  billId: string;
  flatId: string;
  periodStart: string;
  periodEnd: string;
  totalSupplierAmount: number;
  totalPotentialShares: number;
  totalSelectedShares: number;
  amountPerShare: number;
  remainderPaise: number;
  ownerAbsorbedAmount?: number;
  allocationMethod?: 'SHARE_BASED';
  allocationOutcome?: AllocationOutcome;
  status?: AllocationStatus;
  participants?: (AllocationParticipant | AllocationParticipantProps)[];
  dataQualityIssues?: AllocationDataQualityIssue[];
  reversalReferenceId?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Aggregate Root representing the persistent operator allocation decision.
 * Enforces historical immutability once CONFIRMED.
 */
export class ElectricityAllocation {
  readonly id: string;
  readonly billId: string;
  readonly flatId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly totalSupplierAmount: number;
  readonly totalPotentialShares: number;
  readonly totalSelectedShares: number;
  readonly amountPerShare: number;
  readonly remainderPaise: number;
  private _ownerAbsorbedAmount: number;
  readonly allocationMethod: 'SHARE_BASED';
  private _allocationOutcome?: AllocationOutcome;
  private _status: AllocationStatus;
  private _participants: AllocationParticipant[];
  private _dataQualityIssues: AllocationDataQualityIssue[];
  private _reversalReferenceId?: string;
  private _confirmedBy?: string;
  private _confirmedAt?: string;
  readonly createdAt: string;
  private _updatedAt: string;

  constructor(props: ElectricityAllocationProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('ElectricityAllocation requires a valid id.');
    }
    if (!props.billId || props.billId.trim() === '') {
      throw new Error('ElectricityAllocation requires a billId.');
    }
    if (!props.flatId || props.flatId.trim() === '') {
      throw new Error('ElectricityAllocation requires a flatId.');
    }
    if (typeof props.totalSupplierAmount !== 'number' || isNaN(props.totalSupplierAmount) || props.totalSupplierAmount <= 0) {
      throw new Error('ElectricityAllocation totalSupplierAmount must be a positive number greater than zero.');
    }

    this.id = props.id;
    this.billId = props.billId;
    this.flatId = props.flatId;
    this.periodStart = props.periodStart;
    this.periodEnd = props.periodEnd;
    this.totalSupplierAmount = Number(props.totalSupplierAmount.toFixed(2));
    this.totalPotentialShares = props.totalPotentialShares || 0;
    this.totalSelectedShares = props.totalSelectedShares || 0;
    this.amountPerShare = props.amountPerShare || 0;
    this.remainderPaise = props.remainderPaise || 0;
    this._ownerAbsorbedAmount = props.ownerAbsorbedAmount || 0;
    this.allocationMethod = props.allocationMethod || 'SHARE_BASED';
    this._status = props.status || 'DRAFT';
    this._allocationOutcome = props.allocationOutcome;
    this._dataQualityIssues = props.dataQualityIssues || [];
    this._reversalReferenceId = props.reversalReferenceId;
    this._confirmedBy = props.confirmedBy;
    this._confirmedAt = props.confirmedAt;
    this.createdAt = props.createdAt || new Date().toISOString();
    this._updatedAt = props.updatedAt || new Date().toISOString();

    // Instantiate AllocationParticipant entities
    if (props.participants && props.participants.length > 0) {
      this._participants = props.participants.map((p) =>
        p instanceof AllocationParticipant ? p : new AllocationParticipant(p)
      );
    } else {
      this._participants = [];
    }
  }

  get status(): AllocationStatus {
    return this._status;
  }

  get allocationOutcome(): AllocationOutcome | undefined {
    return this._allocationOutcome;
  }

  get ownerAbsorbedAmount(): number {
    return this._ownerAbsorbedAmount;
  }

  get confirmedBy(): string | undefined {
    return this._confirmedBy;
  }

  get confirmedAt(): string | undefined {
    return this._confirmedAt;
  }

  get reversalReferenceId(): string | undefined {
    return this._reversalReferenceId;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  get participants(): readonly AllocationParticipant[] {
    return [...this._participants];
  }

  get dataQualityIssues(): readonly AllocationDataQualityIssue[] {
    return [...this._dataQualityIssues];
  }

  /**
   * Explicit Domain Action: Confirm allocation with selected resident shares (>0).
   */
  public confirm(confirmedBy: string, operatorNotes?: string): void {
    if (this._status !== 'DRAFT') {
      throw new Error(`Cannot confirm an ElectricityAllocation that is already ${this._status}.`);
    }
    if (!confirmedBy || confirmedBy.trim() === '') {
      throw new Error('Operator identity (confirmedBy) is required to confirm an allocation.');
    }
    if (this.totalSelectedShares === 0) {
      throw new Error(
        'Cannot confirm standard resident allocation with zero total selected shares. Use confirmOwnerAbsorbed() for explicit owner-absorbed confirmation.'
      );
    }

    const now = new Date().toISOString();
    this._allocationOutcome = 'RESIDENT_ALLOCATED';
    this._ownerAbsorbedAmount = 0;
    this._status = 'CONFIRMED';
    this._confirmedBy = confirmedBy;
    this._confirmedAt = now;
    this._updatedAt = now;

    // Acknowledge all data quality issues permanently
    this._dataQualityIssues = this._dataQualityIssues.map((issue) => ({
      ...issue,
      acknowledgedBy: issue.acknowledgedBy || confirmedBy,
      acknowledgedAt: issue.acknowledgedAt || now,
      operatorNotes: operatorNotes || issue.operatorNotes,
    }));
  }

  /**
   * Explicit Domain Action: Explicitly confirm zero-share OWNER_ABSORBED allocation outcome.
   */
  public confirmOwnerAbsorbed(confirmedBy: string, operatorNotes?: string): void {
    if (this._status !== 'DRAFT') {
      throw new Error(`Cannot confirm an ElectricityAllocation that is already ${this._status}.`);
    }
    if (!confirmedBy || confirmedBy.trim() === '') {
      throw new Error('Operator identity (confirmedBy) is required to confirm an OWNER_ABSORBED allocation.');
    }
    if (this.totalSelectedShares !== 0) {
      throw new Error(
        `confirmOwnerAbsorbed requires totalSelectedShares to be 0 (got: ${this.totalSelectedShares}).`
      );
    }

    const now = new Date().toISOString();
    this._allocationOutcome = 'OWNER_ABSORBED';
    this._ownerAbsorbedAmount = this.totalSupplierAmount;
    this._status = 'CONFIRMED';
    this._confirmedBy = confirmedBy;
    this._confirmedAt = now;
    this._updatedAt = now;

    // Acknowledge all data quality issues permanently
    this._dataQualityIssues = this._dataQualityIssues.map((issue) => ({
      ...issue,
      acknowledgedBy: issue.acknowledgedBy || confirmedBy,
      acknowledgedAt: issue.acknowledgedAt || now,
      operatorNotes: operatorNotes || issue.operatorNotes,
    }));
  }
}

