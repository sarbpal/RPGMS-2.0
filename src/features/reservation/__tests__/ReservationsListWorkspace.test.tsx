import { describe, it, expect } from 'vitest';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationUseCases } from '../application/useCases/ReservationUseCases';

describe('Sprint RA-2 Reservations List Workspace Unit Suite', () => {
  const mockReservations: Reservation[] = [
    {
      id: 'resv-000001',
      reservationNumber: 'RES-000001',
      prospectName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      expectedJoiningDate: '2026-08-15',
      expectedMonthlyRent: 12000,
      expectedSecurityDeposit: 12000,
      accommodationPreference: 'Double Sharing',
      tokenAmount: 2000,
      tokenReceivedOn: '2026-08-01',
      status: ReservationStatus.ACTIVE,
      auditLog: [],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'resv-000002',
      reservationNumber: 'RES-000002',
      prospectName: 'Priya Patel',
      mobileNumber: '9988776655',
      expectedJoiningDate: '2026-07-25',
      status: ReservationStatus.CONVERTED,
      auditLog: [],
      createdAt: '2026-07-15T09:00:00.000Z',
      updatedAt: '2026-07-25T10:00:00.000Z',
    },
  ];

  it('verifies list reservation data structure for workspace table rendering', () => {
    const repo = new InMemoryReservationRepository(mockReservations);
    const useCases = new ReservationUseCases(repo);

    const list = useCases.listReservationsSync();
    expect(list).toHaveLength(2);

    expect(list[0].reservationNumber).toBe('RES-000001');
    expect(list[0].prospectName).toBe('Rahul Sharma');
    expect(list[0].mobileNumber).toBe('9876543210');
    expect(list[0].expectedJoiningDate).toBe('2026-08-15');
    expect(list[0].tokenAmount).toBe(2000);
    expect(list[0].status).toBe(ReservationStatus.ACTIVE);

    expect(list[1].reservationNumber).toBe('RES-000002');
    expect(list[1].prospectName).toBe('Priya Patel');
    expect(list[1].status).toBe(ReservationStatus.CONVERTED);
  });
});
