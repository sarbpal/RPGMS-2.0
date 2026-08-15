import { describe, it, expect, beforeEach } from 'vitest';
import { StayCheckoutCoordinator } from '../StayCheckoutCoordinator';
import { InMemoryStayRepository } from '../../../infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { Stay } from '../../../domain/entities/Stay';
import { StayStatus } from '../../../domain/valueObjects/StayStatus';
import { StayType } from '../../../domain/valueObjects/StayType';
import { BedStatus } from '../../../../accommodation/domain/valueObjects/BedStatus';
import type { Flat } from '../../../../accommodation/domain/entities/Flat';

describe('StayCheckoutCoordinator Integration Suite (CR-3.6)', () => {
  let stayRepo: InMemoryStayRepository;
  let accommodationRepo: InMemoryAccommodationRepository;
  let coordinator: StayCheckoutCoordinator;

  const sampleFlat101: Flat = {
    id: 'flat-101',
    name: '101',
    floor: '1',
    description: '1st Floor Double Sharing',
    areas: [
      {
        id: 'area-101-bedroom',
        name: 'Bedroom',
        defaultRent: 8000,
        defaultDeposit: 6500,
        beds: [
          { id: 'bed-101-a', name: '101-A', status: BedStatus.ON_NOTICE, residentName: 'Rohan Sharma', defaultRent: 8000, defaultDeposit: 6500 },
          { id: 'bed-101-b', name: '101-B', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
        ],
      },
    ],
  };

  const sampleStay = new Stay({
    id: 'stay-000001',
    residentId: 'res-000001',
    stayType: StayType.REGULAR,
    status: StayStatus.ACTIVE,
    checkInDate: '2026-01-01',
    flatId: 'flat-101',
    allocatedBedIds: ['bed-101-a'],
    agreedRent: 8000,
    agreedDeposit: 6500,
  });

  beforeEach(() => {
    stayRepo = new InMemoryStayRepository([sampleStay]);
    accommodationRepo = new InMemoryAccommodationRepository([sampleFlat101]);
    coordinator = new StayCheckoutCoordinator(stayRepo, accommodationRepo);

    // Place stay on notice to prepare for checkout
    const stay = stayRepo.findByIdSync('stay-000001');
    stay?.giveNotice({
      noticeDate: '2026-04-01',
      expectedCheckoutDate: '2026-05-01',
    });
    if (stay) {
      stayRepo.saveSync(stay);
    }
  });

  it('orchestrates Operational Checkout through Stay aggregate and releases physical beds in AccommodationRepository', () => {
    const projection = coordinator.processCheckout({
      stayId: 'stay-000001',
      actualCheckoutDate: '2026-05-01',
      reason: 'End of residency',
    });

    expect(projection.status).toBe(StayStatus.CHECKED_OUT);
    expect(projection.actualCheckoutDate).toBe('2026-05-01');
    expect(projection.activeBedIds).toEqual([]);

    const persistedStay = stayRepo.findByIdSync('stay-000001');
    expect(persistedStay?.status).toBe(StayStatus.CHECKED_OUT);
    expect(persistedStay?.activeBedAllocations).toHaveLength(0);
    expect(persistedStay?.activeCommercialAgreement?.status).toBe('HISTORICAL');

    // Confirm physical bed released to VACANT in AccommodationRepository
    const flat = accommodationRepo.findById('flat-101');
    const bedA = flat?.areas[0].beds.find((b) => b.id === 'bed-101-a');
    expect(bedA?.status).toBe(BedStatus.VACANT);
    expect(bedA?.residentName).toBeUndefined();
    expect(bedA?.stayId).toBeUndefined();
  });

  it('throws error if target Stay does not exist', () => {
    expect(() =>
      coordinator.processCheckout({
        stayId: 'non-existent-stay',
        actualCheckoutDate: '2026-05-01',
      })
    ).toThrow('Stay with ID non-existent-stay not found');
  });

  it('rolls back StayRepository on invalid date input exception', () => {
    expect(() =>
      coordinator.processCheckout({
        stayId: 'stay-000001',
        actualCheckoutDate: '2025-12-01',
      })
    ).toThrow('Actual checkout date (2025-12-01) cannot precede check-in date (2026-01-01)');

    const persistedStay = stayRepo.findByIdSync('stay-000001');
    expect(persistedStay?.status).toBe(StayStatus.ON_NOTICE);
  });
});
