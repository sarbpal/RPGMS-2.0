import { describe, it, expect } from 'vitest';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationUseCases } from '../application/useCases/ReservationUseCases';
import {
  canEditReservation,
  canCancelReservation,
  canConvertReservation,
} from '../domain/rules/reservationRules';

describe('Sprint RA-4 — Reservation Actions Unit & Integration Suite', () => {
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
      status: ReservationStatus.ACTIVE,
      auditLog: [],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'resv-000002',
      reservationNumber: 'RES-000002',
      prospectName: 'Amit Verma',
      mobileNumber: '9812345678',
      expectedJoiningDate: '2026-07-01', // Overdue date
      expectedMonthlyRent: 15000,
      status: ReservationStatus.FOLLOW_UP_REQUIRED,
      auditLog: [],
      createdAt: '2026-06-15T10:00:00.000Z',
      updatedAt: '2026-06-15T10:00:00.000Z',
    },
    {
      id: 'resv-000003',
      reservationNumber: 'RES-000003',
      prospectName: 'Priya Patel',
      mobileNumber: '9988776655',
      expectedJoiningDate: '2026-07-25',
      status: ReservationStatus.CONVERTED,
      auditLog: [],
      createdAt: '2026-07-15T09:00:00.000Z',
      updatedAt: '2026-07-25T10:00:00.000Z',
    },
    {
      id: 'resv-000004',
      reservationNumber: 'RES-000004',
      prospectName: 'Suresh Kumar',
      mobileNumber: '9123456789',
      expectedJoiningDate: '2026-07-20',
      status: ReservationStatus.CANCELLED,
      cancellationReason: 'Joined another branch',
      auditLog: [],
      createdAt: '2026-07-10T14:00:00.000Z',
      updatedAt: '2026-07-18T16:00:00.000Z',
    },
  ];

  it('edits an active reservation successfully via Application Layer use case', () => {
    const repo = new InMemoryReservationRepository(mockReservations);
    const useCases = new ReservationUseCases(repo);

    const updated = useCases.updateReservationSync('resv-000001', {
      prospectName: 'Rahul V. Sharma',
      expectedMonthlyRent: 12500,
      notes: 'Revised rent agreement',
    });

    expect(updated.prospectName).toBe('Rahul V. Sharma');
    expect(updated.expectedMonthlyRent).toBe(12500);
    expect(updated.notes).toBe('Revised rent agreement');
    expect(updated.status).toBe(ReservationStatus.ACTIVE);
  });

  it('rejects editing for converted or cancelled reservations', () => {
    const repo = new InMemoryReservationRepository(mockReservations);
    const useCases = new ReservationUseCases(repo);

    expect(canEditReservation(ReservationStatus.CONVERTED).allowed).toBe(false);
    expect(canEditReservation(ReservationStatus.CANCELLED).allowed).toBe(false);

    expect(() =>
      useCases.updateReservationSync('resv-000003', { prospectName: 'Priya P.' })
    ).toThrow(/CONVERTED/);

    expect(() =>
      useCases.updateReservationSync('resv-000004', { prospectName: 'Suresh K.' })
    ).toThrow(/CANCELLED/);
  });

  it('cancels an active reservation with mandatory cancellation reason', () => {
    const repo = new InMemoryReservationRepository(mockReservations);
    const useCases = new ReservationUseCases(repo);

    const cancelled = useCases.cancelReservationSync('resv-000001', {
      reason: 'Prospect relocated to another city',
    });

    expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
    expect(cancelled.cancellationReason).toBe('Prospect relocated to another city');
  });

  it('rejects cancelling an already cancelled or converted reservation', () => {
    const repo = new InMemoryReservationRepository(mockReservations);
    const useCases = new ReservationUseCases(repo);

    expect(canCancelReservation(ReservationStatus.CONVERTED).allowed).toBe(false);
    expect(canCancelReservation(ReservationStatus.CANCELLED).allowed).toBe(false);

    expect(() =>
      useCases.cancelReservationSync('resv-000004', { reason: 'Double cancel' })
    ).toThrow();
  });

  it('validates convert to admission eligibility guards (hand-off requirement)', () => {
    expect(canConvertReservation(ReservationStatus.ACTIVE).allowed).toBe(true);
    expect(canConvertReservation(ReservationStatus.FOLLOW_UP_REQUIRED).allowed).toBe(true);
    expect(canConvertReservation(ReservationStatus.CONVERTED).allowed).toBe(false);
    expect(canConvertReservation(ReservationStatus.CANCELLED).allowed).toBe(false);
  });
});
