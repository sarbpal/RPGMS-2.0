import { describe, it, expect, beforeEach } from 'vitest';
import { StayWorkspaceCoordinator } from '../StayWorkspaceCoordinator';
import { InMemoryStayRepository } from '../../../infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryFinanceRepository } from '../../../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { BalanceApplicationService } from '../../../../finance/services/balanceEngine';
import { BillingApplicationService } from '../../../../finance/services/billingService';
import { PaymentApplicationService } from '../../../../finance/services/paymentService';
import { DepositApplicationService } from '../../../../finance/services/depositService';
import { Stay } from '../../../domain/entities/Stay';
import { StayStatus } from '../../../domain/valueObjects/StayStatus';
import { StayType } from '../../../domain/valueObjects/StayType';

import { financeStorage } from '../../../../finance/storage/financeStorage';

describe('StayWorkspaceCoordinator Integration Suite (CR-3.7)', () => {
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let coordinator: StayWorkspaceCoordinator;

  const sampleStay = new Stay({
    id: 'stay-000001',
    residentId: 'res-000001',
    stayType: StayType.REGULAR,
    status: StayStatus.ACTIVE,
    checkInDate: '2026-01-01',
    flatId: 'FLAT-101',
    allocatedBedIds: ['BED-A1'],
    agreedRent: 8000,
    agreedDeposit: 6500,
  });

  beforeEach(() => {
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
    financeStorage.saveStoredDepositTransactions([]);

    stayRepo = new InMemoryStayRepository([sampleStay]);
    residentRepo = new InMemoryResidentRepository();
    coordinator = new StayWorkspaceCoordinator(stayRepo, residentRepo);
  });

  it('creates view model driven directly by CurrentProjection and BusinessEvents', () => {
    const viewModel = coordinator.createViewModel('stay-000001');

    expect(viewModel.header.stayId).toBe('stay-000001');
    expect(viewModel.header.status).toBe(StayStatus.ACTIVE);
    expect(viewModel.header.checkInDate).toBe('2026-01-01');
    expect(viewModel.header.allocation).toContain('Flat 101 / Bed A1');

    // Contractual facts stay in Stay domain
    expect(viewModel.summary.rentPlan).toBe('₹8,000 / month');
    expect(viewModel.summary.securityDeposit).toBe('₹6,500');

    // Authoritative Finance projection: unbilled / no ledger records = 0 (no fabricated placeholders)
    expect(viewModel.financialSummary.currentMonthRent).toBe(0);
    expect(viewModel.financialSummary.securityDepositHeld).toBe(0);
    expect(viewModel.financialSummary.outstandingBalance).toBe(0);
    expect(viewModel.financialSummary.pendingElectricity).toBe(0);
    expect(viewModel.financialSummary.pendingLaundry).toBe(0);
    expect(viewModel.financialSummary.lastPaymentReceived).toBe('No payments recorded');

    // Verify timeline maps BusinessEvent records directly
    expect(viewModel.timeline.length).toBeGreaterThan(0);
    expect(viewModel.timeline[0].title).toBe('Admission & Check-in');
    expect(viewModel.timeline[0].type).toBe('CHECK_IN');
  });

  it('dynamically maps timeline events from full Stay lifecycle events', () => {
    const stay = stayRepo.findByIdSync('stay-000001');
    if (stay) {
      stay.reviseRent({
        newRent: 8800,
        effectiveDate: '2026-04-01',
        reason: 'Annual 10% escalation',
      });
      stay.giveNotice({
        noticeDate: '2026-05-01',
        expectedCheckoutDate: '2026-06-01',
      });
      stayRepo.saveSync(stay);
    }

    const viewModel = coordinator.createViewModel('stay-000001');

    // Most recent events first
    expect(viewModel.timeline).toHaveLength(3);
    expect(viewModel.timeline[0].title).toBe('Notice Period Initiated');
    expect(viewModel.timeline[0].type).toBe('NOTICE');
    expect(viewModel.timeline[1].title).toBe('Rent Revised');
    expect(viewModel.timeline[1].type).toBe('COMMERCIAL');
    expect(viewModel.timeline[2].title).toBe('Admission & Check-in');
  });

  it('calculates occupancy duration dynamically from check-in and checkout dates', () => {
    const stay = stayRepo.findByIdSync('stay-000001');
    if (stay) {
      stay.giveNotice({
        noticeDate: '2026-04-01',
        expectedCheckoutDate: '2026-05-01',
      });
      stay.processCheckout({
        actualCheckoutDate: '2026-05-01',
      });
      stayRepo.saveSync(stay);
    }

    const viewModel = coordinator.createViewModel('stay-000001');
    expect(viewModel.summary.status).toBe(StayStatus.CHECKED_OUT);
    expect(viewModel.summary.occupancyDuration).toContain('months');
    expect(viewModel.timeline[0].title).toBe('Operational Checkout Completed');
    expect(viewModel.timeline[0].type).toBe('CHECKOUT');
  });

  it('resolves authoritative Flat via findFlat from AccommodationRepository', () => {
    // Flat 101 exists in accommodation seed data
    const flat = coordinator.findFlat('101');
    expect(flat).not.toBeNull();
    expect(flat?.name).toBe('101');

    // Non-existent flat
    const missingFlat = coordinator.findFlat('NON_EXISTENT_FLAT');
    expect(missingFlat).toBeNull();

    // Unassigned flat string
    const unassignedFlat = coordinator.findFlat('Unassigned');
    expect(unassignedFlat).toBeNull();
  });

  it('reflects authoritative Finance projections when bills and deposits are recorded', () => {
    const financeRepo = new InMemoryFinanceRepository();
    const balanceEngine = new BalanceApplicationService(financeRepo);
    const billingService = new BillingApplicationService(financeRepo, stayRepo);
    const paymentService = new PaymentApplicationService(financeRepo, stayRepo);
    const depositService = new DepositApplicationService(financeRepo, stayRepo);

    const coordinatorWithFinance = new StayWorkspaceCoordinator(
      stayRepo,
      residentRepo,
      undefined,
      balanceEngine,
      billingService,
      paymentService
    );

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // 1. Record deposit contribution of ₹6,500
    depositService.recordDepositContribution('stay-000001', 6500, 'BANK_TRANSFER', 'Admission Deposit');

    // 2. Generate monthly rent bill of ₹8,000 for current month
    billingService.createBill({
      stayId: 'stay-000001',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-07`,
      billType: 'MONTHLY_RENT',
      status: 'UNPAID',
      totalAmount: 8000,
      remarks: 'Current Month Rent',
      lineItems: [
        {
          id: 'li-rent-01',
          description: 'Monthly Rent',
          amount: 8000,
          category: 'RENT',
        },
      ],
    });

    // 3. Post a utility charge bill of ₹300
    billingService.createBill({
      stayId: 'stay-000001',
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-05`,
      dueDate: `${currentMonthStr}-10`,
      billType: 'ONE_TIME_CHARGE',
      status: 'UNPAID',
      totalAmount: 300,
      remarks: 'Electricity Utility Split',
      lineItems: [
        {
          id: 'li-elec-01',
          description: 'Electricity Share',
          amount: 300,
          category: 'UTILITIES',
        },
      ],
    });

    // 4. Record partial payment of ₹5,000
    paymentService.recordPayment({
      stayId: 'stay-000001',
      amount: 5000,
      paymentDate: `${currentMonthStr}-06`,
      paymentMethod: 'UPI',
    });

    const vm = coordinatorWithFinance.createViewModel('stay-000001');

    // Contractual facts remain Stay-owned
    expect(vm.summary.rentPlan).toBe('₹8,000 / month');
    expect(vm.summary.securityDeposit).toBe('₹6,500');

    // Authoritative Finance projection:
    // Rent billed = 8000 (rent only)
    // Total charges billed = 8000 (rent) + 300 (utility) = 8300
    // Total paid = 5000
    // Outstanding receivable = 8300 - 5000 = 3300
    expect(vm.financialSummary.outstandingBalance).toBe(3300);
    expect(vm.financialSummary.currentMonthRent).toBe(8000);
    expect(vm.financialSummary.currentMonthCharges).toBe(8300);
    expect(vm.financialSummary.securityDepositHeld).toBe(6500);
    expect(vm.financialSummary.pendingElectricity).toBe(300);
    expect(vm.financialSummary.pendingLaundry).toBe(0);
    expect(vm.financialSummary.lastPaymentReceived).toContain('₹5,000');
    expect(vm.financialSummary.lastPaymentReceived).toContain(`${currentMonthStr}-06`);
  });
});
