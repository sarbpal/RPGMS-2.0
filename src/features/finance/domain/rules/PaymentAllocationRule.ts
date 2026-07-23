import type { Bill } from '../entities/Bill';
import type { PaymentAllocation } from '../valueObjects/PaymentValueObjects';
import { BillStatus } from '../valueObjects/BillValueObjects';

export interface PaymentAllocationResult {
  updatedBills: Bill[];
  allocations: PaymentAllocation[];
  allocatedTotal: number;
  advanceCreditTotal: number;
}

/**
 * Business Rule: Payment Allocation
 * 
 * Invariant: Payments received are automatically applied to open unpaid bills for a Stay
 * in chronological order of due date. Any overpayment becomes advance credit liability.
 */
export function calculatePaymentAllocations(unpaidBills: Bill[], paymentAmount: number): PaymentAllocationResult {
  if (paymentAmount <= 0) {
    throw new Error('Payment amount must be greater than 0.');
  }

  // Sort unpaid bills by due date ascending
  const sortedBills = [...unpaidBills].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  let remainingPayment = paymentAmount;
  const allocations: PaymentAllocation[] = [];
  const updatedBills: Bill[] = [];

  for (const bill of sortedBills) {
    if (remainingPayment <= 0) {
      updatedBills.push(bill);
      continue;
    }

    const billOwed = bill.totalAmount - bill.paidAmount;
    if (billOwed <= 0) {
      updatedBills.push(bill);
      continue;
    }

    const allocationAmount = Math.min(remainingPayment, billOwed);
    const newPaidAmount = Math.round((bill.paidAmount + allocationAmount) * 100) / 100;
    const newBalanceAmount = Math.round((bill.totalAmount - newPaidAmount) * 100) / 100;
    const newStatus =
      newBalanceAmount === 0 ? BillStatus.PAID : BillStatus.PARTIALLY_PAID;

    allocations.push({
      billId: bill.id,
      amount: allocationAmount,
    });

    updatedBills.push({
      ...bill,
      paidAmount: newPaidAmount,
      balanceAmount: newBalanceAmount,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    remainingPayment = Math.round((remainingPayment - allocationAmount) * 100) / 100;
  }

  const allocatedTotal = Math.round((paymentAmount - remainingPayment) * 100) / 100;
  const advanceCreditTotal = remainingPayment;

  return {
    updatedBills,
    allocations,
    allocatedTotal,
    advanceCreditTotal,
  };
}
