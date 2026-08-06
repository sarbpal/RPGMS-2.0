import { describe, it, expect } from 'vitest';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationUseCases } from '../application/useCases/ReservationUseCases';
import { canConvertReservation } from '../domain/rules/reservationRules';

describe('Sprint RA-3 — Reservation Workspace (Read-Only) Unit & Integration Suite', () => {
  const mockReservations: Reservation[] = [
    {
      id: 'resv-000001',
      reservationNumber: 'RES-000001',
      prospectName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      expectedJoiningDate: '2026-08-15',
      expectedMonthlyRent: 12000,
      expectedSecurityDeposit: 12000,
      accommodationPreference: 'Double Sharing, 1st Floor',
      tokenAmount: 2000,
      tokenReceivedOn: '2026-08-01',
      tokenRemarks: 'GPay payment received',
      status: ReservationStatus.ACTIVE,
      notes: 'Prefers quiet area away from elevator',
      auditLog: [],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'resv-000004',
      reservationNumber: 'RES-000004',
      prospectName: 'Suresh Kumar',
      mobileNumber: '9123456789',
      expectedJoiningDate: '2026-07-20',
      expectedMonthlyRent: 13000,
      expectedSecurityDeposit: 13000,
      accommodationPreference: 'Double Sharing',
      tokenAmount: 0,
      status: ReservationStatus.CANCELLED,
      cancellationReason: 'Plan changed',
      auditLog: [],
      createdAt: '2026-07-10T14:00:00.000Z',
      updatedAt: '2026-07-18T16:00:00.000Z',
    },
  ];

  it('retrieves single reservation by ID for read-only workspace rendering', () => {
    const repo = new InMemoryReservationRepository(mockReservations);
    const useCases = new ReservationUseCases(repo);

    const reservation = useCases.getReservationByIdSync('resv-000001');
    expect(reservation).not.toBeNull();
    expect(reservation?.reservationNumber).toBe('RES-000001');
    expect(reservation?.prospectName).toBe('Rahul Sharma');
    expect(reservation?.mobileNumber).toBe('9876543210');
    expect(reservation?.expectedJoiningDate).toBe('2026-08-15');
    expect(reservation?.expectedMonthlyRent).toBe(12000);
    expect(reservation?.expectedSecurityDeposit).toBe(12000);
    expect(reservation?.accommodationPreference).toBe('Double Sharing, 1st Floor');
    expect(reservation?.tokenAmount).toBe(2000);
    expect(reservation?.tokenReceivedOn).toBe('2026-08-01');
    expect(reservation?.tokenRemarks).toBe('GPay payment received');
    expect(reservation?.notes).toBe('Prefers quiet area away from elevator');
    expect(reservation?.status).toBe(ReservationStatus.ACTIVE);
  });

  it('evaluates readiness for admission in operational decision summary', () => {
    const activeRes = mockReservations[0];
    const cancelledRes = mockReservations[1];

    const activeReadiness = canConvertReservation(activeRes.status);
    expect(activeReadiness.allowed).toBe(true);

    const cancelledReadiness = canConvertReservation(cancelledRes.status);
    expect(cancelledReadiness.allowed).toBe(false);
    expect(cancelledReadiness.reason).toContain('Cancelled');
  });

  it('returns null gracefully when reservation ID does not exist', () => {
    const repo = new InMemoryReservationRepository(mockReservations);
    const useCases = new ReservationUseCases(repo);

    const nonExistent = useCases.getReservationByIdSync('invalid-id');
    expect(nonExistent).toBeNull();
  });
});
