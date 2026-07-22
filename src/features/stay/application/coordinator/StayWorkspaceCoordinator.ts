import type { StayWorkspaceViewModel } from '../models/StayWorkspaceViewModel';

export class StayWorkspaceCoordinator {
  public createViewModel(stayId: string): StayWorkspaceViewModel {
    const activeStayId = stayId || '';

    return {
      header: {
        residentName: 'Rajesh Kumar',
        residentId: 'RES-00124',
        stayId: activeStayId,
        status: 'Active',
        checkInDate: '12-Mar-2026',
        allocation: 'Flat 103 / Bed H2',
      },
      summary: {
        status: 'Active',
        occupancyDuration: '4 months 12 days',
        noticeStatus: 'Not on Notice',
        rentPlan: '₹8,500 / month',
        securityDeposit: '₹15,000',
        bedAllocation: 'Flat 103 / Bed H2',
      },
      financialSummary: {
        outstandingBalance: 0,
        currentMonthRent: 8500,
        pendingElectricity: 450,
        pendingLaundry: 0,
        securityDepositHeld: 15000,
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
          date: '12-Mar-2026',
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
        notes: 'Requested top bunk bed near window. Shifted flat on 15-May-2026.',
      },
    };
  }
}
