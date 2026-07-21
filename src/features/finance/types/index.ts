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

export const BillType = {
  MONTHLY_RENT: 'MONTHLY_RENT',
  RECURRING_CHARGE: 'RECURRING_CHARGE',
  ONE_TIME_CHARGE: 'ONE_TIME_CHARGE',
} as const;

export type BillType = typeof BillType[keyof typeof BillType];

export interface Bill {
  id: string;
  stayId: string;
  billNumber: string;
  billType: BillType;
  period: string; // e.g. "2026-07"
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  lineItems: BillLineItem[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: BillStatus;
  remarks?: string;
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

export const SettlementOutcome = {
  HOSTEL_REFUNDS_RESIDENT: 'HOSTEL_REFUNDS_RESIDENT',
  RESIDENT_PAYS_HOSTEL: 'RESIDENT_PAYS_HOSTEL',
  BALANCED_NO_ACTION: 'BALANCED_NO_ACTION',
} as const;

export type SettlementOutcome = typeof SettlementOutcome[keyof typeof SettlementOutcome];

export interface SettlementPreview {
  stayId: string;
  previewDate: string;
  outstandingReceivable: number;
  advanceCreditBalance: number;
  securityDepositHeld: number;
  damageDeductions: number;
  totalDues: number;
  totalAvailableCredits: number;
  netSettlementAmount: number;
  outcome: SettlementOutcome;
  remarks?: string;
}

export interface Settlement {
  id: string;
  stayId: string;
  settlementNumber: string;
  settlementDate: string;
  settlementType: SettlementType;
  previewSnapshot: SettlementPreview;
  finalAmount: number;
  outcome: SettlementOutcome;
  paymentMethod: PaymentMethod;
  remarks?: string;
  ledgerReferences: string[];
  createdBy: string;
  status: 'DRAFT' | 'SETTLED' | 'CANCELLED';
  createdAt: string;
}

export interface StayBalance {
  receivableBalance: number;
  securityDepositHeld: number;
  advanceCreditBalance: number;
  refundPayable: number;
  netBalance: number;
}

export interface FinanceSummary {
  totalCollected: number;
  totalOutstanding: number;
  totalDepositHeld: number;
  totalAdvanceCredit: number;
}
