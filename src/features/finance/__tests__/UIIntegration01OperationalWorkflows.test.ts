import { describe, it, expect, beforeEach } from 'vitest';
import { defaultFinanceRepository } from '../infrastructure';
import { financeStorage } from '../storage/financeStorage';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { BillingApplicationService } from '../services/billingService';
import { PaymentApplicationService } from '../services/paymentService';
import { SettlementApplicationService } from '../services/settlementService';
import { DepositApplicationService } from '../services/depositService';
import { LedgerApplicationService } from '../services/ledgerService';
import { BalanceApplicationService } from '../services/balanceEngine';
import { ReportingApplicationService } from '../services/reportingService';
import { TimelineApplicationService } from '../services/timelineService';
import { FinanceWorkspaceCoordinator } from '../application/coordinator/FinanceWorkspaceCoordinator';
import { StayWorkspaceCoordinator } from '../../stay/application/coordinator/StayWorkspaceCoordinator';
import { Stay } from '../../stay/domain/entities/Stay';
import { StayStatus } from '../../stay/domain/valueObjects/StayStatus';
import type { Resident } from '../../resident/domain/entities/Resident';

describe('UI-INTEGRATION-01 — Stay & Finance Operational Workflows Integration Suite', () => {
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let billingService: BillingApplicationService;
  let paymentService: PaymentApplicationService;
  let settlementService: SettlementApplicationService;
  let depositService: DepositApplicationService;
  let ledgerService: LedgerApplicationService;
  let balanceEngine: BalanceApplicationService;
  let reportingService: ReportingApplicationService;
  let timelineService: TimelineApplicationService;
  let financeCoordinator: FinanceWorkspaceCoordinator;
  let stayCoordinator: StayWorkspaceCoordinator;

  const testResident: Resident = {
    id: 'res-ui-int-1',
    residentCode: 'R-UI-001',
    fullName: 'Rohan Sen',
    mobileNumber: '+91 9988776655',
    email: 'rohan@example.com',
    status: 'ACTIVE',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  };

  const testStay = new Stay({
    id: 'stay-ui-int-1',
    residentId: testResident.id,
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: '2026-08-01',
    agreedRent: 15000,
    agreedDeposit: 15000,
    allocatedBedIds: ['bed-101'],
  });

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
    financeStorage.saveStoredDepositTransactions([]);

    stayRepo = new InMemoryStayRepository([testStay]);
    residentRepo = new InMemoryResidentRepository([testResident]);
    accommodationRepo = new InMemoryAccommodationRepository();

    billingService = new BillingApplicationService(defaultFinanceRepository, stayRepo);
    paymentService = new PaymentApplicationService(defaultFinanceRepository, stayRepo);
    settlementService = new SettlementApplicationService(defaultFinanceRepository, stayRepo);
    depositService = new DepositApplicationService(defaultFinanceRepository, stayRepo);
    ledgerService = new LedgerApplicationService(defaultFinanceRepository);
    balanceEngine = new BalanceApplicationService(defaultFinanceRepository);
    timelineService = new TimelineApplicationService(billingService, paymentService, settlementService);

    reportingService = new ReportingApplicationService(
      defaultFinanceRepository,
      stayRepo,
      residentRepo,
      billingService,
      paymentService,
      settlementService,
      timelineService
    );

    financeCoordinator = new FinanceWorkspaceCoordinator(
      reportingService,
      timelineService,
      balanceEngine,
      stayRepo,
      residentRepo,
      accommodationRepo,
      paymentService,
      depositService
    );

    stayCoordinator = new StayWorkspaceCoordinator(
      stayRepo,
      residentRepo,
      accommodationRepo,
      balanceEngine,
      billingService,
      paymentService
    );
  });

  describe('1. Deposit Operations Workflow', () => {
    it('executes partial deposit return and reflects updated deposit held balance', () => {
      // 1. Initial deposit contribution
      depositService.recordDepositContribution({
        stayId: testStay.id,
        amount: 15000,
        paymentMethod: 'BANK_TRANSFER',
        remarks: 'Initial deposit at admission',
        createdBy: 'SYSTEM_ADMISSION',
      });

      expect(depositService.getDepositBalance(testStay.id)).toBe(15000);

      // 2. Partial deposit return
      const returnResult = depositService.recordPartialDepositReturn({
        stayId: testStay.id,
        amount: 5000,
        paymentMethod: 'UPI',
        expectedDepositBalance: 15000,
        remarks: 'Mid-stay partial refund',
        createdBy: 'OPERATOR_UI',
      });

      expect(returnResult.success).toBe(true);
      expect(returnResult.transaction?.amount).toBe(5000);
      expect(returnResult.transaction?.transactionType).toBe('PARTIAL_RETURN');

      // 3. Verify updated balance
      expect(depositService.getDepositBalance(testStay.id)).toBe(10000);

      // 4. Verify stay view model reflects authoritative deposit held
      const stayVm = stayCoordinator.createViewModel(testStay.id);
      expect(stayVm.financialSummary.securityDepositHeld).toBe(10000);
    });

    it('executes deposit damage deduction with mandatory reason and updates balance', () => {
      // 1. Initial deposit contribution
      depositService.recordDepositContribution({
        stayId: testStay.id,
        amount: 15000,
        paymentMethod: 'BANK_TRANSFER',
        remarks: 'Initial deposit at admission',
        createdBy: 'SYSTEM_ADMISSION',
      });

      // 2. Deposit deduction for room damage
      const dedResult = depositService.recordDepositDeduction({
        stayId: testStay.id,
        amount: 3000,
        reason: 'Broken wardrobe mirror',
        expectedDepositBalance: 15000,
        remarks: 'Room inspection deduction',
        createdBy: 'OPERATOR_UI',
      });

      expect(dedResult.success).toBe(true);
      expect(dedResult.transaction?.amount).toBe(3000);
      expect(dedResult.transaction?.transactionType).toBe('DEPOSIT_DEDUCTION');
      expect(dedResult.transaction?.reason).toBe('Broken wardrobe mirror');

      // 3. Verify updated balance
      expect(depositService.getDepositBalance(testStay.id)).toBe(12000);

      // 4. Verify stay view model reflects authoritative deposit held
      const stayVm = stayCoordinator.createViewModel(testStay.id);
      expect(stayVm.financialSummary.securityDepositHeld).toBe(12000);
    });
  });

  describe('2. Authoritative Double-Entry Resident Ledger Viewing', () => {
    it('generates authoritative resident ledger view model with full transaction history', () => {
      // 1. Rent Bill
      billingService.createBill({
        stayId: testStay.id,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: '1', description: 'Rent', amount: 15000, category: 'RENT' }],
        totalAmount: 15000,
        status: 'UNPAID',
      });

      // 2. Payment
      paymentService.recordPayment({
        stayId: testStay.id,
        amount: 15000,
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: '2026-08-05',
        referenceNumber: 'NEFT001',
      });

      // 3. Retrieve Ledger ViewModel
      const ledgerVm = ledgerService.getResidentLedgerViewModel(testStay.id, testResident);

      expect(ledgerVm.residentName).toBe('Rohan Sen');
      expect(ledgerVm.residentCode).toBe('R-UI-001');
      expect(ledgerVm.stayId).toBe(testStay.id);
      expect(ledgerVm.currentOutstandingBalance).toBe(0);
      expect(ledgerVm.rows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('3. Payment History & Reversal Workflow', () => {
    it('records payment, presents in payment history, and reverses with double-entry balance restoration', () => {
      // 1. Initial bill
      billingService.createBill({
        stayId: testStay.id,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: '1', description: 'Rent', amount: 15000, category: 'RENT' }],
        totalAmount: 15000,
        status: 'UNPAID',
      });

      // 2. Record payment
      const recResult = paymentService.recordPayment({
        stayId: testStay.id,
        amount: 15000,
        paymentMethod: 'CHEQUE',
        paymentDate: '2026-08-05',
        referenceNumber: 'CHQ-8877',
      });

      expect(recResult.success).toBe(true);
      const paymentId = recResult.payment!.id;

      // Verify dues cleared
      expect(balanceEngine.calculateStayBalances(testStay.id).receivableBalance).toBe(0);

      // 3. Inspect in Finance Workspace payment history
      const history = financeCoordinator.getPaymentRecords();
      const item = history.find((p) => p.id === paymentId);
      expect(item).toBeDefined();
      expect(item?.status).toBe('RECORDED');
      expect(item?.amount).toBe(15000);

      // 4. Reverse payment
      const revResult = financeCoordinator.reversePayment({
        paymentId,
        reversalReason: 'Cheque returned dishonoured by bank',
        reversedBy: 'CHIEF_ACCOUNTANT',
      });

      expect(revResult.success).toBe(true);
      expect(revResult.payment?.status).toBe('REVERSED');

      // 5. Verify dues restored to 15,000 on stay ledger
      expect(balanceEngine.calculateStayBalances(testStay.id).receivableBalance).toBe(15000);

      // 6. Verify duplicate reversal is blocked
      const dupResult = financeCoordinator.reversePayment({
        paymentId,
        reversalReason: 'Duplicate attempt',
      });

      expect(dupResult.success).toBe(false);
      expect(dupResult.errors[0]).toContain('already been reversed');
    });
  });
});
