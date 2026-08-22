import { reportingService as defaultReportingService, ReportingApplicationService } from '../../services/reportingService';
import { timelineService as defaultTimelineService, TimelineApplicationService } from '../../services/timelineService';
import { balanceEngine as defaultBalanceEngine, BalanceApplicationService } from '../../services/balanceEngine';
import { paymentService as defaultPaymentService, PaymentApplicationService, type ReversePaymentPayload, type ReversePaymentResult } from '../../services/paymentService';
import { depositService as defaultDepositService, DepositApplicationService } from '../../services/depositService';
import type {
  FinanceWorkspaceViewModel,
  StayFinanceViewModel,
  PropertyFinanceSummaryViewModel,
  PaymentHistoryItem,
} from '../models/FinanceWorkspaceViewModel';
import type {
  FinanceTimelineEvent,
  FinanceSummary,
  StayBalance,
  TimelineSummary,
} from '../../types';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import { defaultStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { defaultResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import type { AccommodationRepository } from '../../../accommodation/domain/interfaces/AccommodationRepository';
import { defaultAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import type { Resident } from '../../../resident/domain/entities/Resident';
import type { Flat } from '../../../accommodation/domain/entities/Flat';
import type { Stay } from '../../../stay/domain/entities/Stay';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';

export interface SelectableStayItem {
  stayId: string;
  residentId: string;
  residentName: string;
  residentCode: string;
  phone?: string;
  flatId: string;
  flatName: string;
  allocatedBedsLabel: string;
  status: string;
  checkInDate: string;
  agreedRent: number;
  agreedDeposit: number;
  currentBalance: number;
  balances: StayBalance;
  resident: Resident;
  flat: Flat | null;
}

export class FinanceWorkspaceCoordinator {
  private _reportingService: ReportingApplicationService;
  private _timelineService: TimelineApplicationService;
  private _balanceEngine: BalanceApplicationService;
  private _paymentService: PaymentApplicationService;
  private _depositService: DepositApplicationService;
  private _stayRepository: StayRepository;
  private _residentRepository: ResidentRepository;
  private _accommodationRepository: AccommodationRepository;

  constructor(
    reportingService: ReportingApplicationService = defaultReportingService,
    timelineService: TimelineApplicationService = defaultTimelineService,
    balanceEngine: BalanceApplicationService = defaultBalanceEngine,
    stayRepository: StayRepository = defaultStayRepository,
    residentRepository: ResidentRepository = defaultResidentRepository,
    accommodationRepository: AccommodationRepository = defaultAccommodationRepository,
    paymentService: PaymentApplicationService = defaultPaymentService,
    depositService: DepositApplicationService = defaultDepositService
  ) {
    this._reportingService = reportingService;
    this._timelineService = timelineService;
    this._balanceEngine = balanceEngine;
    this._paymentService = paymentService;
    this._depositService = depositService;
    this._stayRepository = stayRepository;
    this._residentRepository = residentRepository;
    this._accommodationRepository = accommodationRepository;
  }

  public get reportingService(): ReportingApplicationService {
    return this._reportingService;
  }

  public get timelineService(): TimelineApplicationService {
    return this._timelineService;
  }

  public get balanceEngine(): BalanceApplicationService {
    return this._balanceEngine;
  }

  public get paymentService(): PaymentApplicationService {
    return this._paymentService;
  }

  public get depositService(): DepositApplicationService {
    return this._depositService;
  }

  public get stayRepository(): StayRepository {
    return this._stayRepository;
  }

  public get residentRepository(): ResidentRepository {
    return this._residentRepository;
  }

  public get accommodationRepository(): AccommodationRepository {
    return this._accommodationRepository;
  }

  /**
   * Constructs enriched payment history items for property-wide inspection and reversal.
   */
  public getPaymentRecords(): PaymentHistoryItem[] {
    const payments = this._paymentService.getAllPayments();
    const residents = this._residentRepository.getAllSync();
    const residentMap = new Map<string, Resident>();
    residents.forEach((r) => residentMap.set(r.id, r));

    const stays = this._stayRepository.getAllSync();
    const stayMap = new Map<string, Stay>();
    stays.forEach((s) => stayMap.set(s.id, s));

    return payments
      .slice()
      .sort((a, b) => (b.paymentDate || '').localeCompare(a.paymentDate || '') || b.createdAt.localeCompare(a.createdAt))
      .map((p) => {
        const stay = stayMap.get(p.stayId);
        const resident = stay ? residentMap.get(stay.residentId) : undefined;
        return {
          id: p.id,
          paymentNumber: p.paymentNumber,
          stayId: p.stayId,
          residentId: stay?.residentId || '',
          residentName: resident?.fullName || 'Resident',
          residentCode: resident?.residentCode || '',
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          referenceNumber: p.referenceNumber,
          status: p.status || 'RECORDED',
          reversedAt: p.reversedAt,
          reversedBy: p.reversedBy,
          reversalReason: p.reversalReason,
          remarks: p.remarks,
          createdAt: p.createdAt,
        };
      });
  }

  /**
   * Delegates payment reversal to the authoritative payment application service.
   */
  public reversePayment(payload: ReversePaymentPayload): ReversePaymentResult {
    return this._paymentService.reversePayment(payload);
  }

  /**
   * Constructs the ViewModel for Finance Workspace.
   */
  public createViewModel(activityLimit = 8): FinanceWorkspaceViewModel {
    const metrics = this.reportingService.getFinanceDashboard();
    const outstandingResidents = this.reportingService.getOutstandingResidents();
    const settlementsReport = this.reportingService.getSettlementReport();
    const paymentHistory = this.getPaymentRecords();
    const activity = this.timelineService.getRecentFinanceActivity(activityLimit);

    return {
      metrics,
      outstandingResidents,
      settlementsReport,
      paymentHistory,
      activity,
    };
  }

  /**
   * Retrieves property-wide financial summary view model.
   */
  public getPropertyFinanceSummary(): PropertyFinanceSummaryViewModel {
    const summary: FinanceSummary = this.balanceEngine.calculateFinanceSummary();
    return { summary };
  }

  /**
   * Retrieves recent financial activity events.
   */
  public getRecentActivity(limit = 10): FinanceTimelineEvent[] {
    return this.timelineService.getRecentFinanceActivity(limit);
  }

  /**
   * Retrieves stay-level financial view model.
   */
  public getStayFinanceViewModel(stayId: string): StayFinanceViewModel {
    const balances: StayBalance = this.balanceEngine.calculateStayBalances(stayId);
    const timeline: FinanceTimelineEvent[] = this.timelineService.getTimelineForStay(stayId);
    const summary: TimelineSummary = this.timelineService.getTimelineSummary(stayId);

    return {
      stayId,
      balances,
      timeline,
      summary,
    };
  }

  /**
   * Retrieves all active/on-notice stays enriched with resident and accommodation data for finance selection.
   */
  public getActiveStaysForSelection(): SelectableStayItem[] {
    const stays = this.stayRepository.getAllSync();
    const residents = this.residentRepository.getAllSync();
    const inMem = this.accommodationRepository as any;
    const flats: Flat[] = inMem && typeof inMem.findAllSync === 'function' ? inMem.findAllSync() : [];

    const residentMap = new Map<string, Resident>();
    residents.forEach((r) => residentMap.set(r.id, r));

    const flatMap = new Map<string, Flat>();
    flats.forEach((f) => flatMap.set(f.id, f));

    const selectableStays: SelectableStayItem[] = [];

    stays.forEach((stay) => {
      // Selection candidates: ACTIVE, ON_NOTICE, and CHECKED_OUT (for post-checkout settlement; exclude CLOSED, CANCELLED)
      if (
        stay.status !== StayStatus.ACTIVE &&
        stay.status !== StayStatus.ON_NOTICE &&
        stay.status !== StayStatus.CHECKED_OUT
      ) {
        return;
      }

      const resident = residentMap.get(stay.residentId);
      if (!resident) return;

      const flat = stay.flatId ? flatMap.get(stay.flatId) || null : null;
      const flatName = flat
        ? (flat.name.startsWith('Flat ') ? flat.name : `Flat ${flat.name}`)
        : (stay.flatId && stay.flatId !== 'Unassigned'
            ? (stay.flatId.startsWith('Flat ') ? stay.flatId : `Flat ${stay.flatId}`)
            : 'Unassigned');

      const allocatedBeds =
        stay.allocatedBedIds && stay.allocatedBedIds.length > 0
          ? stay.allocatedBedIds.map((b) => b.replace(/^BED-/i, '')).join(', ')
          : 'None';
      const allocatedBedsLabel = `Bed ${allocatedBeds}`;

      const balances = this.balanceEngine.calculateStayBalances(stay.id);

      const enrichedResident: Resident = {
        ...resident,
        allocatedBedIds: stay.allocatedBedIds || [],
        agreedRent: stay.agreedRent || 0,
        agreedDeposit: stay.agreedDeposit || 0,
      } as Resident;

      selectableStays.push({
        stayId: stay.id,
        residentId: resident.id,
        residentName: resident.fullName,
        residentCode: resident.residentCode,
        phone: resident.mobileNumber,
        flatId: stay.flatId || '',
        flatName,
        allocatedBedsLabel,
        status: stay.status,
        checkInDate: stay.checkInDate,
        agreedRent: stay.agreedRent || 0,
        agreedDeposit: stay.agreedDeposit || 0,
        currentBalance: balances.receivableBalance,
        balances,
        resident: enrichedResident,
        flat,
      });
    });

    return selectableStays;
  }
}
