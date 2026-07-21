import type { FinanceTimelineEvent, TimelineSummary } from '../types';
import { billingService } from './billingService';
import { paymentService } from './paymentService';
import { settlementService } from './settlementService';
import { balanceEngine } from './balanceEngine';

export const timelineService = {
  /**
   * Return a single chronological list of financial events (Bills, Payments, Settlements) for a Stay.
   * Sorted newest first.
   * STRICTLY READ-ONLY: Performs zero mutations, creates zero records.
   * 
   * @param stayId Target Stay ID
   * @returns Array of FinanceTimelineEvent objects
   */
  getTimelineForStay(stayId: string): FinanceTimelineEvent[] {
    if (!stayId || stayId.trim() === '') return [];

    const events: FinanceTimelineEvent[] = [];

    // 1. Bills
    const bills = billingService.getBillsByStayId(stayId);
    bills.forEach((b) => {
      events.push({
        id: `evt_bill_${b.id}`,
        stayId: b.stayId,
        date: new Date(b.issueDate || b.createdAt),
        type: 'BILL',
        title: `Bill #${b.billNumber}`,
        description: `${b.billType.replace(/_/g, ' ')} (${b.period}): ${b.remarks || 'Rent/Service Charge'}`,
        amount: b.totalAmount,
        referenceId: b.id,
        metadata: {
          status: b.status,
          paidAmount: b.paidAmount,
          balanceAmount: b.balanceAmount,
          billType: b.billType,
        },
      });
    });

    // 2. Payments
    const payments = paymentService.getPaymentsByStayId(stayId);
    payments.forEach((p) => {
      events.push({
        id: `evt_pay_${p.id}`,
        stayId: p.stayId,
        date: new Date(p.paymentDate || p.createdAt),
        type: 'PAYMENT',
        title: `Payment #${p.paymentNumber}`,
        description: `Payment received via ${p.paymentMethod}${p.remarks ? ` - ${p.remarks}` : ''}`,
        amount: p.amount,
        referenceId: p.id,
        metadata: {
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          allocationsCount: p.allocations?.length || 0,
        },
      });
    });

    // 3. Settlement
    const settlement = settlementService.getSettlementByStayId(stayId);
    if (settlement) {
      events.push({
        id: `evt_stl_${settlement.id}`,
        stayId: settlement.stayId,
        date: new Date(settlement.settlementDate || settlement.createdAt),
        type: 'SETTLEMENT',
        title: `Settlement #${settlement.settlementNumber}`,
        description: `Checkout Settlement (${settlement.outcome.replace(/_/g, ' ')})`,
        amount: settlement.finalAmount,
        referenceId: settlement.id,
        metadata: {
          outcome: settlement.outcome,
          settlementType: settlement.settlementType,
          paymentMethod: settlement.paymentMethod,
        },
      });
    }

    // Sort newest first
    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  /**
   * Return latest financial events across all stays.
   * Used for dashboard widgets and recent activity lists.
   * 
   * @param limit Maximum number of activity events to return (default: 10)
   * @returns Array of recent FinanceTimelineEvent objects
   */
  getRecentFinanceActivity(limit = 10): FinanceTimelineEvent[] {
    const events: FinanceTimelineEvent[] = [];

    const bills = billingService.getAllBills();
    bills.forEach((b) => {
      events.push({
        id: `evt_bill_${b.id}`,
        stayId: b.stayId,
        date: new Date(b.issueDate || b.createdAt),
        type: 'BILL',
        title: `Bill #${b.billNumber}`,
        description: `${b.billType.replace(/_/g, ' ')} (${b.period})`,
        amount: b.totalAmount,
        referenceId: b.id,
        metadata: { status: b.status, stayId: b.stayId },
      });
    });

    const payments = paymentService.getAllPayments();
    payments.forEach((p) => {
      events.push({
        id: `evt_pay_${p.id}`,
        stayId: p.stayId,
        date: new Date(p.paymentDate || p.createdAt),
        type: 'PAYMENT',
        title: `Payment #${p.paymentNumber}`,
        description: `Payment received via ${p.paymentMethod}`,
        amount: p.amount,
        referenceId: p.id,
        metadata: { paymentMethod: p.paymentMethod, stayId: p.stayId },
      });
    });

    const settlements = settlementService.getAllSettlements();
    settlements.forEach((s) => {
      events.push({
        id: `evt_stl_${s.id}`,
        stayId: s.stayId,
        date: new Date(s.settlementDate || s.createdAt),
        type: 'SETTLEMENT',
        title: `Settlement #${s.settlementNumber}`,
        description: `Checkout Settlement (${s.outcome.replace(/_/g, ' ')})`,
        amount: s.finalAmount,
        referenceId: s.id,
        metadata: { outcome: s.outcome, stayId: s.stayId },
      });
    });

    return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
  },

  /**
   * Return a summary of financial metrics and counts for a Stay.
   * All balance values are derived strictly from balanceEngine.
   * 
   * @param stayId Target Stay ID
   * @returns TimelineSummary object
   */
  getTimelineSummary(stayId: string): TimelineSummary {
    if (!stayId || stayId.trim() === '') {
      return {
        totalBillsCount: 0,
        totalPaymentsCount: 0,
        outstandingBalance: 0,
        advanceCredit: 0,
        securityDepositHeld: 0,
        settlementStatus: 'NONE',
      };
    }

    const balances = balanceEngine.calculateStayBalances(stayId);
    const bills = billingService.getBillsByStayId(stayId);
    const payments = paymentService.getPaymentsByStayId(stayId);
    const settlement = settlementService.getSettlementByStayId(stayId);

    return {
      totalBillsCount: bills.length,
      totalPaymentsCount: payments.length,
      outstandingBalance: balances.receivableBalance,
      advanceCredit: balances.advanceCreditBalance,
      securityDepositHeld: balances.securityDepositHeld,
      settlementStatus: settlement ? 'SETTLED' : 'NONE',
    };
  },
};
