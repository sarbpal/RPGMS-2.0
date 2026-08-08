export type ElectricityBillStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface ElectricityBillProps {
  id: string;
  supplierName: string;
  supplierBillNumber: string;
  flatId: string;
  periodStart: string;
  periodEnd: string;
  billDate?: string;
  dueDate?: string;
  supplierAmount: number;
  documentAttachment?: string;
  status?: ElectricityBillStatus;
  createdAt?: string;
  updatedAt?: string;
}

export class ElectricityBill {
  readonly id: string;
  readonly supplierName: string;
  readonly supplierBillNumber: string;
  readonly flatId: string;
  readonly periodStart: string;
  readonly periodEnd: string;
  readonly billDate: string;
  readonly dueDate?: string;
  readonly supplierAmount: number;
  readonly documentAttachment?: string;
  private _status: ElectricityBillStatus;
  readonly createdAt: string;
  private _updatedAt: string;

  constructor(props: ElectricityBillProps) {
    if (!props.id || props.id.trim() === '') {
      throw new Error('ElectricityBill requires a valid id.');
    }
    if (!props.supplierName || props.supplierName.trim() === '') {
      throw new Error('ElectricityBill requires a supplierName.');
    }
    if (!props.supplierBillNumber || props.supplierBillNumber.trim() === '') {
      throw new Error('ElectricityBill requires a supplierBillNumber.');
    }
    if (!props.flatId || props.flatId.trim() === '') {
      throw new Error('ElectricityBill requires a flatId.');
    }
    if (!props.periodStart || props.periodStart.trim() === '') {
      throw new Error('ElectricityBill requires periodStart date.');
    }
    if (!props.periodEnd || props.periodEnd.trim() === '') {
      throw new Error('ElectricityBill requires periodEnd date.');
    }
    if (props.periodEnd < props.periodStart) {
      throw new Error(`periodEnd (${props.periodEnd}) cannot precede periodStart (${props.periodStart}).`);
    }
    if (typeof props.supplierAmount !== 'number' || isNaN(props.supplierAmount) || props.supplierAmount < 0) {
      throw new Error('ElectricityBill supplierAmount must be a non-negative number.');
    }

    this.id = props.id;
    this.supplierName = props.supplierName;
    this.supplierBillNumber = props.supplierBillNumber;
    this.flatId = props.flatId;
    this.periodStart = props.periodStart;
    this.periodEnd = props.periodEnd;
    this.billDate = props.billDate || new Date().toISOString().split('T')[0];
    this.dueDate = props.dueDate;
    this.supplierAmount = Number(props.supplierAmount.toFixed(2));
    this.documentAttachment = props.documentAttachment;
    this._status = props.status || 'DRAFT';
    this.createdAt = props.createdAt || new Date().toISOString();
    this._updatedAt = props.updatedAt || new Date().toISOString();
  }

  get status(): ElectricityBillStatus {
    return this._status;
  }

  get updatedAt(): string {
    return this._updatedAt;
  }

  public confirm(): void {
    if (this._status !== 'DRAFT') {
      throw new Error(`Cannot confirm ElectricityBill in ${this._status} status.`);
    }
    this._status = 'CONFIRMED';
    this._updatedAt = new Date().toISOString();
  }

  public cancel(_reason?: string): void {
    if (this._status === 'CONFIRMED') {
      throw new Error('Cannot cancel a CONFIRMED ElectricityBill directly. Use reversal workflow.');
    }
    this._status = 'CANCELLED';
    this._updatedAt = new Date().toISOString();
  }
}

