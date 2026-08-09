import { describe, it, expect, beforeEach } from 'vitest';
import { BillingApplicationService } from '../billingService';
import { defaultFinanceRepository } from '../../infrastructure';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { AccountType } from '../../domain';

describe('BillingApplicationService Unit Test Suite (Sprint FR-3)', () => {
  let billingService: BillingApplicationService;
  let stayRepo: InMemoryStayRepository;

  const sampleStayId = 'stay-bill-101';
  const sampleStay = new Stay({
    id: sampleStayId,
    residentId: 'res-101',
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: '2026-08-01',
    agreedRent: 12000,
    agreedDeposit: 10000,
    allocatedBedIds: ['bed-101-a'],
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
  });

  describe('createBill Validation & Ledger Postings', () => {
    it('creates an invoice, posts Debit ACCOUNTS_RECEIVABLE and Credit RENT_REVENUE ledger entries', () => {
      const res = billingService.createBill({
        stayId: sampleStayId,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [
          {
            id: 'li-1',
            description: 'Monthly Rent - 2026-08',
            amount: 12000,
            category: 'RENT',
          },
        ],
        totalAmount: 12000,
        status: 'UNPAID',
        remarks: 'Monthly Rent Invoice',
      });

      expect(res.success).toBe(true);
      expect(res.bill).toBeDefined();
      expect(res.bill?.billNumber).toContain('INV-202608-');
      expect(res.bill?.status).toBe('UNPAID');

      // Verify Ledger Postings
      const entries = defaultFinanceRepository.getLedgerEntriesByStayId(sampleStayId);
      expect(entries).toHaveLength(2);

      const arEntry = entries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
      expect(arEntry?.debit).toBe(12000);
      expect(arEntry?.credit).toBe(0);

      const revEntry = entries.find((e) => e.account === AccountType.RENT_REVENUE);
      expect(revEntry?.debit).toBe(0);
      expect(revEntry?.credit).toBe(12000);
    });

    it('routes SECURITY_DEPOSIT category bill line items to SECURITY_DEPOSIT_LIABILITY account', () => {
      const res = billingService.createBill({
        stayId: sampleStayId,
        billType: 'ONE_TIME_CHARGE',
        period: '2026-08',


        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [
          {
            id: 'li-dep-1',
            description: 'Security Deposit Bill',
            amount: 8000,
            category: 'SECURITY_DEPOSIT',
          },
        ],
        totalAmount: 8000,
        status: 'UNPAID',
        remarks: 'Admission Deposit Invoice',
      });

      expect(res.success).toBe(true);
      const entries = defaultFinanceRepository.getLedgerEntriesByStayId(sampleStayId);
      const depEntry = entries.find((e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY);
      expect(depEntry).toBeDefined();
      expect(depEntry?.credit).toBe(8000);
    });

    it('rejects bill creation when stayId is missing or amount is invalid', () => {

      const invalidRes = billingService.createBill({
        stayId: '',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: '1', description: 'Rent', amount: 1000, category: 'RENT' }],
        totalAmount: -500,
        status: 'UNPAID',
      });

      expect(invalidRes.success).toBe(false);
      expect(invalidRes.errors).toContain('Missing or invalid stayId.');
      expect(invalidRes.errors).toContain('Bill total amount must be a positive number greater than zero.');
    });
  });

  describe('generateMonthlyRentBill Use Case', () => {
    it('fetches agreed rent from injected StayRepository and generates rent bill', () => {
      const res = billingService.generateMonthlyRentBill(sampleStayId, '2026-08');
      expect(res.success).toBe(true);
      expect(res.bill?.totalAmount).toBe(12000);
      expect(res.bill?.period).toBe('2026-08');
    });

    it('prevents duplicate monthly rent bill for the same stayId and period', () => {
      billingService.generateMonthlyRentBill(sampleStayId, '2026-08');
      const dupRes = billingService.generateMonthlyRentBill(sampleStayId, '2026-08');

      expect(dupRes.success).toBe(false);
      expect(dupRes.errors[0]).toContain('Monthly rent bill already exists');
    });

    it('returns error if stayId is not found in injected StayRepository', () => {
      const res = billingService.generateMonthlyRentBill('non-existent-stay', '2026-08');
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('not found');
    });
  });

  describe('Ancillary Charges (Laundry, One-time, Recurring)', () => {
    it('generates a laundry charge bill with category OTHER', () => {
      const res = billingService.generateLaundryChargeBill(
        sampleStayId,
        450,
        '2026-08-10',
        'Express Laundry Service'
      );

      expect(res.success).toBe(true);
      expect(res.bill?.totalAmount).toBe(450);
      expect(res.bill?.lineItems[0].description).toBe('Express Laundry Service');
    });
  });

  describe('Payment Allocation across Open Bills', () => {
    it('allocates payment sequentially to oldest unpaid bills and updates status', () => {
      // Create two open bills
      billingService.createBill({
        stayId: sampleStayId,
        billType: 'MONTHLY_RENT',
        period: '2026-07',
        issueDate: '2026-07-01',
        dueDate: '2026-07-07',
        lineItems: [{ id: 'li-1', description: 'July Rent', amount: 10000, category: 'RENT' }],
        totalAmount: 10000,
        status: 'UNPAID',
      });

      billingService.createBill({
        stayId: sampleStayId,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: 'li-2', description: 'August Rent', amount: 12000, category: 'RENT' }],
        totalAmount: 12000,
        status: 'UNPAID',
      });

      // Allocate 15,000 payment
      const allocations = billingService.allocatePaymentToBills(sampleStayId, 15000);

      expect(allocations).toHaveLength(2);
      expect(allocations[0].amount).toBe(10000); // Fully pays July bill
      expect(allocations[1].amount).toBe(5000);  // Partially pays August bill

      const updatedBills = defaultFinanceRepository.getBillsByStayId(sampleStayId);
      const julyBill = updatedBills.find((b) => b.period === '2026-07');
      const augBill = updatedBills.find((b) => b.period === '2026-08');

      expect(julyBill?.status).toBe('PAID');
      expect(julyBill?.balanceAmount).toBe(0);

      expect(augBill?.status).toBe('PARTIALLY_PAID');
      expect(augBill?.paidAmount).toBe(5000);
      expect(augBill?.balanceAmount).toBe(7000);
    });
  });
});
