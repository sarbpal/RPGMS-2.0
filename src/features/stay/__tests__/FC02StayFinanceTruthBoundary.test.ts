import { describe, it, expect, beforeEach } from 'vitest';
import { StayWorkspaceCoordinator } from '../application/coordinator/StayWorkspaceCoordinator';
import { InMemoryStayRepository } from '../infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryFinanceRepository } from '../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../finance/storage/financeStorage';
import { BalanceApplicationService } from '../../finance/services/balanceEngine';
import { BillingApplicationService } from '../../finance/services/billingService';
import { PaymentApplicationService } from '../../finance/services/paymentService';
import { DepositApplicationService } from '../../finance/services/depositService';
import { ReportingApplicationService } from '../../finance/services/reportingService';
import { Stay } from '../domain/entities/Stay';
import { StayStatus } from '../domain/valueObjects/StayStatus';
import { StayType } from '../domain/valueObjects/StayType';
import { BillStatus } from '../../finance/domain';

describe('FC-02 — Stay ↔ Finance Financial Truth Boundary Suite', () => {
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let financeRepo: InMemoryFinanceRepository;

  let balanceEngine: BalanceApplicationService;
  let billingService: BillingApplicationService;
  let paymentService: PaymentApplicationService;
  let depositService: DepositApplicationService;
  let reportingService: ReportingApplicationService;
  let coordinator: StayWorkspaceCoordinator;

  const stayA_Id = 'STAY-FC02-A';
  const stayB_Id = 'STAY-FC02-B';
  const resA_Id = 'RES-FC02-A';
  const resB_Id = 'RES-FC02-B';

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  beforeEach(() => {
    // Reset finance storage
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
    financeStorage.saveStoredDepositTransactions([]);

    stayRepo = new InMemoryStayRepository();
    residentRepo = new InMemoryResidentRepository();
    accommodationRepo = new InMemoryAccommodationRepository();
    financeRepo = new InMemoryFinanceRepository();

    balanceEngine = new BalanceApplicationService(financeRepo);
    billingService = new BillingApplicationService(financeRepo, stayRepo);
    paymentService = new PaymentApplicationService(financeRepo, stayRepo);
    depositService = new DepositApplicationService(financeRepo, stayRepo);
    reportingService = new ReportingApplicationService(financeRepo, stayRepo, residentRepo);

    coordinator = new StayWorkspaceCoordinator(
      stayRepo,
      residentRepo,
      accommodationRepo,
      balanceEngine,
      billingService,
      paymentService
    );

    // Seed Residents
    residentRepo.saveSync({
      id: resA_Id,
      residentCode: 'R-A',
      fullName: 'Alice Resident',
      gender: 'FEMALE' as any,
      dateOfBirth: '1996-01-01',
      status: 'ACTIVE' as any,
      mobileNumber: '9111111111',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    residentRepo.saveSync({
      id: resB_Id,
      residentCode: 'R-B',
      fullName: 'Bob Resident',
      gender: 'MALE' as any,
      dateOfBirth: '1995-05-05',
      status: 'ACTIVE' as any,
      mobileNumber: '9222222222',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });

    // Seed Stays
    stayRepo.saveSync(
      new Stay({
        id: stayA_Id,
        residentId: resA_Id,
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-08-01',
        billingAnchorDay: 1,
        flatId: '101',
        allocatedBedIds: ['BED-101-A'],
        agreedRent: 10000,
        agreedDeposit: 20000,
      })
    );

    stayRepo.saveSync(
      new Stay({
        id: stayB_Id,
        residentId: resB_Id,
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-08-01',
        billingAnchorDay: 1,
        flatId: '102',
        allocatedBedIds: ['BED-102-B'],
        agreedRent: 15000,
        agreedDeposit: 30000,
      })
    );
  });

  it('Test 1 — Stay isolation: Stay A never displays financial values belonging to Stay B', () => {
    // Generate bill for Stay B only (₹15,000 rent + ₹500 laundry)
    billingService.createBill({
      stayId: stayB_Id,
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-05`,
      billType: 'MONTHLY_RENT',
      status: BillStatus.UNPAID,
      totalAmount: 15000,
      lineItems: [{ id: 'li-b1', description: 'Rent', amount: 15000, category: 'RENT' }],
    });

    billingService.createBill({
      stayId: stayB_Id,
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-02`,
      dueDate: `${currentMonthStr}-05`,
      billType: 'ONE_TIME_CHARGE',
      status: BillStatus.UNPAID,
      totalAmount: 500,
      lineItems: [{ id: 'li-b2', description: 'Laundry', amount: 500, category: 'LAUNDRY' }],
    });

    // Stay A has NO bills
    const vmA = coordinator.createViewModel(stayA_Id);
    expect(vmA.financialSummary.outstandingBalance).toBe(0);
    expect(vmA.financialSummary.currentMonthRent).toBe(0);
    expect(vmA.financialSummary.pendingLaundry).toBe(0);

    // Stay B reflects its own bills
    const vmB = coordinator.createViewModel(stayB_Id);
    expect(vmB.financialSummary.outstandingBalance).toBe(15500);
    expect(vmB.financialSummary.currentMonthRent).toBe(15000);
    expect(vmB.financialSummary.currentMonthCharges).toBe(15500);
    expect(vmB.financialSummary.pendingLaundry).toBe(500);
  });

  it('Test 2 — Current-month charges: Stay displays only current-month charges belonging to the selected stay', () => {
    // Stay A: Past month bill (2026-01) of ₹10,000 and current month bill of ₹10,000
    billingService.createBill({
      stayId: stayA_Id,
      period: '2026-01',
      issueDate: '2026-01-01',
      dueDate: '2026-01-07',
      billType: 'MONTHLY_RENT',
      status: BillStatus.UNPAID,
      totalAmount: 10000,
      lineItems: [{ id: 'li-a-old', description: 'Jan Rent', amount: 10000, category: 'RENT' }],
    });

    billingService.createBill({
      stayId: stayA_Id,
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-07`,
      billType: 'MONTHLY_RENT',
      status: BillStatus.UNPAID,
      totalAmount: 10000,
      lineItems: [{ id: 'li-a-curr', description: 'Current Rent', amount: 10000, category: 'RENT' }],
    });

    const vmA = coordinator.createViewModel(stayA_Id);
    // Total outstanding = 20,000
    expect(vmA.financialSummary.outstandingBalance).toBe(20000);
    // Current month charges = strictly current billing period (10,000)
    expect(vmA.financialSummary.currentMonthRent).toBe(10000);
  });

  it('Test 3 — Outstanding balance: Stay displays the authoritative Finance outstanding balance', () => {
    billingService.createBill({
      stayId: stayA_Id,
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-07`,
      billType: 'MONTHLY_RENT',
      status: BillStatus.UNPAID,
      totalAmount: 10000,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    });

    const balanceFromEngine = balanceEngine.calculateStayBalances(stayA_Id);
    const vmA = coordinator.createViewModel(stayA_Id);

    expect(vmA.financialSummary.outstandingBalance).toBe(balanceFromEngine.receivableBalance);
    expect(vmA.financialSummary.outstandingBalance).toBe(10000);
  });

  it('Test 4 — Cancelled Bills: Cancelled Bills do not incorrectly inflate Stay financial values', () => {
    // Generate bill
    const billRes = billingService.createBill({
      stayId: stayA_Id,
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-07`,
      billType: 'MONTHLY_RENT',
      status: BillStatus.UNPAID,
      totalAmount: 10000,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    });

    expect(billRes.success).toBe(true);

    // Cancel the bill in repository
    const storedBills = financeRepo.getBills();
    const bill = storedBills.find((b) => b.id === billRes.bill!.id);
    if (bill) {
      bill.status = 'CANCELLED' as any;
      financeRepo.saveBills(storedBills);
    }

    const vmA = coordinator.createViewModel(stayA_Id);
    // Cancelled bill does NOT inflate currentMonthRent
    expect(vmA.financialSummary.currentMonthRent).toBe(0);
  });

  it('Test 5 — Payment update: After a payment, the Stay financial projection reflects the authoritative updated state', () => {
    billingService.createBill({
      stayId: stayA_Id,
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-07`,
      billType: 'MONTHLY_RENT',
      status: BillStatus.UNPAID,
      totalAmount: 10000,
      lineItems: [{ id: 'li-1', description: 'Rent', amount: 10000, category: 'RENT' }],
    });

    let vm = coordinator.createViewModel(stayA_Id);
    expect(vm.financialSummary.outstandingBalance).toBe(10000);
    expect(vm.financialSummary.lastPaymentReceived).toBe('No payments recorded');

    // Record partial payment of ₹6,000
    paymentService.recordPayment({
      stayId: stayA_Id,
      amount: 6000,
      paymentDate: `${currentMonthStr}-03`,
      paymentMethod: 'UPI',
    });

    vm = coordinator.createViewModel(stayA_Id);
    expect(vm.financialSummary.outstandingBalance).toBe(4000);
    expect(vm.financialSummary.lastPaymentReceived).toContain('₹6,000');
    expect(vm.financialSummary.lastPaymentReceived).toContain(`${currentMonthStr}-03`);
  });

  it('Test 6 — Deposit: Stay displays the authoritative deposit-held value from ledger', () => {
    // Contractual deposit is ₹20,000, but no ledger contribution yet
    let vm = coordinator.createViewModel(stayA_Id);
    expect(vm.summary.securityDeposit).toBe('₹20,000'); // Contractual Stay agreed deposit
    expect(vm.financialSummary.securityDepositHeld).toBe(0); // Actual ledger deposit held

    // Record actual deposit contribution of ₹20,000
    depositService.recordDepositContribution(stayA_Id, 20000, 'BANK_TRANSFER', 'Security Deposit Receipt');

    vm = coordinator.createViewModel(stayA_Id);
    expect(vm.financialSummary.securityDepositHeld).toBe(20000);
  });

  it('Test 7 — Advance: Stay displays the authoritative advance-credit value', () => {
    // No bills. Resident pays ₹5,000 in advance
    paymentService.recordPayment({
      stayId: stayA_Id,
      amount: 5000,
      paymentDate: `${currentMonthStr}-02`,
      paymentMethod: 'BANK_TRANSFER',
    });

    const vm = coordinator.createViewModel(stayA_Id);
    expect(vm.financialSummary.advanceCredit).toBe(5000);
    expect(vm.financialSummary.outstandingBalance).toBe(0);
  });

  it('Test 8 — No fabricated values: No fallback/default/placeholder value (e.g. ₹0, ₹450) is presented as real financial data', () => {
    const vm = coordinator.createViewModel(stayA_Id);

    // When no electricity bills exist, pendingElectricity MUST be 0 (never fake 450)
    expect(vm.financialSummary.pendingElectricity).toBe(0);
    expect(vm.financialSummary.pendingLaundry).toBe(0);
    expect(vm.financialSummary.lastPaymentReceived).toBe('No payments recorded');
  });

  it('Test 9 — Property isolation: Property-wide Finance metrics must not accidentally appear in stay-scoped financial fields', () => {
    // Post bills across multiple stays
    billingService.createBill({
      stayId: stayA_Id,
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-07`,
      billType: 'MONTHLY_RENT',
      status: BillStatus.UNPAID,
      totalAmount: 10000,
      lineItems: [{ id: 'li-a', description: 'Rent A', amount: 10000, category: 'RENT' }],
    });

    billingService.createBill({
      stayId: stayB_Id,
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-07`,
      billType: 'MONTHLY_RENT',
      status: BillStatus.UNPAID,
      totalAmount: 15000,
      lineItems: [{ id: 'li-b', description: 'Rent B', amount: 15000, category: 'RENT' }],
    });

    // Property-wide dashboard reports total billing of ₹25,000
    const dashboard = reportingService.getFinanceDashboard();
    expect(dashboard.totalMonthlyBilling).toBe(25000);

    // Stay A view model MUST only report Stay A's ₹10,000 (never property-wide 25,000)
    const vmA = coordinator.createViewModel(stayA_Id);
    expect(vmA.financialSummary.currentMonthRent).toBe(10000);
    expect(vmA.financialSummary.outstandingBalance).toBe(10000);

    // Stay B view model MUST only report Stay B's ₹15,000
    const vmB = coordinator.createViewModel(stayB_Id);
    expect(vmB.financialSummary.currentMonthRent).toBe(15000);
    expect(vmB.financialSummary.outstandingBalance).toBe(15000);
  });

  it('Test 10 — Regression: Existing Stay workflows and quick actions remain intact', () => {
    // Test Stay operational actions: Give notice and check out
    const noticeProj = coordinator.giveNotice({
      stayId: stayA_Id,
      noticeDate: '2026-08-15',
      expectedCheckoutDate: '2026-09-15',
      reason: 'Relocating',
    });
    expect(noticeProj.status).toBe(StayStatus.ON_NOTICE);

    const checkoutProj = coordinator.processCheckout({
      stayId: stayA_Id,
      actualCheckoutDate: '2026-09-15',
      reason: 'Notice period completed',
    });
    expect(checkoutProj.status).toBe(StayStatus.CHECKED_OUT);

    const vm = coordinator.createViewModel(stayA_Id);
    expect(vm.header.status).toBe(StayStatus.CHECKED_OUT);
    expect(vm.timeline[0].title).toBe('Operational Checkout Completed');
  });

  it('Test 11 — Partial payment on utility charges: pendingElectricity reflects remaining unpaid balance', () => {
    // Post an electricity bill of ₹2,000
    billingService.createBill({
      stayId: stayA_Id,
      period: currentMonthStr,
      issueDate: `${currentMonthStr}-01`,
      dueDate: `${currentMonthStr}-05`,
      billType: 'ONE_TIME_CHARGE',
      status: BillStatus.UNPAID,
      totalAmount: 2000,
      lineItems: [{ id: 'li-elec-2000', description: 'Electricity', amount: 2000, category: 'UTILITIES' }],
    });

    let vm = coordinator.createViewModel(stayA_Id);
    expect(vm.financialSummary.pendingElectricity).toBe(2000);
    expect(vm.financialSummary.outstandingBalance).toBe(2000);

    // Record partial payment of ₹1,500
    paymentService.recordPayment({
      stayId: stayA_Id,
      amount: 1500,
      paymentDate: `${currentMonthStr}-02`,
      paymentMethod: 'UPI',
    });

    vm = coordinator.createViewModel(stayA_Id);
    // Unpaid balance is ₹500 (NOT total bill ₹2,000)
    expect(vm.financialSummary.pendingElectricity).toBe(500);
    expect(vm.financialSummary.outstandingBalance).toBe(500);

    // Record remaining payment of ₹500
    paymentService.recordPayment({
      stayId: stayA_Id,
      amount: 500,
      paymentDate: `${currentMonthStr}-03`,
      paymentMethod: 'CASH',
    });

    vm = coordinator.createViewModel(stayA_Id);
    // Fully paid -> pending is 0
    expect(vm.financialSummary.pendingElectricity).toBe(0);
    expect(vm.financialSummary.outstandingBalance).toBe(0);
  });
});
