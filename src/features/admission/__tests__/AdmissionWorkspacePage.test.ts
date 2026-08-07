import { describe, it, expect } from 'vitest';
import type { Reservation } from '../../reservation/domain/entities/Reservation';
import { ReservationStatus } from '../../reservation/domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../../reservation/infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { AdmissionCoordinator } from '../application/coordinator/AdmissionCoordinator';
import type { AdmissionDraft } from '../application/models/AdmissionDraft';
import { TokenDisposition } from '../domain/valueObjects/TokenDisposition';

describe('Sprint RA-6 — Complete Admission Unit & Integration Suite', () => {
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
  ];

  it('pre-populates admission draft from source reservation for workspace review', () => {
    const resRepo = new InMemoryReservationRepository(mockReservations);
    const reservation = resRepo.findByIdSync('resv-000001');

    expect(reservation).not.toBeNull();
    expect(reservation?.prospectName).toBe('Rahul Sharma');
    expect(reservation?.mobileNumber).toBe('9876543210');
    expect(reservation?.expectedJoiningDate).toBe('2026-08-15');
    expect(reservation?.expectedMonthlyRent).toBe(12000);
    expect(reservation?.expectedSecurityDeposit).toBe(12000);
    expect(reservation?.tokenAmount).toBe(2000);
  });

  it('evaluates readiness checklist during admission preparation without DB mutation', () => {
    const resRepo = new InMemoryReservationRepository(mockReservations);
    const accomRepo = new InMemoryAccommodationRepository();
    const coordinator = new AdmissionCoordinator(resRepo, undefined, undefined, accomRepo);

    const reservation = resRepo.findByIdSync('resv-000001');
    const flats = accomRepo.findAll();
    expect(flats.length).toBeGreaterThan(0);

    const flat = flats[0];
    const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT');
    expect(vacantBed).toBeDefined();

    // 1. Incomplete Draft (missing accommodation and token choice)
    const incompleteDraft: AdmissionDraft = {
      reservationId: 'resv-000001',
      residentName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      checkInDate: '2026-08-15',
      agreedRent: 12000,
      agreedDeposit: 12000,
    };

    const initialReadiness = coordinator.evaluateReadiness(incompleteDraft, reservation);
    expect(initialReadiness.isReadyToConfirm).toBe(false);
    expect(initialReadiness.isAccommodationValid).toBe(false);
    expect(initialReadiness.isTokenDecisionValid).toBe(false);

    // 2. Fully Prepared Draft
    const preparedDraft: AdmissionDraft = {
      ...incompleteDraft,
      flatId: flat.id,
      bedIds: [vacantBed!.id],
      tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
    };

    const completeReadiness = coordinator.evaluateReadiness(preparedDraft, reservation);
    expect(completeReadiness.isReadyToConfirm).toBe(true);
    expect(completeReadiness.isReservationValid).toBe(true);
    expect(completeReadiness.isResidentDetailsValid).toBe(true);
    expect(completeReadiness.isCommercialTermsValid).toBe(true);
    expect(completeReadiness.isAccommodationValid).toBe(true);
    expect(completeReadiness.isTokenDecisionValid).toBe(true);

    // Verify ZERO database state mutation during preparation phase
    const bedAfterEval = accomRepo
      .findAll()
      .flatMap((f) => f.areas)
      .flatMap((a) => a.beds)
      .find((b) => b.id === vacantBed!.id);

    expect(bedAfterEval?.status).toBe('VACANT');
    expect(resRepo.findByIdSync('resv-000001')?.status).toBe(ReservationStatus.ACTIVE);
  });

  it('executes Complete Admission transaction, creating Resident, Stay, occupying Bed, and preserving traceability references', () => {
    const freshMock = JSON.parse(JSON.stringify(mockReservations));
    const resRepo = new InMemoryReservationRepository(freshMock);
    const residentRepo = new InMemoryResidentRepository();
    const stayRepo = new InMemoryStayRepository();
    const accomRepo = new InMemoryAccommodationRepository();

    const coordinator = new AdmissionCoordinator(resRepo, residentRepo, stayRepo, accomRepo);
    const reservation = resRepo.findByIdSync('resv-000001')!;

    const flat = accomRepo.findAll()[0];
    const vacantBed = flat.areas.flatMap((a) => a.beds).find((b) => b.status === 'VACANT')!;

    const validDraft: AdmissionDraft = {
      reservationId: 'resv-000001',
      residentName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      checkInDate: '2026-08-15',
      agreedRent: 12000,
      agreedDeposit: 12000,
      flatId: flat.id,
      bedIds: [vacantBed.id],
      tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
    };

    const result = coordinator.confirmReservedAdmission(validDraft, reservation);

    expect(result.success).toBe(true);
    expect(result.residentCode).toMatch(/^RESID-/);
    expect(result.stayId).toBeDefined();

    // 1. Verify Resident created in ResidentRepository
    const createdResident = residentRepo.getByIdSync(result.residentId!);
    expect(createdResident).not.toBeNull();
    expect(createdResident?.fullName).toBe('Rahul Sharma');
    expect(createdResident?.mobileNumber).toBe('9876543210');

    // 2. Verify Stay created in StayRepository
    const createdStay = stayRepo.findByIdSync(result.stayId);
    expect(createdStay).not.toBeNull();
    expect(createdStay?.residentId).toBe(result.residentId);

    // 3. Verify Accommodation bed marked OCCUPIED
    const updatedFlat = accomRepo.findById(flat.id)!;
    const occupiedBed = updatedFlat.areas.flatMap((a) => a.beds).find((b) => b.id === vacantBed.id);
    expect(occupiedBed?.status).toBe('OCCUPIED');

    // 4. Verify Reservation status CONVERTED and traceability references set
    const updatedReservation = resRepo.findByIdSync('resv-000001')!;
    expect(updatedReservation.status).toBe(ReservationStatus.CONVERTED);
    expect(updatedReservation.convertedResidentId).toBe(result.residentId);
    expect(updatedReservation.convertedStayId).toBe(result.stayId);
  });
});
