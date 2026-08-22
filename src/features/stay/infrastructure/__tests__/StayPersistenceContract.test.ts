import { describe, it, expect } from 'vitest';
import { InMemoryStayRepository } from '../repositories/InMemoryStayRepository';
import { StayMappers } from '../mappers/StayMappers';
import { Stay } from '../../domain/entities/Stay';
import { StayStatus } from '../../domain/valueObjects/StayStatus';

describe('Stay Persistence & Mapping Contract', () => {
  const sampleStay = new Stay({
    id: 'stay_contract_test_1',
    residentId: 'res_contract_test_1',
    stayType: 'REGULAR',
    status: StayStatus.ACTIVE,
    checkInDate: '2026-08-01',
    expectedCheckoutDate: '2027-07-31',
    flatId: 'FLAT-101',
    allocatedBedIds: ['BED-101-H1'],
    agreedRent: 8000,
    agreedDeposit: 15000,
    billingAnchorDay: 1,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  });

  it('preserves commercial and allocation attributes across mapper roundtrip', () => {
    const row = StayMappers.toRow(sampleStay);
    expect(row.id).toBe('stay_contract_test_1');
    expect(row.resident_id).toBe('res_contract_test_1');
    expect(row.flat_id).toBe('FLAT-101');
    expect(row.agreed_rent).toBe(8000);
    expect(row.agreed_deposit).toBe(15000);
    expect(row.billing_cycle_anchor_day).toBe(1);

    const allocRows = [
      {
        id: 'alloc_1',
        stay_id: 'stay_contract_test_1',
        bed_id: 'BED-101-H1',
        allocated_at: '2026-08-01T10:00:00.000Z',
        released_at: null,
        status: 'ALLOCATED' as const,
      },
    ];

    const domainStay = StayMappers.toDomain(
      {
        ...row,
        stay_type: 'REGULAR',
        status: 'ACTIVE',
        expected_check_out_date: row.expected_check_out_date || null,
        actual_check_out_date: row.actual_check_out_date || null,
        billing_cycle_anchor_day: row.billing_cycle_anchor_day || 1,
        notice_date: null,
        current_commercial_period_start: null,
        created_at: row.created_at || new Date().toISOString(),
        updated_at: row.updated_at || new Date().toISOString(),
      },
      allocRows
    );

    expect(domainStay.id).toBe(sampleStay.id);
    expect(domainStay.residentId).toBe(sampleStay.residentId);
    expect(domainStay.agreedRent).toBe(8000);
    expect(domainStay.agreedDeposit).toBe(15000);
    expect(domainStay.allocatedBedIds).toEqual(['BED-101-H1']);
    expect(domainStay.status).toBe(StayStatus.ACTIVE);
  });

  it('InMemoryStayRepository retrieves active stay by resident ID', async () => {
    const repo = new InMemoryStayRepository([sampleStay]);
    const found = await repo.findById('stay_contract_test_1');
    expect(found).not.toBeNull();
    expect(found?.residentId).toBe('res_contract_test_1');

    const activeStay = await repo.findActiveByResidentId('res_contract_test_1');
    expect(activeStay).not.toBeNull();
    expect(activeStay?.id).toBe('stay_contract_test_1');
  });
});
