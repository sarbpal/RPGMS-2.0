import type { Bill } from '../entities/Bill';
import { BillType } from '../valueObjects/BillValueObjects';

/**
 * Business Rule: Duplicate Rent Prevention
 * 
 * Invariant: A Stay can have at most one MONTHLY_RENT bill generated for a given period (YYYY-MM).
 */
export function hasDuplicateRentBill(existingBills: Bill[], stayId: string, period: string): boolean {
  return existingBills.some(
    (bill) =>
      bill.stayId === stayId &&
      bill.billType === BillType.MONTHLY_RENT &&
      bill.period === period &&
      bill.status !== 'CANCELLED'
  );
}

export function validateNoDuplicateRentBill(existingBills: Bill[], stayId: string, period: string): void {
  if (hasDuplicateRentBill(existingBills, stayId, period)) {
    throw new Error(`A monthly rent bill has already been generated for stay '${stayId}' for period '${period}'.`);
  }
}
