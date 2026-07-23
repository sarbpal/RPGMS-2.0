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
