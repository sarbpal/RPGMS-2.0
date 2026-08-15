import type { Bed } from '../../domain/entities/Bed';
import type { Area } from '../../domain/entities/Area';
import type { Flat } from '../../domain/entities/Flat';
import type { FlatDraft } from '../../application/models/FlatDraft';
import { BedStatus } from '../../domain/valueObjects/BedStatus';
import { Stay, type StayProps } from '../../../stay/domain/entities/Stay';
import { CommercialAgreement } from '../../../stay/domain/valueObjects/CommercialAgreement';
import { BedAllocation } from '../../../stay/domain/valueObjects/BedAllocation';
import { StayStatus } from '../../../stay/domain/valueObjects/StayStatus';
import { StayType } from '../../../stay/domain/valueObjects/StayType';
import type { Resident } from '../../../resident/domain/entities/Resident';
import { ResidentStatus } from '../../../resident/domain/valueObjects/ResidentStatus';

export function createMockBed(overrides?: Partial<Bed>): Bed {
  return {
    id: '101-B1',
    name: 'B1',
    status: BedStatus.VACANT,
    defaultRent: 5000,
    defaultDeposit: 10000,
    ...overrides,
  };
}

export function createMockArea(overrides?: Partial<Area>): Area {
  return {
    id: '101-bedroom-1',
    name: 'Bedroom 1',
    bedPrefix: 'B',
    defaultRent: 5000,
    defaultDeposit: 10000,
    beds: [
      createMockBed({ id: '101-B1', name: 'B1' }),
      createMockBed({ id: '101-B2', name: 'B2' }),
    ],
    ...overrides,
  };
}

export function createMockFlat(overrides?: Partial<Flat>): Flat {
  return {
    id: '101',
    name: '101',
    floor: '1',
    description: 'First Floor Flat',
    areas: [createMockArea()],
    ...overrides,
  };
}

export function createMockFlatDraft(overrides?: Partial<FlatDraft>): FlatDraft {
  return {
    flatNumber: '102',
    floor: '1',
    description: 'Draft Flat 102',
    capacity: 2,
    areas: [
      {
        name: 'Bedroom 1',
        bedPrefix: 'B',
        defaultRent: 6000,
        defaultDeposit: 12000,
        beds: ['B1', 'B2'],
      },
    ],
    ...overrides,
  };
}

export function createMockStay(overrides?: Partial<StayProps>): Stay {
  const stayId = overrides?.id || 'stay-1';
  const flatId = overrides?.flatId || '101';
  const allocatedBedIds = overrides?.allocatedBedIds || ['101-B1', '101-B2'];

  const defaultCommercial = [
    new CommercialAgreement({
      id: `ca-${stayId}-1`,
      stayId,
      rent: 5000,
      securityDeposit: 10000,
      effectiveFrom: '2026-01-01',
      amendmentReason: 'Admission Initial Agreement',
      status: 'ACTIVE',
    }),
  ];

  const defaultAllocations = overrides?.bedAllocations || allocatedBedIds.map((bedId, idx) => (
    new BedAllocation({
      id: `ba-${stayId}-${idx + 1}`,
      stayId,
      flatId,
      bedId,
      allocatedFrom: '2026-01-01',
      status: 'ACTIVE',
    })
  ));

  return new Stay({
    id: stayId,
    residentId: 'res-1',
    checkInDate: '2026-01-01',
    flatId,
    stayType: StayType.REGULAR,
    status: StayStatus.ACTIVE,
    commercialAgreements: defaultCommercial,
    bedAllocations: defaultAllocations,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  });
}

export function createMockResident(overrides?: Partial<Resident>): Resident {
  return {
    id: 'res-1',
    residentCode: 'RES-001',
    fullName: 'Jane Doe',
    mobileNumber: '9876543210',
    email: 'jane@example.com',
    status: ResidentStatus.ACTIVE,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}
