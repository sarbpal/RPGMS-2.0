import { describe, it, expect, beforeEach } from 'vitest';
import { ReservationWorkspaceCoordinator } from '../application/coordinator/ReservationWorkspaceCoordinator';
import { AdmissionCoordinator } from '../../admission/application/coordinator/AdmissionCoordinator';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryResidentRepository } from '../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { BedStatus } from '../../accommodation/domain/valueObjects/BedStatus';
import { TokenDisposition } from '../../admission/domain/valueObjects/TokenDisposition';
import type { ReservationDraft } from '../application/models/ReservationDraft';
import type { AdmissionDraft } from '../../admission/application/models/AdmissionDraft';
import type { Flat } from '../../accommodation/domain/entities/Flat';

describe('CR-2.5 End-to-End Business Journey Regression Test Suite', () => {
  let reservationRepo: InMemoryReservationRepository;
  let residentRepo: InMemoryResidentRepository;
  let stayRepo: InMemoryStayRepository;
  let accommodationRepo: InMemoryAccommodationRepository;

  let reservationCoordinator: ReservationWorkspaceCoordinator;
  let admissionCoordinator: AdmissionCoordinator;

  const todayStr = new Date().toISOString().split('T')[0];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const sampleFlat: Flat = {
    id: 'flat-101',
    name: '101',
    floor: '1',
    description: 'Double Sharing 1st Floor',
    areas: [
      {
        id: 'area-101-bedroom',
        name: 'Bedroom',
        defaultRent: 8000,
        defaultDeposit: 6500,
        beds: [
          { id: 'bed-101-a', name: '101-A', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
          { id: 'bed-101-b', name: '101-B', status: BedStatus.VACANT, defaultRent: 8000, defaultDeposit: 6500 },
        ],
      },
    ],
  };

  beforeEach(() => {
    reservationRepo = new InMemoryReservationRepository([]);
    residentRepo = new InMemoryResidentRepository([]);
    stayRepo = new InMemoryStayRepository([]);
    accommodationRepo = new InMemoryAccommodationRepository([sampleFlat]);

    reservationCoordinator = new ReservationWorkspaceCoordinator(reservationRepo);
    admissionCoordinator = new AdmissionCoordinator(reservationRepo, residentRepo, stayRepo, accommodationRepo);
  });

  it('executes complete business journey: Create -> Edit -> Token Update -> Overdue -> Extend Date -> Admission -> Read-Only Guard', () => {
    // -------------------------------------------------------------------------
    // STEP 1: Create Reservation
    // -------------------------------------------------------------------------
    const initialDraft: ReservationDraft = {
      prospectName: 'Aditya Verma',
      mobileNumber: '9876543210',
      expectedJoiningDate: todayStr,
      accommodationPreference: 'Double Sharing, 1st Floor',
      tokenAmount: 2000,
      tokenReceivedOn: todayStr,
      tokenRemarks: 'GPay',
      notes: 'Initial enquiry',
    };

    const createdRes = reservationCoordinator.saveReservation(initialDraft);
    expect(createdRes.reservationNumber).toBe('RES-000001');
    expect(createdRes.status).toBe(ReservationStatus.ACTIVE);
    expect(createdRes.tokenAmount).toBe(2000);

    // Verify Repository State
    expect(reservationRepo.findByIdSync(createdRes.id)?.reservationNumber).toBe('RES-000001');

    // -------------------------------------------------------------------------
    // STEP 2: Edit Reservation Details
    // -------------------------------------------------------------------------
    const editDraft: ReservationDraft = {
      ...initialDraft,
      accommodationPreference: 'Double Sharing, 1st Floor (Window Side)',
      notes: 'Updated preference to window side',
    };

    const editedRes = reservationCoordinator.saveReservation(editDraft, createdRes);
    expect(editedRes.accommodationPreference).toBe('Double Sharing, 1st Floor (Window Side)');
    expect(editedRes.auditLog.map((a) => a.action)).toContain('Reservation Updated');

    // -------------------------------------------------------------------------
    // STEP 3: Update Token Amount
    // -------------------------------------------------------------------------
    const tokenUpdateDraft: ReservationDraft = {
      ...editDraft,
      tokenAmount: 3000,
      tokenRemarks: 'Additional top-up ₹1000 via Cash',
    };

    const tokenUpdatedRes = reservationCoordinator.saveReservation(tokenUpdateDraft, editedRes);
    expect(tokenUpdatedRes.tokenAmount).toBe(3000);
    expect(tokenUpdatedRes.auditLog.map((a) => a.action)).toContain('Token Updated');

    // -------------------------------------------------------------------------
    // STEP 4: Overdue Operational Follow-Up Calculation
    // -------------------------------------------------------------------------
    // Set expected joining date to yesterday
    reservationRepo.saveSync({
      ...tokenUpdatedRes,
      expectedJoiningDate: yesterdayStr,
    });

    // Loading workspace derives follow-up operational attention without lifecycle mutation
    const vm = reservationCoordinator.loadWorkspace();
    const overdueRes = reservationRepo.findByIdSync(createdRes.id)!;
    expect(overdueRes.status).toBe(ReservationStatus.ACTIVE); // Lifecycle strictly preserved
    expect(vm.stats.totalFollowUp).toBe(1); // Derived operational metric

    // -------------------------------------------------------------------------
    // STEP 5: Extend Joining Date (Genuine Operator Action)
    // -------------------------------------------------------------------------
    const extendDateDraft: ReservationDraft = {
      ...tokenUpdateDraft,
      expectedJoiningDate: tomorrowStr,
    };

    const recoveredRes = reservationCoordinator.saveReservation(extendDateDraft, overdueRes, 'Exams extended');
    expect(recoveredRes.status).toBe(ReservationStatus.ACTIVE);
    expect(recoveredRes.expectedJoiningDate).toBe(tomorrowStr);

    const auditActions = recoveredRes.auditLog.map((a) => a.action);
    expect(auditActions).toContain('Joining Date Updated');
    expect(auditActions).not.toContain('Status Updated'); // Zero synthetic lifecycle churn

    // -------------------------------------------------------------------------
    // STEP 6: Admission Conversion Workflow
    // -------------------------------------------------------------------------
    const admissionDraft: AdmissionDraft = {
      reservationId: recoveredRes.id,
      residentName: recoveredRes.prospectName,
      mobileNumber: recoveredRes.mobileNumber,
      emergencyContactName: 'Ramesh Verma',
      emergencyContactRelationship: 'Father',
      emergencyContactPhone: '9111111111',
      idProofType: 'Aadhaar',
      idProofNumber: '1234-5678-9012',
      checkInDate: tomorrowStr,
      agreedRent: 8500,
      agreedDeposit: 7000,
      flatId: 'flat-101',
      bedIds: ['bed-101-a'],
      tokenDisposition: TokenDisposition.ADJUST_TO_SECURITY_DEPOSIT,
      notes: 'Final admission confirmed',
    };

    const admissionResult = admissionCoordinator.confirmReservedAdmission(admissionDraft, recoveredRes);

    // Assert Admission Result
    expect(admissionResult.success).toBe(true);
    expect(admissionResult.residentCode).toBe('RESID-000001');
    expect(admissionResult.stayId).toBe('stay-000001');
    expect(admissionResult.adjustedDepositBalance).toBe(4000); // Deposit 7000 - Token 3000 = 4000

    // -------------------------------------------------------------------------
    // STEP 7: Verify ALL Affected Repositories
    // -------------------------------------------------------------------------
    // Resident Repository
    const createdResident = residentRepo.getByIdSync('res-000001');
    expect(createdResident).toBeDefined();
    expect(createdResident?.residentCode).toBe('RESID-000001');
    expect(createdResident?.fullName).toBe('Aditya Verma');

    // Stay Repository
    const createdStay = stayRepo.findByIdSync('stay-000001');
    expect(createdStay).toBeDefined();
    expect(createdStay?.residentId).toBe('res-000001');
    expect(createdStay?.status).toBe('ACTIVE');
    expect(createdStay?.allocatedBedIds).toEqual(['bed-101-a']);
    expect(createdStay?.agreedRent).toBe(8500);

    // Accommodation Repository
    const updatedFlat = accommodationRepo.findById('flat-101');
    const allFlatBeds = updatedFlat?.areas.flatMap((a) => a.beds) || [];
    const allocatedBed = allFlatBeds.find((b) => b.id === 'bed-101-a');
    expect(allocatedBed?.status).toBe(BedStatus.OCCUPIED);
    expect(allocatedBed?.residentName).toBe('Aditya Verma');
    expect(allocatedBed?.stayId).toBe('stay-000001');

    // Reservation Repository
    const finalReservation = reservationRepo.findByIdSync(createdRes.id);
    expect(finalReservation?.status).toBe(ReservationStatus.CONVERTED);

    // -------------------------------------------------------------------------
    // STEP 8: Post-Admission Read-Only Enforcement
    // -------------------------------------------------------------------------
    const convertedRes = reservationRepo.findByIdSync(createdRes.id)!;
    expect(() =>
      reservationCoordinator.saveReservation({ ...extendDateDraft, prospectName: 'Attempt Edit' }, convertedRes)
    ).toThrow('Reservation is CONVERTED and is read-only');

    expect(() => reservationCoordinator.cancelReservation(createdRes.id)).toThrow('Converted reservations cannot be cancelled');

    // Verify Repository State unchanged after failed edit attempt
    expect(reservationRepo.findByIdSync(createdRes.id)?.prospectName).toBe('Aditya Verma');
  });
});
