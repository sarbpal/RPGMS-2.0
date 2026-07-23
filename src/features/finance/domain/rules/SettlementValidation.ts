import type { StayBalance } from '../valueObjects/StayBalance';
import type { SettlementPreview } from '../valueObjects/SettlementValueObjects';
import { SettlementOutcome } from '../valueObjects/SettlementValueObjects';

/**
 * Business Rule: Checkout Settlement Preview Derivation
 * 
 * Invariant: Checkout settlement reconciles outstanding receivables and damage deductions
 * against security deposit held and advance credits to determine final net outcome.
 */
export function deriveSettlementPreview(
  stayBalances: StayBalance,
  stayId: string,
  previewDate: string,
  damageDeductions = 0,
  remarks?: string
): SettlementPreview {
  const outstandingReceivable = stayBalances.receivableBalance;
  const advanceCreditBalance = stayBalances.advanceCreditBalance;
  const securityDepositHeld = stayBalances.securityDepositHeld;

  const roundedDamage = Math.round(damageDeductions * 100) / 100;
  const totalDues = Math.round((outstandingReceivable + roundedDamage) * 100) / 100;
  const totalAvailableCredits = Math.round((securityDepositHeld + advanceCreditBalance) * 100) / 100;

  let outcome: SettlementOutcome;
  let netSettlementAmount: number;

  if (totalAvailableCredits > totalDues) {
    outcome = SettlementOutcome.HOSTEL_REFUNDS_RESIDENT;
    netSettlementAmount = Math.round((totalAvailableCredits - totalDues) * 100) / 100;
  } else if (totalDues > totalAvailableCredits) {
    outcome = SettlementOutcome.RESIDENT_PAYS_HOSTEL;
    netSettlementAmount = Math.round((totalDues - totalAvailableCredits) * 100) / 100;
  } else {
    outcome = SettlementOutcome.BALANCED_NO_ACTION;
    netSettlementAmount = 0;
  }

  return {
    stayId,
    previewDate,
    outstandingReceivable,
    advanceCreditBalance,
    securityDepositHeld,
    damageDeductions: roundedDamage,
    totalDues,
    totalAvailableCredits,
    netSettlementAmount,
    outcome,
    remarks,
  };
}
