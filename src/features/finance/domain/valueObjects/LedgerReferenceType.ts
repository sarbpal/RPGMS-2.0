export const LedgerReferenceType = {
  BILL: 'BILL',
  PAYMENT: 'PAYMENT',
  SETTLEMENT: 'SETTLEMENT',
  REVERSAL: 'REVERSAL',
  ELECTRICITY_ALLOCATION: 'ELECTRICITY_ALLOCATION',
  LAUNDRY_CHARGE: 'LAUNDRY_CHARGE',
} as const;

export type LedgerReferenceType = typeof LedgerReferenceType[keyof typeof LedgerReferenceType];

