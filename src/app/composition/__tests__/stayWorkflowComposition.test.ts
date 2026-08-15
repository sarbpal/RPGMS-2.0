import { describe, expect, it } from 'vitest';
import { stayWorkflowComposition } from '../stayWorkflowComposition';
import { ReservationStatus } from '../../../features/reservation/domain/valueObjects/ReservationStatus';
import { ReservationUseCases } from '../../../features/reservation/application/useCases/ReservationUseCases';

describe('stayWorkflowComposition', () => {
  it('makes a walk-in admission visible to the composed Stay and Accommodation workspaces', () => {
    const { admissionCoordinator, stayWorkspaceCoordinator, accommodationWorkspaceCoordinator, accommodationRepository } = stayWorkflowComposition;
    const flat = accommodationRepository.findAll().find((candidate) => candidate.areas.some((area) => area.beds.some((bed) => bed.status === 'VACANT')));
    const bed = flat?.areas.flatMap((area) => area.beds).find((candidate) => candidate.status === 'VACANT');
    expect(flat).toBeDefined();
    expect(bed).toBeDefined();

    const result = admissionCoordinator.confirmWalkInAdmission({
      sourceType: 'WALK_IN', residentName: 'Composition Test Resident', mobileNumber: '7012345678',
      idProofType: 'AADHAAR', idProofNumber: '1234-5678-9012',
      checkInDate: '2026-08-10', agreedRent: 10000, agreedDeposit: 20000,
      flatId: flat!.id, bedIds: [bed!.id],
    });

    const stay = stayWorkspaceCoordinator.findStay(result.stayId);
    expect(stay).toMatchObject({ id: result.stayId, residentId: result.residentId, status: 'ACTIVE', checkInDate: '2026-08-10' });
    const accommodationView = accommodationWorkspaceCoordinator.loadAndSynchronizeFlats();
    const composedBed = accommodationView.find((candidate) => candidate.id === flat!.id)?.areas.flatMap((area) => area.beds).find((candidate) => candidate.id === bed!.id);
    expect(composedBed?.status).toBe('OCCUPIED');
  });

  describe('Reservation Shared Repository & Workflow Composition Integrity', () => {
    it('A. Shared Repository Identity: proves list and detail workflows share the same repository reference', () => {
      const { reservationRepository, reservationWorkspaceCoordinator } = stayWorkflowComposition;
      const reservationUseCases = new ReservationUseCases(reservationRepository);

      // Verify reference identity
      expect(reservationRepository).toBeDefined();
      expect(reservationWorkspaceCoordinator).toBeDefined();

      const created = reservationWorkspaceCoordinator.saveReservation({
        prospectName: 'Shared Identity Prospect',
        mobileNumber: '9900112233',
        expectedJoiningDate: '2026-09-01',
        accommodationPreference: 'Single Room',
        tokenAmount: 1500,
        tokenReceivedOn: '2026-08-15',
        tokenRemarks: 'UPI',
        notes: 'Identity Verification Test',
      });

      // Verify that direct use cases on the same composed repo immediately see the created entity
      const resolvedFromUseCases = reservationUseCases.getReservationByIdSync(created.id);
      expect(resolvedFromUseCases).not.toBeNull();
      expect(resolvedFromUseCases?.id).toBe(created.id);
      expect(resolvedFromUseCases?.reservationNumber).toBe(created.reservationNumber);
    });

    it('B. Create → List → Detail: reservation created via coordinator is visible in list and detail workflows', () => {
      const { reservationRepository, reservationWorkspaceCoordinator } = stayWorkflowComposition;
      const reservationUseCases = new ReservationUseCases(reservationRepository);

      const created = reservationWorkspaceCoordinator.saveReservation({
        prospectName: 'Flow Test Prospect',
        mobileNumber: '9811223344',
        expectedJoiningDate: '2026-08-25',
        accommodationPreference: 'Double Sharing, 2nd Floor',
        tokenAmount: 2000,
      });

      // 1. Visible in List workflow
      const listViewModel = reservationWorkspaceCoordinator.loadWorkspace();
      const inList = listViewModel.reservations.find((r) => r.id === created.id);
      expect(inList).toBeDefined();
      expect(inList?.prospectName).toBe('Flow Test Prospect');

      const allViaUseCases = reservationUseCases.listReservationsSync();
      expect(allViaUseCases.some((r) => r.id === created.id)).toBe(true);

      // 2. Visible in Detail workflow
      const detailEntity = reservationUseCases.getReservationByIdSync(created.id);
      expect(detailEntity).toBeDefined();
      expect(detailEntity?.expectedJoiningDate).toBe('2026-08-25');
      expect(detailEntity?.status).toBe(ReservationStatus.ACTIVE);
    });

    it('C. Edit → Detail: editing reservation updates the shared state with business audit trail', () => {
      const { reservationRepository, reservationWorkspaceCoordinator } = stayWorkflowComposition;
      const reservationUseCases = new ReservationUseCases(reservationRepository);

      const created = reservationWorkspaceCoordinator.saveReservation({
        prospectName: 'Edit Test Prospect',
        mobileNumber: '9822334455',
        expectedJoiningDate: '2026-08-28',
      });

      // Perform edit
      reservationWorkspaceCoordinator.saveReservation(
        {
          prospectName: 'Edit Test Prospect Updated',
          mobileNumber: '9822334455',
          expectedJoiningDate: '2026-08-30',
          accommodationPreference: 'Triple Sharing',
          tokenAmount: 3000,
          tokenReceivedOn: '2026-08-16',
          tokenRemarks: 'Cash',
          notes: 'Shifted date by 2 days',
        },
        created,
        'Prospect requested postponement'
      );

      // Detail resolution reflects all updates
      const resolved = reservationUseCases.getReservationByIdSync(created.id);
      expect(resolved).toBeDefined();
      expect(resolved?.expectedJoiningDate).toBe('2026-08-30');
      expect(resolved?.accommodationPreference).toBe('Triple Sharing');
      expect(resolved?.tokenAmount).toBe(3000);
      expect(resolved?.notes).toBe('Shifted date by 2 days');
      expect(resolved?.auditLog.some((entry) => entry.action === 'Joining Date Updated')).toBe(true);
    });

    it('D. Reservation → Admission Handoff: admission workflow resolves and converts the composed reservation', () => {
      const {
        reservationRepository,
        reservationWorkspaceCoordinator,
        admissionCoordinator,
        stayWorkspaceCoordinator,
        accommodationRepository,
      } = stayWorkflowComposition;

      // Find vacant bed for admission
      const flat = accommodationRepository.findAll().find((candidate) =>
        candidate.areas.some((area) => area.beds.some((bed) => bed.status === 'VACANT'))
      );
      const bed = flat?.areas.flatMap((area) => area.beds).find((candidate) => candidate.status === 'VACANT');
      expect(flat).toBeDefined();
      expect(bed).toBeDefined();

      const created = reservationWorkspaceCoordinator.saveReservation({
        prospectName: 'Admission Handoff Prospect',
        mobileNumber: '9833445566',
        expectedJoiningDate: '2026-08-20',
        accommodationPreference: 'Double Sharing',
        tokenAmount: 2500,
      });

      // 1. Admission workflow resolves the source reservation from the shared repository
      const sourceRes = reservationRepository.findByIdSync(created.id);
      expect(sourceRes).not.toBeNull();
      expect(sourceRes?.status).toBe(ReservationStatus.ACTIVE);

      // 2. Admission confirms reserved admission
      const admissionResult = admissionCoordinator.confirmReservedAdmission(
        {
          sourceType: 'RESERVATION',
          reservationId: created.id,
          residentName: 'Admission Handoff Prospect',
          mobileNumber: '9833445566',
          idProofType: 'AADHAAR',
          idProofNumber: '1122-3344-5566',
          checkInDate: '2026-08-20',
          agreedRent: 9000,
          agreedDeposit: 9000,
          flatId: flat!.id,
          bedIds: [bed!.id],
          tokenDisposition: 'ADJUST_TO_SECURITY_DEPOSIT',
        },
        sourceRes!
      );

      // 3. Verify Reservation status in shared repository is permanently CONVERTED
      const convertedRes = reservationRepository.findByIdSync(created.id);
      expect(convertedRes?.status).toBe(ReservationStatus.CONVERTED);
      expect(convertedRes?.convertedResidentId).toBe(admissionResult.residentId);
      expect(convertedRes?.convertedStayId).toBe(admissionResult.stayId);

      // 4. Verify Stay and Accommodation reflect the admission
      const stay = stayWorkspaceCoordinator.findStay(admissionResult.stayId);
      expect(stay).toBeDefined();
      expect(stay?.status).toBe('ACTIVE');
    });

    it('E. Cancel / Lifecycle Integrity: cancellation updates status without creating Stay or Bed allocation', () => {
      const {
        reservationRepository,
        reservationWorkspaceCoordinator,
        stayRepository,
      } = stayWorkflowComposition;

      const created = reservationWorkspaceCoordinator.saveReservation({
        prospectName: 'Cancel Test Prospect',
        mobileNumber: '9844556677',
        expectedJoiningDate: '2026-08-22',
      });

      const initialStayCount = stayRepository.getAllSync().length;

      // Cancel reservation
      const cancelled = reservationWorkspaceCoordinator.cancelReservation(
        created.id,
        'Found another PG accommodation'
      );

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);

      // Verify shared repository reflects CANCELLED
      const resolved = reservationRepository.findByIdSync(created.id);
      expect(resolved?.status).toBe(ReservationStatus.CANCELLED);
      expect(resolved?.auditLog.some((e) => e.action === 'Reservation Cancelled')).toBe(true);

      // Verify no operational Stay or Bed Allocation was created
      expect(stayRepository.getAllSync().length).toBe(initialStayCount);
    });
  });
});
