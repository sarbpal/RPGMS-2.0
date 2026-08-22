import type { PaymentMethod } from '../valueObjects/PaymentValueObjects';

export type DepositTransactionType =
  | 'DEPOSIT_RECEIPT'
  | 'PARTIAL_RETURN'
  | 'DEPOSIT_DEDUCTION'
  | 'SETTLEMENT_CLEARANCE';

export interface DepositTransaction {
  id: string;
  stayId: string;
  residentId: string;
  transactionType: DepositTransactionType;
  amount: number;
  postingDate: string;
  effectiveDate: string;
  paymentMethod?: PaymentMethod;
  reason?: string;
  remarks?: string;
  ledgerEntryIds: string[];
  createdBy: string;
  createdAt: string;
  idempotencyKey?: string;
}
