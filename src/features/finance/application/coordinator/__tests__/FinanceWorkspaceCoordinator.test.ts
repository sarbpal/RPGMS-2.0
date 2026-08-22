import { describe, it, expect, beforeEach } from 'vitest';
import { FinanceWorkspaceCoordinator } from '../FinanceWorkspaceCoordinator';
import { ReportingApplicationService } from '../../../services/reportingService';
import { TimelineApplicationService } from '../../../services/timelineService';
import { BillingApplicationService } from '../../../services/billingService';
import { PaymentApplicationService } from '../../../services/paymentService';
import { SettlementApplicationService } from '../../../services/settlementService';
import { balanceEngine } from '../../../services/balanceEngine';
import { defaultFinanceRepository } from '../../../infrastructure';
import { financeStorage } from '../../../storage/financeStorage';
import { InMemoryStayRepository } from '../../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { Stay } from '../../../../stay/domain/entities/Stay';
import type { Resident } from '../../../../resident/domain/entities/Resident';
import { StayStatus } from '../../../../stay/domain/valueObjects/StayStatus';

describe('FinanceWorkspaceCoordinator Unit Test Suite (Sprint FR-4)', () => {
  let coordinator: FinanceWorkspaceCoordinator;
  let reportingService: ReportingApplicationService;
  let timelineService: TimelineApplicationService;
  let billingService: BillingApplicationService;
  let paymentService: PaymentApplicationService;
  let settlementService: SettlementApplicationService;
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;

  const sampleResident: Resident = {
    id: 'res-coord-1',
    residentCode: 'RES-COORD-1',
    fullName: 'Ananya Verma',
    mobileNumber: '+91 9123456789',
    email: 'ananya@example.com',
    status: 'ACTIVE',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  };

  const sampleStay = new Stay({
    id: 'stay-coord-1',
    residentId: sampleResident.id,
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: '2026-08-01',
    agreedRent: 18000,
    agreedDeposit: 12000,
    allocatedBedIds: ['bed-coord-1'],
  });

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);

    stayRepo = new InMemoryStayRepository([sampleStay]);
    residentRepo = new InMemoryResidentRepository([sampleResident]);

    billingService = new BillingApplicationService(defaultFinanceRepository, stayRepo);
    paymentService = new PaymentApplicationService(defaultFinanceRepository, stayRepo);
    settlementService = new SettlementApplicationService(defaultFinanceRepository, stayRepo);
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

    coordinator = new FinanceWorkspaceCoordinator(
      reportingService,
      timelineService,
      balanceEngine,
      stayRepo,
      residentRepo
    );
  });

  describe('createViewModel Assembly', () => {
    it('assembles complete FinanceWorkspaceViewModel for the dashboard workspace', () => {
      const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      billingService.createBill({
        stayId: sampleStay.id,
        billType: 'MONTHLY_RENT',
        period: currentMonthStr,
        issueDate: `${currentMonthStr}-01`,
        dueDate: `${currentMonthStr}-07`,
        lineItems: [{ id: '1', description: 'Rent', amount: 18000, category: 'RENT' }],
        totalAmount: 18000,
        status: 'UNPAID',
      });

      const viewModel = coordinator.createViewModel(5);

      expect(viewModel.metrics).toBeDefined();
      expect(viewModel.metrics.totalMonthlyBilling).toBe(18000);
      expect(viewModel.outstandingResidents).toHaveLength(1);
      expect(viewModel.outstandingResidents[0].residentName).toBe('Ananya Verma');
      expect(viewModel.settlementsReport).toEqual([]);
      expect(viewModel.activity).toHaveLength(1);
      expect(viewModel.activity[0].type).toBe('BILL');
    });
  });

  describe('getPropertyFinanceSummary & getStayFinanceViewModel', () => {
    it('returns property-wide summary view model', () => {
      const propSummary = coordinator.getPropertyFinanceSummary();
      expect(propSummary.summary).toBeDefined();
      expect(propSummary.summary.totalOutstanding).toBe(0);
    });

    it('returns stay-level finance view model with balances and timeline summary', () => {
      billingService.createBill({
        stayId: sampleStay.id,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: '1', description: 'Rent', amount: 18000, category: 'RENT' }],
        totalAmount: 18000,
        status: 'UNPAID',
      });

      const stayVm = coordinator.getStayFinanceViewModel(sampleStay.id);

      expect(stayVm.stayId).toBe(sampleStay.id);
      expect(stayVm.balances.receivableBalance).toBe(18000);
      expect(stayVm.timeline).toHaveLength(1);
      expect(stayVm.summary.totalBillsCount).toBe(1);
      expect(stayVm.summary.settlementStatus).toBe('NONE');
    });
  });

  describe('getActiveStaysForSelection', () => {
    it('returns active, on-notice, and checked-out stays enriched with resident and accommodation data for post-checkout settlement', () => {
      const onNoticeStay = new Stay({
        id: 'stay-coord-on-notice',
        residentId: sampleResident.id,
        stayType: 'REGULAR',
        status: StayStatus.ON_NOTICE,
        checkInDate: '2026-06-01',
        flatId: '101',
        allocatedBedIds: ['101-B1'],
        agreedRent: 15000,
        agreedDeposit: 15000,
      });

      const checkedOutStay = new Stay({
        id: 'stay-coord-checked-out',
        residentId: sampleResident.id,
        stayType: 'REGULAR',
        status: StayStatus.CHECKED_OUT,
        checkInDate: '2025-01-01',
        flatId: '102',
        allocatedBedIds: ['102-B1'],
        agreedRent: 12000,
        agreedDeposit: 10000,
      });

      const closedStay = new Stay({
        id: 'stay-coord-closed',
        residentId: sampleResident.id,
        stayType: 'REGULAR',
        status: StayStatus.CLOSED,
        checkInDate: '2024-01-01',
        flatId: '103',
        allocatedBedIds: ['103-B1'],
      });

      stayRepo.saveSync(onNoticeStay);
      stayRepo.saveSync(checkedOutStay);
      stayRepo.saveSync(closedStay);

      const selectableStays = coordinator.getActiveStaysForSelection();

      // ACTIVE, ON_NOTICE, and CHECKED_OUT are selectable
      const stayIds = selectableStays.map((s) => s.stayId);
      expect(stayIds).toContain('stay-coord-1');
      expect(stayIds).toContain('stay-coord-on-notice');
      expect(stayIds).toContain('stay-coord-checked-out');
      expect(stayIds).not.toContain('stay-coord-closed');

      const noticeItem = selectableStays.find((s) => s.stayId === 'stay-coord-on-notice');
      expect(noticeItem).toBeDefined();
      expect(noticeItem?.residentName).toBe('Ananya Verma');
      expect(noticeItem?.status).toBe(StayStatus.ON_NOTICE);
      expect(noticeItem?.agreedRent).toBe(15000);
      expect(noticeItem?.agreedDeposit).toBe(15000);
      expect(noticeItem?.allocatedBedsLabel).toBe('Bed 101-B1');

      const checkedOutItem = selectableStays.find((s) => s.stayId === 'stay-coord-checked-out');
      expect(checkedOutItem).toBeDefined();
      expect(checkedOutItem?.status).toBe(StayStatus.CHECKED_OUT);
    });
  });

  describe('getPaymentRecords & reversePayment', () => {
    it('returns enriched payment history and executes authoritative reversal', () => {
      // 1. Record a payment
      const recordResult = paymentService.recordPayment({
        stayId: sampleStay.id,
        amount: 10000,
        paymentMethod: 'UPI',
        paymentDate: '2026-08-10',
        referenceNumber: 'UPI-REC-001',
      });

      expect(recordResult.success).toBe(true);
      const paymentId = recordResult.payment!.id;

      // 2. Fetch payment records from coordinator
      const paymentRecords = coordinator.getPaymentRecords();
      expect(paymentRecords.length).toBeGreaterThanOrEqual(1);

      const found = paymentRecords.find((p) => p.id === paymentId);
      expect(found).toBeDefined();
      expect(found?.residentName).toBe('Ananya Verma');
      expect(found?.amount).toBe(10000);
      expect(found?.status).toBe('RECORDED');

      // 3. Reverse payment through coordinator
      const revResult = coordinator.reversePayment({
        paymentId,
        reversalReason: 'Wrong account transfer',
        reversedBy: 'ACCOUNTS_MGR',
      });

      expect(revResult.success).toBe(true);
      expect(revResult.payment?.status).toBe('REVERSED');

      // 4. Verify updated coordinator records reflect reversal status
      const updatedRecords = coordinator.getPaymentRecords();
      const updatedPayment = updatedRecords.find((p) => p.id === paymentId);
      expect(updatedPayment?.status).toBe('REVERSED');
      expect(updatedPayment?.reversalReason).toBe('Wrong account transfer');
      expect(updatedPayment?.reversedBy).toBe('ACCOUNTS_MGR');
    });
  });
});
