import type { Bill } from '../entities/Bill';
import type { BillLineItem } from '../valueObjects/BillValueObjects';
import { BillType } from '../valueObjects/BillValueObjects';
import { hasDuplicateRentBill } from './DuplicateRentPrevention';

export interface UniquenessCheckResult {
  isDuplicate: boolean;
  conflictingBillId?: string;
  conflictingObligationKey?: string;
  reason?: string;
}

/**
 * Searches active (non-CANCELLED) bills for an existing line item carrying the specified obligationKey.
 */
export function findBillByObligationKey(existingBills: Bill[], obligationKey: string): Bill | null {
  if (!obligationKey || obligationKey.trim() === '') return null;
  const targetKey = obligationKey.trim();
  return (
    existingBills.find(
      (bill) =>
        bill.status !== 'CANCELLED' &&
        bill.lineItems?.some((li) => li.obligationKey?.trim() === targetKey)
    ) || null
  );
}

/**
 * PERMANENT GENERIC FINANCIAL UNIQUENESS RULE (BR-416, ADR-032)
 *
 * Source-domain agnostic invariant:
 * No two active (non-CANCELLED) Bills may financially realize the same source-domain
 * obligation identity (`obligationKey`).
 */
export function checkGenericObligationUniqueness(
  existingBills: Bill[],
  lineItems: Array<Pick<BillLineItem, 'obligationKey'>>
): UniquenessCheckResult {
  const activeBills = existingBills.filter((b) => b.status !== 'CANCELLED');

  if (lineItems && lineItems.length > 0) {
    for (const item of lineItems) {
      if (item.obligationKey && item.obligationKey.trim() !== '') {
        const targetKey = item.obligationKey.trim();
        const duplicateBill = activeBills.find((b) =>
          b.lineItems?.some((li) => li.obligationKey?.trim() === targetKey)
        );
        if (duplicateBill) {
          return {
            isDuplicate: true,
            conflictingBillId: duplicateBill.id,
            conflictingObligationKey: targetKey,
            reason: `Financial obligation '${targetKey}' is already financially realized in Bill '${duplicateBill.id}'.`,
          };
        }
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * TRANSITIONAL RENT COMPATIBILITY PROTECTION (ADR-032)
 *
 * Fallback protection specifically for legacy/historical Rent Bills created before
 * explicit `obligationKey` enforcement that only carry `(stayId, MONTHLY_RENT, period)`.
 * Once all historical records carry stable obligationKeys, this compatibility check
 * will be fully subsumed by the generic obligationKey invariant.
 */
export function checkLegacyRentCompatibility(
  existingBills: Bill[],
  stayId: string,
  period: string,
  billType?: BillType | string
): UniquenessCheckResult {
  if (billType === BillType.MONTHLY_RENT) {
    if (hasDuplicateRentBill(existingBills, stayId, period)) {
      const duplicateRentBill = existingBills.find(
        (b) =>
          b.status !== 'CANCELLED' &&
          b.stayId === stayId &&
          b.billType === BillType.MONTHLY_RENT &&
          b.period === period
      );
      return {
        isDuplicate: true,
        conflictingBillId: duplicateRentBill?.id,
        reason: `Monthly rent bill already exists for Stay '${stayId}' in period '${period}'.`,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * COMPOSITE FINANCE FINANCIAL UNIQUENESS BOUNDARY (BR-416, ADR-032)
 *
 * Evaluates incoming bill creation requests against:
 * 1. Permanent generic obligationKey uniqueness across all line items.
 * 2. Transitional legacy Rent period compatibility for bills without obligationKeys.
 */
export function checkFinancialUniqueness(
  existingBills: Bill[],
  payload: {
    stayId: string;
    billType: BillType | string;
    period: string;
    lineItems: Array<Pick<BillLineItem, 'obligationKey' | 'category'>>;
  }
): UniquenessCheckResult {
  // 1. Permanent Generic Rule: ObligationKey uniqueness
  const genericCheck = checkGenericObligationUniqueness(existingBills, payload.lineItems);
  if (genericCheck.isDuplicate) {
    return genericCheck;
  }

  // 2. Transitional Legacy Fallback: Rent Stay-Period compatibility
  const legacyRentCheck = checkLegacyRentCompatibility(
    existingBills,
    payload.stayId,
    payload.period,
    payload.billType
  );
  if (legacyRentCheck.isDuplicate) {
    return legacyRentCheck;
  }

  return { isDuplicate: false };
}
