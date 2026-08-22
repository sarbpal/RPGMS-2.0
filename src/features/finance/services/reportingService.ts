import type {
  FinanceDashboardMetrics,
  ResidentFinancialSummaryReport,
  MonthlyCollectionsReport,
  OutstandingResidentReportItem,
  SettlementReportItem,
  FinanceRepository,
} from '../types';
import { balanceEngine } from './balanceEngine';
import { BillingApplicationService } from './billingService';
import { PaymentApplicationService } from './paymentService';
import { SettlementApplicationService } from './settlementService';
import { TimelineApplicationService } from './timelineService';
import { defaultFinanceRepository } from '../infrastructure';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import { defaultStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import type { ResidentRepository } from '../../resident/domain/interfaces/ResidentRepository';
import { defaultResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';

export class ReportingApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;
  private residentRepository: ResidentRepository;
  private billingService: BillingApplicationService;
  private paymentService: PaymentApplicationService;
  private settlementService: SettlementApplicationService;
  private timelineService: TimelineApplicationService;

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = defaultStayRepository,
    residentRepository: ResidentRepository = defaultResidentRepository,
    billingService?: BillingApplicationService,
    paymentService?: PaymentApplicationService,
    settlementService?: SettlementApplicationService,
    timelineService?: TimelineApplicationService
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
    this.residentRepository = residentRepository;
    this.billingService = billingService ?? new BillingApplicationService(repository, stayRepository);
    this.paymentService = paymentService ?? new PaymentApplicationService(repository, stayRepository);
    this.settlementService = settlementService ?? new SettlementApplicationService(repository, stayRepository);
    this.timelineService =
      timelineService ??
      new TimelineApplicationService(this.billingService, this.paymentService, this.settlementService);
  }

  public getRepository(): FinanceRepository {
    return this.repository;
  }

  /**
   * Return high-level aggregated finance metrics for property management dashboard.
   * STRICTLY READ-ONLY: Aggregates data solely from existing finance and stay services.
   */
  public getFinanceDashboard(): FinanceDashboardMetrics {
    const summary = balanceEngine.calculateFinanceSummary();
    const stays = this.stayRepository.getAllSync();
    const activeStays = stays.filter((s) => s.status === 'ACTIVE' || s.status === 'ON_NOTICE');
    const settlements = this.settlementService.getAllSettlements();
    const closedSettlements = settlements.filter((s) => s.status === 'SETTLED');

    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const bills = this.billingService.getAllBills();
    const totalMonthlyBilling = bills
      .filter((b) => b.period === currentMonthStr && b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const monthlyCollections = this.getMonthlyCollections(now.getMonth() + 1, now.getFullYear());

    return {
      outstandingReceivables: summary.totalOutstanding,
      advanceCredits: summary.totalAdvanceCredit,
      securityDepositLiability: summary.totalDepositHeld,
      totalMonthlyBilling: Math.round(totalMonthlyBilling * 100) / 100,
      totalCollections: monthlyCollections.totalCollections,
      pendingSettlementsCount: stays.filter((s) => s.status === 'ON_NOTICE').length,
      activeResidentsCount: activeStays.length,
      closedSettlementsCount: closedSettlements.length,
    };
  }

  /**
   * Return financial summary report for a specific Stay / Resident.
   */
  public getResidentFinancialSummary(stayId: string): ResidentFinancialSummaryReport | null {
    if (!stayId || stayId.trim() === '') return null;

    const stay = this.stayRepository.findByIdSync(stayId);
    if (!stay) return null;

    const residents = this.residentRepository.getAllSync();
    const resident = residents.find((r) => r.id === stay.residentId);

    const balances = balanceEngine.calculateStayBalances(stayId);
    const timelineSummary = this.timelineService.getTimelineSummary(stayId);

    const bills = this.billingService.getBillsByStayId(stayId);
    const totalBillsAmount = bills
      .filter((b) => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const payments = this.paymentService.getPaymentsByStayId(stayId);
    const totalPaymentsAmount = payments
      .filter((p) => p.status !== 'REVERSED')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      stayId,
      residentName: resident?.fullName || 'Unknown Resident',
      currentBalance: balances.receivableBalance,
      totalBillsAmount: Math.round(totalBillsAmount * 100) / 100,
      totalPaymentsAmount: Math.round(totalPaymentsAmount * 100) / 100,
      advanceCredit: balances.advanceCreditBalance,
      securityDeposit: balances.securityDepositHeld,
      settlementStatus: timelineSummary.settlementStatus,
      timelineSummary,
    };
  }

  /**
   * Return monthly collections breakdown by Cash and Bank for a given month and year.
   */
  public getMonthlyCollections(month: number, year: number): MonthlyCollectionsReport {
    const payments = this.paymentService.getAllPayments();
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;

    const monthPayments = payments.filter(
      (p) => p.status !== 'REVERSED' && p.paymentDate && p.paymentDate.startsWith(monthStr)
    );

    const cashCollections = monthPayments
      .filter((p) => p.paymentMethod === 'CASH')
      .reduce((sum, p) => sum + p.amount, 0);

    const bankCollections = monthPayments
      .filter((p) => p.paymentMethod !== 'CASH')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      month,
      year,
      cashCollections: Math.round(cashCollections * 100) / 100,
      bankCollections: Math.round(bankCollections * 100) / 100,
      totalCollections: Math.round((cashCollections + bankCollections) * 100) / 100,
      paymentCount: monthPayments.length,
    };
  }

  /**
   * Return list of active residents with outstanding receivables (> 0), sorted highest first.
   */
  public getOutstandingResidents(): OutstandingResidentReportItem[] {
    const stays = this.stayRepository.getAllSync();
    const residents = this.residentRepository.getAllSync();
    const report: OutstandingResidentReportItem[] = [];

    stays.forEach((stay) => {
      if (stay.status !== 'ACTIVE' && stay.status !== 'ON_NOTICE') return;

      const balances = balanceEngine.calculateStayBalances(stay.id);
      if (balances.receivableBalance > 0) {
        const resident = residents.find((r) => r.id === stay.residentId);
        report.push({
          stayId: stay.id,
          residentId: stay.residentId,
          residentName: resident?.fullName || 'Unknown Resident',
          phone: resident ? resident.mobileNumber : undefined,
          roomBedLabel: stay.flatId ? `Flat ${stay.flatId}` : undefined,
          outstandingAmount: balances.receivableBalance,
        });
      }
    });

    return report.sort((a, b) => b.outstandingAmount - a.outstandingAmount);
  }

  /**
   * Return report of all completed checkout settlements.
   */
  public getSettlementReport(): SettlementReportItem[] {
    const settlements = this.settlementService.getAllSettlements();
    const residents = this.residentRepository.getAllSync();
    const stays = this.stayRepository.getAllSync();

    return settlements
      .filter((s) => s.status === 'SETTLED')
      .map((s) => {
        const stay = stays.find((st) => st.id === s.stayId);
        const resident = stay ? residents.find((r) => r.id === stay.residentId) : undefined;

        const netRefundAmount = s.outcome === 'HOSTEL_REFUNDS_RESIDENT' ? s.finalAmount : 0;
        const residentPaymentAmount = s.outcome === 'RESIDENT_PAYS_HOSTEL' ? s.finalAmount : 0;
        const damageRecovery = s.previewSnapshot?.damageDeductions || 0;

        return {
          settlementId: s.id,
          settlementNumber: s.settlementNumber,
          stayId: s.stayId,
          residentName: resident?.fullName || 'Unknown Resident',
          settlementDate: s.settlementDate,
          netRefundAmount,
          residentPaymentAmount,
          damageRecovery,
          outcome: s.outcome,
        };
      })
      .sort((a, b) => b.settlementDate.localeCompare(a.settlementDate));
  }
}

export const reportingService = new ReportingApplicationService();
