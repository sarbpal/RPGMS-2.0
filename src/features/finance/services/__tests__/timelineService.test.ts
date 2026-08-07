import { describe, it, expect, beforeEach } from 'vitest';
import { TimelineApplicationService } from '../timelineService';
import { BillingApplicationService } from '../billingService';
import { PaymentApplicationService } from '../paymentService';
import { SettlementApplicationService } from '../settlementService';
import { defaultFinanceRepository } from '../../infrastructure';
import { financeStorage } from '../../storage/financeStorage';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';

describe('TimelineApplicationService Unit Test Suite (Sprint FR-4)', () => {
  let timelineService: TimelineApplicationService;
  let billingService: BillingApplicationService;
  let paymentService: PaymentApplicationService;
  let settlementService: SettlementApplicationService;
  let stayRepo: InMemoryStayRepository;

  const sampleStayId = 'stay-timeline-101';
  const sampleStay = new Stay({
    id: sampleStayId,
    residentId: 'res-tl-1',
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: '2026-08-01',
    agreedRent: 12000,
    agreedDeposit: 10000,
    allocatedBedIds: ['bed-tl-1'],
  });

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);

    stayRepo = new InMemoryStayRepository([sampleStay]);
    billingService = new BillingApplicationService(defaultFinanceRepository, stayRepo);
    paymentService = new PaymentApplicationService(defaultFinanceRepository, stayRepo);
    settlementService = new SettlementApplicationService(defaultFinanceRepository, stayRepo);

    timelineService = new TimelineApplicationService(
      billingService,
      paymentService,
      settlementService
    );
  });

  describe('getTimelineForStay Sorting & Formatting', () => {
    it('aggregates Bills and Payments into a chronological event list (newest first)', () => {
      billingService.createBill({
        stayId: sampleStayId,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: '1', description: 'August Rent', amount: 12000, category: 'RENT' }],
        totalAmount: 12000,
        status: 'UNPAID',
      });

      paymentService.recordPayment({
        stayId: sampleStayId,
        paymentDate: '2026-08-05',
        amount: 12000,
        paymentMethod: 'UPI',
        referenceNumber: 'UPI-TL-100',
      });

      const timeline = timelineService.getTimelineForStay(sampleStayId);

      expect(timeline).toHaveLength(2);
      expect(timeline[0].type).toBe('PAYMENT'); // Aug 5 (newest first)
      expect(timeline[0].amount).toBe(12000);
      expect(timeline[1].type).toBe('BILL');    // Aug 1
      expect(timeline[1].amount).toBe(12000);
    });

    it('returns empty array if stayId is empty or has no financial activity', () => {
      expect(timelineService.getTimelineForStay('')).toEqual([]);
      expect(timelineService.getTimelineForStay('empty-stay')).toEqual([]);
    });
  });

  describe('getRecentFinanceActivity Global Feed', () => {
    it('returns recent financial events across all stays up to the specified limit', () => {
      billingService.createBill({
        stayId: sampleStayId,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: '1', description: 'Rent', amount: 12000, category: 'RENT' }],
        totalAmount: 12000,
        status: 'UNPAID',
      });

      paymentService.recordPayment({
        stayId: sampleStayId,
        paymentDate: '2026-08-04',
        amount: 6000,
        paymentMethod: 'CASH',
      });

      const recent = timelineService.getRecentFinanceActivity(1);
      expect(recent).toHaveLength(1);
      expect(recent[0].type).toBe('PAYMENT');
      expect(recent[0].amount).toBe(6000);
    });
  });

  describe('getTimelineSummary Metrics', () => {
    it('returns accurate bill counts, payment counts, and current balances', () => {
      billingService.createBill({
        stayId: sampleStayId,
        billType: 'MONTHLY_RENT',
        period: '2026-08',
        issueDate: '2026-08-01',
        dueDate: '2026-08-07',
        lineItems: [{ id: '1', description: 'Rent', amount: 12000, category: 'RENT' }],
        totalAmount: 12000,
        status: 'UNPAID',
      });

      paymentService.recordPayment({
        stayId: sampleStayId,
        paymentDate: '2026-08-05',
        amount: 4000,
        paymentMethod: 'CASH',
      });

      const summary = timelineService.getTimelineSummary(sampleStayId);

      expect(summary.totalBillsCount).toBe(1);
      expect(summary.totalPaymentsCount).toBe(1);
      expect(summary.outstandingBalance).toBe(8000);
      expect(summary.advanceCredit).toBe(0);
      expect(summary.settlementStatus).toBe('NONE');
    });

    it('returns default zero summary for invalid stayId', () => {
      const emptySummary = timelineService.getTimelineSummary('');
      expect(emptySummary.totalBillsCount).toBe(0);
      expect(emptySummary.totalPaymentsCount).toBe(0);
      expect(emptySummary.outstandingBalance).toBe(0);
    });
  });
});
