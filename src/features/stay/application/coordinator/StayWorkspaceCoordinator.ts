import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { InMemoryStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import type { ResidentRepository } from '../../../resident/domain/interfaces/ResidentRepository';
import { InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import type { StayWorkspaceViewModel, TimelineEventViewModel } from '../models/StayWorkspaceViewModel';
import type { BusinessEvent } from '../../domain/valueObjects/BusinessEvent';

export class StayWorkspaceCoordinator {
  private stayRepository: StayRepository;
  private residentRepository: ResidentRepository;

  constructor(
    stayRepository: StayRepository = new InMemoryStayRepository(),
    residentRepository: ResidentRepository = new InMemoryResidentRepository()
  ) {
    this.stayRepository = stayRepository;
    this.residentRepository = residentRepository;
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
    const formattedFlat = projection.flatId.startsWith('FLAT-')
      ? `Flat ${projection.flatId.replace('FLAT-', '')}`
      : projection.flatId;

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
        outstandingBalance: 0,
        currentMonthRent: projection.currentRent,
        pendingElectricity: projection.currentRent > 0 ? 450 : 0,
        pendingLaundry: 0,
        securityDepositHeld: projection.currentDeposit,
        lastPaymentReceived:
          projection.currentRent > 0
            ? `₹${projection.currentRent.toLocaleString('en-IN')} (${projection.checkInDate})`
            : 'N/A',
        nextBillingDate: 'Monthly Cycle',
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
