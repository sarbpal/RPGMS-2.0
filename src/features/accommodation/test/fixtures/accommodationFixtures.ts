import type { Bed } from '../../domain/entities/Bed';
import type { Area } from '../../domain/entities/Area';
import type { Flat } from '../../domain/entities/Flat';
import type { FlatDraft } from '../../application/models/FlatDraft';
import { BedStatus } from '../../domain/valueObjects/BedStatus';
import type { Stay } from '../../../stay/domain/entities/Stay';
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

export function createMockStay(overrides?: Partial<Stay>): Stay {
  return {
    id: 'stay-1',
    residentId: 'res-1',
    flatId: '101',
    allocatedBedIds: ['101-B1', '101-B2'],
    checkInDate: '2026-01-01',
    stayType: StayType.REGULAR,
    agreedRent: 5000,
    agreedDeposit: 10000,
    status: StayStatus.ACTIVE,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
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
