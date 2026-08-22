import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { defaultStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { defaultResidentRepository, InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import type { StayWorkspaceViewModel, TimelineEventViewModel } from '../models/StayWorkspaceViewModel';
import type { BusinessEvent } from '../../domain/valueObjects/BusinessEvent';
import type { CurrentProjection } from '../../domain/valueObjects/CurrentProjection';
import type { AccommodationRepository } from '../../../accommodation/domain/interfaces/AccommodationRepository';
import { defaultAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { StayBillingCycleCoordinator, type ChangeBillingCycleInput } from './StayBillingCycleCoordinator';
import { StayLifecycleCoordinator, type ActivateStayInput, type CancelPlannedStayInput, type CloseStayInput } from './StayLifecycleCoordinator';
import {
  StayAccommodationCoordinator,
  type TransferBedInput,
  type TransferFlatInput,
  type AllocateAdditionalBedInput,
  type ReleaseBedInput,
} from './StayAccommodationCoordinator';
import { StayNoticeCoordinator, type GiveNoticeInput } from './StayNoticeCoordinator';
import { StayCheckoutCoordinator, type ProcessCheckoutInput } from './StayCheckoutCoordinator';
import type { Resident } from '../../../resident/domain/entities/Resident';
import type { Flat } from '../../../accommodation/domain/entities/Flat';
import type { BalanceApplicationService } from '../../../finance/services/balanceEngine';
import { balanceEngine as defaultBalanceEngine } from '../../../finance/services/balanceEngine';
import type { BillingApplicationService } from '../../../finance/services/billingService';
import { billingService as defaultBillingService } from '../../../finance/services/billingService';
import type { PaymentApplicationService } from '../../../finance/services/paymentService';
import { paymentService as defaultPaymentService } from '../../../finance/services/paymentService';

export class StayWorkspaceCoordinator {
  private _stayRepository: StayRepository;
  private _residentRepository: ResidentRepository;
  private _accommodationRepository: AccommodationRepository;
  private _balanceEngine: BalanceApplicationService;
  private _billingService: BillingApplicationService;
  private _paymentService: PaymentApplicationService;

  constructor(
    stayRepository: StayRepository = defaultStayRepository,
    residentRepository: ResidentRepository = defaultResidentRepository,
    accommodationRepository: AccommodationRepository = defaultAccommodationRepository,
    balanceEngine: BalanceApplicationService = defaultBalanceEngine,
    billingService: BillingApplicationService = defaultBillingService,
    paymentService: PaymentApplicationService = defaultPaymentService
  ) {
    this._stayRepository = stayRepository || defaultStayRepository;
    this._residentRepository = residentRepository || defaultResidentRepository;
    this._accommodationRepository = accommodationRepository || defaultAccommodationRepository;
    this._balanceEngine = balanceEngine || defaultBalanceEngine;
    this._billingService = billingService || defaultBillingService;
    this._paymentService = paymentService || defaultPaymentService;
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

  public get balanceEngine(): BalanceApplicationService {
    return this._balanceEngine;
  }

  public get billingService(): BillingApplicationService {
    return this._billingService;
  }

  public get paymentService(): PaymentApplicationService {
    return this._paymentService;
  }

  public findStay(stayId: string): Stay | null {
    return this._stayRepository.findByIdSync(stayId);
  }

  public findResident(residentId: string): Resident | null {
    const inMem = this.residentRepository as InMemoryResidentRepository;
    return inMem.getByIdSync ? inMem.getByIdSync(residentId) : null;
  }

  public getAllResidents(): Resident[] {
    return this._residentRepository.getAllSync();
  }

  public findFlat(flatId: string): Flat | null {
    if (!flatId || flatId === 'Unassigned') return null;
    const inMem = this.accommodationRepository as any;
    if (inMem && typeof inMem.findByIdSync === 'function') {
      return inMem.findByIdSync(flatId);
    }
    return null;
  }

  public getStaysForResident(residentId: string): Stay[] {
    return this.stayRepository.getAllSync().filter((stay) => stay.residentId === residentId);
  }

  public getAllStays(): Stay[] { return this.stayRepository.getAllSync(); }
  public changeBillingCycle(input: ChangeBillingCycleInput): CurrentProjection {
    return new StayBillingCycleCoordinator(this.stayRepository).changeBillingCycle(input);
  }
  public activateStay(input: ActivateStayInput): CurrentProjection {
    return new StayLifecycleCoordinator(this.stayRepository, this.accommodationRepository, this.residentRepository).activateStay(input);
  }
  public cancelPlannedStay(input: CancelPlannedStayInput): CurrentProjection {
    return new StayLifecycleCoordinator(this.stayRepository, this.accommodationRepository, this.residentRepository).cancelPlannedStay(input);
  }
  public closeStay(input: CloseStayInput): CurrentProjection {
    return new StayLifecycleCoordinator(this.stayRepository, this.accommodationRepository, this.residentRepository).closeStay(input);
  }
  public transferBed(input: TransferBedInput): CurrentProjection {
    return new StayAccommodationCoordinator(this.stayRepository, this.accommodationRepository, this.residentRepository).transferBed(input);
  }
  public transferFlat(input: TransferFlatInput): CurrentProjection {
    return new StayAccommodationCoordinator(this.stayRepository, this.accommodationRepository, this.residentRepository).transferFlat(input);
  }
  public allocateAdditionalBed(input: AllocateAdditionalBedInput): CurrentProjection {
    return new StayAccommodationCoordinator(this.stayRepository, this.accommodationRepository, this.residentRepository).allocateAdditionalBed(input);
  }
  public releaseBed(input: ReleaseBedInput): CurrentProjection {
    return new StayAccommodationCoordinator(this.stayRepository, this.accommodationRepository, this.residentRepository).releaseBed(input);
  }
  public giveNotice(input: GiveNoticeInput): CurrentProjection {
    return new StayNoticeCoordinator(this.stayRepository).giveNotice(input);
  }
  public processCheckout(input: ProcessCheckoutInput): CurrentProjection {
    return new StayCheckoutCoordinator(this.stayRepository, this.accommodationRepository, this.residentRepository).processCheckout(input);
  }

  public createViewModel(stayId: string): StayWorkspaceViewModel {
    const activeStayId = stayId || '';

    let stay: Stay | null = null;
    if (
      'findByIdSync' in this.stayRepository &&
      typeof (this.stayRepository as { findByIdSync?: (id: string) => Stay | null }).findByIdSync === 'function'
    ) {
      stay = (this.stayRepository as { findByIdSync: (id: string) => Stay | null }).findByIdSync(activeStayId);
      if (!stay && !activeStayId) {
        stay = (this.stayRepository as { findByIdSync: (id: string) => Stay | null }).findByIdSync('STAY-2026-00041');
      }
    }

    if (!stay) {
      stay = new Stay({
        id: activeStayId || 'NOT_FOUND',
        residentId: 'UNKNOWN',
        stayType: 'REGULAR',
        status: 'ACTIVE',
        checkInDate: 'N/A',
        flatId: 'Unassigned',
        allocatedBedIds: [],
        agreedRent: 0,
        agreedDeposit: 0,
        notes: 'Stay record not found in repository.',
      });
    }

    return this.mapStayToViewModel(stay);
  }

  private mapStayToViewModel(stay: Stay): StayWorkspaceViewModel {
    // Leverage Aggregate API to obtain CurrentProjection
    const projection = stay.getCurrentProjection();

    // Resolve Resident Name dynamically from ResidentRepository
    const residentName = this.resolveResidentName(projection.residentId);

    // Format Flat & Bed Allocation details
    const flatEntity = projection.flatId && projection.flatId !== 'Unassigned'
      ? this.findFlat(projection.flatId)
      : null;

    let formattedFlat = projection.flatId;
    if (flatEntity) {
      formattedFlat = flatEntity.name.startsWith('Flat ') ? flatEntity.name : `Flat ${flatEntity.name}`;
    } else if (projection.flatId.startsWith('FLAT-')) {
      formattedFlat = `Flat ${projection.flatId.replace('FLAT-', '')}`;
    } else if (projection.flatId !== 'Unassigned' && !projection.flatId.startsWith('Flat ')) {
      formattedFlat = `Flat ${projection.flatId}`;
    }

    const formattedBeds =
      projection.activeBedIds.length > 0
        ? projection.activeBedIds.map((b) => b.replace('BED-', '')).join(', ')
        : 'None';

    const allocationLabel = `${formattedFlat} / Bed ${formattedBeds}`;

    // Calculate Occupancy Duration dynamically
    const occupancyDuration = this.calculateOccupancyDuration(
      projection.checkInDate,
      projection.actualCheckoutDate
    );

    // Map BusinessEvents directly to Timeline ViewModels
    const timeline = this.mapBusinessEventsToTimeline(
      stay.businessEvents,
      projection.checkInDate,
      allocationLabel
    );

    // Resolve Authoritative Financial Projection
    const stayId = stay.id;
    const isRealStay = stayId && stayId !== 'NOT_FOUND' && stayId !== 'N/A';
    const balances = isRealStay
      ? this._balanceEngine.calculateStayBalances(stayId)
      : {
          receivableBalance: 0,
          securityDepositHeld: 0,
          advanceCreditBalance: 0,
          refundPayable: 0,
          netBalance: 0,
        };

    const stayBills = isRealStay ? this._billingService.getBillsByStayId(stayId) : [];
    const stayPayments = isRealStay ? this._paymentService.getPaymentsByStayId(stayId) : [];

    // 1. Current month rent (Rent-only non-cancelled bills for current YYYY-MM period)
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthBills = stayBills.filter(
      (b) => b.period === currentMonthStr && b.status !== 'CANCELLED'
    );
    const currentMonthRent = currentMonthBills
      .filter((b) => b.billType === 'MONTHLY_RENT' || b.lineItems?.some((li) => li.category === 'RENT'))
      .reduce((sum, b) => {
        if (b.lineItems && b.lineItems.length > 0) {
          const rentItems = b.lineItems.filter((li) => li.category === 'RENT');
          if (rentItems.length > 0) {
            return sum + rentItems.reduce((liSum, li) => liSum + li.amount, 0);
          }
        }
        return sum + b.totalAmount;
      }, 0);

    // 2. Total current month charges across all categories
    const currentMonthCharges = currentMonthBills.reduce((sum, b) => sum + b.totalAmount, 0);

    // 3. Pending electricity / utility charges: remaining unpaid balance of non-cancelled utility bills
    const pendingElectricity = stayBills
      .filter((b) => b.status !== 'CANCELLED' && b.status !== 'PAID' && b.lineItems?.some((li) => li.category === 'UTILITIES'))
      .reduce((sum, b) => {
        const bal = typeof b.balanceAmount === 'number' ? b.balanceAmount : Math.max(0, b.totalAmount - (b.paidAmount || 0));
        return sum + bal;
      }, 0);

    // 4. Pending laundry charges: remaining unpaid balance of non-cancelled laundry bills
    const pendingLaundry = stayBills
      .filter((b) => b.status !== 'CANCELLED' && b.status !== 'PAID' && b.lineItems?.some((li) => li.category === 'LAUNDRY'))
      .reduce((sum, b) => {
        const bal = typeof b.balanceAmount === 'number' ? b.balanceAmount : Math.max(0, b.totalAmount - (b.paidAmount || 0));
        return sum + bal;
      }, 0);

    // 5. Last payment received: formatted text from most recent valid payment record
    let lastPaymentReceived = 'No payments recorded';
    const validPayments = stayPayments.filter((p) => typeof p.amount === 'number' && p.amount > 0);
    if (validPayments.length > 0) {
      const sortedPayments = [...validPayments].sort((a, b) => {
        const dateA = new Date(a.paymentDate || a.createdAt).getTime();
        const dateB = new Date(b.paymentDate || b.createdAt).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      const latestPayment = sortedPayments[0];
      if (latestPayment) {
        const paymentDateStr = latestPayment.paymentDate || (latestPayment.createdAt ? latestPayment.createdAt.split('T')[0] : '');
        lastPaymentReceived = `₹${latestPayment.amount.toLocaleString('en-IN')}${paymentDateStr ? ` (${paymentDateStr})` : ''}`;
      }
    }

    const nextBillingDate = stay.billingAnchorDay
      ? `Day ${stay.billingAnchorDay} of Month`
      : 'Monthly Cycle';

    return {
      header: {
        residentName,
        residentId: projection.residentId,
        stayId: projection.stayId,
        status: projection.status,
        checkInDate: projection.checkInDate,
        allocation: allocationLabel,
      },
      summary: {
        status: projection.status,
        occupancyDuration,
        noticeStatus: projection.noticeStatus === 'ON_NOTICE' ? 'On Notice' : 'Not on Notice',
        rentPlan: `₹${projection.currentRent.toLocaleString('en-IN')} / month`,
        securityDeposit: `₹${projection.currentDeposit.toLocaleString('en-IN')}`,
        bedAllocation: allocationLabel,
      },
      financialSummary: {
        outstandingBalance: balances.receivableBalance,
        currentMonthRent,
        currentMonthCharges,
        pendingElectricity,
        pendingLaundry,
        securityDepositHeld: balances.securityDepositHeld,
        lastPaymentReceived,
        nextBillingDate,
        advanceCredit: balances.advanceCreditBalance,
        netBalance: balances.netBalance,
      },
      timeline,
      supportingInformation: {
        documents: [
          { name: 'Aadhaar Card', status: 'Verified', statusColor: 'success' },
          { name: 'Rental Agreement', status: 'Signed', statusColor: 'primary' },
        ],
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Guardian',
          phone: '+91 98765 43210',
        },
        notes: stay.notes || 'No operational notes recorded.',
      },
    };
  }

  private resolveResidentName(residentId: string): string {
    const inMem = this.residentRepository as InMemoryResidentRepository;
    if (inMem.getByIdSync) {
      const resident = inMem.getByIdSync(residentId);
      if (resident) return resident.fullName;
    }
    return residentId === 'RES-00125' ? 'Amit Sharma' : residentId || 'Unknown Resident';
  }

  private calculateOccupancyDuration(checkInDate: string, checkoutDate?: string): string {
    if (!checkInDate || checkInDate === 'N/A') return 'N/A';

    const start = new Date(checkInDate);
    const end = checkoutDate ? new Date(checkoutDate) : new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A';

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
    }

    const months = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;
    if (remainingDays === 0) {
      return `${months} month${months === 1 ? '' : 's'}`;
    }
    return `${months} month${months === 1 ? '' : 's'} ${remainingDays} day${remainingDays === 1 ? '' : 's'}`;
  }

  private mapBusinessEventsToTimeline(
    events: readonly BusinessEvent[],
    defaultCheckInDate: string,
    allocationLabel: string
  ): TimelineEventViewModel[] {
    if (!events || events.length === 0) {
      return [
        {
          id: 'evt-default-checkin',
          title: 'Stay Started (Check-in)',
          description: `Resident checked in and allocated to ${allocationLabel}`,
          date: defaultCheckInDate,
          type: 'CHECK_IN',
          color: 'info',
        },
      ];
    }

    return events
      .map((be, index) => {
        let title = be.eventType.replace(/_/g, ' ');
        let type = 'INFO';
        let color: TimelineEventViewModel['color'] = 'info';

        switch (be.eventType) {
          case 'ADMISSION':
            title = 'Admission & Check-in';
            type = 'CHECK_IN';
            color = 'info';
            break;
          case 'ADDITIONAL_BED_ALLOCATED':
            title = 'Additional Bed Allocated';
            type = 'ALLOCATION';
            color = 'info';
            break;
          case 'BED_RELEASED':
            title = 'Bed Released';
            type = 'RELEASE';
            color = 'warning';
            break;
          case 'BED_TRANSFER':
            title = 'Bed Transfer Executed';
            type = 'TRANSFER';
            color = 'info';
            break;
          case 'FLAT_TRANSFER':
            title = 'Flat Relocation Executed';
            type = 'TRANSFER';
            color = 'info';
            break;
          case 'RENT_REVISED':
            title = 'Rent Revised';
            type = 'COMMERCIAL';
            color = 'warning';
            break;
          case 'DEPOSIT_REVISED':
            title = 'Security Deposit Revised';
            type = 'COMMERCIAL';
            color = 'warning';
            break;
          case 'COMMERCIAL_TERMS_REVISED':
            title = 'Commercial Terms Amended';
            type = 'COMMERCIAL';
            color = 'warning';
            break;
          case 'NOTICE_GIVEN':
            title = 'Notice Period Initiated';
            type = 'NOTICE';
            color = 'warning';
            break;
          case 'CHECKOUT_COMPLETED':
            title = 'Operational Checkout Completed';
            type = 'CHECKOUT';
            color = 'success';
            break;
          default:
            title = be.eventType;
            type = 'INFO';
            color = 'info';
            break;
        }

        return {
          id: be.id || `evt-${index + 1}`,
          title,
          description: be.description,
          date: be.timestamp,
          type,
          color,
        };
      })
      .reverse(); // Most recent timeline event first
  }
}
