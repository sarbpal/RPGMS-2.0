import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { InMemoryStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import type { StayWorkspaceViewModel } from '../models/StayWorkspaceViewModel';

export class StayWorkspaceCoordinator {
  private stayRepository: StayRepository;

  constructor(stayRepository: StayRepository = new InMemoryStayRepository()) {
    this.stayRepository = stayRepository;
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

    const formattedFlat = projection.flatId.startsWith('FLAT-')
      ? `Flat ${projection.flatId.replace('FLAT-', '')}`
      : projection.flatId;

    const formattedBeds =
      projection.activeBedIds.length > 0
        ? projection.activeBedIds.map((b) => b.replace('BED-', '')).join(', ')
        : 'None';

    const allocationLabel = `${formattedFlat} / Bed ${formattedBeds}`;

    return {
      header: {
        residentName: projection.residentId === 'RES-00125' ? 'Amit Sharma' : 'Rajesh Kumar',
        residentId: projection.residentId,
        stayId: projection.stayId,
        status: projection.status,
        checkInDate: projection.checkInDate,
        allocation: allocationLabel,
      },
      summary: {
        status: projection.status,
        occupancyDuration: projection.checkInDate !== 'N/A' ? '4 months 12 days' : 'N/A',
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
        lastPaymentReceived: projection.currentRent > 0 ? `₹${projection.currentRent.toLocaleString('en-IN')} (01-Jul-2026)` : 'N/A',
        nextBillingDate: '01-Aug-2026',
      },
      timeline: [
        {
          id: 'evt-1',
          title: 'Payment Received',
          description: `₹${projection.currentRent.toLocaleString('en-IN')} collected via UPI for July 2026 rent`,
          date: '01-Jul-2026',
          type: 'PAYMENT',
          color: 'success',
        },
        {
          id: 'evt-2',
          title: 'Monthly Rent Bill Generated',
          description: `Rent invoice generated for July 2026 (₹${projection.currentRent.toLocaleString('en-IN')})`,
          date: '01-Jul-2026',
          type: 'BILL',
          color: 'error',
        },
        {
          id: 'evt-3',
          title: 'Electricity Charge Posted',
          description: `${formattedFlat} electricity split share added (₹450)`,
          date: '15-Jun-2026',
          type: 'CHARGE',
          color: 'warning',
        },
        {
          id: 'evt-4',
          title: 'Stay Started (Check-in)',
          description: `Resident checked in and allocated to ${allocationLabel}`,
          date: projection.checkInDate,
          type: 'CHECK_IN',
          color: 'info',
        },
      ],
      supportingInformation: {
        documents: [
          { name: 'Aadhaar Card', status: 'Verified', statusColor: 'success' },
          { name: 'Rental Agreement', status: 'Signed', statusColor: 'primary' },
        ],
        emergencyContact: {
          name: 'Ramesh Kumar',
          relationship: 'Father',
          phone: '+91 98765 43210',
        },
        notes: stay.notes || 'No operational notes recorded.',
      },
    };
  }
}
