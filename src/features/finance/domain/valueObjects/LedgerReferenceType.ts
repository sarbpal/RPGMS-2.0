export const LedgerReferenceType = {
  BILL: 'BILL',
  PAYMENT: 'PAYMENT',
  SETTLEMENT: 'SETTLEMENT',
  REVERSAL: 'REVERSAL',
} as const;

export type LedgerReferenceType = typeof LedgerReferenceType[keyof typeof LedgerReferenceType];
