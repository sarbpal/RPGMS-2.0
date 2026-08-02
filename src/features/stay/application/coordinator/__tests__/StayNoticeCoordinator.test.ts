import { describe, it, expect, beforeEach } from 'vitest';
import { StayNoticeCoordinator } from '../StayNoticeCoordinator';
import { InMemoryStayRepository } from '../../../infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../../../domain/entities/Stay';
import { StayStatus } from '../../../domain/valueObjects/StayStatus';
import { StayType } from '../../../domain/valueObjects/StayType';

describe('StayNoticeCoordinator Integration Suite (CR-3.5)', () => {
  let stayRepo: InMemoryStayRepository;
  let coordinator: StayNoticeCoordinator;

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
    coordinator = new StayNoticeCoordinator(stayRepo);
  });

  it('orchestrates placing a Stay on Notice through Stay aggregate and persists StayRepository', () => {
    const projection = coordinator.giveNotice({
      stayId: 'stay-000001',
      noticeDate: '2026-04-01',
      expectedCheckoutDate: '2026-05-01',
      reason: 'Relocating to Pune',
    });

    expect(projection.status).toBe(StayStatus.ON_NOTICE);
    expect(projection.noticeStatus).toBe('ON_NOTICE');
    expect(projection.expectedCheckoutDate).toBe('2026-05-01');
    expect(projection.noticeDate).toBe('2026-04-01');

    const persistedStay = stayRepo.findByIdSync('stay-000001');
    expect(persistedStay?.status).toBe(StayStatus.ON_NOTICE);
    expect(persistedStay?.expectedCheckoutDate).toBe('2026-05-01');

    // Confirm accommodation allocations and commercial agreements are preserved unchanged
    expect(persistedStay?.bedAllocations).toHaveLength(1);
    expect(persistedStay?.bedAllocations[0].status).toBe('ACTIVE');
    expect(persistedStay?.commercialAgreements).toHaveLength(1);
    expect(persistedStay?.commercialAgreements[0].status).toBe('ACTIVE');

    // Confirm Business Event appended
    const events = persistedStay?.businessEvents || [];
    const noticeEvent = events.find((be) => be.eventType === 'NOTICE_GIVEN');
    expect(noticeEvent).toBeDefined();
    expect(noticeEvent?.timestamp).toBe('2026-04-01');
  });

  it('throws error if target Stay does not exist', () => {
    expect(() =>
      coordinator.giveNotice({
        stayId: 'non-existent-stay',
        noticeDate: '2026-04-01',
        expectedCheckoutDate: '2026-05-01',
      })
    ).toThrow('Stay with ID non-existent-stay not found');
  });

  it('rolls back StayRepository on invalid date input exception', () => {
    expect(() =>
      coordinator.giveNotice({
        stayId: 'stay-000001',
        noticeDate: '2026-05-01',
        expectedCheckoutDate: '2026-04-01',
      })
    ).toThrow('Expected checkout date (2026-04-01) cannot precede notice date (2026-05-01)');

    const persistedStay = stayRepo.findByIdSync('stay-000001');
    expect(persistedStay?.status).toBe(StayStatus.ACTIVE);
  });
});
