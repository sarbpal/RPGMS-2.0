import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DepositApplicationService } from '../depositService';
import { InMemoryFinanceRepository } from '../../infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository, Stay, StayStatus } from '../../../stay';
import { InMemoryResidentRepository, ResidentStatus, type Resident } from '../../../resident';
import { ResidentLifecycleService } from '../../../resident/services/ResidentLifecycleService';
import { SettlementApplicationService } from '../settlementService';
import { AccountType } from '../../domain';

describe('DepositApplicationService & FC-06 Deposit Return Lifecycle', () => {
  let financeRepo: InMemoryFinanceRepository;
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let depositService: DepositApplicationService;
  let settlementService: SettlementApplicationService;
  let residentLifecycleService: ResidentLifecycleService;

  const testStayId = 'stay_dep_test_101';
  const testResidentId = 'res_dep_test_101';

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
    financeStorage.saveStoredDepositTransactions([]);

    financeRepo = new InMemoryFinanceRepository();
    stayRepo = new InMemoryStayRepository();
    residentRepo = new InMemoryResidentRepository();
    residentLifecycleService = new ResidentLifecycleService(residentRepo, stayRepo, financeRepo);

    depositService = new DepositApplicationService(financeRepo, stayRepo);
    settlementService = new SettlementApplicationService(
      financeRepo,
      stayRepo,
      undefined,
      residentRepo,
      undefined,
      undefined,
      residentLifecycleService
    );

    const testResident: Resident = {
      id: testResidentId,
      fullName: 'Rahul Sharma',
      residentCode: 'R00101',
      mobileNumber: '9876543210',
      status: ResidentStatus.ACTIVE,
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
    };
    residentRepo.save(testResident);

    const testStay = new Stay({
      id: testStayId,
      residentId: testResidentId,
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-06-01',
      allocatedBedIds: ['bed-101-a'],
      agreedRent: 10000,
      agreedDeposit: 8000,
    });
    stayRepo.saveSync(testStay);
  });

  describe('1. Deposit Contributions (Running Account Accumulation)', () => {
    it('records initial deposit contribution and posts to SECURITY_DEPOSIT_LIABILITY', () => {
      const res = depositService.recordDepositContribution(testStayId, 5000, 'BANK_TRANSFER', 'Initial Deposit');
      expect(res.success).toBe(true);
      expect(res.transaction).not.toBeNull();
      expect(res.transaction?.amount).toBe(5000);
      expect(res.transaction?.transactionType).toBe('DEPOSIT_RECEIPT');

      const balance = depositService.getDepositBalance(testStayId);
      expect(balance).toBe(5000);

      const entries = financeRepo.getLedgerEntriesByStayId(testStayId);
      expect(entries.length).toBe(2);
      expect(entries.find((e) => e.account === AccountType.BANK)?.debit).toBe(5000);
      expect(entries.find((e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY)?.credit).toBe(5000);
    });

    it('DEC-DEP-02: supports additional deposit contributions after initial deposit', () => {
      depositService.recordDepositContribution(testStayId, 5000, 'BANK_TRANSFER', 'Initial Deposit');
      const res2 = depositService.recordDepositContribution(testStayId, 3000, 'UPI', 'Second Deposit Installment');

      expect(res2.success).toBe(true);
      const balance = depositService.getDepositBalance(testStayId);
      expect(balance).toBe(8000);

      const txs = depositService.getDepositTransactionsByStayId(testStayId);
      expect(txs.length).toBe(2);
    });

    it('supports payload object interface for deposit contribution', () => {
      const res = depositService.recordDepositContribution({
        stayId: testStayId,
        amount: 4000,
        paymentMethod: 'CASH',
        remarks: 'Cash deposit contribution',
        createdBy: 'OPERATOR_UI',
      });
      expect(res.success).toBe(true);
      expect(depositService.getDepositBalance(testStayId)).toBe(4000);

      const entries = financeRepo.getLedgerEntriesByStayId(testStayId);
      expect(entries.find((e) => e.account === AccountType.CASH)?.debit).toBe(4000);
    });

    it('rejects zero or negative deposit contribution amount', () => {
      const res = depositService.recordDepositContribution(testStayId, 0);
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('positive number');

      const resNeg = depositService.recordDepositContribution(testStayId, -500);
      expect(resNeg.success).toBe(false);
      expect(resNeg.errors[0]).toContain('positive number');
    });

    it('rejects invalid stayId', () => {
      const res = depositService.recordDepositContribution('non_existent_stay', 5000);
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('not found');
    });
  });

  describe('2. Partial & Full Deposit Returns', () => {
    beforeEach(() => {
      depositService.recordDepositContribution(testStayId, 8000, 'BANK_TRANSFER', 'Full Deposit');
    });

    it('DEC-DEP-01: executes partial deposit return during ACTIVE stay', () => {
      const res = depositService.recordPartialDepositReturn(testStayId, 3000, 'BANK_TRANSFER', 'Mid-stay refund');
      expect(res.success).toBe(true);
      expect(res.transaction?.transactionType).toBe('PARTIAL_RETURN');
      expect(res.transaction?.amount).toBe(3000);

      const balance = depositService.getDepositBalance(testStayId);
      expect(balance).toBe(5000);

      const entries = financeRepo.getLedgerEntriesByStayId(testStayId);
      const returnLiability = entries.find(
        (e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY && e.debit === 3000
      );
      const returnBank = entries.find((e) => e.account === AccountType.BANK && e.credit === 3000);
      expect(returnLiability).toBeDefined();
      expect(returnBank).toBeDefined();
    });

    it('allows returning 100% exact available deposit balance', () => {
      const res = depositService.recordPartialDepositReturn(testStayId, 8000, 'BANK_TRANSFER', 'Full mid-stay refund');
      expect(res.success).toBe(true);
      expect(depositService.getDepositBalance(testStayId)).toBe(0);
    });

    it('DEC-DEP-01: executes partial deposit return during ON_NOTICE and CHECKED_OUT stays', () => {
      const stay = stayRepo.findByIdSync(testStayId);
      if (stay) {
        stay.giveNotice({ noticeDate: '2026-07-01', expectedCheckoutDate: '2026-07-31', reason: 'Moving out' });
        stayRepo.saveSync(stay);
      }

      const resNotice = depositService.recordPartialDepositReturn(testStayId, 2000, 'UPI', 'Notice period partial return');
      expect(resNotice.success).toBe(true);
      expect(depositService.getDepositBalance(testStayId)).toBe(6000);

      if (stay) {
        stay.processCheckout({ actualCheckoutDate: '2026-07-31', reason: 'Checked out' });
        stayRepo.saveSync(stay);
      }

      const resCheckedOut = depositService.recordPartialDepositReturn(testStayId, 2000, 'UPI', 'Post checkout partial return');
      expect(resCheckedOut.success).toBe(true);
      expect(depositService.getDepositBalance(testStayId)).toBe(4000);
    });

    it('enforces over-return guard: rejects return amount exceeding available deposit balance', () => {
      const res = depositService.recordPartialDepositReturn(testStayId, 10000, 'BANK_TRANSFER');
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Available security deposit balance');
      expect(depositService.getDepositBalance(testStayId)).toBe(8000);
    });

    it('rejects zero or negative return amount', () => {
      const resZero = depositService.recordPartialDepositReturn(testStayId, 0);
      expect(resZero.success).toBe(false);
      expect(resZero.errors[0]).toContain('positive number');

      const resNeg = depositService.recordPartialDepositReturn(testStayId, -100);
      expect(resNeg.success).toBe(false);
      expect(resNeg.errors[0]).toContain('positive number');
    });
  });

  describe('3. Deposit Deductions (Damage / Penalty Adjustments)', () => {
    beforeEach(() => {
      depositService.recordDepositContribution(testStayId, 8000, 'BANK_TRANSFER', 'Full Deposit');
    });

    it('records deposit deduction with mandatory reason and credits DAMAGE_RECOVERY', () => {
      const res = depositService.recordDepositDeduction(testStayId, 1500, 'Wall paint damage');
      expect(res.success).toBe(true);
      expect(res.transaction?.transactionType).toBe('DEPOSIT_DEDUCTION');
      expect(res.transaction?.reason).toBe('Wall paint damage');

      const balance = depositService.getDepositBalance(testStayId);
      expect(balance).toBe(6500);

      const entries = financeRepo.getLedgerEntriesByStayId(testStayId);
      const damageEntry = entries.find((e) => e.account === AccountType.DAMAGE_RECOVERY);
      expect(damageEntry?.credit).toBe(1500);

      const liabilityEntry = entries.find(
        (e) => e.account === AccountType.SECURITY_DEPOSIT_LIABILITY && e.debit === 1500
      );
      expect(liabilityEntry).toBeDefined();
    });

    it('rejects deduction without mandatory reason', () => {
      const res = depositService.recordDepositDeduction(testStayId, 1000, '');
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('reason is mandatory');

      const resWhitespace = depositService.recordDepositDeduction(testStayId, 1000, '   ');
      expect(resWhitespace.success).toBe(false);
      expect(resWhitespace.errors[0]).toContain('reason is mandatory');
    });

    it('enforces over-deduction guard: rejects deduction exceeding available deposit', () => {
      const res = depositService.recordDepositDeduction(testStayId, 9000, 'Total destruction');
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Available security deposit balance');
      expect(depositService.getDepositBalance(testStayId)).toBe(8000);
    });
  });

  describe('4. Idempotency Implementation', () => {
    beforeEach(() => {
      depositService.recordDepositContribution(testStayId, 10000, 'BANK_TRANSFER', 'Base Deposit');
    });

    it('replays identical deposit return request with same idempotencyKey without duplicating ledger entries', () => {
      const key = 'IDEMP-RET-TEST-001';
      const res1 = depositService.recordPartialDepositReturn({
        stayId: testStayId,
        amount: 3000,
        paymentMethod: 'BANK_TRANSFER',
        remarks: 'Room downgrade partial refund',
        idempotencyKey: key,
      });

      expect(res1.success).toBe(true);
      expect(depositService.getDepositBalance(testStayId)).toBe(7000);
      const initialEntryCount = financeRepo.getLedgerEntries().length;

      // Replay identical submission
      const res2 = depositService.recordPartialDepositReturn({
        stayId: testStayId,
        amount: 3000,
        paymentMethod: 'BANK_TRANSFER',
        remarks: 'Room downgrade partial refund',
        idempotencyKey: key,
      });

      expect(res2.success).toBe(true);
      expect(res2.transaction?.id).toBe(res1.transaction?.id);
      expect(depositService.getDepositBalance(testStayId)).toBe(7000);
      expect(financeRepo.getLedgerEntries().length).toBe(initialEntryCount);
    });

    it('rejects conflicting deposit return request with same idempotencyKey but different amount', () => {
      const key = 'IDEMP-RET-TEST-002';
      depositService.recordPartialDepositReturn({
        stayId: testStayId,
        amount: 3000,
        paymentMethod: 'BANK_TRANSFER',
        idempotencyKey: key,
      });

      const resConflict = depositService.recordPartialDepositReturn({
        stayId: testStayId,
        amount: 4000, // Conflict!
        paymentMethod: 'BANK_TRANSFER',
        idempotencyKey: key,
      });

      expect(resConflict.success).toBe(false);
      expect(resConflict.errors[0]).toContain('Idempotency conflict');
      expect(depositService.getDepositBalance(testStayId)).toBe(7000);
    });

    it('rejects deposit return request with same idempotencyKey on a different stay', () => {
      const otherStayId = 'stay_dep_test_999';
      stayRepo.saveSync(
        new Stay({
          id: otherStayId,
          residentId: testResidentId,
          stayType: 'REGULAR',
          status: StayStatus.ACTIVE,
          checkInDate: '2026-06-01',
          allocatedBedIds: ['bed-999'],
        })
      );
      depositService.recordDepositContribution(otherStayId, 10000);

      const key = 'IDEMP-CROSS-STAY-001';
      depositService.recordPartialDepositReturn({
        stayId: testStayId,
        amount: 2000,
        paymentMethod: 'BANK_TRANSFER',
        idempotencyKey: key,
      });

      const resOther = depositService.recordPartialDepositReturn({
        stayId: otherStayId,
        amount: 2000,
        paymentMethod: 'BANK_TRANSFER',
        idempotencyKey: key,
      });

      expect(resOther.success).toBe(false);
      expect(resOther.errors[0]).toContain('Idempotency conflict');
    });

    it('replays identical deposit deduction request with same idempotencyKey', () => {
      const key = 'IDEMP-DED-TEST-001';
      const res1 = depositService.recordDepositDeduction({
        stayId: testStayId,
        amount: 1500,
        reason: 'Broken table',
        idempotencyKey: key,
      });

      expect(res1.success).toBe(true);
      expect(depositService.getDepositBalance(testStayId)).toBe(8500);
      const initialEntryCount = financeRepo.getLedgerEntries().length;

      const res2 = depositService.recordDepositDeduction({
        stayId: testStayId,
        amount: 1500,
        reason: 'Broken table',
        idempotencyKey: key,
      });

      expect(res2.success).toBe(true);
      expect(res2.transaction?.id).toBe(res1.transaction?.id);
      expect(depositService.getDepositBalance(testStayId)).toBe(8500);
      expect(financeRepo.getLedgerEntries().length).toBe(initialEntryCount);
    });
  });

  describe('5. T2 Authoritative Live Balance Revalidation', () => {
    beforeEach(() => {
      depositService.recordDepositContribution(testStayId, 8000, 'BANK_TRANSFER', 'Initial Deposit');
    });

    it('rejects deposit return if UI expected balance diverges from live balance', () => {
      // Simulate another background deduction that changed live balance to ₹6,000
      depositService.recordDepositDeduction(testStayId, 2000, 'Mid-stay damage');
      expect(depositService.getDepositBalance(testStayId)).toBe(6000);

      // Stale UI submission expecting ₹8,000
      const res = depositService.recordPartialDepositReturn({
        stayId: testStayId,
        amount: 4000,
        expectedDepositBalance: 8000, // Stale! Live is 6000
      });

      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Deposit balance is stale');
      expect(depositService.getDepositBalance(testStayId)).toBe(6000);
    });

    it('rejects deposit deduction if UI expected balance diverges from live balance', () => {
      depositService.recordPartialDepositReturn(testStayId, 3000);
      expect(depositService.getDepositBalance(testStayId)).toBe(5000);

      const res = depositService.recordDepositDeduction({
        stayId: testStayId,
        amount: 2000,
        reason: 'Stain on wall',
        expectedDepositBalance: 8000, // Stale!
      });

      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Deposit balance is stale');
      expect(depositService.getDepositBalance(testStayId)).toBe(5000);
    });
  });

  describe('6. Compensating Rollback Safety', () => {
    beforeEach(() => {
      depositService.recordDepositContribution(testStayId, 8000, 'BANK_TRANSFER', 'Initial Deposit');
    });

    it('rolls back ledger entries cleanly if saveDepositTransaction throws an exception', () => {
      const initialEntryCount = financeRepo.getLedgerEntries().length;
      const initialDepositTxCount = financeRepo.getDepositTransactions().length;

      // Mock saveDepositTransaction to throw
      const origSave = financeRepo.saveDepositTransaction.bind(financeRepo);
      vi.spyOn(financeRepo, 'saveDepositTransaction').mockImplementation(() => {
        throw new Error('Disk IO write failure on deposit transactions');
      });

      const res = depositService.recordPartialDepositReturn(testStayId, 3000);
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('rolled back');

      // Assert complete pre-operation state restoration
      expect(financeRepo.getLedgerEntries().length).toBe(initialEntryCount);
      expect(financeRepo.getDepositTransactions().length).toBe(initialDepositTxCount);
      expect(depositService.getDepositBalance(testStayId)).toBe(8000);

      // Restore mock
      vi.spyOn(financeRepo, 'saveDepositTransaction').mockImplementation(origSave);
    });
  });

  describe('7. Multi-Step Lifecycle & Financial Separation (FC-05 / FC-06)', () => {
    it('executes complete running deposit account lifecycle through settlement clearance', () => {
      // 1. Initial Deposit: ₹10,000
      depositService.recordDepositContribution(testStayId, 10000, 'BANK_TRANSFER', 'Initial Deposit');
      expect(depositService.getDepositBalance(testStayId)).toBe(10000);

      // 2. Additional Contribution: ₹5,000
      depositService.recordDepositContribution(testStayId, 5000, 'UPI', 'Second Deposit Installment');
      expect(depositService.getDepositBalance(testStayId)).toBe(15000);

      // 3. Partial Return: ₹3,000
      depositService.recordPartialDepositReturn(testStayId, 3000, 'BANK_TRANSFER', 'Mid-stay refund');
      expect(depositService.getDepositBalance(testStayId)).toBe(12000);

      // 4. Damage Deduction: ₹2,000
      depositService.recordDepositDeduction(testStayId, 2000, 'Door repair');
      expect(depositService.getDepositBalance(testStayId)).toBe(10000);

      // 5. Operational Checkout (FC-05) - does NOT return deposit
      const stay = stayRepo.findByIdSync(testStayId);
      stay?.processCheckout({ actualCheckoutDate: '2026-07-31', reason: 'Normal departure' });
      if (stay) stayRepo.saveSync(stay);

      expect(stay?.status).toBe(StayStatus.CHECKED_OUT);
      expect(depositService.getDepositBalance(testStayId)).toBe(10000); // Deposit STILL HELD

      // 6. Resident status remains ACTIVE because settlement is not complete
      residentLifecycleService.evaluateAndSyncResidentStatus(testResidentId);
      expect(residentRepo.getByIdSync(testResidentId)?.status).toBe(ResidentStatus.ACTIVE);

      // 7. Settlement Confirmation (FC-04) - clears remaining deposit liability
      const previewRes = settlementService.generateSettlementPreview(testStayId);
      expect(previewRes.success).toBe(true);
      expect(previewRes.preview?.securityDepositHeld).toBe(10000);

      const confirmRes = settlementService.confirmSettlement(previewRes.preview!);
      expect(confirmRes.success).toBe(true);

      // 8. Deposit balance is now 0 and SETTLEMENT_CLEARANCE transaction recorded
      expect(depositService.getDepositBalance(testStayId)).toBe(0);
      const depTxs = depositService.getDepositTransactionsByStayId(testStayId);
      const settlementClearanceTx = depTxs.find((t) => t.transactionType === 'SETTLEMENT_CLEARANCE');
      expect(settlementClearanceTx).toBeDefined();
      expect(settlementClearanceTx?.amount).toBe(10000);

      // 9. Resident transitions to ALUMNI upon settlement completion
      expect(residentRepo.getByIdSync(testResidentId)?.status).toBe(ResidentStatus.ALUMNI);
    });

    it('guarantees that 0 deposit balance before settlement does NOT mark resident as ALUMNI', () => {
      depositService.recordDepositContribution(testStayId, 5000);
      // Return 100% of deposit
      depositService.recordPartialDepositReturn(testStayId, 5000);
      expect(depositService.getDepositBalance(testStayId)).toBe(0);

      // Stay is checked out
      const stay = stayRepo.findByIdSync(testStayId);
      stay?.processCheckout({ actualCheckoutDate: '2026-07-31' });
      if (stay) stayRepo.saveSync(stay);

      // Evaluate lifecycle: Resident must remain ACTIVE because Settlement has not been performed
      residentLifecycleService.evaluateAndSyncResidentStatus(testResidentId);
      expect(residentRepo.getByIdSync(testResidentId)?.status).toBe(ResidentStatus.ACTIVE);
    });
  });
});
