import { describe, it, expect, beforeEach } from 'vitest';
import { BillingApplicationService } from '../billingService';
import { InMemoryFinanceRepository } from '../../infrastructure/repositories/InMemoryFinanceRepository';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { financeStorage } from '../../storage/financeStorage';
import { Stay } from '../../../stay/domain/entities/Stay';
import { CommercialAgreement } from '../../../stay/domain/valueObjects/CommercialAgreement';

describe('Financial Obligation Uniqueness Boundary (BR-416, ADR-032)', () => {
  let financeRepo: InMemoryFinanceRepository;
  let stayRepo: InMemoryStayRepository;
  let billingService: BillingApplicationService;

  beforeEach(() => {
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredLedgerEntries([]);
    financeRepo = new InMemoryFinanceRepository();
    stayRepo = new InMemoryStayRepository();
    billingService = new BillingApplicationService(financeRepo, stayRepo);

    const testStay = new Stay({
      id: 'STAY-U-01',
      residentId: 'RES-U-01',
      flatId: 'FLAT-101',
      stayType: 'REGULAR',
      checkInDate: '2026-08-01',
      status: 'ACTIVE',
      billingAnchorDay: 1,
      commercialAgreements: [
        new CommercialAgreement({
          id: 'CA-01',
          stayId: 'STAY-U-01',
          rent: 12000,
          securityDeposit: 24000,
          effectiveFrom: '2026-08-01',
          amendmentReason: 'Initial',
          status: 'ACTIVE',
        }),
      ],
    });
    stayRepo.save(testStay);
  });

  describe('1. Line-Item Obligation Key Uniqueness', () => {
    it('creates a bill with obligationKey successfully and rejects duplicate obligationKey', () => {
      const payload1 = {
        stayId: 'STAY-U-01',
        billType: 'ONE_TIME_CHARGE' as const,
        period: '2026-08',
        issueDate: '2026-08-05',
        dueDate: '2026-08-12',
        totalAmount: 1500,
        status: 'UNPAID' as const,
        lineItems: [
          {
            id: 'li-1',
            description: 'Locker Rental',
            amount: 1500,
            category: 'OTHER' as const,
            obligationKey: 'SERVICE:STAY-U-01:LOCKER-AUG',
          },
        ],
      };

      const result1 = billingService.createBill(payload1);
      expect(result1.success).toBe(true);
      expect(result1.bill).toBeDefined();

      const initialLedgerCount = financeRepo.getLedgerEntriesByStayId('STAY-U-01').length;
      expect(initialLedgerCount).toBe(2);

      // Attempt second creation with identical obligationKey
      const result2 = billingService.createBill(payload1);
      expect(result2.success).toBe(false);
      expect(result2.bill).toBeNull();
      expect(result2.errors[0]).toContain("Financial obligation 'SERVICE:STAY-U-01:LOCKER-AUG' is already financially realized");

      // Verify Ledger was not touched on rejection
      const finalLedgerCount = financeRepo.getLedgerEntriesByStayId('STAY-U-01').length;
      expect(finalLedgerCount).toBe(initialLedgerCount);
    });

    it('allows a new bill if a previously conflicting bill was CANCELLED', () => {
      const payload = {
        stayId: 'STAY-U-01',
        billType: 'ONE_TIME_CHARGE' as const,
        period: '2026-08',
        issueDate: '2026-08-05',
        dueDate: '2026-08-12',
        totalAmount: 500,
        status: 'UNPAID' as const,
        lineItems: [
          {
            id: 'li-1',
            description: 'Key Replacement',
            amount: 500,
            category: 'OTHER' as const,
            obligationKey: 'PENALTY:STAY-U-01:KEY-01',
          },
        ],
      };

      const result1 = billingService.createBill(payload);
      expect(result1.success).toBe(true);

      // Cancel the first bill
      const bill = result1.bill!;
      bill.status = 'CANCELLED';
      financeRepo.saveBill(bill);

      // Attempt re-creation of the obligation
      const result2 = billingService.createBill(payload);
      expect(result2.success).toBe(true);
      expect(result2.bill?.id).not.toBe(bill.id);
    });
  });

  describe('2. Monthly Rent Stay-Period Uniqueness', () => {
    it('enforces monthly rent stay-period uniqueness even when called directly via createBill', () => {
      const rentPayload = {
        stayId: 'STAY-U-01',
        billType: 'MONTHLY_RENT' as const,
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        totalAmount: 12000,
        status: 'UNPAID' as const,
        lineItems: [
          {
            id: 'li-rent-1',
            description: 'Monthly Rent - 2026-08',
            amount: 12000,
            category: 'RENT' as const,
          },
        ],
      };

      const res1 = billingService.createBill(rentPayload);
      expect(res1.success).toBe(true);

      // Duplicate monthly rent payload in the same period
      const res2 = billingService.createBill(rentPayload);
      expect(res2.success).toBe(false);
      expect(res2.errors[0]).toContain("Monthly rent bill already exists for Stay 'STAY-U-01' in period '2026-08'");
    });

    it('allows monthly rent bills for different periods and different stays', () => {
      const resAug = billingService.generateMonthlyRentBill('STAY-U-01', '2026-08');
      expect(resAug.success).toBe(true);
      expect(resAug.bill?.lineItems[0].obligationKey).toBe('RENT:STAY-U-01:2026-08-01');

      const resSep = billingService.generateMonthlyRentBill('STAY-U-01', '2026-09');
      expect(resSep.success).toBe(true);
      expect(resSep.bill?.lineItems[0].obligationKey).toBe('RENT:STAY-U-01:2026-09-01');

      // Verify bills exist in Finance
      const bills = financeRepo.getBillsByStayId('STAY-U-01');
      expect(bills).toHaveLength(2);
    });
  });

  describe('3. Query by Obligation Key', () => {
    it('locates an existing bill by its obligationKey', () => {
      billingService.createBill({
        stayId: 'STAY-U-01',
        billType: 'ONE_TIME_CHARGE' as const,
        period: '2026-08',
        issueDate: '2026-08-10',
        dueDate: '2026-08-15',
        totalAmount: 2000,
        status: 'UNPAID' as const,
        lineItems: [
          {
            id: 'li-x',
            description: 'Maintenance Work',
            amount: 2000,
            category: 'MAINTENANCE' as const,
            obligationKey: 'MAINT:STAY-U-01:WO-998',
          },
        ],
      });

      const found = billingService.findBillByObligationKey('MAINT:STAY-U-01:WO-998');
      expect(found).not.toBeNull();
      expect(found?.stayId).toBe('STAY-U-01');
      expect(found?.totalAmount).toBe(2000);

      const notFound = billingService.findBillByObligationKey('MAINT:STAY-U-01:NONEXISTENT');
      expect(notFound).toBeNull();
    });
  });

  describe('4. Legacy Rent Compatibility Protection (ADR-032)', () => {
    it('protects legacy Rent bills created without obligationKey from duplicate creation', () => {
      // Simulate historical legacy bill created before obligationKey enforcement
      financeRepo.saveBill({
        id: 'bill_legacy_rent_01',
        billNumber: 'INV-202608-0001',
        stayId: 'STAY-U-01',
        billType: 'MONTHLY_RENT' as const,
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        totalAmount: 12000,
        paidAmount: 0,
        balanceAmount: 12000,
        status: 'UNPAID' as const,
        lineItems: [
          {
            id: 'li_legacy_1',
            description: 'Monthly Rent - 2026-08',
            amount: 12000,
            category: 'RENT' as const,
            // Notice: obligationKey is undefined on legacy bill
          },
        ],
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
      });

      // Attempt manual or automated generation for the same stay and period
      const result = billingService.generateMonthlyRentBill('STAY-U-01', '2026-08');
      expect(result.success).toBe(false);
      expect(result.bill).toBeNull();
      expect(result.errors[0]).toContain("Monthly rent bill already exists for Stay 'STAY-U-01' in period '2026-08'");
    });
  });

  describe('5. Non-Rent Charges Isolation', () => {
    it('allows multiple non-Rent charges without obligationKeys to be created in the same period', () => {
      const charge1 = billingService.createBill({
        stayId: 'STAY-U-01',
        billType: 'ONE_TIME_CHARGE' as const,
        period: '2026-08',
        issueDate: '2026-08-05',
        dueDate: '2026-08-12',
        totalAmount: 300,
        status: 'UNPAID' as const,
        lineItems: [
          {
            id: 'li-misc-1',
            description: 'Printing Charges',
            amount: 300,
            category: 'OTHER' as const,
          },
        ],
      });
      expect(charge1.success).toBe(true);

      // Second ad-hoc charge in same period with different line item description
      const charge2 = billingService.createBill({
        stayId: 'STAY-U-01',
        billType: 'ONE_TIME_CHARGE' as const,
        period: '2026-08',
        issueDate: '2026-08-06',
        dueDate: '2026-08-13',
        totalAmount: 450,
        status: 'UNPAID' as const,
        lineItems: [
          {
            id: 'li-misc-2',
            description: 'Late Entry Fine',
            amount: 450,
            category: 'OTHER' as const,
          },
        ],
      });
      expect(charge2.success).toBe(true);
      expect(charge2.bill?.id).not.toBe(charge1.bill?.id);
    });
  });
});
