export const LedgerReferenceType = {
  BILL: 'BILL',
  PAYMENT: 'PAYMENT',
  SETTLEMENT: 'SETTLEMENT',
  REVERSAL: 'REVERSAL',
  ELECTRICITY_ALLOCATION: 'ELECTRICITY_ALLOCATION',
  LAUNDRY_CHARGE: 'LAUNDRY_CHARGE',
  ADVANCE_APPLICATION: 'ADVANCE_APPLICATION',
} as const;

export type LedgerReferenceType = typeof LedgerReferenceType[keyof typeof LedgerReferenceType];

