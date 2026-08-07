import { describe, it, expect, beforeEach } from 'vitest';
import { ReportingApplicationService } from '../reportingService';
import { BillingApplicationService } from '../billingService';
import { PaymentApplicationService } from '../paymentService';
import { SettlementApplicationService } from '../settlementService';
import { TimelineApplicationService } from '../timelineService';
import { defaultFinanceRepository } from '../../infrastructure';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import type { Resident } from '../../../resident/domain/entities/Resident';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';

describe('ReportingApplicationService Unit Test Suite (Sprint FR-4)', () => {
  let reportingService: ReportingApplicationService;
  let billingService: BillingApplicationService;
  let paymentService: PaymentApplicationService;
  let settlementService: SettlementApplicationService;
  let timelineService: TimelineApplicationService;
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;

  const sampleResident: Resident = {
    id: 'res-report-1',
    residentCode: 'RES-REP-1',
    fullName: 'Rahul Sharma',
    mobileNumber: '+91 9876543210',
    email: 'rahul@example.com',
    status: 'ACTIVE',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  };

  const sampleStay = new Stay({
    id: 'stay-report-1',
    residentId: sampleResident.id,
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: '2026-08-01',
    agreedRent: 15000,
    agreedDeposit: 10000,
    allocatedBedIds: ['bed-report-1a'],
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
  });

  describe('getFinanceDashboard Metrics Aggregation', () => {
    it('aggregates property-wide billing, receivables, collections, and active residents', () => {
      const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      // Create rent bill
      billingService.createBill({
        stayId: sampleStay.id,
        billType: 'MONTHLY_RENT',
        period: currentMonthStr,
        issueDate: `${currentMonthStr}-01`,
        dueDate: `${currentMonthStr}-07`,
        lineItems: [{ id: 'li-1', description: 'Rent', amount: 15000, category: 'RENT' }],
        totalAmount: 15000,
        status: 'UNPAID',
      });

      // Record partial payment
      paymentService.recordPayment({
        stayId: sampleStay.id,
        paymentDate: `${currentMonthStr}-03`,
        amount: 5000,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-999',
      });

      const metrics = reportingService.getFinanceDashboard();

      expect(metrics.outstandingReceivables).toBe(10000);
      expect(metrics.totalMonthlyBilling).toBe(15000);
      expect(metrics.totalCollections).toBe(5000);
      expect(metrics.activeResidentsCount).toBe(1);
    });
  });

  describe('getResidentFinancialSummary Details', () => {
    it('returns formatted summary for an active stay', () => {
      billingService.createBill({
        stayId: sampleStay.id,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: 'li-1', description: 'Rent', amount: 15000, category: 'RENT' }],
        totalAmount: 15000,
        status: 'UNPAID',
      });

      const summary = reportingService.getResidentFinancialSummary(sampleStay.id);

      expect(summary).not.toBeNull();
      expect(summary?.residentName).toBe('Rahul Sharma');
      expect(summary?.currentBalance).toBe(15000);
      expect(summary?.totalBillsAmount).toBe(15000);
      expect(summary?.totalPaymentsAmount).toBe(0);
      expect(summary?.settlementStatus).toBe('NONE');
    });

    it('returns null if stayId is empty or non-existent', () => {
      expect(reportingService.getResidentFinancialSummary('')).toBeNull();
      expect(reportingService.getResidentFinancialSummary('unknown-stay')).toBeNull();
    });
  });

  describe('getMonthlyCollections Breakdown', () => {
    it('groups cash vs bank payment collections for specified month/year', () => {
      paymentService.recordPayment({
        stayId: sampleStay.id,
        paymentDate: '2026-08-02',
        amount: 2000,
        paymentMethod: 'CASH',
      });

      paymentService.recordPayment({
        stayId: sampleStay.id,
        paymentDate: '2026-08-05',
        amount: 8000,
        paymentMethod: 'BANK_TRANSFER',
      });

      const report = reportingService.getMonthlyCollections(8, 2026);

      expect(report.month).toBe(8);
      expect(report.year).toBe(2026);
      expect(report.cashCollections).toBe(2000);
      expect(report.bankCollections).toBe(8000);
      expect(report.totalCollections).toBe(10000);
      expect(report.paymentCount).toBe(2);
    });
  });

  describe('getOutstandingResidents List', () => {
    it('returns residents with positive receivable balance sorted highest dues first', () => {
      const stay2 = new Stay({
        id: 'stay-report-2',
        residentId: 'res-report-2',
        stayType: 'REGULAR',
        status: StayStatus.ACTIVE,
        checkInDate: '2026-08-01',
        agreedRent: 20000,
        agreedDeposit: 15000,
        allocatedBedIds: ['bed-2a'],
      });
      const res2: Resident = {
        id: 'res-report-2',
        residentCode: 'RES-REP-2',
        fullName: 'Priya Patel',
        mobileNumber: '+91 9999988888',
        email: 'priya@example.com',
        status: 'ACTIVE',
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01',
      };

      stayRepo.saveSync(stay2);
      residentRepo.saveSync(res2);

      // Stay 1: 5,000 receivable
      billingService.createBill({
        stayId: sampleStay.id,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: '1', description: 'Rent', amount: 5000, category: 'RENT' }],
        totalAmount: 5000,
        status: 'UNPAID',
      });

      // Stay 2: 20,000 receivable
      billingService.createBill({
        stayId: stay2.id,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: '2', description: 'Rent', amount: 20000, category: 'RENT' }],
        totalAmount: 20000,
        status: 'UNPAID',
      });

      const list = reportingService.getOutstandingResidents();

      expect(list).toHaveLength(2);
      expect(list[0].residentName).toBe('Priya Patel');
      expect(list[0].outstandingAmount).toBe(20000);
      expect(list[1].residentName).toBe('Rahul Sharma');
      expect(list[1].outstandingAmount).toBe(5000);
    });
  });

  describe('getSettlementReport Audit Log', () => {
    it('returns empty array when no checkout settlements exist', () => {
      expect(reportingService.getSettlementReport()).toEqual([]);
    });
  });
});
