export const BillStatus = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

export type BillStatus = typeof BillStatus[keyof typeof BillStatus];

export const BillType = {
  MONTHLY_RENT: 'MONTHLY_RENT',
  RECURRING_CHARGE: 'RECURRING_CHARGE',
  ONE_TIME_CHARGE: 'ONE_TIME_CHARGE',
} as const;

export type BillType = typeof BillType[keyof typeof BillType];

export interface BillLineItem {
  id: string;
  description: string;
  amount: number;
  category: 'RENT' | 'SECURITY_DEPOSIT' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER';
}
