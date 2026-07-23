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
