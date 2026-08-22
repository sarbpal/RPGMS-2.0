import { describe, it, expect } from 'vitest';
import { calculateAdvanceAllocations } from '../AdvanceApplicationRule';
import type { Bill } from '../../entities/Bill';
import { BillStatus } from '../../valueObjects/BillValueObjects';

describe('AdvanceApplicationRule (Domain Rule)', () => {
  const createMockBill = (overrides: Partial<Bill>): Bill => ({
    id: 'bill-default',
    stayId: 'stay-101',
    billNumber: 'INV-202608-0001',
    billType: 'MONTHLY_RENT',
    period: '2026-08',
    issueDate: '2026-08-01',
    dueDate: '2026-08-05',
    lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    totalAmount: 10000,
    paidAmount: 0,
    balanceAmount: 10000,
    status: BillStatus.UNPAID,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    ...overrides,
  });

  it('Test 1 — No Advance available (<= 0) returns zero consumption with no mutations', () => {
    const bills = [createMockBill({ id: 'b1', totalAmount: 5000, balanceAmount: 5000 })];
    const res = calculateAdvanceAllocations(bills, 0);

    expect(res.consumedTotal).toBe(0);
    expect(res.remainingAdvance).toBe(0);
    expect(res.allocations).toHaveLength(0);
    expect(res.updatedBills).toHaveLength(0);
  });

  it('Test 2 — Advance < Bill results in partial payment', () => {
    const bills = [createMockBill({ id: 'b1', totalAmount: 10000, balanceAmount: 10000 })];
    const res = calculateAdvanceAllocations(bills, 4000);

    expect(res.consumedTotal).toBe(4000);
    expect(res.remainingAdvance).toBe(0);
    expect(res.allocations).toHaveLength(1);
    expect(res.allocations[0]).toEqual({
      billId: 'b1',
      amount: 4000,
      remainingBillBalance: 6000,
    });
    expect(res.updatedBills[0].paidAmount).toBe(4000);
    expect(res.updatedBills[0].balanceAmount).toBe(6000);
    expect(res.updatedBills[0].status).toBe(BillStatus.PARTIALLY_PAID);
  });

  it('Test 3 — Advance == Bill results in full payment and zero remaining advance', () => {
    const bills = [createMockBill({ id: 'b1', totalAmount: 8000, balanceAmount: 8000 })];
    const res = calculateAdvanceAllocations(bills, 8000);

    expect(res.consumedTotal).toBe(8000);
    expect(res.remainingAdvance).toBe(0);
    expect(res.allocations[0].amount).toBe(8000);
    expect(res.updatedBills[0].paidAmount).toBe(8000);
    expect(res.updatedBills[0].balanceAmount).toBe(0);
    expect(res.updatedBills[0].status).toBe(BillStatus.PAID);
  });

  it('Test 4 — Advance > Bill results in full payment with leftover advance', () => {
    const bills = [createMockBill({ id: 'b1', totalAmount: 6000, balanceAmount: 6000 })];
    const res = calculateAdvanceAllocations(bills, 10000);

    expect(res.consumedTotal).toBe(6000);
    expect(res.remainingAdvance).toBe(4000);
    expect(res.updatedBills[0].paidAmount).toBe(6000);
    expect(res.updatedBills[0].balanceAmount).toBe(0);
    expect(res.updatedBills[0].status).toBe(BillStatus.PAID);
  });

  it('Test 5 & 6 — Multiple bills ordered strictly by dueDate ascending', () => {
    const billA = createMockBill({
      id: 'bill-later',
      dueDate: '2026-08-10',
      totalAmount: 5000,
      balanceAmount: 5000,
      createdAt: '2026-08-01T12:00:00Z',
    });
    const billB = createMockBill({
      id: 'bill-earlier',
      dueDate: '2026-08-03',
      totalAmount: 4000,
      balanceAmount: 4000,
      createdAt: '2026-08-01T14:00:00Z',
    });

    const res = calculateAdvanceAllocations([billA, billB], 6000);

    expect(res.consumedTotal).toBe(6000);
    expect(res.remainingAdvance).toBe(0);
    expect(res.allocations).toHaveLength(2);

    // Earlier due date (bill-earlier) is settled first in full
    expect(res.allocations[0].billId).toBe('bill-earlier');
    expect(res.allocations[0].amount).toBe(4000);
    expect(res.allocations[0].remainingBillBalance).toBe(0);

    // Later due date (bill-later) receives the remaining 2,000
    expect(res.allocations[1].billId).toBe('bill-later');
    expect(res.allocations[1].amount).toBe(2000);
    expect(res.allocations[1].remainingBillBalance).toBe(3000);
  });

  it('Test 7 — createdAt tiebreaker when due dates are identical', () => {
    const bill1 = createMockBill({
      id: 'bill-first-created',
      dueDate: '2026-08-05',
      totalAmount: 3000,
      balanceAmount: 3000,
      createdAt: '2026-08-01T08:00:00Z',
    });
    const bill2 = createMockBill({
      id: 'bill-second-created',
      dueDate: '2026-08-05',
      totalAmount: 3000,
      balanceAmount: 3000,
      createdAt: '2026-08-01T12:00:00Z',
    });

    const res = calculateAdvanceAllocations([bill2, bill1], 4000);

    expect(res.allocations[0].billId).toBe('bill-first-created');
    expect(res.allocations[0].amount).toBe(3000);
    expect(res.allocations[1].billId).toBe('bill-second-created');
    expect(res.allocations[1].amount).toBe(1000);
  });

  it('Test 8 & 9 — CANCELLED and PAID bills are strictly excluded from allocation', () => {
    const cancelledBill = createMockBill({
      id: 'bill-cancelled',
      status: BillStatus.CANCELLED,
      totalAmount: 5000,
      balanceAmount: 5000,
    });
    const paidBill = createMockBill({
      id: 'bill-paid',
      status: BillStatus.PAID,
      totalAmount: 5000,
      paidAmount: 5000,
      balanceAmount: 0,
    });
    const openBill = createMockBill({
      id: 'bill-open',
      status: BillStatus.UNPAID,
      totalAmount: 5000,
      balanceAmount: 5000,
    });

    const res = calculateAdvanceAllocations([cancelledBill, paidBill, openBill], 10000);

    expect(res.consumedTotal).toBe(5000);
    expect(res.remainingAdvance).toBe(5000);
    expect(res.allocations).toHaveLength(1);
    expect(res.allocations[0].billId).toBe('bill-open');
  });
});
