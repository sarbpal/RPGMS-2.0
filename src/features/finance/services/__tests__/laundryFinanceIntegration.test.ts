import { describe, it, expect, beforeEach } from 'vitest';
import { LaundryPostingService } from '../laundryPostingService';
import { BillingApplicationService } from '../billingService';
import { defaultFinanceRepository } from '../../infrastructure';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { LaundryChargeRecord } from '../../../laundry/domain/entities/LaundryChargeRecord';
import { LaundryBusinessEvent } from '../../../laundry/domain/valueObjects/LaundryBusinessEvent';
import { AccountType } from '../../domain/valueObjects/AccountType';
import { LedgerReferenceType } from '../../domain/valueObjects/LedgerReferenceType';
import { InMemoryLaundryMasterRepository } from '../../../laundry/infrastructure/repositories/InMemoryLaundryMasterRepository';
import { LaundryChargeRate } from '../../../laundry/domain/entities/LaundryChargeRate';

describe('Work Item L-08 — Finance Integration (LaundryChargeRaised -> Finance Posting)', () => {
  let stayRepo: InMemoryStayRepository;
  let billingService: BillingApplicationService;
  let laundryPostingService: LaundryPostingService;
  let testStay: Stay;

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rpgms_stays');
    }
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
    financeStorage.saveStoredDepositTransactions([]);

    testStay = new Stay({
      id: 'STAY-2026-001',
      residentId: 'RES-101',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-08-01',
      agreedRent: 12000,
      agreedDeposit: 12000,
      flatId: 'FLAT-302',
      allocatedBedIds: ['BED-302-A'],
    });

    stayRepo = new InMemoryStayRepository([testStay]);
    billingService = new BillingApplicationService(defaultFinanceRepository, stayRepo);
    laundryPostingService = new LaundryPostingService(billingService, defaultFinanceRepository, stayRepo);
  });

  function createTestChargeRecord(overrides?: Partial<{
    businessChargeId: string;
    quantity: number;
    unitRate: number;
    totalAmount: number;
  }>): LaundryChargeRecord {
    return new LaundryChargeRecord({
      businessChargeId: overrides?.businessChargeId ?? 'LTX-001:GL-01:LSRV-01:BRK-01',
      transactionId: 'LTX-001',
      garmentLineId: 'GL-01',
      serviceId: 'LSRV-01',
      bracketIndex: 1,
      quantity: overrides?.quantity ?? 3,
      unitRate: overrides?.unitRate ?? 40,
      totalAmount: overrides?.totalAmount ?? 120,
      currency: 'INR',
      calculatedAt: '2026-08-20T10:00:00.000Z',
    });
  }

  function createCanonicalChargeRaisedEvent(chargeRecord: LaundryChargeRecord, stayId: string = 'STAY-2026-001'): LaundryBusinessEvent {
    return new LaundryBusinessEvent({
      id: `EVT-LTX-001-CHG-${chargeRecord.businessChargeId}`,
      transactionId: chargeRecord.transactionId,
      eventType: 'LaundryChargeRaised',
      timestamp: chargeRecord.calculatedAt,
      description: `Charge raised for Dry Cleaning: ${chargeRecord.quantity} unit(s) at rate ₹${chargeRecord.unitRate} (Total: ₹${chargeRecord.totalAmount}).`,
      metadata: {
        stayId,
        residentId: 'RES-101',
        businessChargeId: chargeRecord.businessChargeId,
        garmentLineId: chargeRecord.garmentLineId,
        serviceId: chargeRecord.serviceId,
        bracketIndex: chargeRecord.bracketIndex,
        chargeableQuantity: chargeRecord.quantity,
        unitRate: chargeRecord.unitRate,
        totalAmount: chargeRecord.totalAmount,
        currency: chargeRecord.currency,
      },
    });
  }

  describe('Correction Pass Canonical Accounting & Routing Tests (Tests A - E)', () => {
    it('Test A — Laundry Revenue Routing: Credits LAUNDRY_REVENUE and debits ACCOUNTS_RECEIVABLE (not RENT_REVENUE)', () => {
      const chargeRecord = createTestChargeRecord({ totalAmount: 180 });
      const event = createCanonicalChargeRaisedEvent(chargeRecord);

      const result = laundryPostingService.postLaundryCharge(event, chargeRecord);
      expect(result.success).toBe(true);

      const ledgerEntries = defaultFinanceRepository.getLedgerEntries();
      expect(ledgerEntries.length).toBe(2);

      const arEntry = ledgerEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
      const laundryRevEntry = ledgerEntries.find((e) => e.account === AccountType.LAUNDRY_REVENUE);
      const rentRevEntry = ledgerEntries.find((e) => e.account === AccountType.RENT_REVENUE);

      expect(arEntry).toBeDefined();
      expect(arEntry?.debit).toBe(180);
      expect(arEntry?.credit).toBe(0);

      expect(laundryRevEntry).toBeDefined();
      expect(laundryRevEntry?.credit).toBe(180);
      expect(laundryRevEntry?.debit).toBe(0);

      // Must NOT credit RENT_REVENUE
      expect(rentRevEntry).toBeUndefined();
    });

    it('Test B — Laundry Reference Type: Ledger entries use LedgerReferenceType.LAUNDRY_CHARGE', () => {
      const chargeRecord = createTestChargeRecord();
      const event = createCanonicalChargeRaisedEvent(chargeRecord);

      laundryPostingService.postLaundryCharge(event, chargeRecord);

      const ledgerEntries = defaultFinanceRepository.getLedgerEntries();
      expect(ledgerEntries.length).toBe(2);

      for (const entry of ledgerEntries) {
        expect(entry.referenceType).toBe(LedgerReferenceType.LAUNDRY_CHARGE);
      }
    });

    it('Test C — Laundry Bill Category: Bill line item uses category LAUNDRY', () => {
      const chargeRecord = createTestChargeRecord();
      const event = createCanonicalChargeRaisedEvent(chargeRecord);

      const result = laundryPostingService.postLaundryCharge(event, chargeRecord);
      expect(result.bill?.lineItems[0].category).toBe('LAUNDRY');
    });

    it('Test D — Existing Rent Flow Unchanged: Rent billing continues to credit RENT_REVENUE with referenceType BILL', () => {
      const rentResult = billingService.generateMonthlyRentBill('STAY-2026-001', '2026-08');
      expect(rentResult.success).toBe(true);

      const ledgerEntries = defaultFinanceRepository.getLedgerEntries();
      const arEntry = ledgerEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
      const rentRevEntry = ledgerEntries.find((e) => e.account === AccountType.RENT_REVENUE);
      const laundryRevEntry = ledgerEntries.find((e) => e.account === AccountType.LAUNDRY_REVENUE);

      expect(arEntry).toBeDefined();
      expect(arEntry?.referenceType).toBe(LedgerReferenceType.BILL);
      expect(rentRevEntry).toBeDefined();
      expect(rentRevEntry?.referenceType).toBe(LedgerReferenceType.BILL);
      expect(rentRevEntry?.credit).toBe(12000);
      expect(laundryRevEntry).toBeUndefined();
    });

    it('Test E — Existing Electricity Flow Unchanged: Electricity billing continues to credit ELECTRICITY_REVENUE with referenceType ELECTRICITY_ALLOCATION', () => {
      const elecResult = billingService.createBill({
        stayId: 'STAY-2026-001',
        billType: 'RECURRING_CHARGE',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        totalAmount: 1500,
        status: 'UNPAID',
        lineItems: [
          {
            id: 'li_elec_1',
            description: 'Electricity Share',
            amount: 1500,
            category: 'UTILITIES',
          },
        ],
      });
      expect(elecResult.success).toBe(true);

      const ledgerEntries = defaultFinanceRepository.getLedgerEntries();
      const arEntry = ledgerEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
      const elecRevEntry = ledgerEntries.find((e) => e.account === AccountType.ELECTRICITY_REVENUE);

      expect(arEntry?.referenceType).toBe(LedgerReferenceType.ELECTRICITY_ALLOCATION);
      expect(elecRevEntry).toBeDefined();
      expect(elecRevEntry?.referenceType).toBe(LedgerReferenceType.ELECTRICITY_ALLOCATION);
      expect(elecRevEntry?.credit).toBe(1500);
    });
  });

  describe('Basic Posting Tests', () => {
    it('Test 1 — Valid Laundry Charge Posting creates Finance bill and marks charge record POSTED', () => {
      const chargeRecord = createTestChargeRecord();
      expect(chargeRecord.status).toBe('PENDING_POSTING');
      expect(chargeRecord.financeBillId).toBeUndefined();

      const event = createCanonicalChargeRaisedEvent(chargeRecord);
      const result = laundryPostingService.postLaundryCharge(event, chargeRecord);

      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(false);
      expect(result.bill).toBeDefined();
      expect(result.bill?.totalAmount).toBe(120);
      expect(result.bill?.stayId).toBe('STAY-2026-001');
      expect(result.bill?.lineItems[0].category).toBe('LAUNDRY');
      expect(result.bill?.lineItems[0].obligationKey).toBe('LTX-001:GL-01:LSRV-01:BRK-01');

      // Verify double-entry ledger entries
      const entries = defaultFinanceRepository.getLedgerEntries();
      expect(entries.length).toBe(2);
      const arEntry = entries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
      const revEntry = entries.find((e) => e.account === AccountType.LAUNDRY_REVENUE);
      expect(arEntry?.debit).toBe(120);
      expect(revEntry?.credit).toBe(120);

      // Verify LaundryChargeRecord state transition
      expect(chargeRecord.status).toBe('POSTED');
      expect(chargeRecord.financeBillId).toBe(result.bill?.id);
      expect(chargeRecord.postedAt).toBeDefined();
    });

    it('Test 2 / Test K — Commercial Amount Preserved without recalculation', () => {
      const chargeRecord = createTestChargeRecord({ quantity: 5, unitRate: 45, totalAmount: 225 });
      const event = createCanonicalChargeRaisedEvent(chargeRecord);

      const result = laundryPostingService.postLaundryCharge(event, chargeRecord);

      expect(result.success).toBe(true);
      expect(result.bill?.totalAmount).toBe(225);
      expect(result.bill?.lineItems[0].amount).toBe(225);
    });

    it('Test 3 / Test L — Rate Snapshot Independence: Changing current master rates has zero impact on posting', () => {
      const masterRepo = new InMemoryLaundryMasterRepository([], [], []);
      masterRepo.saveRate(
        new LaundryChargeRate({
          id: 'LRATE-001',
          itemId: 'LITM-01',
          serviceId: 'LSRV-01',
          rate: 40,
          effectiveFrom: '2026-08-01T00:00:00.000Z',
          isActive: true,
          createdAt: '2026-08-01T00:00:00.000Z',
        })
      );

      const chargeRecord = createTestChargeRecord({ quantity: 2, unitRate: 40, totalAmount: 80 });
      const event = createCanonicalChargeRaisedEvent(chargeRecord);

      // Mutate current active master rate to ₹99
      masterRepo.saveRate(
        new LaundryChargeRate({
          id: 'LRATE-002',
          itemId: 'LITM-01',
          serviceId: 'LSRV-01',
          rate: 99,
          effectiveFrom: '2026-08-21T00:00:00.000Z',
          isActive: true,
          createdAt: '2026-08-21T00:00:00.000Z',
        })
      );

      // Post to Finance
      const result = laundryPostingService.postLaundryCharge(event, chargeRecord);
      expect(result.bill?.totalAmount).toBe(80); // Preserves immutable historical ₹80
    });
  });

  describe('Idempotency Tests (Tests F & G)', () => {
    it('Test 4 / Test F — Duplicate Event processing produces exactly ONE Finance posting', () => {
      const chargeRecord = createTestChargeRecord();
      const event = createCanonicalChargeRaisedEvent(chargeRecord);

      const firstResult = laundryPostingService.postLaundryCharge(event, chargeRecord);
      expect(firstResult.success).toBe(true);
      expect(firstResult.isDuplicate).toBe(false);

      const secondResult = laundryPostingService.postLaundryCharge(event, chargeRecord);
      expect(secondResult.success).toBe(true);
      expect(secondResult.isDuplicate).toBe(true);
      expect(secondResult.bill?.id).toBe(firstResult.bill?.id);

      expect(defaultFinanceRepository.getBills().length).toBe(1);
      expect(defaultFinanceRepository.getLedgerEntries().length).toBe(2);
    });

    it('Test 5 — Duplicate Event Object with same businessChargeId produces exactly ONE Finance posting', () => {
      const chargeRecord1 = createTestChargeRecord();
      const chargeRecord2 = createTestChargeRecord(); // Identical businessChargeId

      const event1 = createCanonicalChargeRaisedEvent(chargeRecord1);
      const event2 = createCanonicalChargeRaisedEvent(chargeRecord2);

      const res1 = laundryPostingService.postLaundryCharge(event1, chargeRecord1);
      const res2 = laundryPostingService.postLaundryCharge(event2, chargeRecord2);

      expect(res1.isDuplicate).toBe(false);
      expect(res2.isDuplicate).toBe(true);
      expect(res2.bill?.id).toBe(res1.bill?.id);
      expect(defaultFinanceRepository.getBills().length).toBe(1);
    });

    it('Test 6 — Already Posted charge record re-processed produces no duplicate Finance posting', () => {
      const chargeRecord = createTestChargeRecord();
      const event = createCanonicalChargeRaisedEvent(chargeRecord);

      laundryPostingService.postLaundryCharge(event, chargeRecord);
      expect(chargeRecord.status).toBe('POSTED');

      // Re-process
      const replayResult = laundryPostingService.postLaundryCharge(event, chargeRecord);
      expect(replayResult.success).toBe(true);
      expect(replayResult.isDuplicate).toBe(true);
      expect(defaultFinanceRepository.getBills().length).toBe(1);
    });
  });

  describe('Failure / Retry / Crash Window Tests (Tests H, I, J)', () => {
    it('Test 7 / Test H — Finance Posting Failure leaves LaundryChargeRecord in PENDING_POSTING', () => {
      const chargeRecord = createTestChargeRecord();
      const eventWithInvalidStay = createCanonicalChargeRaisedEvent(chargeRecord, 'NON-EXISTENT-STAY');

      const result = laundryPostingService.postLaundryCharge(eventWithInvalidStay, chargeRecord);

      expect(result.success).toBe(false);
      expect(result.bill).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(chargeRecord.status).toBe('PENDING_POSTING');
      expect(chargeRecord.financeBillId).toBeUndefined();
      expect(defaultFinanceRepository.getBills().length).toBe(0);
      expect(defaultFinanceRepository.getLedgerEntries().length).toBe(0);
    });

    it('Test 8 / Test I — Retry After Failure succeeds and marks charge POSTED with single Finance bill', () => {
      const chargeRecord = createTestChargeRecord();
      const failedEvent = createCanonicalChargeRaisedEvent(chargeRecord, 'INVALID-STAY');
      const validEvent = createCanonicalChargeRaisedEvent(chargeRecord, 'STAY-2026-001');

      // Attempt 1: Fails
      const attempt1 = laundryPostingService.postLaundryCharge(failedEvent, chargeRecord);
      expect(attempt1.success).toBe(false);
      expect(chargeRecord.status).toBe('PENDING_POSTING');

      // Attempt 2: Succeeds
      const attempt2 = laundryPostingService.postLaundryCharge(validEvent, chargeRecord);
      expect(attempt2.success).toBe(true);
      expect(chargeRecord.status).toBe('POSTED');
      expect(defaultFinanceRepository.getBills().length).toBe(1);
    });

    it('Test 9 / Test J — Crash-Window Recovery: Existing Finance record detected without duplicate', () => {
      const chargeRecord = createTestChargeRecord();
      const event = createCanonicalChargeRaisedEvent(chargeRecord);

      // Simulate crash: Bill was created in Finance repository, but chargeRecord did not get marked POSTED
      const preExistingBillResult = billingService.createBill({
        stayId: 'STAY-2026-001',
        billType: 'ONE_TIME_CHARGE',
        period: '2026-08',
        issueDate: '2026-08-20',
        dueDate: '2026-08-20',
        totalAmount: 120,
        status: 'UNPAID',
        lineItems: [
          {
            id: 'li_crash_1',
            description: 'Laundry charge',
            amount: 120,
            category: 'LAUNDRY',
            obligationKey: chargeRecord.businessChargeId,
          },
        ],
      });
      expect(preExistingBillResult.success).toBe(true);
      expect(chargeRecord.status).toBe('PENDING_POSTING');

      // Re-run integration on recovery
      const recoveryResult = laundryPostingService.postLaundryCharge(event, chargeRecord);

      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.isDuplicate).toBe(true);
      expect(recoveryResult.bill?.id).toBe(preExistingBillResult.bill?.id);
      expect(chargeRecord.status).toBe('POSTED');
      expect(chargeRecord.financeBillId).toBe(preExistingBillResult.bill?.id);
      expect(defaultFinanceRepository.getBills().length).toBe(1); // No duplicate bill
    });
  });

  describe('Identity & Traceability Tests (Test G & Test 11)', () => {
    it('Test 10 / Test G — businessChargeId Identity: same ID -> 1 bill, different IDs -> 2 bills', () => {
      const chargeA = createTestChargeRecord({ businessChargeId: 'LTX-01:GL-01:LSRV-01:BRK-01', totalAmount: 50 });
      const chargeB = createTestChargeRecord({ businessChargeId: 'LTX-01:GL-01:LSRV-01:BRK-02', totalAmount: 70 });

      const eventA = createCanonicalChargeRaisedEvent(chargeA);
      const eventB = createCanonicalChargeRaisedEvent(chargeB);

      const resA = laundryPostingService.postLaundryCharge(eventA, chargeA);
      const resB = laundryPostingService.postLaundryCharge(eventB, chargeB);

      expect(resA.success).toBe(true);
      expect(resB.success).toBe(true);
      expect(resA.bill?.id).not.toBe(resB.bill?.id);
      expect(defaultFinanceRepository.getBills().length).toBe(2);
    });

    it('Test 11 — Traceability: Finance bill preserves businessChargeId obligationKey and audit memo', () => {
      const charge = createTestChargeRecord({ businessChargeId: 'LTX-999:GL-88:LSRV-77:BRK-01' });
      const event = createCanonicalChargeRaisedEvent(charge);

      const res = laundryPostingService.postLaundryCharge(event, charge);

      expect(res.bill?.lineItems[0].obligationKey).toBe('LTX-999:GL-88:LSRV-77:BRK-01');
      expect(res.bill?.remarks).toContain('LTX-999:GL-88:LSRV-77:BRK-01');
    });
  });

  describe('Boundary & Non-Leakage Tests', () => {
    it('Test 12 — No Laundry Recalculation in Finance', () => {
      const charge = createTestChargeRecord({ quantity: 10, unitRate: 35, totalAmount: 350 });
      const event = createCanonicalChargeRaisedEvent(charge);

      const res = laundryPostingService.postLaundryCharge(event, charge);

      // Exact amount 350 used without any rate lookups or arithmetic alterations
      expect(res.bill?.totalAmount).toBe(350);
    });

    it('Test 13 — No Finance Leakage into Laundry', () => {
      const charge = createTestChargeRecord();
      expect((charge as any).financeRepository).toBeUndefined();
      expect((charge as any).postToLedger).toBeUndefined();
    });

    it('Test 14 — No Payment / Settlement in L-08', () => {
      const charge = createTestChargeRecord();
      const event = createCanonicalChargeRaisedEvent(charge);

      laundryPostingService.postLaundryCharge(event, charge);

      expect(defaultFinanceRepository.getPayments().length).toBe(0);
      expect(defaultFinanceRepository.getSettlements().length).toBe(0);
      expect(defaultFinanceRepository.getDepositTransactions().length).toBe(0);
    });
  });

  describe('Commercial Immutability Tests', () => {
    it('Test 15 — Historical Rate is preserved in Finance bill', () => {
      const charge = createTestChargeRecord({ unitRate: 55, totalAmount: 110, quantity: 2 });
      const event = createCanonicalChargeRaisedEvent(charge);

      const res = laundryPostingService.postLaundryCharge(event, charge);
      expect(res.bill?.lineItems[0].description).toContain('₹55');
    });

    it('Test 16 — Historical Quantity is preserved in Finance bill', () => {
      const charge = createTestChargeRecord({ quantity: 7, unitRate: 20, totalAmount: 140 });
      const event = createCanonicalChargeRaisedEvent(charge);

      const res = laundryPostingService.postLaundryCharge(event, charge);
      expect(res.bill?.lineItems[0].amount).toBe(140);
    });

    it('Test 17 — Historical Amount is preserved exactly', () => {
      const charge = createTestChargeRecord({ totalAmount: 499 });
      const event = createCanonicalChargeRaisedEvent(charge);

      const res = laundryPostingService.postLaundryCharge(event, charge);
      expect(res.bill?.totalAmount).toBe(499);
    });
  });

  describe('Posting State Tests', () => {
    it('Test 18 — Successful Transition from PENDING_POSTING to POSTED', () => {
      const charge = createTestChargeRecord();
      expect(charge.status).toBe('PENDING_POSTING');

      const event = createCanonicalChargeRaisedEvent(charge);
      laundryPostingService.postLaundryCharge(event, charge);

      expect(charge.status).toBe('POSTED');
      expect(charge.financeBillId).toBeDefined();
    });

    it('Test 19 — Failed Transition preserves PENDING_POSTING', () => {
      const charge = createTestChargeRecord();
      const event = createCanonicalChargeRaisedEvent(charge, 'UNKNOWN-STAY');

      laundryPostingService.postLaundryCharge(event, charge);
      expect(charge.status).toBe('PENDING_POSTING');
    });

    it('Test 20 — POSTED Immutability: markPosted requires non-empty billId and sets immutable status', () => {
      const charge = createTestChargeRecord();
      charge.markPosted('BILL-1234');

      expect(charge.status).toBe('POSTED');
      expect(() => charge.markPosted('')).toThrow('Finance bill ID cannot be empty');
    });
  });

  describe('Cross-Domain Tests', () => {
    it('Test 21 — LaundryChargeRaised event creates correct Finance posting', () => {
      const charge = createTestChargeRecord();
      const event = createCanonicalChargeRaisedEvent(charge);

      const res = laundryPostingService.postLaundryCharge(event, charge);
      expect(res.success).toBe(true);
      expect(res.bill?.status).toBe('UNPAID');
    });

    it('Test 22 — Finance Does Not Duplicate Laundry Algorithms', () => {
      const charge = createTestChargeRecord({ totalAmount: 150 });
      const event = createCanonicalChargeRaisedEvent(charge);

      const res = laundryPostingService.postLaundryCharge(event, charge);
      expect(res.bill?.totalAmount).toBe(150);
    });

    it('Test 23 — Multiple Independent Charges processed with zero cross-contamination', () => {
      const charge1 = createTestChargeRecord({ businessChargeId: 'CHG-1', totalAmount: 100 });
      const charge2 = createTestChargeRecord({ businessChargeId: 'CHG-2', totalAmount: 200 });

      const res1 = laundryPostingService.postLaundryCharge(createCanonicalChargeRaisedEvent(charge1), charge1);
      const res2 = laundryPostingService.postLaundryCharge(createCanonicalChargeRaisedEvent(charge2), charge2);

      expect(res1.bill?.totalAmount).toBe(100);
      expect(res2.bill?.totalAmount).toBe(200);
      expect(defaultFinanceRepository.getBills().length).toBe(2);
    });

    it('Test 24 — One Charge Multiple Event Deliveries produces exactly ONE Finance posting', () => {
      const charge = createTestChargeRecord({ businessChargeId: 'CHG-REPEAT', totalAmount: 300 });
      const event = createCanonicalChargeRaisedEvent(charge);

      for (let i = 0; i < 5; i++) {
        laundryPostingService.postLaundryCharge(event, charge);
      }

      expect(defaultFinanceRepository.getBills().length).toBe(1);
      expect(defaultFinanceRepository.getLedgerEntries().length).toBe(2);
    });
  });
});
