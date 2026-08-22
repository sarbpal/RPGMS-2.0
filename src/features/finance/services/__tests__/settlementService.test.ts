import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettlementApplicationService } from '../settlementService';
import { defaultFinanceRepository } from '../../infrastructure';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { Stay, StayStatus } from '../../../stay';
import { ledgerService } from '../ledgerService';
import { financeStorage } from '../../storage/financeStorage';
import { AccountType, SettlementOutcome, BillStatus } from '../../domain';
import type { Settlement, SettlementPreview, Bill } from '../../domain';
import { InMemoryResidentRepository, ResidentStatus } from '../../../resident';
import { billingService } from '../billingService';

describe('SettlementApplicationService Unit Test Suite (Sprint FR-1 & FC-04 Corrections)', () => {
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
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
    vi.restoreAllMocks();
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
    financeStorage.saveStoredDepositTransactions([]);
    stayRepo = new InMemoryStayRepository();
    residentRepo = new InMemoryResidentRepository();
    service = new SettlementApplicationService(
      defaultFinanceRepository,
      stayRepo,
      undefined,
      residentRepo
    );
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

    it('TC-STL-04: allows settlement preview generation for Stay with CHECKED_OUT status (BR-460)', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.CHECKED_OUT);
      stayRepo.saveSync(stay);

      const result = service.generateSettlementPreview(sampleStayId);
      expect(result.success).toBe(true);
      expect(result.preview).not.toBeNull();
      expect(result.preview?.stayId).toBe(sampleStayId);
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
      expect(preview.netSettlementAmount).toBe(7000);
      expect(preview.outcome).toBe(SettlementOutcome.RESIDENT_PAYS_HOSTEL);
    });

    it('TC-STL-08: calculates BALANCED_NO_ACTION preview when deposit exactly equals receivables + damage', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

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

      expect(defaultFinanceRepository.getLedgerEntries().length).toBe(initialLedgerCount);
      expect(defaultFinanceRepository.getSettlements().length).toBe(initialSettlementCount);
      expect(stayRepo.findByIdSync(sampleStayId)?.status).toBe(StayStatus.ON_NOTICE);
    });
  });

  describe('Stage 2: confirmSettlement Execution & Double-Entry Verification', () => {
    it('TC-STL-10: posts double-entry entries clearing deposit liability, advance credit, and receivables', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

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

      const settlementEntries = defaultFinanceRepository.getLedgerEntriesByStayId(sampleStayId).filter(
        (e) => e.referenceType === 'SETTLEMENT'
      );
      expect(settlementEntries.length).toBeGreaterThan(0);

      const depClear = settlementEntries.find((e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY);
      expect(depClear?.debit).toBe(8000);

      const advClear = settlementEntries.find((e) => e.account === AccountType.ADVANCE_CREDIT);
      expect(advClear?.debit).toBe(1000);

      const recClear = settlementEntries.find((e) => e.account === AccountType.ACCOUNTS_RECEIVABLE);
      expect(recClear?.credit).toBe(3000);

      const dmgEntry = settlementEntries.find((e) => e.account === AccountType.DAMAGE_RECOVERY);
      expect(dmgEntry?.credit).toBe(500);

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

  describe('Stage 2: Decoupled Operational Checkout & Resident Alumni Transition', () => {
    it('TC-STL-14: does NOT perform operational checkout directly (decoupled per BR-460)', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ACTIVE);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      expect(previewRes.success).toBe(true);

      const confirmRes = service.confirmSettlement(previewRes.preview!);
      expect(confirmRes.success).toBe(true);

      // Operational status remains intact (checkout is managed separately by StayCheckoutCoordinator)
      const stayAfter = stayRepo.findByIdSync(sampleStayId);
      expect(stayAfter?.status).toBe(StayStatus.ACTIVE);
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

    it('TC-STL-16: prevents duplicate confirmation without idempotency key if a Settlement already exists', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const confirmRes1 = service.confirmSettlement(previewRes.preview!);
      expect(confirmRes1.success).toBe(true);

      const confirmRes2 = service.confirmSettlement(previewRes.preview!);
      expect(confirmRes2.success).toBe(false);
      expect(confirmRes2.settlement).toBeNull();
      expect(confirmRes2.errors[0]).toContain(`Stay '${sampleStayId}' has already been settled`);
    });

    it('TC-STL-17: rejects confirmation if preview payload is null or invalid', () => {
      const confirmRes1 = service.confirmSettlement(null as any);
      expect(confirmRes1.success).toBe(false);
      expect(confirmRes1.errors).toContain('Missing or invalid settlement preview payload.');

      const confirmRes2 = service.confirmSettlement({} as any);
      expect(confirmRes2.success).toBe(false);
      expect(confirmRes2.errors).toContain('Missing or invalid settlement preview payload.');
    });

    it('TC-STL-18: verifies non-mutation of Resident identity record during settlement', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const confirmRes = service.confirmSettlement(previewRes.preview!);

      expect(confirmRes.success).toBe(true);

      const updatedStay = stayRepo.findByIdSync(sampleStayId);
      expect(updatedStay?.residentId).toBe(sampleResidentId);
    });

    it('TC-STL-19: converts Resident status to ALUMNI upon settlement completion if no other active stays exist (BR-461)', () => {
      const resident = {
        id: sampleResidentId,
        residentCode: 'R-101',
        fullName: 'Alumni Test Resident',
        status: ResidentStatus.ACTIVE,
        mobileNumber: '9876543210',
        createdAt: todayStr,
        updatedAt: todayStr,
      };
      residentRepo.save(resident);

      const stay = createActiveStay(sampleStayId, StayStatus.CHECKED_OUT);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const confirmRes = service.confirmSettlement(previewRes.preview!);

      expect(confirmRes.success).toBe(true);

      const updatedResident = residentRepo.getByIdSync(sampleResidentId);
      expect(updatedResident?.status).toBe(ResidentStatus.ALUMNI);
    });
  });

  describe('FC-04 Correction B: Settlement ↔ Bill Synchronization Semantics', () => {
    it('CASE 1 — Single Open Bill: marks bill PAID with balance 0 and paid equal to total', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

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

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      expect(previewRes.success).toBe(true);
      expect(previewRes.preview?.outstandingReceivable).toBe(10000);

      const confirmRes = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER');
      expect(confirmRes.success).toBe(true);

      const billsAfter = defaultFinanceRepository.getBillsByStayId(sampleStayId);
      expect(billsAfter).toHaveLength(1);
      expect(billsAfter[0].status).toBe(BillStatus.PAID);
      expect(billsAfter[0].paidAmount).toBe(10000);
      expect(billsAfter[0].balanceAmount).toBe(0);
    });

    it('CASE 2 — Partially Paid Bill: adds settlement allocation to existing paidAmount without corrupting prior payments', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const bill: Bill = {
        id: 'bill-partial-1',
        stayId: sampleStayId,
        billNumber: 'INV-202608-0099',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
        totalAmount: 10000,
        paidAmount: 4000,
        balanceAmount: 6000,
        status: 'PARTIALLY_PAID',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-05T00:00:00Z',
      };
      defaultFinanceRepository.saveBill(bill);

      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill-partial-1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 6000,
          credit: 0,
          remarks: 'Remaining receivable',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill-partial-1',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 6000,
          remarks: 'Rent revenue',
          createdBy: 'TEST',
        },
      ]);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      expect(previewRes.success).toBe(true);
      expect(previewRes.preview?.outstandingReceivable).toBe(6000);

      const confirmRes = service.confirmSettlement(previewRes.preview!, 'CASH');
      expect(confirmRes.success).toBe(true);

      const updatedBill = defaultFinanceRepository.getBillsByStayId(sampleStayId).find((b) => b.id === 'bill-partial-1');
      expect(updatedBill?.status).toBe(BillStatus.PAID);
      expect(updatedBill?.paidAmount).toBe(10000); // 4000 prior + 6000 settlement
      expect(updatedBill?.balanceAmount).toBe(0);
    });

    it('CASE 3 & 6 — Multiple Bills & Future Bills: resolves only obligations matching authoritative settlement amount, leaves future obligations untouched', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      // Current bill (₹6,000 due today) - posted to ledger
      const currentBill: Bill = {
        id: 'bill-current-1',
        stayId: sampleStayId,
        billNumber: 'INV-202608-0001',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-05',
        lineItems: [{ id: 'li-1', description: 'Current Rent', amount: 6000, category: 'RENT' }],
        totalAmount: 6000,
        paidAmount: 0,
        balanceAmount: 6000,
        status: 'UNPAID',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      };

      // Future/Unrealized bill (₹10,000 due next month) - NOT in settlement AR
      const futureBill: Bill = {
        id: 'bill-future-1',
        stayId: sampleStayId,
        billNumber: 'INV-202609-0001',
        billType: 'MONTHLY_RENT',
        period: '2026-09',
        issueDate: '2026-09-01',
        dueDate: '2026-09-07',
        lineItems: [{ id: 'li-2', description: 'Future Rent', amount: 10000, category: 'RENT' }],
        totalAmount: 10000,
        paidAmount: 0,
        balanceAmount: 10000,
        status: 'UNPAID',
        createdAt: '2026-09-01T00:00:00Z',
        updatedAt: '2026-09-01T00:00:00Z',
      };

      defaultFinanceRepository.saveBills([currentBill, futureBill]);

      // Seed AR ledger entry only for the current bill (6,000)
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill-current-1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 6000,
          credit: 0,
          remarks: 'Current bill receivable',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill-current-1',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 6000,
          remarks: 'Rent revenue',
          createdBy: 'TEST',
        },
      ]);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      expect(previewRes.preview?.outstandingReceivable).toBe(6000);

      const confirmRes = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER');
      expect(confirmRes.success).toBe(true);

      const billsAfter = defaultFinanceRepository.getBillsByStayId(sampleStayId);
      const resCurrent = billsAfter.find((b) => b.id === 'bill-current-1');
      const resFuture = billsAfter.find((b) => b.id === 'bill-future-1');

      // Current bill is resolved and PAID
      expect(resCurrent?.status).toBe(BillStatus.PAID);
      expect(resCurrent?.balanceAmount).toBe(0);
      expect(resCurrent?.paidAmount).toBe(6000);

      // Future bill is NOT resolved and remains UNPAID with 10,000 balance
      expect(resFuture?.status).toBe(BillStatus.UNPAID);
      expect(resFuture?.balanceAmount).toBe(10000);
      expect(resFuture?.paidAmount).toBe(0);
    });

    it('CASE 4 — Already Paid Bill: remains historically untouched with intact paidAmount', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const alreadyPaidBill: Bill = {
        id: 'bill-already-paid',
        stayId: sampleStayId,
        billNumber: 'INV-202607-0001',
        billType: 'MONTHLY_RENT',
        period: '2026-07',
        issueDate: '2026-07-01',
        dueDate: '2026-07-07',
        lineItems: [{ id: 'li-0', description: 'July Rent', amount: 8000, category: 'RENT' }],
        totalAmount: 8000,
        paidAmount: 8000,
        balanceAmount: 0,
        status: 'PAID',
        createdAt: '2026-07-01T00:00:00Z',
        updatedAt: '2026-07-05T00:00:00Z',
      };
      defaultFinanceRepository.saveBill(alreadyPaidBill);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const confirmRes = service.confirmSettlement(previewRes.preview!);
      expect(confirmRes.success).toBe(true);

      const billAfter = defaultFinanceRepository.getBillsByStayId(sampleStayId).find((b) => b.id === 'bill-already-paid');
      expect(billAfter?.status).toBe(BillStatus.PAID);
      expect(billAfter?.paidAmount).toBe(8000);
      expect(billAfter?.balanceAmount).toBe(0);
      expect(billAfter?.updatedAt).toBe('2026-07-05T00:00:00Z');
    });

    it('CASE 5 — Cancelled Bill: remains CANCELLED and is not resurrected', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const cancelledBill: Bill = {
        id: 'bill-cancelled-1',
        stayId: sampleStayId,
        billNumber: 'INV-202608-0002',
        billType: 'ONE_TIME_CHARGE',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-01',
        lineItems: [{ id: 'li-c', description: 'Cancelled fine', amount: 2000, category: 'OTHER' }],
        totalAmount: 2000,
        paidAmount: 0,
        balanceAmount: 2000,
        status: 'CANCELLED',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      };
      defaultFinanceRepository.saveBill(cancelledBill);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const confirmRes = service.confirmSettlement(previewRes.preview!);
      expect(confirmRes.success).toBe(true);

      const billAfter = defaultFinanceRepository.getBillsByStayId(sampleStayId).find((b) => b.id === 'bill-cancelled-1');
      expect(billAfter?.status).toBe(BillStatus.CANCELLED);
      expect(billAfter?.paidAmount).toBe(0);
      expect(billAfter?.balanceAmount).toBe(2000);
    });

    it('CASE 7 — Multiple Source Domain Obligations: synchronizes Rent, Laundry, and Electricity bills maintaining source identity', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const rentBill: Bill = {
        id: 'bill-rent-1',
        stayId: sampleStayId,
        billNumber: 'INV-202608-R01',
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-05',
        lineItems: [{ id: 'li-r', description: 'Monthly Rent', amount: 8000, category: 'RENT' }],
        totalAmount: 8000,
        paidAmount: 0,
        balanceAmount: 8000,
        status: 'UNPAID',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      };

      const laundryBill: Bill = {
        id: 'bill-laundry-1',
        stayId: sampleStayId,
        billNumber: 'INV-202608-L01',
        billType: 'ONE_TIME_CHARGE',
        period: '2026-08',
        issueDate: '2026-08-03',
        dueDate: '2026-08-06',
        lineItems: [{ id: 'li-l', description: 'Dry Cleaning Service', amount: 500, category: 'LAUNDRY' }],
        totalAmount: 500,
        paidAmount: 0,
        balanceAmount: 500,
        status: 'UNPAID',
        createdAt: '2026-08-03T00:00:00Z',
        updatedAt: '2026-08-03T00:00:00Z',
      };

      const electricityBill: Bill = {
        id: 'bill-elec-1',
        stayId: sampleStayId,
        billNumber: 'INV-202608-E01',
        billType: 'ONE_TIME_CHARGE',
        period: '2026-08',
        issueDate: '2026-08-04',
        dueDate: '2026-08-07',
        lineItems: [{ id: 'li-e', description: 'August Electricity Units', amount: 1500, category: 'UTILITIES' }],
        totalAmount: 1500,
        paidAmount: 0,
        balanceAmount: 1500,
        status: 'UNPAID',
        createdAt: '2026-08-04T00:00:00Z',
        updatedAt: '2026-08-04T00:00:00Z',
      };

      defaultFinanceRepository.saveBills([rentBill, laundryBill, electricityBill]);

      // Seed AR ledger entries matching all 3 bills
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill-rent-1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 8000,
          credit: 0,
          remarks: 'Rent',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill-rent-1',
          account: AccountType.RENT_REVENUE,
          debit: 0,
          credit: 8000,
          remarks: 'Rent Rev',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill-laundry-1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 500,
          credit: 0,
          remarks: 'Laundry',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill-laundry-1',
          account: AccountType.LAUNDRY_REVENUE,
          debit: 0,
          credit: 500,
          remarks: 'Laundry Rev',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill-elec-1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 1500,
          credit: 0,
          remarks: 'Electricity',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'BILL',
          referenceId: 'bill-elec-1',
          account: AccountType.ELECTRICITY_REVENUE,
          debit: 0,
          credit: 1500,
          remarks: 'Electricity Rev',
          createdBy: 'TEST',
        },
      ]);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      expect(previewRes.preview?.outstandingReceivable).toBe(10000);

      const confirmRes = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER');
      expect(confirmRes.success).toBe(true);

      const billsAfter = defaultFinanceRepository.getBillsByStayId(sampleStayId);
      const resRent = billsAfter.find((b) => b.id === 'bill-rent-1');
      const resLaundry = billsAfter.find((b) => b.id === 'bill-laundry-1');
      const resElec = billsAfter.find((b) => b.id === 'bill-elec-1');

      expect(resRent?.status).toBe(BillStatus.PAID);
      expect(resRent?.balanceAmount).toBe(0);
      expect(resRent?.paidAmount).toBe(8000);
      expect(resRent?.lineItems[0].category).toBe('RENT');

      expect(resLaundry?.status).toBe(BillStatus.PAID);
      expect(resLaundry?.balanceAmount).toBe(0);
      expect(resLaundry?.paidAmount).toBe(500);
      expect(resLaundry?.lineItems[0].category).toBe('LAUNDRY');

      expect(resElec?.status).toBe(BillStatus.PAID);
      expect(resElec?.balanceAmount).toBe(0);
      expect(resElec?.paidAmount).toBe(1500);
      expect(resElec?.lineItems[0].category).toBe('UTILITIES');
    });
  });

  describe('FC-04 Correction A: Partial Failure Safety & Compensating Rollback', () => {
    it('FAILURE SCENARIO 1: Ledger posting failure before realization causes zero mutations and clean failure', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

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

      const initialLedgerCount = defaultFinanceRepository.getLedgerEntries().length;
      const previewRes = service.generateSettlementPreview(sampleStayId, 0);

      // Force ledgerService.postEntries to fail
      const mockLedgerService = {
        postEntries: vi.fn().mockReturnValue({ success: false, entries: [], errors: ['Ledger database connection error'] }),
      };
      const failingService = new SettlementApplicationService(
        defaultFinanceRepository,
        stayRepo,
        mockLedgerService as any,
        residentRepo
      );

      const confirmRes = failingService.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OP', 'idem-fail-1');
      expect(confirmRes.success).toBe(false);
      expect(confirmRes.settlement).toBeNull();
      expect(confirmRes.errors[0]).toContain('Ledger database connection error');

      // State is pristine
      expect(defaultFinanceRepository.getLedgerEntries().length).toBe(initialLedgerCount);
      expect(defaultFinanceRepository.getSettlements().length).toBe(0);
    });

    it('FAILURE SCENARIO 2: DepositTransaction save failure rolls back Ledger entries and leaves state clean for retry', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      // Seed deposit of 5,000
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
          account: AccountType.BANK,
          debit: 5000,
          credit: 0,
          remarks: 'Bank',
          createdBy: 'TEST',
        },
      ]);

      const initialLedgerEntries = defaultFinanceRepository.getLedgerEntries().length;
      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const idempotencyKey = 'idem-fail-deposit-retry';

      // Mock saveDepositTransaction to fail on first attempt
      const origSaveDeposit = defaultFinanceRepository.saveDepositTransaction.bind(defaultFinanceRepository);
      let hasFailedOnce = false;
      vi.spyOn(defaultFinanceRepository, 'saveDepositTransaction').mockImplementation((tx) => {
        if (!hasFailedOnce) {
          hasFailedOnce = true;
          throw new Error('Disk full on deposit transaction storage');
        }
        return origSaveDeposit(tx);
      });

      // First attempt fails
      const confirmRes1 = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OP', idempotencyKey);
      expect(confirmRes1.success).toBe(false);
      expect(confirmRes1.errors[0]).toContain('Disk full on deposit transaction storage');

      // Assert complete rollback: ledger entries restored, no orphan entries
      expect(defaultFinanceRepository.getLedgerEntries().length).toBe(initialLedgerEntries);
      expect(defaultFinanceRepository.getDepositTransactions().length).toBe(0);

      // Retry with the SAME idempotencyKey succeeds without duplicate ledger entries
      const confirmRes2 = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OP', idempotencyKey);
      expect(confirmRes2.success).toBe(true);
      expect(confirmRes2.settlement?.idempotencyKey).toBe(idempotencyKey);
      expect(defaultFinanceRepository.getDepositTransactions().length).toBe(1);
    });

    it('FAILURE SCENARIO 3: Bill synchronization save failure rolls back Ledger entries and leaves state clean for retry', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      billingService.createBill({
        stayId: sampleStayId,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: 'li-1', description: 'Rent', amount: 8000, category: 'RENT' }],
        totalAmount: 8000,
        status: 'UNPAID',
      });

      const initialLedgerEntries = defaultFinanceRepository.getLedgerEntries().length;
      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const idempotencyKey = 'idem-fail-bill-retry';

      // Mock saveBills to fail on first attempt
      const origSaveBills = defaultFinanceRepository.saveBills.bind(defaultFinanceRepository);
      let hasFailedOnce = false;
      vi.spyOn(defaultFinanceRepository, 'saveBills').mockImplementation((bills) => {
        if (!hasFailedOnce) {
          hasFailedOnce = true;
          throw new Error('Database deadlock on bill table');
        }
        return origSaveBills(bills);
      });

      // Attempt 1 fails
      const res1 = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OP', idempotencyKey);
      expect(res1.success).toBe(false);
      expect(res1.errors[0]).toContain('Database deadlock on bill table');

      // Assert rollback: ledger entries restored, bill remains UNPAID
      expect(defaultFinanceRepository.getLedgerEntries().length).toBe(initialLedgerEntries);
      const billsAfterFail = defaultFinanceRepository.getBillsByStayId(sampleStayId);
      expect(billsAfterFail[0].status).toBe(BillStatus.UNPAID);
      expect(billsAfterFail[0].balanceAmount).toBe(8000);

      // Attempt 2 (Retry with SAME idempotencyKey) succeeds
      const res2 = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OP', idempotencyKey);
      expect(res2.success).toBe(true);
      expect(res2.settlement?.status).toBe('SETTLED');

      const billsAfterRetry = defaultFinanceRepository.getBillsByStayId(sampleStayId);
      expect(billsAfterRetry[0].status).toBe(BillStatus.PAID);
      expect(billsAfterRetry[0].balanceAmount).toBe(0);
    });

    it('FAILURE SCENARIO 4: Settlement persistence failure rolls back Ledger and bills, retry prevents duplicate realization', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

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

      const initialLedgerEntries = defaultFinanceRepository.getLedgerEntries().length;
      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const idempotencyKey = 'idem-fail-settlement-save-retry';

      // Mock saveSettlement to fail on first call
      const origSaveSettlement = defaultFinanceRepository.saveSettlement.bind(defaultFinanceRepository);
      let hasFailedOnce = false;
      vi.spyOn(defaultFinanceRepository, 'saveSettlement').mockImplementation((stl) => {
        if (!hasFailedOnce) {
          hasFailedOnce = true;
          throw new Error('Settlement storage timeout');
        }
        return origSaveSettlement(stl);
      });

      // Attempt 1 fails
      const res1 = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OP', idempotencyKey);
      expect(res1.success).toBe(false);
      expect(res1.errors[0]).toContain('Settlement storage timeout');

      // Assert rollback: Ledger entries restored, bill restored to UNPAID, zero settlements stored
      expect(defaultFinanceRepository.getLedgerEntries().length).toBe(initialLedgerEntries);
      expect(defaultFinanceRepository.getSettlements().length).toBe(0);
      expect(defaultFinanceRepository.getBillsByStayId(sampleStayId)[0].status).toBe(BillStatus.UNPAID);

      // Attempt 2 (Retry with SAME idempotencyKey) succeeds
      const res2 = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OP', idempotencyKey);
      expect(res2.success).toBe(true);
      expect(res2.settlement?.status).toBe('SETTLED');
      expect(defaultFinanceRepository.getSettlements().length).toBe(1);
    });

    it('FAILURE SCENARIO 5: Resident transition failure rolls back all state, retry succeeds cleanly', () => {
      const resident = {
        id: sampleResidentId,
        residentCode: 'R-FAIL',
        fullName: 'Rollback Resident',
        status: ResidentStatus.ACTIVE,
        mobileNumber: '9999999999',
        createdAt: todayStr,
        updatedAt: todayStr,
      };
      residentRepo.save(resident);

      const stay = createActiveStay(sampleStayId, StayStatus.CHECKED_OUT);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const idempotencyKey = 'idem-fail-resident-retry';

      // Mock residentRepo.save to fail once
      const origResidentSave = residentRepo.save.bind(residentRepo);
      let hasFailedOnce = false;
      vi.spyOn(residentRepo, 'save').mockImplementation((r) => {
        if (!hasFailedOnce) {
          hasFailedOnce = true;
          throw new Error('Resident repository constraint violation');
        }
        return origResidentSave(r);
      });

      // Attempt 1 fails
      const res1 = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OP', idempotencyKey);
      expect(res1.success).toBe(false);
      expect(res1.errors[0]).toContain('Resident repository constraint violation');

      // Assert resident remains ACTIVE
      expect(residentRepo.getByIdSync(sampleResidentId)?.status).toBe(ResidentStatus.ACTIVE);

      // Attempt 2 (Retry with SAME idempotencyKey) succeeds and updates resident to ALUMNI
      const res2 = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OP', idempotencyKey);
      expect(res2.success).toBe(true);
      expect(residentRepo.getByIdSync(sampleResidentId)?.status).toBe(ResidentStatus.ALUMNI);
    });
  });

  describe('FC-04 Live T2 Revalidation & Stale Preview Rejection', () => {
    it('TC-STL-25: rejects settlement confirmation when receivable balance changed due to intermediate payment', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

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

      // T1: Generate Preview (AR = 10,000)
      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      expect(previewRes.success).toBe(true);
      const stalePreview = previewRes.preview!;

      // Intermediate Event: Payment of 4,000 is received before settlement confirms
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'pay_inter_1',
          account: AccountType.BANK,
          debit: 4000,
          credit: 0,
          remarks: 'Intermediate payment',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'pay_inter_1',
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 0,
          credit: 4000,
          remarks: 'Payment applied',
          createdBy: 'TEST',
        },
      ]);

      // T2: Attempt to confirm with stale T1 preview
      const confirmRes = service.confirmSettlement(stalePreview, 'BANK_TRANSFER');
      expect(confirmRes.success).toBe(false);
      expect(confirmRes.settlement).toBeNull();
      expect(confirmRes.errors[0]).toContain('Settlement preview is stale');
    });

    it('TC-STL-26: rejects confirmation when Advance Credit balance changed between preview and confirm', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'p1',
          account: AccountType.ADVANCE_CREDIT,
          debit: 0,
          credit: 3000,
          remarks: 'Advance',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'p1',
          account: AccountType.BANK,
          debit: 3000,
          credit: 0,
          remarks: 'Advance bank',
          createdBy: 'TEST',
        },
      ]);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const stalePreview = previewRes.preview!;

      // Intermediate Advance Credit change
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'p2',
          account: AccountType.ADVANCE_CREDIT,
          debit: 0,
          credit: 1000,
          remarks: 'More advance',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'p2',
          account: AccountType.BANK,
          debit: 1000,
          credit: 0,
          remarks: 'Advance bank 2',
          createdBy: 'TEST',
        },
      ]);

      const confirmRes = service.confirmSettlement(stalePreview);
      expect(confirmRes.success).toBe(false);
      expect(confirmRes.errors[0]).toContain('Settlement preview is stale');
    });

    it('TC-STL-27: rejects confirmation when security deposit changed between preview and confirm', () => {
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
          credit: 8000,
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
          debit: 8000,
          credit: 0,
          remarks: 'Deposit bank',
          createdBy: 'TEST',
        },
      ]);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const stalePreview = previewRes.preview!;

      // Intermediate partial deposit deduction
      ledgerService.postEntries([
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'dpt_1',
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 2000,
          credit: 0,
          remarks: 'Deduction',
          createdBy: 'TEST',
        },
        {
          stayId: sampleStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'PAYMENT',
          referenceId: 'dpt_1',
          account: AccountType.DAMAGE_RECOVERY,
          debit: 0,
          credit: 2000,
          remarks: 'Damage deduction',
          createdBy: 'TEST',
        },
      ]);

      const confirmRes = service.confirmSettlement(stalePreview);
      expect(confirmRes.success).toBe(false);
      expect(confirmRes.errors[0]).toContain('Settlement preview is stale');
    });
  });

  describe('FC-04 Idempotency & Concurrency', () => {
    it('TC-STL-29: replays existing Settlement on identical idempotencyKey + parameters without duplicate ledger entries', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      const idempotencyKey = 'idem_key_stl_1001';

      // First confirmation
      const confirmRes1 = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OPERATOR_1', idempotencyKey);
      expect(confirmRes1.success).toBe(true);
      const initialLedgerEntries = defaultFinanceRepository.getLedgerEntries().length;
      const initialSettlement = confirmRes1.settlement!;

      // Second confirmation with same idempotencyKey and parameters (Replay)
      const confirmRes2 = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER', 'OPERATOR_1', idempotencyKey);
      expect(confirmRes2.success).toBe(true);
      expect(confirmRes2.settlement?.id).toBe(initialSettlement.id);
      expect(confirmRes2.settlement?.settlementNumber).toBe(initialSettlement.settlementNumber);

      // Ledger count did NOT increase
      expect(defaultFinanceRepository.getLedgerEntries().length).toBe(initialLedgerEntries);
    });

    it('TC-STL-30: rejects confirmation with conflict error when same idempotencyKey is used with conflicting parameters', () => {
      const stay1 = createActiveStay('stay-1', StayStatus.ON_NOTICE);
      const stay2 = createActiveStay('stay-2', StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay1);
      stayRepo.saveSync(stay2);

      const previewRes1 = service.generateSettlementPreview('stay-1', 0);
      const previewRes2 = service.generateSettlementPreview('stay-2', 0);

      const idempotencyKey = 'shared_idem_key_conflict';

      const res1 = service.confirmSettlement(previewRes1.preview!, 'BANK_TRANSFER', 'OP', idempotencyKey);
      expect(res1.success).toBe(true);

      // Attempt to use same idempotencyKey for different stay
      const res2 = service.confirmSettlement(previewRes2.preview!, 'BANK_TRANSFER', 'OP', idempotencyKey);
      expect(res2.success).toBe(false);
      expect(res2.settlement).toBeNull();
      expect(res2.errors[0]).toContain('Idempotency conflict');
    });

    it('TC-STL-31: prevents simultaneous overlapping confirmations via activeStayLocks concurrency locking', () => {
      const stay = createActiveStay(sampleStayId, StayStatus.ON_NOTICE);
      stayRepo.saveSync(stay);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);

      // Simulate lock acquired by concurrent worker
      (SettlementApplicationService as any).activeStayLocks.add(sampleStayId);

      const concurrentRes = service.confirmSettlement(previewRes.preview!);
      expect(concurrentRes.success).toBe(false);
      expect(concurrentRes.errors[0]).toContain('Settlement confirmation is already in progress');

      // Cleanup simulated lock
      (SettlementApplicationService as any).activeStayLocks.delete(sampleStayId);
    });
  });

  describe('FC-04 Deposit SETTLEMENT_CLEARANCE Audit Trail', () => {
    it('TC-STL-34: creates SETTLEMENT_CLEARANCE DepositTransaction when deposit liability is settled', () => {
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
          credit: 7500,
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
          debit: 7500,
          credit: 0,
          remarks: 'Bank',
          createdBy: 'TEST',
        },
      ]);

      const previewRes = service.generateSettlementPreview(sampleStayId, 0);
      expect(previewRes.preview?.securityDepositHeld).toBe(7500);

      const confirmRes = service.confirmSettlement(previewRes.preview!, 'BANK_TRANSFER');
      expect(confirmRes.success).toBe(true);

      const depositTxs = defaultFinanceRepository.getDepositTransactionsByStayId(sampleStayId);
      expect(depositTxs.length).toBeGreaterThan(0);

      const clearanceTx = depositTxs.find((tx) => tx.transactionType === 'SETTLEMENT_CLEARANCE');
      expect(clearanceTx).toBeDefined();
      expect(clearanceTx?.amount).toBe(7500);
      expect(clearanceTx?.paymentMethod).toBe('BANK_TRANSFER');
      expect(clearanceTx?.ledgerEntryIds.length).toBeGreaterThan(0);
    });
  });
});
