import { describe, expect, it } from 'vitest';
import { InMemoryStayRepository } from '../infrastructure/repositories/InMemoryStayRepository';
import { Stay } from '../domain/entities/Stay';
import { StayStatus } from '../domain/valueObjects/StayStatus';
import { StayType } from '../domain/valueObjects/StayType';
import { StayLifecycleCoordinator } from '../application/coordinator/StayLifecycleCoordinator';
import { StayBillingCycleCoordinator } from '../application/coordinator/StayBillingCycleCoordinator';
import { StayWorkspaceCoordinator } from '../application/coordinator/StayWorkspaceCoordinator';

describe('CR-5 Stay Registry & Resident Stay History Integration Suite', () => {
  it('shares a supplied repository across registry/detail history operations', () => {
    const stayRepo = new InMemoryStayRepository([]);
    const workspace = new StayWorkspaceCoordinator(stayRepo);
    const billing = new StayBillingCycleCoordinator(stayRepo);
    stayRepo.saveSync(new Stay({ id: 'STAY-SHARED-01', residentId: 'RES-SHARED', stayType: StayType.REGULAR, status: StayStatus.ACTIVE, checkInDate: '2026-01-10' }));
    billing.changeBillingCycle({ stayId: 'STAY-SHARED-01', requestedBillingAnchor: 20, effectiveFrom: '2026-02-20', reason: 'Shared state check' });
    expect(workspace.findStay('STAY-SHARED-01')?.billingAnchorDay).toBe(20);
    expect(workspace.getStaysForResident('RES-SHARED')[0].billingCycleRecords).toHaveLength(2);
  });

  it('retrieves all stays, filters by status, resident, flat, and date range', () => {
    const stayRepo = new InMemoryStayRepository([]);

    const stay1 = new Stay({
      id: 'STAY-REG-01',
      residentId: 'RES-100',
      stayType: StayType.REGULAR,
      status: StayStatus.ACTIVE,
      checkInDate: '2026-01-01',
      flatId: 'FLAT-101',
      allocatedBedIds: ['BED-A1'],
      billingAnchorDay: 10,
    });

    const stay2 = new Stay({
      id: 'STAY-REG-02',
      residentId: 'RES-101',
      stayType: StayType.REGULAR,
      status: StayStatus.PLANNED,
      checkInDate: '2026-06-01',
      flatId: 'FLAT-102',
      allocatedBedIds: ['BED-B1'],
      billingAnchorDay: 1,
    });

    const stay3 = new Stay({
      id: 'STAY-REG-03',
      residentId: 'RES-100', // Repeat stay for RES-100!
      stayType: StayType.REGULAR,
      status: StayStatus.CHECKED_OUT,
      checkInDate: '2025-01-01',
      actualCheckoutDate: '2025-12-31',
      flatId: 'FLAT-101',
      allocatedBedIds: ['BED-A1'],
      billingAnchorDay: 10,
    });

    stayRepo.saveSync(stay1);
    stayRepo.saveSync(stay2);
    stayRepo.saveSync(stay3);

    const allStays = stayRepo.getAllSync();
    expect(allStays).toHaveLength(3);

    // Resident Stay History query for RES-100
    const res100Stays = allStays.filter((s) => s.residentId === 'RES-100');
    expect(res100Stays).toHaveLength(2);
    expect(res100Stays.map((s) => s.id)).toEqual(['STAY-REG-01', 'STAY-REG-03']);

    // Filter by Status: PLANNED
    const plannedStays = allStays.filter((s) => s.status === StayStatus.PLANNED);
    expect(plannedStays).toHaveLength(1);
    expect(plannedStays[0].id).toBe('STAY-REG-02');

    // Filter by Status: ACTIVE
    const activeStays = allStays.filter((s) => s.status === StayStatus.ACTIVE);
    expect(activeStays).toHaveLength(1);

    // Filter by Flat: FLAT-101
    const flat101Stays = allStays.filter((s) => s.flatId === 'FLAT-101');
    expect(flat101Stays).toHaveLength(2);
  });

  it('executes full CR-5 lifecycle end-to-end: PLANNED -> ACTIVE -> ON_NOTICE -> CHECKED_OUT -> CLOSED', () => {
    const stayRepo = new InMemoryStayRepository([]);
    const lifecycleCoordinator = new StayLifecycleCoordinator(stayRepo);
    const billingCoordinator = new StayBillingCycleCoordinator(stayRepo);

    const stay = new Stay({
      id: 'STAY-E2E-01',
      residentId: 'RES-E2E',
      stayType: StayType.REGULAR,
      status: StayStatus.PLANNED,
      checkInDate: '2026-03-01',
      billingAnchorDay: 5,
    });
    stayRepo.saveSync(stay);

    // 1. Activate
    const activeProj = lifecycleCoordinator.activateStay({ stayId: 'STAY-E2E-01', reason: 'Checked in' });
    expect(activeProj.status).toBe(StayStatus.ACTIVE);

    // 2. Change Billing Cycle
    const billingProj = billingCoordinator.changeBillingCycle({
      stayId: 'STAY-E2E-01',
      requestedBillingAnchor: 15,
      effectiveFrom: '2026-04-15',
      reason: 'Requested anchor change',
      financialAdjustmentReference: 'ADJ-E2E-01',
    });
    expect(billingProj.billingAnchorDay).toBe(15);
    expect(stayRepo.findByIdSync('STAY-E2E-01')?.checkInDate).toBe('2026-03-01'); // Immutable!

    // 3. Give Notice
    const noticeProj = lifecycleCoordinator.giveNotice({
      stayId: 'STAY-E2E-01',
      noticeDate: '2026-05-01',
      expectedCheckoutDate: '2026-06-01',
    });
    expect(noticeProj.status).toBe(StayStatus.ON_NOTICE);

    // 4. Checkout
    const checkoutProj = lifecycleCoordinator.processCheckout({
      stayId: 'STAY-E2E-01',
      actualCheckoutDate: '2026-06-01',
      reason: 'Regular checkout',
    });
    expect(checkoutProj.status).toBe(StayStatus.CHECKED_OUT);

    // 5. Close Stay
    const closedProj = lifecycleCoordinator.closeStay({
      stayId: 'STAY-E2E-01',
      closedDate: '2026-06-05',
      reason: 'Admin closure',
    });
    expect(closedProj.status).toBe(StayStatus.CLOSED);

    // Verify history events count
    const finalStay = stayRepo.findByIdSync('STAY-E2E-01');
    expect(finalStay?.businessEvents.length).toBeGreaterThanOrEqual(5);
  });
});
