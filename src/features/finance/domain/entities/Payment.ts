import type { PaymentMethod, PaymentAllocation } from '../valueObjects/PaymentValueObjects';

export type PaymentStatus = 'RECORDED' | 'REVERSED';

export interface Payment {
  id: string;
  stayId: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  idempotencyKey?: string;
  allocations: PaymentAllocation[];
  remarks?: string;
  createdAt: string;
  status?: PaymentStatus;
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
  reversalIdempotencyKey?: string;
  reversalLedgerEntryIds?: string[];
}
