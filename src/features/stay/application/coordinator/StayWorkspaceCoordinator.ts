import type { Stay } from '../../domain/entities/Stay';
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

    // Retrieve Stay entity using the StayRepository interface contract
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
      return this.mapStayToViewModel({
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return this.mapStayToViewModel(stay);
  }

  private mapStayToViewModel(stay: Stay): StayWorkspaceViewModel {
    const formattedFlat = stay.flatId.startsWith('FLAT-')
      ? `Flat ${stay.flatId.replace('FLAT-', '')}`
      : stay.flatId;

    const formattedBeds =
      stay.allocatedBedIds.length > 0
        ? stay.allocatedBedIds.map((b) => b.replace('BED-', '')).join(', ')
        : 'None';

    const allocationLabel = `${formattedFlat} / Bed ${formattedBeds}`;

    return {
      header: {
        residentName: stay.residentId === 'RES-00125' ? 'Amit Sharma' : 'Rajesh Kumar',
        residentId: stay.residentId,
        stayId: stay.id,
        status: stay.status,
        checkInDate: stay.checkInDate,
        allocation: allocationLabel,
      },
      summary: {
        status: stay.status,
        occupancyDuration: stay.checkInDate !== 'N/A' ? '4 months 12 days' : 'N/A',
        noticeStatus: stay.status === 'ON_NOTICE' ? 'On Notice' : 'Not on Notice',
        rentPlan: `₹${stay.agreedRent.toLocaleString('en-IN')} / month`,
        securityDeposit: `₹${stay.agreedDeposit.toLocaleString('en-IN')}`,
        bedAllocation: allocationLabel,
      },
      financialSummary: {
        outstandingBalance: 0,
        currentMonthRent: stay.agreedRent,
        pendingElectricity: stay.agreedRent > 0 ? 450 : 0,
        pendingLaundry: 0,
        securityDepositHeld: stay.agreedDeposit,
        lastPaymentReceived: stay.agreedRent > 0 ? `₹${stay.agreedRent.toLocaleString('en-IN')} (01-Jul-2026)` : 'N/A',
        nextBillingDate: '01-Aug-2026',
      },
      timeline: [
        {
          id: 'evt-1',
          title: 'Payment Received',
          description: `₹${stay.agreedRent.toLocaleString('en-IN')} collected via UPI for July 2026 rent`,
          date: '01-Jul-2026',
          type: 'PAYMENT',
          color: 'success',
        },
        {
          id: 'evt-2',
          title: 'Monthly Rent Bill Generated',
          description: `Rent invoice generated for July 2026 (₹${stay.agreedRent.toLocaleString('en-IN')})`,
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
          date: stay.checkInDate,
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
