import { BedAllocation } from '../../domain/valueObjects/BedAllocation';
import { BusinessEvent } from '../../domain/valueObjects/BusinessEvent';
import { CommercialAgreement } from '../../domain/valueObjects/CommercialAgreement';
import { Stay } from '../../domain/entities/Stay';
import { StayStatus } from '../../domain/valueObjects/StayStatus';
import { StayType } from '../../domain/valueObjects/StayType';

export const staySeedData: Stay[] = [
  // STAY-2026-00041: Rajesh Kumar (RES-00124, ACTIVE) occupies Flat 101, Bed 101-B1
  new Stay({
    id: 'STAY-2026-00041',
    residentId: 'RES-00124',
    stayType: StayType.REGULAR,
    status: StayStatus.ACTIVE,
    checkInDate: '12-Mar-2026',
    commercialAgreements: [
      new CommercialAgreement({
        id: 'CA-2026-00041-1',
        stayId: 'STAY-2026-00041',
        rent: 8500,
        securityDeposit: 15000,
        effectiveFrom: '12-Mar-2026',
        amendmentReason: 'Initial Admission Agreement',
        status: 'ACTIVE',
      }),
    ],
    bedAllocations: [
      new BedAllocation({
        id: 'BA-2026-00041-1',
        stayId: 'STAY-2026-00041',
        flatId: '101',
        bedId: '101-B1',
        allocatedFrom: '12-Mar-2026',
        status: 'ACTIVE',
      }),
    ],
    businessEvents: [
      new BusinessEvent({
        id: 'BE-2026-00041-1',
        stayId: 'STAY-2026-00041',
        eventType: 'ADMISSION',
        timestamp: '12-Mar-2026',
        description: 'Resident checked in and allocated to Flat 101 / Bed B1',
      }),
    ],
    notes: 'Requested bedroom allocation.',
    createdAt: '2026-03-12T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
  }),
  // STAY-2026-00042: Amit Sharma (RES-00125, ON_NOTICE) occupies Flat 102, Beds 102-B1 and 102-B2
  new Stay({
    id: 'STAY-2026-00042',
    residentId: 'RES-00125',
    stayType: StayType.REGULAR,
    status: StayStatus.ON_NOTICE,
    checkInDate: '01-Apr-2026',
    commercialAgreements: [
      new CommercialAgreement({
        id: 'CA-2026-00042-1',
        stayId: 'STAY-2026-00042',
        rent: 9000,
        securityDeposit: 18000,
        effectiveFrom: '01-Apr-2026',
        amendmentReason: 'Initial Admission Agreement',
        status: 'ACTIVE',
      }),
    ],
    bedAllocations: [
      new BedAllocation({
        id: 'BA-2026-00042-1',
        stayId: 'STAY-2026-00042',
        flatId: '102',
        bedId: '102-B1',
        allocatedFrom: '01-Apr-2026',
        status: 'ACTIVE',
      }),
      new BedAllocation({
        id: 'BA-2026-00042-2',
        stayId: 'STAY-2026-00042',
        flatId: '102',
        bedId: '102-B2',
        allocatedFrom: '01-Apr-2026',
        status: 'ACTIVE',
      }),
    ],
    businessEvents: [
      new BusinessEvent({
        id: 'BE-2026-00042-1',
        stayId: 'STAY-2026-00042',
        eventType: 'ADMISSION',
        timestamp: '01-Apr-2026',
        description: 'Resident checked in and allocated to Flat 102 / Beds B1 and B2',
      }),
    ],
    notes: 'Ground floor preference. Notice served.',
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
  }),
  // STAY-2026-00010: Suresh Patel (RES-00101, CHECKED_OUT) — historical, no active bed
  new Stay({
    id: 'STAY-2026-00010',
    residentId: 'RES-00101',
    stayType: StayType.REGULAR,
    status: StayStatus.CHECKED_OUT,
    checkInDate: '01-Jan-2025',
    actualCheckoutDate: '31-Dec-2025',
    commercialAgreements: [
      new CommercialAgreement({
        id: 'CA-2026-00010-1',
        stayId: 'STAY-2026-00010',
        rent: 8000,
        securityDeposit: 15000,
        effectiveFrom: '01-Jan-2025',
        effectiveUntil: '31-Dec-2025',
        amendmentReason: 'Initial Admission Agreement',
        status: 'HISTORICAL',
      }),
    ],
    bedAllocations: [
      new BedAllocation({
        id: 'BA-2026-00010-1',
        stayId: 'STAY-2026-00010',
        flatId: '101',
        bedId: '101-H1',
        allocatedFrom: '01-Jan-2025',
        allocatedUntil: '31-Dec-2025',
        status: 'RELEASED',
      }),
    ],
    businessEvents: [
      new BusinessEvent({
        id: 'BE-2026-00010-1',
        stayId: 'STAY-2026-00010',
        eventType: 'ADMISSION',
        timestamp: '01-Jan-2025',
        description: 'Resident checked in',
      }),
      new BusinessEvent({
        id: 'BE-2026-00010-2',
        stayId: 'STAY-2026-00010',
        eventType: 'OPERATIONAL_CHECKOUT',
        timestamp: '31-Dec-2025',
        description: 'Completed 1 year stay and checked out',
      }),
    ],
    notes: 'Completed 1 year stay.',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-12-31T00:00:00Z',
  }),
];
