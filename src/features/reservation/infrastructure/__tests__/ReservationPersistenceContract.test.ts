import { describe, it, expect } from 'vitest';
import { InMemoryReservationRepository } from '../repositories/InMemoryReservationRepository';
import { ReservationMappers } from '../mappers/ReservationMappers';
import { ReservationStatus } from '../../domain/valueObjects/ReservationStatus';
import type { Reservation } from '../../domain/entities/Reservation';

describe('Reservation Persistence & Mapping Contract', () => {
  const sampleReservation: Reservation = {
    id: 'res_contract_test_1',
    reservationNumber: 'RES-000001',
    prospectName: 'John Prospect',
    mobileNumber: '9876543210',
    expectedJoiningDate: '2026-09-01',
    expectedMonthlyRent: 7500,
    expectedSecurityDeposit: 15000,
    status: ReservationStatus.ACTIVE,
    notes: 'Prefers upper floor',
    auditLog: [],
    createdAt: '2026-08-20T10:00:00.000Z',
    updatedAt: '2026-08-20T10:00:00.000Z',
  };

  it('preserves complete reservation attributes across row mapping roundtrip', () => {
    const row = ReservationMappers.toRow(sampleReservation);
    expect(row.id).toBe('res_contract_test_1');
    expect(row.reservation_number).toBe('RES-000001');
    expect(row.guest_name).toBe('John Prospect');
    expect(row.mobile_number).toBe('9876543210');
    expect(row.agreed_rent).toBe(7500);
    expect(row.agreed_deposit).toBe(15000);
    expect(row.status).toBe('CONFIRMED');

    const domain = ReservationMappers.toDomain({
      ...row,
      email: null,
      bed_id: null,
      flat_id: null,
      target_stay_type: 'REGULAR',
      status: (row.status as 'CONFIRMED') || 'CONFIRMED',
      notes: row.notes || null,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    });

    expect(domain.id).toBe(sampleReservation.id);
    expect(domain.reservationNumber).toBe(sampleReservation.reservationNumber);
    expect(domain.prospectName).toBe(sampleReservation.prospectName);
    expect(domain.mobileNumber).toBe(sampleReservation.mobileNumber);
    expect(domain.expectedJoiningDate).toBe(sampleReservation.expectedJoiningDate);
    expect(domain.expectedMonthlyRent).toBe(7500);
    expect(domain.expectedSecurityDeposit).toBe(15000);
    expect(domain.status).toBe(ReservationStatus.ACTIVE);
    expect(domain.notes).toBe('Prefers upper floor');
  });

  it('handles optional and null fields gracefully during domain mapping', () => {
    const minimalRow = {
      id: 'res_minimal',
      reservation_number: 'RES-000002',
      guest_name: 'Jane Prospect',
      mobile_number: '9123456780',
      email: null,
      bed_id: null,
      flat_id: null,
      target_stay_type: 'REGULAR',
      expected_joining_date: '2026-09-15',
      status: 'PENDING' as const,
      agreed_rent: 0,
      agreed_deposit: 0,
      notes: null,
      created_at: '2026-08-21T10:00:00.000Z',
      updated_at: '2026-08-21T10:00:00.000Z',
    };

    const domain = ReservationMappers.toDomain(minimalRow);
    expect(domain.id).toBe('res_minimal');
    expect(domain.notes).toBeUndefined();
    expect(domain.expectedMonthlyRent).toBe(0);
    expect(domain.expectedSecurityDeposit).toBe(0);
    expect(domain.status).toBe(ReservationStatus.ACTIVE);
  });

  it('InMemoryReservationRepository satisfies async CRUD and lookup contracts', async () => {
    const repo = new InMemoryReservationRepository([sampleReservation]);

    // Async findById
    const found = await repo.findById('res_contract_test_1');
    expect(found).not.toBeNull();
    expect(found?.prospectName).toBe('John Prospect');

    // Async findByReservationNumber
    const foundByNum = await repo.findByReservationNumber('res-000001'); // Case-insensitive
    expect(foundByNum).not.toBeNull();
    expect(foundByNum?.id).toBe('res_contract_test_1');

    // Async findActiveByMobile
    const foundByMobile = await repo.findActiveByMobile('9876543210');
    expect(foundByMobile).not.toBeNull();
    expect(foundByMobile?.id).toBe('res_contract_test_1');

    // Async save
    const newReservation: Reservation = {
      ...sampleReservation,
      id: 'res_contract_test_2',
      reservationNumber: 'RES-000002',
      mobileNumber: '9998887770',
    };
    await repo.save(newReservation);
    const all = await repo.findAll();
    expect(all.length).toBe(2);

    // Async delete
    await repo.delete('res_contract_test_2');
    const allAfterDelete = await repo.findAll();
    expect(allAfterDelete.length).toBe(1);
  });
});
