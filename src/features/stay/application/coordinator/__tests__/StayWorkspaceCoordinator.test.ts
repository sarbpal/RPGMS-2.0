import { describe, it, expect, beforeEach } from 'vitest';
import { StayWorkspaceCoordinator } from '../StayWorkspaceCoordinator';
import { InMemoryStayRepository } from '../../../infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { Stay } from '../../../domain/entities/Stay';
import { StayStatus } from '../../../domain/valueObjects/StayStatus';
import { StayType } from '../../../domain/valueObjects/StayType';

describe('StayWorkspaceCoordinator Integration Suite (CR-3.7)', () => {
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let coordinator: StayWorkspaceCoordinator;

  const sampleStay = new Stay({
    id: 'stay-000001',
    residentId: 'res-000001',
    stayType: StayType.REGULAR,
    status: StayStatus.ACTIVE,
    checkInDate: '2026-01-01',
    flatId: 'FLAT-101',
    allocatedBedIds: ['BED-A1'],
    agreedRent: 8000,
    agreedDeposit: 6500,
  });

  beforeEach(() => {
    stayRepo = new InMemoryStayRepository([sampleStay]);
    residentRepo = new InMemoryResidentRepository();
    coordinator = new StayWorkspaceCoordinator(stayRepo, residentRepo);
  });

  it('creates view model driven directly by CurrentProjection and BusinessEvents', () => {
    const viewModel = coordinator.createViewModel('stay-000001');

    expect(viewModel.header.stayId).toBe('stay-000001');
    expect(viewModel.header.status).toBe(StayStatus.ACTIVE);
    expect(viewModel.header.checkInDate).toBe('2026-01-01');
    expect(viewModel.header.allocation).toContain('Flat 101 / Bed A1');

    expect(viewModel.summary.rentPlan).toBe('₹8,000 / month');
    expect(viewModel.summary.securityDeposit).toBe('₹6,500');

    expect(viewModel.financialSummary.currentMonthRent).toBe(8000);
    expect(viewModel.financialSummary.securityDepositHeld).toBe(6500);

    // Verify timeline maps BusinessEvent records directly
    expect(viewModel.timeline.length).toBeGreaterThan(0);
    expect(viewModel.timeline[0].title).toBe('Admission & Check-in');
    expect(viewModel.timeline[0].type).toBe('CHECK_IN');
  });

  it('dynamically maps timeline events from full Stay lifecycle events', () => {
    const stay = stayRepo.findByIdSync('stay-000001');
    if (stay) {
      stay.reviseRent({
        newRent: 8800,
        effectiveDate: '2026-04-01',
        reason: 'Annual 10% escalation',
      });
      stay.giveNotice({
        noticeDate: '2026-05-01',
        expectedCheckoutDate: '2026-06-01',
      });
      stayRepo.saveSync(stay);
    }

    const viewModel = coordinator.createViewModel('stay-000001');

    // Most recent events first
    expect(viewModel.timeline).toHaveLength(3);
    expect(viewModel.timeline[0].title).toBe('Notice Period Initiated');
    expect(viewModel.timeline[0].type).toBe('NOTICE');
    expect(viewModel.timeline[1].title).toBe('Rent Revised');
    expect(viewModel.timeline[1].type).toBe('COMMERCIAL');
    expect(viewModel.timeline[2].title).toBe('Admission & Check-in');
  });

  it('calculates occupancy duration dynamically from check-in and checkout dates', () => {
    const stay = stayRepo.findByIdSync('stay-000001');
    if (stay) {
      stay.giveNotice({
        noticeDate: '2026-04-01',
        expectedCheckoutDate: '2026-05-01',
      });
      stay.processCheckout({
        actualCheckoutDate: '2026-05-01',
      });
      stayRepo.saveSync(stay);
    }

    const viewModel = coordinator.createViewModel('stay-000001');
    expect(viewModel.summary.status).toBe(StayStatus.CHECKED_OUT);
    expect(viewModel.summary.occupancyDuration).toContain('months');
    expect(viewModel.timeline[0].title).toBe('Operational Checkout Completed');
    expect(viewModel.timeline[0].type).toBe('CHECKOUT');
  });
});
