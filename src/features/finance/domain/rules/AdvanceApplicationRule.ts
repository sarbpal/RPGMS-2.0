import type { Bill } from '../entities/Bill';
import { BillStatus } from '../valueObjects/BillValueObjects';

export interface AdvanceAllocation {
  billId: string;
  amount: number;
  remainingBillBalance: number;
}

export interface AdvanceAllocationResult {
  updatedBills: Bill[];
  allocations: AdvanceAllocation[];
  consumedTotal: number;
  remainingAdvance: number;
}

/**
 * Business Rule: Advance Credit Allocation
 * 
 * Invariant: Available Advance Credit for a Stay is automatically applied to open unpaid bills
 * in deterministic chronological order of due date (tiebreaker: creation timestamp and bill ID).
 * 
 * Pure domain function with zero side effects, no I/O, and no persistence dependencies.
 */
export function calculateAdvanceAllocations(
  openBills: Bill[],
  availableAdvance: number
): AdvanceAllocationResult {
  if (typeof availableAdvance !== 'number' || isNaN(availableAdvance) || availableAdvance <= 0) {
    return {
      updatedBills: [],
      allocations: [],
      consumedTotal: 0,
      remainingAdvance: 0,
    };
  }

  // Filter only eligible open bills (exclude PAID, CANCELLED, and fully settled bills)
  const eligibleBills = openBills.filter((b) => {
    const isEligibleStatus =
      b.status === BillStatus.UNPAID || b.status === BillStatus.PARTIALLY_PAID;
    const owed = b.totalAmount - (b.paidAmount || 0);
    return isEligibleStatus && owed > 0;
  });

  // Deterministic sorting: dueDate ASC, then createdAt ASC, then id ASC
  const sortedBills = [...eligibleBills].sort((a, b) => {
    const dueA = new Date(a.dueDate).getTime();
    const dueB = new Date(b.dueDate).getTime();
    if (dueA !== dueB) return dueA - dueB;

    const createdA = new Date(a.createdAt || 0).getTime();
    const createdB = new Date(b.createdAt || 0).getTime();
    if (createdA !== createdB) return createdA - createdB;

    return a.id.localeCompare(b.id);
  });

  let remainingAdvance = Math.round(availableAdvance * 100) / 100;
  const allocations: AdvanceAllocation[] = [];
  const updatedBills: Bill[] = [];

  for (const bill of sortedBills) {
    if (remainingAdvance <= 0) {
      break;
    }

    const billOwed = Math.round((bill.totalAmount - (bill.paidAmount || 0)) * 100) / 100;
    if (billOwed <= 0) {
      continue;
    }

    const allocationAmount = Math.round(Math.min(remainingAdvance, billOwed) * 100) / 100;
    if (allocationAmount <= 0) {
      continue;
    }

    const newPaidAmount = Math.round(((bill.paidAmount || 0) + allocationAmount) * 100) / 100;
    const newBalanceAmount = Math.round((bill.totalAmount - newPaidAmount) * 100) / 100;
    const newStatus =
      newBalanceAmount === 0 ? BillStatus.PAID : BillStatus.PARTIALLY_PAID;

    allocations.push({
      billId: bill.id,
      amount: allocationAmount,
      remainingBillBalance: newBalanceAmount,
    });

    updatedBills.push({
      ...bill,
      paidAmount: newPaidAmount,
      balanceAmount: newBalanceAmount,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    remainingAdvance = Math.round((remainingAdvance - allocationAmount) * 100) / 100;
  }

  const consumedTotal = Math.round((availableAdvance - remainingAdvance) * 100) / 100;

  return {
    updatedBills,
    allocations,
    consumedTotal,
    remainingAdvance,
  };
}
