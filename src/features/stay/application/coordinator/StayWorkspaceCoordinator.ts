import type { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { StayStatus } from '../../domain/valueObjects/StayStatus';
import { StayType } from '../../domain/valueObjects/StayType';
import { InMemoryStayRepository } from '../../infrastructure/repositories/InMemoryStayRepository';
import type { StayWorkspaceViewModel } from '../models/StayWorkspaceViewModel';

export class StayWorkspaceCoordinator {
  private stayRepository: StayRepository;

  constructor(stayRepository: StayRepository = new InMemoryStayRepository()) {
    this.stayRepository = stayRepository;
  }

  public createViewModel(stayId: string): StayWorkspaceViewModel {
    const activeStayId = stayId || '';

    // Retrieve Stay entity using the StayRepository interface
    let stay: Stay | null = null;
    if (
      'findByIdSync' in this.stayRepository &&
      typeof (this.stayRepository as { findByIdSync?: (id: string) => Stay | null }).findByIdSync === 'function'
    ) {
      stay =
        (this.stayRepository as { findByIdSync: (id: string) => Stay | null }).findByIdSync(activeStayId) ||
        (this.stayRepository as { findByIdSync: (id: string) => Stay | null }).findByIdSync('STAY-2026-00041');
    }

    const currentStay: Stay = stay || {
      id: activeStayId || 'STAY-2026-00041',
      residentId: 'RES-00124',
      stayType: StayType.REGULAR,
      status: StayStatus.ACTIVE,
      checkInDate: '12-Mar-2026',
      flatId: 'FLAT-103',
      allocatedBedIds: ['BED-H2'],
      agreedRent: 8500,
      agreedDeposit: 15000,
      createdAt: '2026-03-12T00:00:00Z',
      updatedAt: '2026-07-01T00:00:00Z',
    };

    return {
      header: {
        residentName: 'Rajesh Kumar',
        residentId: currentStay.residentId,
        stayId: currentStay.id,
        status: currentStay.status,
        checkInDate: currentStay.checkInDate,
        allocation: 'Flat 103 / Bed H2',
      },
      summary: {
        status: currentStay.status,
        occupancyDuration: '4 months 12 days',
        noticeStatus: 'Not on Notice',
        rentPlan: `₹${currentStay.agreedRent.toLocaleString('en-IN')} / month`,
        securityDeposit: `₹${currentStay.agreedDeposit.toLocaleString('en-IN')}`,
        bedAllocation: 'Flat 103 / Bed H2',
      },
      financialSummary: {
        outstandingBalance: 0,
        currentMonthRent: currentStay.agreedRent,
        pendingElectricity: 450,
        pendingLaundry: 0,
        securityDepositHeld: currentStay.agreedDeposit,
        lastPaymentReceived: '₹8,500 (01-Jul-2026)',
        nextBillingDate: '01-Aug-2026',
      },
      timeline: [
        {
          id: 'evt-1',
          title: 'Payment Received',
          description: '₹8,500 collected via UPI for July 2026 rent',
          date: '01-Jul-2026',
          type: 'PAYMENT',
          color: 'success',
        },
        {
          id: 'evt-2',
          title: 'Monthly Rent Bill Generated',
          description: 'Rent invoice generated for July 2026 (₹8,500)',
          date: '01-Jul-2026',
          type: 'BILL',
          color: 'error',
        },
        {
          id: 'evt-3',
          title: 'Electricity Charge Posted',
          description: 'Flat 103 electricity split share added (₹450)',
          date: '15-Jun-2026',
          type: 'CHARGE',
          color: 'warning',
        },
        {
          id: 'evt-4',
          title: 'Stay Started (Check-in)',
          description: 'Resident checked in and allocated to Flat 103 / Bed H2',
          date: currentStay.checkInDate,
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
        notes: currentStay.notes || 'Requested top bunk bed near window. Shifted flat on 15-May-2026.',
      },
    };
  }
}
