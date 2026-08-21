import { describe, it, expect, beforeEach } from 'vitest';
import { BillingApplicationService } from '../billingService';
import { InMemoryFinanceRepository } from '../../infrastructure/repositories/InMemoryFinanceRepository';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { AccountType } from '../../domain/valueObjects/AccountType';
import { LedgerReferenceType } from '../../domain/valueObjects/LedgerReferenceType';

describe('Stage 1 — Finance Domain Integration for Electricity Billing', () => {
  let financeRepo: InMemoryFinanceRepository;
  let stayRepo: InMemoryStayRepository;
  let billingService: BillingApplicationService;

  beforeEach(() => {
    const testStay = new Stay({
      id: 'stay-test-01',
      residentId: 'res-test-01',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-06-01',
      agreedRent: 10000,
      agreedDeposit: 10000,
      flatId: 'flat-101',
      allocatedBedIds: ['bed-01'],
    });

    financeRepo = new InMemoryFinanceRepository();
    financeRepo.saveBills([]);
    financeRepo.saveLedgerEntries([]);
    stayRepo = new InMemoryStayRepository([testStay]);
    billingService = new BillingApplicationService(financeRepo, stayRepo);
  });

  it('routes bills with line item category UTILITIES to ELECTRICITY_REVENUE instead of RENT_REVENUE', () => {
    const result = billingService.createBill({
      stayId: 'stay-test-01',
      billType: 'RECURRING_CHARGE',
      period: '2026-07',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      totalAmount: 1500,
      status: 'UNPAID',
      remarks: 'Electricity Allocation Bill (flat-101)',
      lineItems: [
        {
          id: 'li-01',
          description: 'Electricity Share Charge',
          amount: 1500,
          category: 'UTILITIES',
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.bill).toBeDefined();

    const ledgerEntries = financeRepo.getLedgerEntries();
    expect(ledgerEntries.length).toBe(2);

    const arEntry = ledgerEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
    const revenueEntry = ledgerEntries.find((e) => e.account === AccountType.ELECTRICITY_REVENUE);
    const rentEntry = ledgerEntries.find((e) => e.account === AccountType.RENT_REVENUE);

    expect(arEntry).toBeDefined();
    expect(arEntry?.debit).toBe(1500);

    expect(revenueEntry).toBeDefined();
    expect(revenueEntry?.credit).toBe(1500);
    expect(revenueEntry?.account).toBe('ELECTRICITY_REVENUE');

    // Must NOT credit RENT_REVENUE for electricity bills!
    expect(rentEntry).toBeUndefined();

    // Verify LedgerReferenceType is ELECTRICITY_ALLOCATION
    expect(arEntry?.referenceType).toBe(LedgerReferenceType.ELECTRICITY_ALLOCATION);
    expect(revenueEntry?.referenceType).toBe(LedgerReferenceType.ELECTRICITY_ALLOCATION);
  });

  it('detects and rejects duplicate electricity billing via Finance obligationKey uniqueness', () => {
    const obligationKey = 'ELECTRICITY:stay-test-01:part-01';

    // Post initial electricity bill with obligationKey
    const billResult = billingService.createBill({
      stayId: 'stay-test-01',
      billType: 'RECURRING_CHARGE',
      period: '2026-07',
      issueDate: '2026-08-01',
      dueDate: '2026-08-07',
      totalAmount: 1500,
      status: 'UNPAID',
      remarks: 'Electricity Allocation Bill',
      lineItems: [
        {
          id: 'li-01',
          description: 'Electricity Share Charge',
          amount: 1500,
          category: 'UTILITIES',
          obligationKey,
        },
      ],
    });

    expect(billResult.success).toBe(true);
    expect(billResult.bill).toBeDefined();

    // Verify finding by obligationKey
    const foundBill = billingService.findBillByObligationKey(obligationKey);
    expect(foundBill).not.toBeNull();
    expect(foundBill?.id).toBe(billResult.bill?.id);

    // Attempt second creation with the same obligationKey -> must be rejected by Finance uniqueness
    const duplicateResult = billingService.createBill({
      stayId: 'stay-test-01',
      billType: 'RECURRING_CHARGE',
      period: '2026-07',
      issueDate: '2026-08-02',
      dueDate: '2026-08-08',
      totalAmount: 1500,
      status: 'UNPAID',
      remarks: 'Duplicate Electricity Allocation Bill',
      lineItems: [
        {
          id: 'li-02',
          description: 'Electricity Share Charge Duplicate',
          amount: 1500,
          category: 'UTILITIES',
          obligationKey,
        },
      ],
    });

    expect(duplicateResult.success).toBe(false);
    expect(duplicateResult.bill).toBeNull();
    expect(duplicateResult.errors[0]).toContain(`Financial obligation '${obligationKey}' is already financially realized`);

    // Verify no second bill and no additional ledger entries
    expect(financeRepo.getBills().length).toBe(1);
    expect(financeRepo.getLedgerEntries().length).toBe(2);
  });
});
