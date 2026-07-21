export const AccountType = {
  ACCOUNTS_RECEIVABLE: 'ACCOUNTS_RECEIVABLE',
  RENT_REVENUE: 'RENT_REVENUE',
  CASH: 'CASH',
  BANK: 'BANK',
  SECURITY_DEPOSIT_LIABILITY: 'SECURITY_DEPOSIT_LIABILITY',
  ADVANCE_CREDIT: 'ADVANCE_CREDIT',
  DAMAGE_RECOVERY: 'DAMAGE_RECOVERY',
  REFUND_PAYABLE: 'REFUND_PAYABLE',
} as const;

export type AccountType = typeof AccountType[keyof typeof AccountType];

export const LedgerReferenceType = {
  BILL: 'BILL',
  PAYMENT: 'PAYMENT',
  SETTLEMENT: 'SETTLEMENT',
  REVERSAL: 'REVERSAL',
} as const;

export type LedgerReferenceType = typeof LedgerReferenceType[keyof typeof LedgerReferenceType];

export interface LedgerEntry {
  id: string;
  stayId: string;
  postingDate: string;
  effectiveDate: string;
  referenceType: LedgerReferenceType;
  referenceId: string;
  account: AccountType;
  debit: number;
  credit: number;
  remarks: string;
  createdBy: string;
  createdAt: string;
}

export const BillStatus = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
} as const;

export type BillStatus = typeof BillStatus[keyof typeof BillStatus];

export interface BillLineItem {
  id: string;
  description: string;
  amount: number;
  category: 'RENT' | 'SECURITY_DEPOSIT' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER';
}

export interface Bill {
  id: string;
  stayId: string;
  billNumber: string;
  period: string; // e.g. "2026-07"
  dueDate: string;
  lineItems: BillLineItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: BillStatus;
  createdAt: string;
  updatedAt: string;
}

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

export interface Payment {
  id: string;
  stayId: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  allocations: PaymentAllocation[];
  remarks?: string;
  createdAt: string;
}

export const SettlementType = {
  CHECKOUT: 'CHECKOUT',
  EARLY_TERMINATION: 'EARLY_TERMINATION',
  NOTICE_EXPIRY: 'NOTICE_EXPIRY',
} as const;

export type SettlementType = typeof SettlementType[keyof typeof SettlementType];

export interface Settlement {
  id: string;
  stayId: string;
  settlementDate: string;
  settlementType: SettlementType;
  totalDues: number;
  depositHeld: number;
  damageDeduction: number;
  unpaidRentDeduction: number;
  netRefundAmount: number;
  status: 'DRAFT' | 'SETTLED' | 'CANCELLED';
  createdAt: string;
}

export interface StayBalance {
  receivableBalance: number;
  securityDepositHeld: number;
  advanceCreditBalance: number;
  netBalance: number;
}

export interface FinanceSummary {
  totalCollected: number;
  totalOutstanding: number;
  totalDepositHeld: number;
  totalAdvanceCredit: number;
}
