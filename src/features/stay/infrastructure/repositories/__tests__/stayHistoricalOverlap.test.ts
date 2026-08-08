import { describe, it, expect } from 'vitest';
import { InMemoryStayRepository } from '../InMemoryStayRepository';
import { Stay } from '../../../domain/entities/Stay';
import { StayStatus } from '../../../domain/valueObjects/StayStatus';

describe('Stage 2 — StayRepository Historical Date-Overlap Query Tests', () => {
  it('verifies exact boundary overlap predicate rules (Tests 1 through 5)', () => {
    // Setup test stays with distinct BedAllocations
    const stay1 = new Stay({
      id: 'stay-test-1',
      residentId: 'res-1',
      stayType: 'REGULAR',
      status: StayStatus.CHECKED_OUT,
      checkInDate: '2026-06-20',
      actualCheckoutDate: '2026-06-30',
      bedAllocations: [
        { id: 'ba-1', stayId: 'stay-test-1', flatId: 'flat-101', bedId: 'bed-1', allocatedFrom: '2026-06-20', allocatedUntil: '2026-06-30', status: 'RELEASED' },
      ],
    });

    const stay2 = new Stay({
      id: 'stay-test-2',
      residentId: 'res-2',
      stayType: 'REGULAR',
      status: StayStatus.CHECKED_OUT,
      checkInDate: '2026-06-20',
      actualCheckoutDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-2', stayId: 'stay-test-2', flatId: 'flat-101', bedId: 'bed-2', allocatedFrom: '2026-06-20', allocatedUntil: '2026-07-01', status: 'RELEASED' },
      ],
    });

    const stay3 = new Stay({
      id: 'stay-test-3',
      residentId: 'res-3',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-31',
      bedAllocations: [
        { id: 'ba-3', stayId: 'stay-test-3', flatId: 'flat-101', bedId: 'bed-3', allocatedFrom: '2026-07-31', allocatedUntil: '2026-08-10', status: 'ACTIVE' },
      ],
    });

    const stay4 = new Stay({
      id: 'stay-test-4',
      residentId: 'res-4',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-08-01',
      bedAllocations: [
        { id: 'ba-4', stayId: 'stay-test-4', flatId: 'flat-101', bedId: 'bed-4', allocatedFrom: '2026-08-01', allocatedUntil: '2026-08-10', status: 'ACTIVE' },
      ],
    });

    const stay5 = new Stay({
      id: 'stay-test-5',
      residentId: 'res-5',
      stayType: 'REGULAR',
      status: StayStatus.ACTIVE,
      checkInDate: '2026-07-01',
      bedAllocations: [
        { id: 'ba-5', stayId: 'stay-test-5', flatId: 'flat-101', bedId: 'bed-5', allocatedFrom: '2026-07-01', allocatedUntil: '2026-07-31', status: 'ACTIVE' },
      ],
    });

    const repo = new InMemoryStayRepository([stay1, stay2, stay3, stay4, stay5]);
    const periodStart = '2026-07-01';
    const periodEnd = '2026-07-31';

    const results = repo.findStaysByFlatAndPeriodOverlapSync('flat-101', periodStart, periodEnd);
    const resultIds = results.map((s) => s.id);

    // Test 1: Jun 20-30 vs Jul 1-31 -> NO overlap
    expect(resultIds).not.toContain('stay-test-1');

    // Test 2: Jun 20-Jul 1 vs Jul 1-31 -> OVERLAP
    expect(resultIds).toContain('stay-test-2');

    // Test 3: Jul 31-Aug 10 vs Jul 1-31 -> OVERLAP
    expect(resultIds).toContain('stay-test-3');

    // Test 4: Aug 1-Aug 10 vs Jul 1-31 -> NO overlap
    expect(resultIds).not.toContain('stay-test-4');

    // Test 5: Jul 1-Jul 31 vs Jul 1-31 -> OVERLAP
    expect(resultIds).toContain('stay-test-5');

    expect(results.length).toBe(3);
  });

  it('discovers CHECKED_OUT and ON_NOTICE historical Stays without modifying Stay status', () => {
    const checkedOutStay = new Stay({
      id: 'stay-co',
      residentId: 'res-co',
      stayType: 'REGULAR',
      status: StayStatus.CHECKED_OUT,
      checkInDate: '2026-06-01',
      actualCheckoutDate: '2026-07-15',
      bedAllocations: [
        { id: 'ba-co', stayId: 'stay-co', flatId: 'flat-202', bedId: 'bed-1', allocatedFrom: '2026-06-01', allocatedUntil: '2026-07-15', status: 'RELEASED' },
      ],
    });

    const repo = new InMemoryStayRepository([checkedOutStay]);
    const found = repo.findStaysByFlatAndPeriodOverlapSync('flat-202', '2026-07-01', '2026-07-31');

    expect(found.length).toBe(1);
    expect(found[0].id).toBe('stay-co');
    expect(found[0].status).toBe(StayStatus.CHECKED_OUT);
  });
});
