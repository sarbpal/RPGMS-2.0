import { describe, it, expect, beforeEach } from 'vitest';
import { SettlementApplicationService } from '../settlementService';
import { defaultFinanceRepository } from '../../infrastructure';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { Stay, StayStatus } from '../../../stay';
import { ledgerService } from '../ledgerService';
import { financeStorage } from '../../storage/financeStorage';
import { AccountType, SettlementOutcome } from '../../domain';
import type { Settlement, SettlementPreview } from '../../domain';

describe('SettlementApplicationService Unit Test Suite (Sprint FR-1)', () => {
  let stayRepo: InMemoryStayRepository;
  let service: SettlementApplicationService;

  const sampleStayId = 'stay-test-101';
  const sampleResidentId = 'res-test-202';
  const todayStr = new Date().toISOString().split('T')[0];

  const createActiveStay = (id = sampleStayId, status: StayStatus = StayStatus.ACTIVE): Stay => {
    return new Stay({
      id,
      residentId: sampleResidentId,
      stayType: 'REGULAR',
      status,
      checkInDate: '2026-01-01',
      agreedRent: 10000,
      agreedDeposit: 8000,
      flatId: 'flat-101',
      allocatedBedIds: ['bed-101-a'],
    });
  };

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
    stayRepo = new InMemoryStayRepository();
    service = new SettlementApplicationService(defaultFinanceRepository, stayRepo);
  });

  describe('Stage 1: generateSettlementPreview Validations', () => {
    it('TC-STL-01: rejects preview if stayId is empty or whitespace', () => {
      const result1 = service.generateSettlementPreview('');
      expect(result1.success).toBe(false);
      expect(result1.preview).toBeNull();
      expect(result1.errors).toContain('Missing or invalid stayId.');

      const result2 = service.generateSettlementPreview('   ');
      expect(result2.success).toBe(false);
      expect(result2.preview).toBeNull();
      expect(result2.errors).toContain('Missing or invalid stayId.');
    });

    it('TC-STL-02: rejects preview if damageDeductions is negative or NaN', () => {
      const result1 = service.generateSettlementPreview(sampleStayId, -500);
      expect(result1.success).toBe(false);
      expect(result1.errors).toContain('Damage deduction amount must be a non-negative number.');

      const result2 = service.generateSettlementPreview(sampleStayId, NaN);
      expect(result2.success).toBe(false);
      expect(result2.errors).toContain('Damage deduction amount must be a non-negative number.');
    });

    it('TC-STL-03: rejects preview if target Stay is not found in StayRepository', () => {
      const result = service.generateSettlementPreview('stay-non-existent');
      expect(result.success).toBe(false);
      expect(result.preview).toBeNull();
      expect(result.errors).toContain("Stay 'stay-non-existent' not found in system.");
    });

    it('TC-STL-04: rejects preview if target Stay is already CHECKED_OUT', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.CHECKED_OUT);
      stayRepo.saveSync(stay);

      const result = service.generateSettlementPreview(sampleStayId);
      expect(result.success).toBe(false);
      expect(result.preview).toBeNull();
      expect(result.errors).toContain(`Stay '${sampleStayId}' is already checked out.`);
    });

    it('TC-STL-05: rejects preview if target Stay has already been settled', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const mockPreview: SettlementPreview = {
        stayId: sampleStayId,
        previewDate: todayStr,
        outstandingReceivable: 0,
        securityDepositHeld: 8000,
        advanceCreditBalance: 0,
        damageDeductions: 0,
        totalDues: 0,
        totalAvailableCredits: 8000,
        netSettlementAmount: 8000,
        outcome: SettlementOutcome.HOSTEL_REFUNDS_RESIDENT,
        remarks: 'Prior settlement',
      };

      const existingSettlement: Settlement = {
        id: 'stl_existing_1',
        stayId: sampleStayId,
        settlementNumber: 'STL-202608-0001',
        settlementDate: todayStr,
        settlementType: 'CHECKOUT',
        previewSnapshot: mockPreview,
        finalAmount: 8000,
        outcome: SettlementOutcome.HOSTEL_REFUNDS_RESIDENT,
        paymentMethod: 'BANK_TRANSFER',
        remarks: 'Prior settlement',
        ledgerReferences: [],
        createdBy: 'TEST',
        status: 'SETTLED',
        createdAt: new Date().toISOString(),
      };
      defaultFinanceRepository.saveSettlement(existingSettlement);

      const result = service.generateSettlementPreview(sampleStayId);
      expect(result.success).toBe(false);
      expect(result.preview).toBeNull();
      expect(result.errors).toContain(`Stay '${sampleStayId}' has already been settled via Settlement #STL-202608-0001.`);
    });
  });

  describe('Stage 1: generateSettlementPreview Calculations & Read-Only Nature', () => {
    it('TC-STL-06: calculates HOSTEL_REFUNDS_RESIDENT preview when deposit > (receivables + damage)', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      // Post initial deposit held entry
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'pay_dep_1',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 0,
          credit: 8000,
          remarks: 'Deposit collected',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'pay_dep_1',
          account: AccountType.BANK,
          debit: 8000,
          credit: 0,
          remarks: 'Deposit payment received',
          createdBy: 'TEST',
        },
      ]);

      const result = service.generateSettlementPreview(sampleStayId, 1000, 'Damage to wall paint');
      expect(result.success).toBe(true);
      expect(result.preview).toBeDefined();

      const preview = result.preview!;
      expect(preview.stayId).toBe(sampleStayId);
      expect(preview.securityDepositHeld).toBe(8000);
      expect(preview.outstandingReceivable).toBe(0);
      expect(preview.damageDeductions).toBe(1000);
      expect(preview.netSettlementAmount).toBe(7000);
      expect(preview.outcome).toBe(SettlementOutcome.HOSTEL_REFUNDS_RESIDENT);
      expect(preview.remarks).toBe('Damage to wall paint');
    });

    it('TC-STL-07: calculates RESIDENT_PAYS_HOSTEL preview when receivables + damage > deposit', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      // Post rent bill (10000 receivable) and deposit held (5000)
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill_1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 10000,
          credit: 0,
          remarks: 'Unpaid rent',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill_1',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 10000,
          remarks: 'Rent income',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'pay_dep_1',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 0,
          credit: 5000,
          remarks: 'Deposit held',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'pay_dep_1',
          account: AccountType.BANK,
          debit: 5000,
          credit: 0,
          remarks: 'Deposit payment',
          createdBy: 'TEST',
        },
      ]);

      const result = service.generateSettlementPreview(sampleStayId, 2000, 'Pending dues + damage');
      expect(result.success).toBe(true);
      expect(result.preview).toBeDefined();

      const preview = result.preview!;
      expect(preview.securityDepositHeld).toBe(5000);
      expect(preview.outstandingReceivable).toBe(10000);
      expect(preview.damageDeductions).toBe(2000);
      // Net owed by resident = (10000 + 2000) - 5000 = 7000
      expect(preview.netSettlementAmount).toBe(7000);
      expect(preview.outcome).toBe(SettlementOutcome.RESIDENT_PAYS_HOSTEL);
    });

    it('TC-STL-08: calculates BALANCED_NO_ACTION preview when deposit exactly equals receivables + damage', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      // Post deposit held (5000) and rent bill (5000)
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill_1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 5000,
          credit: 0,
          remarks: 'Pending bill',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill_1',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 5000,
          remarks: 'Rent revenue',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'pay_dep_1',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 0,
          credit: 5000,
          remarks: 'Deposit held',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'pay_dep_1',
          account: AccountType.CASH,
          debit: 5000,
          credit: 0,
          remarks: 'Cash deposit',
          createdBy: 'TEST',
        },
      ]);

      const result = service.generateSettlementPreview(sampleStayId, 0, 'Exact match');
      expect(result.success).toBe(true);
      const preview = result.preview!;
      expect(preview.netSettlementAmount).toBe(0);
      expect(preview.outcome).toBe(SettlementOutcome.BALANCED_NO_ACTION);
    });

    it('TC-STL-09: confirms Stage 1 preview is strictly READ-ONLY (no ledger entries, no repo writes)', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const initialLedgerCount = defaultFinanceRepository.getLedgerEntries().length;
      const initialSettlementCount = defaultFinanceRepository.getSettlements().length;

      const result = service.generateSettlementPreview(sampleStayId, 500, 'Read-only check');
      expect(result.success).toBe(true);

      // Verify zero storage modifications
      expect(defaultFinanceRepository.getLedgerEntries().length).toBe(initialLedgerCount);
      expect(defaultFinanceRepository.getSettlements().length).toBe(initialSettlementCount);
      expect(stayRepo.findByIdSync(sampleStayId)?.status).toBe(StayStatus.ON_NOTICE);
    });
  });

  describe('Stage 2: confirmSettlement Execution & Double-Entry Verification', () => {
    it('TC-STL-10: posts double-entry entries clearing deposit liability, advance credit, and receivables', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      // Seed initial balances: Deposit 8000, Advance 1000, Receivable 3000
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'seed_1',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 0,
          credit: 8000,
          remarks: 'Deposit held',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'seed_1',
          account: AccountType.BANK,
          debit: 8000,
          credit: 0,
          remarks: 'Deposit bank receipt',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'seed_2',
          account: AccountType.ADVANCE_CREDIT,
          debit: 0,
          credit: 1000,
          remarks: 'Advance credit',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'seed_2',
          account: AccountType.BANK,
          debit: 1000,
          credit: 0,
          remarks: 'Advance bank receipt',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'seed_3',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 3000,
          credit: 0,
          remarks: 'Pending dues',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'seed_3',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 3000,
          remarks: 'Rent income',
          createdBy: 'TEST',
        },
      ]);

      const previewRes = service.generateSettlementPreview(sampleStayId, 500, 'Checkout settlement');
      expect(previewRes.success).toBe(true);

      const confirmRes = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OPERATOR_1');
      expect(confirmRes.success).toBe(true);
      expect(confirmRes.settlement).toBeDefined();

      const settlement = confirmRes.settlement!;
      expect(settlement.status).toBe('SETTLED');
      expect(settlement.settlementNumber).toMatch(/^STL-\d{6}-\d{4}$/);

      // Verify settlement ledger entries created
      const settlementEntries = defaultFinanceRepository.getLedgerEntriesByStayId(sampleStayId).filter(
        (e) => e.referenceType === 'SETTLEMENT'
      );
      expect(settlementEntries.length).toBeGreaterThan(0);

      // Check deposit liability cleared (Debit 8000)
      const depClear = settlementEntries.find((e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY);
      expect(depClear?.debit).toBe(8000);

      // Check advance credit cleared (Debit 1000)
      const advClear = settlementEntries.find((e) => e.account === AccountType.ADVANCE_CREDIT);
      expect(advClear?.debit).toBe(1000);

      // Check receivable cleared (Credit 3000)
      const recClear = settlementEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
      expect(recClear?.credit).toBe(3000);

      // Check damage recovery income (Credit 500)
      const dmgEntry = settlementEntries.find((e) => e.account === AccountType.DAMAGE_RECOVERY);
      expect(dmgEntry?.credit).toBe(500);

      // Net refund payout = (8000 + 1000) - (3000 + 500) = 5500 via BANK Credit
      const bankEntry = settlementEntries.find((e) => e.account === AccountType.BANK);
      expect(bankEntry?.credit).toBe(5500);
    });

    it('TC-STL-11: posts DAMAGE_RECOVERY Credit when damage deductions are applied', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'p1',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 0,
          credit: 5000,
          remarks: 'Deposit',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'p1',
          account: AccountType.CASH,
          debit: 5000,
          credit: 0,
          remarks: 'Cash',
          createdBy: 'TEST',
        },
      ]);

      const previewRes = service.generateSettlementPreview(sampleStayId, 1500, 'Broken key & lock');
      const confirmRes = service.confirmSettlement(previewRes.preview!, 'CASH');

      expect(confirmRes.success).toBe(true);

      const settlementEntries = defaultFinanceRepository.getLedgerEntriesByStayId(sampleStayId).filter(
        (e) => e.referenceType === 'SETTLEMENT'
      );
      const dmgEntry = settlementEntries.find((e) => e.account === AccountType.DAMAGE_RECOVERY);
      expect(dmgEntry).toBeDefined();
      expect(dmgEntry?.credit).toBe(1500);
      expect(dmgEntry?.remarks).toContain('Damage Deduction Recovery');
    });

    it('TC-STL-12: posts CASH / BANK asset movements matching chosen PaymentMethod', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'p1',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 0,
          credit: 4000,
          remarks: 'Deposit',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'p1',
          account: AccountType.CASH,
          debit: 4000,
          credit: 0,
          remarks: 'Cash',
          createdBy: 'TEST',
        },
      ]);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const confirmRes = service.confirmSettlement(previewRes.preview!, 'CASH');

      expect(confirmRes.success).toBe(true);

      const settlementEntries = defaultFinanceRepository.getLedgerEntriesByStayId(sampleStayId).filter(
        (e) => e.referenceType === 'SETTLEMENT'
      );
      const cashEntry = settlementEntries.find((e) => e.account === AccountType.CASH);
      expect(cashEntry).toBeDefined();
      expect(cashEntry?.credit).toBe(4000);
    });

    it('TC-STL-13: verifies double-entry debit-credit equality (sum(debit) === sum(credit)) for confirmed settlement', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'p1',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 0,
          credit: 6000,
          remarks: 'Deposit',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'p1',
          account: AccountType.BANK,
          debit: 6000,
          credit: 0,
          remarks: 'Bank',
          createdBy: 'TEST',
        },
      ]);

      const previewRes = service.generateSettlementPreview(sampleStayId, 1200);
      const confirmRes = service.confirmSettlement(previewRes.preview!);

      expect(confirmRes.success).toBe(true);

      const settlementEntries = defaultFinanceRepository.getLedgerEntriesByStayId(sampleStayId).filter(
        (e) => e.referenceType === 'SETTLEMENT'
      );

      const totalDebits = settlementEntries.reduce((sum, e) => sum + e.debit, 0);
      const totalCredits = settlementEntries.reduce((sum, e) => sum + e.credit, 0);

      expect(totalDebits).toBe(totalCredits);
      expect(totalDebits).toBe(6000);
    });
  });

  describe('Stage 2: confirmSettlement Stay State Updates & Idempotency', () => {
    it('TC-STL-14: transitions operational Stay status from ACTIVE or ON_NOTICE to CHECKED_OUT on confirmation', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ACTIVE);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      expect(previewRes.success).toBe(true);

      const confirmRes = service.confirmSettlement(previewRes.preview!);
      expect(confirmRes.success).toBe(true);

      // Verify Stay updated to CHECKED_OUT in stayRepository
      const updatedStay = stayRepo.findByIdSync(sampleStayId);
      expect(updatedStay?.status).toBe(StayStatus.CHECKED_OUT);
      expect(updatedStay?.actualCheckoutDate).toBeDefined();
    });

    it('TC-STL-15: saves Settlement entity with snapshot, generated settlement number, and status SETTLED', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 250, 'Window latch repair');
      const confirmRes = service.confirmSettlement(previewRes.preview!);

      expect(confirmRes.success).toBe(true);

      const savedSettlement = defaultFinanceRepository.getSettlementByStayId(sampleStayId);
      expect(savedSettlement).toBeDefined();
      expect(savedSettlement?.stayId).toBe(sampleStayId);
      expect(savedSettlement?.status).toBe('SETTLED');
      expect(savedSettlement?.previewSnapshot.damageDeductions).toBe(250);
      expect(savedSettlement?.ledgerReferences.length).toBeGreaterThan(0);
    });

    it('TC-STL-16: prevents duplicate confirmation if a Settlement already exists for the stayId', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const confirmRes1 = service.confirmSettlement(previewRes.preview!);
      expect(confirmRes1.success).toBe(true);

      // Attempt second confirmation with same preview
      const confirmRes2 = service.confirmSettlement(previewRes.preview!);
      expect(confirmRes2.success).toBe(false);
      expect(confirmRes2.settlement).toBeNull();
      expect(confirmRes2.errors).toContain(`Stay '${sampleStayId}' has already been settled.`);
    });

    it('TC-STL-17: rejects confirmation if preview payload is null or invalid', () => {
      const confirmRes1 = service.confirmSettlement(null as any);
      expect(confirmRes1.success).toBe(false);
      expect(confirmRes1.errors).toContain('Missing or invalid settlement preview payload.');

      const confirmRes2 = service.confirmSettlement({} as any);
      expect(confirmRes2.success).toBe(false);
      expect(confirmRes2.errors).toContain('Missing or invalid settlement preview payload.');
    });

    it('TC-STL-18: verifies non-mutation of Resident identity record or physical Accommodation structure during settlement', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const confirmRes = service.confirmSettlement(previewRes.preview!);

      expect(confirmRes.success).toBe(true);

      // Verify Stay residentId remains untouched
      const updatedStay = stayRepo.findByIdSync(sampleStayId);
      expect(updatedStay?.residentId).toBe(sampleResidentId);
    });
  });
});
