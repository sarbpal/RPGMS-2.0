export const PaymentMethod = {
  CASH: 'CASH',
  UPI: 'UPI',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE',
  CARD: 'CARD',
  OTHER: 'OTHER',
} as const;

export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export interface PaymentAllocation {
  billId: string;
  amount: number;
}
