import { BedAllocation } from '../../domain/valueObjects/BedAllocation';
import { BusinessEvent } from '../../domain/valueObjects/BusinessEvent';
import { CommercialAgreement } from '../../domain/valueObjects/CommercialAgreement';
import { Stay } from '../../domain/entities/Stay';
import { StayStatus } from '../../domain/valueObjects/StayStatus';
import { StayType } from '../../domain/valueObjects/StayType';

export const staySeedData: Stay[] = [
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
        flatId: 'FLAT-103',
        bedId: 'BED-H2',
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
        description: 'Resident checked in and allocated to Flat 103 / Bed H2',
      }),
    ],
    notes: 'Requested top bunk bed near window. Shifted flat on 15-May-2026.',
    createdAt: '2026-03-12T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
  }),
  new Stay({
    id: 'STAY-000001',
    residentId: 'RES-00124',
    stayType: StayType.REGULAR,
    status: StayStatus.ACTIVE,
    checkInDate: '12-Mar-2026',
    commercialAgreements: [
      new CommercialAgreement({
        id: 'CA-000001-1',
        stayId: 'STAY-000001',
        rent: 8500,
        securityDeposit: 15000,
        effectiveFrom: '12-Mar-2026',
        amendmentReason: 'Initial Admission Agreement',
        status: 'ACTIVE',
      }),
    ],
    bedAllocations: [
      new BedAllocation({
        id: 'BA-000001-1',
        stayId: 'STAY-000001',
        flatId: 'FLAT-103',
        bedId: 'BED-H2',
        allocatedFrom: '12-Mar-2026',
        status: 'ACTIVE',
      }),
    ],
    businessEvents: [
      new BusinessEvent({
        id: 'BE-000001-1',
        stayId: 'STAY-000001',
        eventType: 'ADMISSION',
        timestamp: '12-Mar-2026',
        description: 'Resident checked in and allocated to Flat 103 / Bed H2',
      }),
    ],
    notes: 'Requested top bunk bed near window. Shifted flat on 15-May-2026.',
    createdAt: '2026-03-12T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
  }),
  new Stay({
    id: 'STAY-2026-00042',
    residentId: 'RES-00125',
    stayType: StayType.REGULAR,
    status: StayStatus.ACTIVE,
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
        flatId: 'FLAT-104',
        bedId: 'BED-B1',
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
        description: 'Resident checked in and allocated to Flat 104 / Bed B1',
      }),
    ],
    notes: 'Ground floor preference.',
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-07-01T00:00:00Z',
  }),
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
        flatId: 'FLAT-101',
        bedId: 'BED-A1',
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
