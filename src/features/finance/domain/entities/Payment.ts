import type { PaymentMethod, PaymentAllocation } from '../valueObjects/PaymentValueObjects';

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
}
