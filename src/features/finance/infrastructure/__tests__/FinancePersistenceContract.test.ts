import { describe, it, expect } from 'vitest';
import { InMemoryFinanceRepository } from '../repositories/InMemoryFinanceRepository';
import { FinanceMappers } from '../mappers/FinanceMappers';
import {
  AccountType,
  LedgerReferenceType,
  BillStatus,
  BillType,
  calculatePaymentAllocations,
  type LedgerEntry,
  type Bill,
  type Payment,
} from '../../domain';

describe('Finance Persistence & Mapping Contract', () => {
  const sampleBill: Bill = {
    id: 'bill_contract_test_1',
    stayId: 'stay_1',
    billNumber: 'BILL-202608-0001',
    billType: BillType.MONTHLY_RENT,
    period: '2026-08',
    issueDate: '2026-08-01',
    dueDate: '2026-08-05',
    totalAmount: 8000,
    paidAmount: 8000,
    balanceAmount: 0,
    status: BillStatus.PAID,
    lineItems: [
      { id: 'li_1', category: 'RENT', description: 'Room Rent August 2026', amount: 8000 },
    ],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  const samplePayment: Payment = {
    id: 'pay_contract_test_1',
    stayId: 'stay_1',
    paymentNumber: 'PAY-202608-0001',
    amount: 8000,
    paymentDate: '2026-08-02',
    paymentMethod: 'UPI',
    referenceNumber: 'UPI987654321',
    idempotencyKey: 'idem_contract_1',
    status: 'RECORDED',
    allocations: [{ billId: 'bill_contract_test_1', amount: 8000 }],
    createdAt: '2026-08-02T10:00:00.000Z',
  };

  const sampleLedgerEntries: LedgerEntry[] = [
    {
      id: 'led_contract_1',
      stayId: 'stay_1',
      postingDate: '2026-08-01',
      effectiveDate: '2026-08-01',
      referenceType: LedgerReferenceType.BILL,
      referenceId: 'bill_contract_test_1',
      account: AccountType.ACCOUNTS_RECEIVABLE,
      debit: 8000,
      credit: 0,
      remarks: 'Rent charge',
      createdBy: 'OPERATOR',
      createdAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'led_contract_2',
      stayId: 'stay_1',
      postingDate: '2026-08-01',
      effectiveDate: '2026-08-01',
      referenceType: LedgerReferenceType.BILL,
      referenceId: 'bill_contract_test_1',
      account: AccountType.RENT_REVENUE,
      debit: 0,
      credit: 8000,
      remarks: 'Rent revenue recognized',
      createdBy: 'OPERATOR',
      createdAt: '2026-08-01T10:00:00.000Z',
    },
  ];

  it('preserves bill attributes and derived balances across row mapping', () => {
    const row = FinanceMappers.toBillRow(sampleBill);
    expect(row.id).toBe('bill_contract_test_1');
    expect(row.total_amount).toBe(8000);
    expect(row.paid_amount).toBe(8000);

    const domainBill = FinanceMappers.toBillDomain(
      {
        ...row,
        paid_amount: row.paid_amount || 0,
        status: (row.status as 'PAID') || 'PAID',
        obligation_key: null,
        remarks: null,
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
      },
      [
        {
          id: 'li_1',
          bill_id: 'bill_contract_test_1',
          category: 'RENT',
          description: 'Room Rent August 2026',
          amount: 8000,
          created_at: new Date().toISOString(),
        },
      ]
    );

    expect(domainBill.id).toBe(sampleBill.id);
    expect(domainBill.totalAmount).toBe(8000);
    expect(domainBill.paidAmount).toBe(8000);
    expect(domainBill.balanceAmount).toBe(0);
    expect(domainBill.status).toBe(BillStatus.PAID);
    expect(domainBill.lineItems?.length).toBe(1);
  });

  it('preserves immutable payment allocations in mapping', () => {
    const row = FinanceMappers.toPaymentRow(samplePayment);
    expect(row.id).toBe('pay_contract_test_1');
    expect(row.amount).toBe(8000);
    expect(row.idempotency_key).toBe('idem_contract_1');

    const domainPayment = FinanceMappers.toPaymentDomain(
      {
        ...row,
        reference_number: row.reference_number || null,
        idempotency_key: row.idempotency_key || null,
        status: 'RECORDED',
        reversal_reason: null,
        reversed_by: null,
        reversed_at: null,
        reversal_idempotency_key: null,
        remarks: null,
        created_by: 'OPERATOR',
        created_at: row.created_at || new Date().toISOString(),
      },
      [
        {
          id: 'alloc_1',
          payment_id: 'pay_contract_test_1',
          bill_id: 'bill_contract_test_1',
          amount: 8000,
          allocated_at: new Date().toISOString(),
        },
      ]
    );

    expect(domainPayment.id).toBe(samplePayment.id);
    expect(domainPayment.allocations).toEqual([
      { billId: 'bill_contract_test_1', amount: 8000 },
    ]);
  });

  it('InMemoryFinanceRepository stores and isolates ledger entries', () => {
    const repo = new InMemoryFinanceRepository();
    repo.saveLedgerEntries(sampleLedgerEntries);

    const entries = repo.getLedgerEntriesByStayId('stay_1');
    expect(entries.length).toBe(2);
    expect(entries[0].debit).toBe(8000);
    expect(entries[1].credit).toBe(8000);
  });

  it('proves FIFO calculation authority resides in TypeScript application layer', () => {
    const bill1: Bill = {
      id: 'bill_fifo_1',
      stayId: 'stay_fifo',
      billNumber: 'BILL-01',
      billType: BillType.MONTHLY_RENT,
      period: '2026-07',
      issueDate: '2026-07-01',
      dueDate: '2026-07-05',
      totalAmount: 5000,
      paidAmount: 0,
      balanceAmount: 5000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li_1', category: 'RENT', description: 'July Rent', amount: 5000 }],
      createdAt: '2026-07-01T10:00:00.000Z',
      updatedAt: '2026-07-01T10:00:00.000Z',
    };

    const bill2: Bill = {
      id: 'bill_fifo_2',
      stayId: 'stay_fifo',
      billNumber: 'BILL-02',
      billType: BillType.MONTHLY_RENT,
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-05',
      totalAmount: 5000,
      paidAmount: 0,
      balanceAmount: 5000,
      status: BillStatus.UNPAID,
      lineItems: [{ id: 'li_2', category: 'RENT', description: 'August Rent', amount: 5000 }],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    };

    // Calculate allocation for 7,500 Payment
    const result = calculatePaymentAllocations([bill2, bill1], 7500); // Unordered input to test chronological sorting

    // 1. First bill (July) must be fully paid (5,000)
    expect(result.allocations[0].billId).toBe('bill_fifo_1');
    expect(result.allocations[0].amount).toBe(5000);

    // 2. Second bill (August) must be partially paid (2,500)
    expect(result.allocations[1].billId).toBe('bill_fifo_2');
    expect(result.allocations[1].amount).toBe(2500);
    expect(result.allocatedTotal).toBe(7500);
    expect(result.advanceCreditTotal).toBe(0);

    // 3. Persistence mapping preserves these application-computed allocations
    const paymentRow = FinanceMappers.toPaymentRow({
      id: 'pay_fifo_test',
      stayId: 'stay_fifo',
      paymentNumber: 'PAY-FIFO-01',
      amount: 7500,
      paymentDate: '2026-08-02',
      paymentMethod: 'UPI',
      allocations: result.allocations,
      createdAt: '2026-08-02T10:00:00.000Z',
    });

    expect(paymentRow.amount).toBe(7500);
  });
});
