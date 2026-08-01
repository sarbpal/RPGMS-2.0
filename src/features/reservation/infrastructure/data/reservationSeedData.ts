import type { Reservation } from '../../domain/entities/Reservation';
import { ReservationStatus } from '../../domain/valueObjects/ReservationStatus';

const todayStr = new Date().toISOString().split('T')[0];

const threeDaysAgo = new Date();
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

const twoDaysFuture = new Date();
twoDaysFuture.setDate(twoDaysFuture.getDate() + 2);
const twoDaysFutureStr = twoDaysFuture.toISOString().split('T')[0];

export const reservationSeedData: Reservation[] = [
  {
    id: 'resv-000001',
    reservationNumber: 'RES-000001',
    prospectName: 'Rahul Sharma',
    mobileNumber: '9876543210',
    expectedJoiningDate: twoDaysFutureStr,
    accommodationPreference: 'Double Sharing, 1st Floor',
    tokenAmount: 2000,
    tokenReceivedOn: '2026-07-28',
    tokenRemarks: 'GPay transfer received',
    status: ReservationStatus.ACTIVE,
    notes: 'Requires study desk near window',
    auditLog: [
      {
        timestamp: '2026-07-28T10:30:00Z',
        action: 'CREATED',
        performedBy: 'System Operator',
        details: 'Reservation created with ₹2,000 token',
      },
    ],
    createdAt: '2026-07-28T10:30:00Z',
    updatedAt: '2026-07-28T10:30:00Z',
  },
  {
    id: 'resv-000002',
    reservationNumber: 'RES-000002',
    prospectName: 'Amit Verma',
    mobileNumber: '9876543211',
    expectedJoiningDate: threeDaysAgoStr,
    accommodationPreference: 'Single Room, Quiet Area',
    tokenAmount: 0,
    status: ReservationStatus.FOLLOW_UP_REQUIRED,
    notes: 'Joining date passed, follow up pending',
    auditLog: [
      {
        timestamp: '2026-07-20T11:00:00Z',
        action: 'CREATED',
        performedBy: 'System Operator',
        details: 'Reservation created',
      },
      {
        timestamp: '2026-07-30T00:00:00Z',
        action: 'STATUS_UPDATED',
        performedBy: 'System',
        details: 'Flagged as FOLLOW_UP_REQUIRED due to overdue joining date',
      },
    ],
    createdAt: '2026-07-20T11:00:00Z',
    updatedAt: '2026-07-30T00:00:00Z',
  },
  {
    id: 'resv-000003',
    reservationNumber: 'RES-000003',
    prospectName: 'Vikram Singh',
    mobileNumber: '9876543212',
    expectedJoiningDate: todayStr, // Today's Arrival!
    accommodationPreference: 'Triple Sharing, 2nd Floor',
    tokenAmount: 5000,
    tokenReceivedOn: '2026-07-25',
    tokenRemarks: 'Cash deposit at reception',
    status: ReservationStatus.ACTIVE,
    notes: 'Arriving by evening train',
    auditLog: [
      {
        timestamp: '2026-07-25T14:15:00Z',
        action: 'CREATED',
        performedBy: 'System Operator',
        details: 'Reservation created with ₹5,000 token',
      },
    ],
    createdAt: '2026-07-25T14:15:00Z',
    updatedAt: '2026-07-25T14:15:00Z',
  },
  {
    id: 'resv-000004',
    reservationNumber: 'RES-000004',
    prospectName: 'Suresh Kumar',
    mobileNumber: '9876543213',
    expectedJoiningDate: '2026-07-15',
    accommodationPreference: 'Double Sharing',
    tokenAmount: 2000,
    tokenReceivedOn: '2026-07-10',
    status: ReservationStatus.CONVERTED,
    notes: 'Admitted into Flat 101, Bed 101-B1',
    auditLog: [
      {
        timestamp: '2026-07-10T09:00:00Z',
        action: 'CREATED',
        performedBy: 'System Operator',
        details: 'Reservation created',
      },
      {
        timestamp: '2026-07-15T10:00:00Z',
        action: 'CONVERTED_TO_STAY',
        performedBy: 'System Operator',
        details: 'Converted to active Stay STAY-001',
      },
    ],
    createdAt: '2026-07-10T09:00:00Z',
    updatedAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 'resv-000005',
    reservationNumber: 'RES-000005',
    prospectName: 'Deepak Patel',
    mobileNumber: '9876543214',
    expectedJoiningDate: '2026-07-20',
    accommodationPreference: 'Single Room',
    tokenAmount: 0,
    status: ReservationStatus.CANCELLED,
    notes: 'Prospect cancelled - found alternative accommodation near office',
    auditLog: [
      {
        timestamp: '2026-07-12T16:00:00Z',
        action: 'CREATED',
        performedBy: 'System Operator',
        details: 'Reservation created',
      },
      {
        timestamp: '2026-07-18T11:20:00Z',
        action: 'CANCELLED',
        performedBy: 'System Operator',
        details: 'Reservation cancelled upon prospect request',
      },
    ],
    createdAt: '2026-07-12T16:00:00Z',
    updatedAt: '2026-07-18T11:20:00Z',
  },
];
