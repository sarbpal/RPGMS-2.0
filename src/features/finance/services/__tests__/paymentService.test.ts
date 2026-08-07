import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentApplicationService } from '../paymentService';
import { BillingApplicationService } from '../billingService';
import { defaultFinanceRepository } from '../../infrastructure';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { AccountType } from '../../domain';

describe('PaymentApplicationService Unit Test Suite (Sprint FR-3)', () => {
  let paymentService: PaymentApplicationService;
  let billingService: BillingApplicationService;
  let stayRepo: InMemoryStayRepository;

  const sampleStayId = 'stay-pay-101';
  const sampleStay = new Stay({
    id: sampleStayId,
    residentId: 'res-201',
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: '2026-08-01',
    agreedRent: 10000,
    agreedDeposit: 8000,
    allocatedBedIds: ['bed-101-b'],
  });

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rpgms_stays');
    }
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);

    stayRepo = new InMemoryStayRepository([sampleStay]);
    billingService = new BillingApplicationService(defaultFinanceRepository, stayRepo);
    paymentService = new PaymentApplicationService(defaultFinanceRepository, stayRepo);
  });

  describe('recordPayment Validation & Basic Flow', () => {
    it('records a payment, posts Debit CASH and Credit ACCOUNTS_RECEIVABLE ledger entries', () => {
      // Create a bill first so ACCOUNTS_RECEIVABLE exists
      billingService.createBill({
        stayId: sampleStayId,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
        totalAmount: 10000,
        status: 'UNPAID',
      });

      const res = paymentService.recordPayment({
        stayId: sampleStayId,
        paymentDate: '2026-08-05',
        amount: 10000,
        paymentMethod: 'CASH',
        referenceNumber: 'CASH-REC-001',
        remarks: 'Full rent payment in cash',
      });

      expect(res.success).toBe(true);
      expect(res.payment).toBeDefined();
      expect(res.payment?.paymentNumber).toContain('PAY-');
      expect(res.payment?.amount).toBe(10000);

      // Verify Ledger entries created
      const entries = defaultFinanceRepository.getLedgerEntriesByStayId(sampleStayId);
      // 2 entries from bill creation + 2 entries from payment
      const paymentEntries = entries.filter((e) => e.referenceType === 'PAYMENT');
      expect(paymentEntries).toHaveLength(2);

      const cashEntry = paymentEntries.find((e) => e.account === AccountType.CASH);
      expect(cashEntry?.debit).toBe(10000);

      const arEntry = paymentEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
      expect(arEntry?.credit).toBe(10000);
    });

    it('routes digital payment methods (UPI, BANK_TRANSFER, CHEQUE, CARD) to AccountType.BANK', () => {
      billingService.createBill({
        stayId: sampleStayId,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: 'li-1', description: 'Rent', amount: 5000, category: 'RENT' }],
        totalAmount: 5000,
        status: 'UNPAID',
      });

      const res = paymentService.recordPayment({
        stayId: sampleStayId,
        paymentDate: '2026-08-05',
        amount: 5000,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-12345678',
      });

      expect(res.success).toBe(true);
      const entries = defaultFinanceRepository.getLedgerEntriesByStayId(sampleStayId);
      const bankEntry = entries.find((e) => e.referenceType === 'PAYMENT' && e.account === AccountType.BANK);
      expect(bankEntry?.debit).toBe(5000);
    });

    it('rejects payment recording when amount is zero or negative', () => {
      const res = paymentService.recordPayment({
        stayId: sampleStayId,
        paymentDate: '2026-08-05',
        amount: -100,
        paymentMethod: 'CASH',
      });

      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('positive number greater than zero');
    });
  });

  describe('Overpayment Handling via ADVANCE_CREDIT', () => {
    it('splits payment into ACCOUNTS_RECEIVABLE reduction and ADVANCE_CREDIT credit when payment exceeds receivable', () => {
      // Create bill for 6,000
      billingService.createBill({
        stayId: sampleStayId,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: 'li-1', description: 'Rent', amount: 6000, category: 'RENT' }],
        totalAmount: 6000,
        status: 'UNPAID',
      });

      // Pay 10,000 (4,000 overpayment)
      const res = paymentService.recordPayment({
        stayId: sampleStayId,
        paymentDate: '2026-08-05',
        amount: 10000,
        paymentMethod: 'BANK_TRANSFER',
      });

      expect(res.success).toBe(true);

      const entries = defaultFinanceRepository.getLedgerEntriesByStayId(sampleStayId);
      const paymentEntries = entries.filter((e) => e.referenceType === 'PAYMENT');

      const arCredit = paymentEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
      expect(arCredit?.credit).toBe(6000);

      const advCredit = paymentEntries.find((e) => e.account === AccountType.ADVANCE_CREDIT);
      expect(advCredit?.credit).toBe(4000);
    });
  });
});
