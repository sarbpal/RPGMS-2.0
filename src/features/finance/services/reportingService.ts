import type {
  FinanceDashboardMetrics,
  ResidentFinancialSummaryReport,
  MonthlyCollectionsReport,
  OutstandingResidentReportItem,
  SettlementReportItem,
} from '../types';
import { balanceEngine } from './balanceEngine';
import { billingService } from './billingService';
import { paymentService } from './paymentService';
import { settlementService } from './settlementService';
import { timelineService } from './timelineService';
import { InMemoryStayRepository } from '../../stay';
import { InMemoryResidentRepository } from '../../resident';

export const reportingService = {
  /**
   * Return high-level aggregated finance metrics for property management dashboard.
   * STRICTLY READ-ONLY: Aggregates data solely from existing finance and stay services.
   */
  getFinanceDashboard(): FinanceDashboardMetrics {
    const summary = balanceEngine.calculateFinanceSummary();
    const stays = new InMemoryStayRepository().getAllSync();
    const activeStays = stays.filter((s) => s.status === 'ACTIVE' || s.status === 'ON_NOTICE');
    const settlements = settlementService.getAllSettlements();
    const closedSettlements = settlements.filter((s) => s.status === 'SETTLED');

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const bills = billingService.getAllBills();
    const totalMonthlyBilling = bills
      .filter((b) => b.period === currentMonthStr && b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      outstandingReceivables: summary.totalOutstanding,
      advanceCredits: summary.totalAdvanceCredit,
      securityDepositLiability: summary.totalDepositHeld,
      totalMonthlyBilling: Math.round(totalMonthlyBilling * 100) / 100,
      totalCollections: summary.totalCollected,
      pendingSettlementsCount: stays.filter((s) => s.status === 'ON_NOTICE').length,
      activeResidentsCount: activeStays.length,
      closedSettlementsCount: closedSettlements.length,
    };
  },

  /**
   * Return financial summary report for a specific Stay / Resident.
   */
  getResidentFinancialSummary(stayId: string): ResidentFinancialSummaryReport | null {
    if (!stayId || stayId.trim() === '') return null;

    const stay = new InMemoryStayRepository().findByIdSync(stayId);
    if (!stay) return null;

    const residents = new InMemoryResidentRepository().getAllSync();
    const resident = residents.find((r) => r.id === stay.residentId);

    const balances = balanceEngine.calculateStayBalances(stayId);
    const timelineSummary = timelineService.getTimelineSummary(stayId);

    const bills = billingService.getBillsByStayId(stayId);
    const totalBillsAmount = bills
      .filter((b) => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const payments = paymentService.getPaymentsByStayId(stayId);
    const totalPaymentsAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      stayId,
      residentName: resident ? resident.fullName : 'Resident',
      currentBalance: balances.receivableBalance,
      totalBillsAmount: Math.round(totalBillsAmount * 100) / 100,
      totalPaymentsAmount: Math.round(totalPaymentsAmount * 100) / 100,
      advanceCredit: balances.advanceCreditBalance,
      securityDeposit: balances.securityDepositHeld,
      settlementStatus: timelineSummary.settlementStatus,
      timelineSummary,
    };
  },

  /**
   * Return monthly collections breakdown by Cash and Bank for a given month and year.
   */
  getMonthlyCollections(month: number, year: number): MonthlyCollectionsReport {
    const payments = paymentService.getAllPayments();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const monthPayments = payments.filter(
      (p) => p.paymentDate && p.paymentDate.startsWith(monthStr)
    );

    let cashCollections = 0;
    let bankCollections = 0;

    monthPayments.forEach((p) => {
      if (p.paymentMethod === 'CASH') {
        cashCollections += p.amount;
      } else {
        bankCollections += p.amount;
      }
    });

    return {
      month,
      year,
      cashCollections: Math.round(cashCollections * 100) / 100,
      bankCollections: Math.round(bankCollections * 100) / 100,
      totalCollections: Math.round((cashCollections + bankCollections) * 100) / 100,
      paymentCount: monthPayments.length,
    };
  },

  /**
   * Return list of active residents with outstanding receivables (> 0), sorted highest first.
   */
  getOutstandingResidents(): OutstandingResidentReportItem[] {
    const stays = new InMemoryStayRepository().getAllSync();
    const residents = new InMemoryResidentRepository().getAllSync();
    const report: OutstandingResidentReportItem[] = [];

    stays.forEach((stay) => {
      if (stay.status === 'CLOSED') return;

      const balances = balanceEngine.calculateStayBalances(stay.id);
      if (balances.receivableBalance > 0) {
        const res = residents.find((r) => r.id === stay.residentId);
        report.push({
          stayId: stay.id,
          residentId: stay.residentId,
          residentName: res ? res.fullName : 'Resident',
          phone: res ? res.mobileNumber : undefined,
          roomBedLabel: stay.flatId ? `Flat ${stay.flatId}` : undefined,
          outstandingAmount: balances.receivableBalance,
        });
      }
    });

    return report.sort((a, b) => b.outstandingAmount - a.outstandingAmount);
  },

  /**
   * Return report of all completed checkout settlements.
   */
  getSettlementReport(): SettlementReportItem[] {
    const settlements = settlementService.getAllSettlements();
    const residents = new InMemoryResidentRepository().getAllSync();
    const stays = new InMemoryStayRepository().getAllSync();

    return settlements
      .filter((s) => s.status === 'SETTLED')
      .map((s) => {
        const stay = stays.find((st) => st.id === s.stayId);
        const res = stay ? residents.find((r) => r.id === stay.residentId) : undefined;

        const netRefundAmount =
          s.outcome === 'HOSTEL_REFUNDS_RESIDENT' ? s.finalAmount : 0;
        const residentPaymentAmount =
          s.outcome === 'RESIDENT_PAYS_HOSTEL' ? s.finalAmount : 0;
        const damageRecovery = s.previewSnapshot?.damageDeductions || 0;

        return {
          settlementId: s.id,
          settlementNumber: s.settlementNumber,
          stayId: s.stayId,
          residentName: res ? res.fullName : 'Resident',
          settlementDate: s.settlementDate,
          netRefundAmount,
          residentPaymentAmount,
          damageRecovery,
          outcome: s.outcome,
        };
      })
      .sort((a, b) => b.settlementDate.localeCompare(a.settlementDate));
  },
};
