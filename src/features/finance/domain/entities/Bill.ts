import type { BillStatus, BillType, BillLineItem } from '../valueObjects/BillValueObjects';

export interface Bill {
  id: string;
  stayId: string;
  billNumber: string;
  billType: BillType;
  period: string;
  issueDate: string;
  dueDate: string;
  lineItems: BillLineItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: BillStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}
