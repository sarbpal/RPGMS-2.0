import { describe, it, expect, beforeEach } from 'vitest';
import { DepositApplicationService } from '../depositService';
import { InMemoryFinanceRepository } from '../../infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository, Stay, StayStatus } from '../../../stay';
import { AccountType } from '../../domain';

describe('DepositApplicationService', () => {
  let financeRepo: InMemoryFinanceRepository;
  let stayRepo: InMemoryStayRepository;
  let depositService: DepositApplicationService;

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
    depositService = new DepositApplicationService(financeRepo, stayRepo);

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

  describe('recordDepositContribution', () => {
    it('records initial deposit contribution and posts to SECURITY_DEPOSIT_LIABILITY', () => {
      const res = depositService.recordDepositContribution(testStayId, 5000, 'BANK_TRANSFER', 'Initial Deposit');
      expect(res.success).toBe(true);
      expect(res.transaction).not.toBeNull();
      expect(res.transaction?.amount).toBe(5000);
      expect(res.transaction?.transactionType).toBe('DEPOSIT_RECEIPT');

      const balance = depositService.getDepositBalance(testStayId);
      expect(balance).toBe(5000);
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

    it('rejects zero or negative deposit contribution amount', () => {
      const res = depositService.recordDepositContribution(testStayId, 0);
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('positive number');
    });

    it('rejects invalid stayId', () => {
      const res = depositService.recordDepositContribution('non_existent_stay', 5000);
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('not found');
    });
  });

  describe('recordPartialDepositReturn', () => {
    beforeEach(() => {
      // Establish ₹8,000 deposit liability
      depositService.recordDepositContribution(testStayId, 8000, 'BANK_TRANSFER', 'Full Deposit');
    });

    it('DEC-DEP-01: executes partial deposit return during ACTIVE stay', () => {
      const res = depositService.recordPartialDepositReturn(testStayId, 3000, 'BANK_TRANSFER', 'Mid-stay room downgrade refund');
      expect(res.success).toBe(true);
      expect(res.transaction?.transactionType).toBe('PARTIAL_RETURN');

      const balance = depositService.getDepositBalance(testStayId);
      expect(balance).toBe(5000);
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
    });
  });

  describe('recordDepositDeduction', () => {
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
    });

    it('rejects deduction without mandatory reason', () => {
      const res = depositService.recordDepositDeduction(testStayId, 1000, '');
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('reason is mandatory');
    });

    it('enforces over-deduction guard: rejects deduction exceeding available deposit', () => {
      const res = depositService.recordDepositDeduction(testStayId, 9000, 'Total destruction');
      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Available security deposit balance');
    });
  });
});

