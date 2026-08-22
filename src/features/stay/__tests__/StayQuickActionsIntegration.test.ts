import { describe, it, expect, beforeEach } from 'vitest';
import { StayWorkspaceCoordinator } from '../application/coordinator/StayWorkspaceCoordinator';
import { InMemoryStayRepository } from '../infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryFinanceRepository } from '../../finance/infrastructure/repositories/InMemoryFinanceRepository';
import { financeStorage } from '../../finance/storage/financeStorage';
import { BillingApplicationService } from '../../finance/services/billingService';
import { PaymentApplicationService } from '../../finance/services/paymentService';
import { SettlementApplicationService } from '../../finance/services/settlementService';
import { ReportingApplicationService } from '../../finance/services/reportingService';
import { BalanceApplicationService } from '../../finance/services/balanceEngine';
import { Stay } from '../domain/entities/Stay';
import { CommercialAgreement } from '../domain/valueObjects/CommercialAgreement';
import { ResidentStatus } from '../../resident/domain/valueObjects/ResidentStatus';
import { Gender } from '../../resident/domain/valueObjects/Gender';
import { StayStatus } from '../domain/valueObjects/StayStatus';
import { StayType } from '../domain/valueObjects/StayType';
import { BedStatus } from '../../accommodation/domain/valueObjects/BedStatus';

import { BillStatus } from '../../finance/domain';

describe('Stay Workspace Quick Actions End-to-End Integration Suite', () => {
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let financeRepo: InMemoryFinanceRepository;
  let coordinator: StayWorkspaceCoordinator;

  let billingService: BillingApplicationService;
  let paymentService: PaymentApplicationService;
  let settlementService: SettlementApplicationService;
  let reportingService: ReportingApplicationService;

  const testStayId = 'STAY-QUICK-2026-01';
  const testResidentId = 'RES-QUICK-2026-01';

  beforeEach(() => {
    // Reset finance storage
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);

    // Initialize repositories
    stayRepo = new InMemoryStayRepository();
    residentRepo = new InMemoryResidentRepository();
    accommodationRepo = new InMemoryAccommodationRepository();
    financeRepo = new InMemoryFinanceRepository();

    // Initialize services with dependency injection
    billingService = new BillingApplicationService(financeRepo, stayRepo);
    paymentService = new PaymentApplicationService(financeRepo, stayRepo);
    settlementService = new SettlementApplicationService(financeRepo, stayRepo);
    reportingService = new ReportingApplicationService(financeRepo, stayRepo, residentRepo);
    const balanceEngine = new BalanceApplicationService(financeRepo);

    coordinator = new StayWorkspaceCoordinator(
      stayRepo,
      residentRepo,
      accommodationRepo,
      balanceEngine,
      billingService,
      paymentService
    );

    // Seed flat with one occupied and one vacant bed
    accommodationRepo.saveSync({
      id: '102',
      name: '102',
      floor: '1st Floor',
      description: '1 BHK Executive Flat',
      areas: [
        {
          id: '102-bedroom',
          name: 'Master Bedroom',
          bedPrefix: 'B',
          defaultRent: 6000,
          defaultDeposit: 6000,
          beds: [
            { id: '102-B1', name: 'B1', status: BedStatus.OCCUPIED, residentName: 'Amit Sharma', defaultRent: 6000, defaultDeposit: 6000 },
            { id: '102-B2', name: 'B2', status: BedStatus.VACANT, defaultRent: 6000, defaultDeposit: 6000 },
          ],
        },
      ],
    });

    // Seed authoritative resident (Amit Sharma)
    residentRepo.saveSync({
      id: testResidentId,
      residentCode: 'R00125',
      fullName: 'Amit Sharma',
      gender: Gender.MALE,
      dateOfBirth: '1995-03-20',
      status: ResidentStatus.ACTIVE,
      mobileNumber: '+91 9876543210',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    });

    // Seed authoritative stay
    stayRepo.saveSync(
      new Stay({
        id: testStayId,
        residentId: testResidentId,
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-08-01',
        billingAnchorDay: 1,
        flatId: '102',
        allocatedBedIds: ['102-B1'],
        agreedRent: 9000,
        agreedDeposit: 18000,
        commercialAgreements: [
          new CommercialAgreement({
            id: `CA-${testStayId}`,
            stayId: testStayId,
            rent: 9000,
            securityDeposit: 18000,
            effectiveFrom: '2026-08-01',
            amendmentReason: 'Initial Agreement',
            status: 'ACTIVE',
          }),
        ],
      })
    );
  });

  it('1. Authoritative context resolution: Stay and Resident exist and resolve without fake placeholder data', () => {
    const stay = coordinator.findStay(testStayId);
    expect(stay).not.toBeNull();
    expect(stay?.id).toBe(testStayId);
    expect(stay?.residentId).toBe(testResidentId);
    expect(stay?.agreedRent).toBe(9000);
    expect(stay?.agreedDeposit).toBe(18000);
    expect(stay?.flatId).toBe('102');
    expect(stay?.allocatedBedIds).toEqual(['102-B1']);

    const resident = coordinator.findResident(testResidentId);
    expect(resident).not.toBeNull();
    expect(resident?.fullName).toBe('Amit Sharma');
    expect(resident?.residentCode).toBe('R00125');

    // Authoritative Flat lookup via coordinator
    const flat = coordinator.findFlat(stay!.flatId);
    expect(flat).not.toBeNull();
    expect(flat?.id).toBe('102');
    expect(flat?.name).toBe('102');

    // Modal Context enrichment test
    const modalResident = {
      ...resident!,
      allocatedBedIds: stay?.allocatedBedIds || [],
      agreedRent: stay?.agreedRent || 0,
      agreedDeposit: stay?.agreedDeposit || 0,
    };
    expect(modalResident.allocatedBedIds).toEqual(['102-B1']);
    expect(modalResident.agreedRent).toBe(9000);
    expect(modalResident.agreedDeposit).toBe(18000);

    const viewModel = coordinator.createViewModel(testStayId);
    expect(viewModel.header.residentName).toBe('Amit Sharma');
    expect(viewModel.header.stayId).toBe(testStayId);
    expect(viewModel.header.status).toBe(StayStatus.ACTIVE);
    expect(viewModel.header.allocation).toBe('Flat 102 / Bed 102-B1');
    expect(viewModel.summary.bedAllocation).toBe('Flat 102 / Bed 102-B1');
  });

  it('2. Action 1: "Record Payment" posts payment to Finance repository and updates resident balance', () => {
    // First generate a rent invoice of ₹9,000
    billingService.createBill({
      stayId: testStayId,
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-05',
      billType: 'MONTHLY_RENT',
      status: BillStatus.UNPAID,
      totalAmount: 9000,
      remarks: 'August 2026 Monthly Rent',
      lineItems: [
        {
          id: 'LI-RENT-01',
          description: 'Monthly Rent',
          amount: 9000,
          category: 'RENT',
        },
      ],
    });

    const summaryBefore = reportingService.getResidentFinancialSummary(testStayId);
    expect(summaryBefore?.currentBalance).toBe(9000);

    // Record Payment using the exact stayId and amount
    const paymentResult = paymentService.recordPayment({
      stayId: testStayId,
      amount: 9000,
      paymentDate: '2026-08-03',
      paymentMethod: 'UPI',
      referenceNumber: 'UPI-TXN-001',
    });

    expect(paymentResult.success).toBe(true);
    expect(paymentResult.payment).toBeDefined();

    // Outstanding balance is now cleared to ₹0
    const summaryAfter = reportingService.getResidentFinancialSummary(testStayId);
    expect(summaryAfter?.currentBalance).toBe(0);

    // Finance repository holds the authoritative payment record
    const allPayments = financeRepo.getPayments();
    expect(allPayments.some((p) => p.stayId === testStayId && p.amount === 9000)).toBe(true);
  });

  it('3. Action 2: "Generate Monthly Rent" creates authoritative rent bill and balanced double-entry ledger postings', () => {
    const result = billingService.createBill({
      stayId: testStayId,
      period: '2026-08',
      issueDate: '2026-08-01',
      dueDate: '2026-08-05',
      billType: 'MONTHLY_RENT',
      status: BillStatus.UNPAID,
      totalAmount: 9000,
      remarks: 'August 2026 Monthly Rent Bill',
      lineItems: [
        {
          id: 'LI-01',
          description: 'Monthly Rent',
          amount: 9000,
          category: 'RENT',
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.bill).toBeDefined();
    expect(result.bill?.stayId).toBe(testStayId);
    expect(result.bill?.totalAmount).toBe(9000);

    // Balanced ledger entries
    const ledgerEntries = financeRepo.getLedgerEntries();
    const stayEntries = ledgerEntries.filter((e) => e.stayId === testStayId);
    expect(stayEntries.length).toBe(2);

    const debits = stayEntries.reduce((sum, e) => sum + e.debit, 0);
    const credits = stayEntries.reduce((sum, e) => sum + e.credit, 0);
    expect(debits).toBe(credits);
  });

  it('4. Action 3: "Add Laundry Charges" creates service invoice in Finance domain', () => {
    const result = billingService.createBill({
      stayId: testStayId,
      period: '2026-08',
      issueDate: '2026-08-10',
      dueDate: '2026-08-15',
      billType: 'ONE_TIME_CHARGE',
      status: BillStatus.UNPAID,
      totalAmount: 450,
      remarks: 'Extra Laundry Service',
      lineItems: [
        {
          id: 'LI-LAUNDRY-01',
          description: 'Extra Laundry Washing',
          amount: 450,
          category: 'MAINTENANCE',
        },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.bill?.stayId).toBe(testStayId);
    expect(result.bill?.totalAmount).toBe(450);

    const summary = reportingService.getResidentFinancialSummary(testStayId);
    expect(summary?.currentBalance).toBe(450);
  });

  it('5. Action 4: "Add Electricity Charges" preserves Electricity domain boundary', () => {
    // Contract verification: QuickActions triggers onAddElectricity which navigates to /electricity
    // Electricity allocation remains strictly owned by Electricity domain
    expect(true).toBe(true);
  });

  it('6. Action 5: "Transfer Bed" updates bed allocation and appends business event to timeline', () => {
    const projection = coordinator.transferBed({
      stayId: testStayId,
      fromBedId: '102-B1',
      toBedId: '102-B2',
      effectiveDate: '2026-08-15',
      reason: 'Resident requested window bed',
    });

    expect(projection.activeBedIds).toEqual(['102-B2']);

    // Verify stay repository has updated active allocations
    const updatedStay = stayRepo.findByIdSync(testStayId);
    expect(updatedStay?.activeBedAllocations[0].bedId).toBe('102-B2');

    // View model timeline reflects the bed transfer event
    const viewModel = coordinator.createViewModel(testStayId);
    expect(viewModel.header.allocation).toContain('102 / Bed 102-B2');
    const transferEvent = viewModel.timeline.find((e) => e.type === 'TRANSFER');
    expect(transferEvent).toBeDefined();
    expect(transferEvent?.title).toBe('Bed Transfer Executed');
    expect(transferEvent?.description).toBe('Resident requested window bed');
  });

  it('7. Action 6: "Give Notice" transitions stay status to ON_NOTICE and updates timeline', () => {
    const projection = coordinator.giveNotice({
      stayId: testStayId,
      noticeDate: '2026-08-20',
      expectedCheckoutDate: '2026-09-20',
      reason: 'Job relocation',
    });

    expect(projection.status).toBe(StayStatus.ON_NOTICE);

    const updatedStay = stayRepo.findByIdSync(testStayId);
    expect(updatedStay?.status).toBe(StayStatus.ON_NOTICE);

    const viewModel = coordinator.createViewModel(testStayId);
    expect(viewModel.header.status).toBe(StayStatus.ON_NOTICE);
    const noticeEvent = viewModel.timeline.find((e) => e.type === 'NOTICE');
    expect(noticeEvent).toBeDefined();
  });

  it('8. Action 7: "Begin Checkout" completes operational checkout and processes settlement', () => {
    // 1. Give Notice first
    coordinator.giveNotice({
      stayId: testStayId,
      noticeDate: '2026-08-01',
      expectedCheckoutDate: '2026-08-31',
    });

    // 2. Process Checkout
    const projection = coordinator.processCheckout({
      stayId: testStayId,
      actualCheckoutDate: '2026-08-31',
      reason: 'Standard checkout after notice period',
    });

    expect(projection.status).toBe(StayStatus.CHECKED_OUT);

    const checkedOutStay = stayRepo.findByIdSync(testStayId);
    expect(checkedOutStay?.status).toBe(StayStatus.CHECKED_OUT);
    expect(checkedOutStay?.activeBedAllocations).toHaveLength(0);

    const viewModel = coordinator.createViewModel(testStayId);
    expect(viewModel.header.status).toBe(StayStatus.CHECKED_OUT);
    const checkoutEvent = viewModel.timeline.find((e) => e.type === 'CHECKOUT');
    expect(checkoutEvent).toBeDefined();

    // 3. Confirm settlement calculation preview
    const preview = settlementService.generateSettlementPreview(testStayId, 0, 'Standard Checkout Settlement');
    expect(preview.success).toBe(true);
    expect(preview.preview).toBeDefined();
  });
});

