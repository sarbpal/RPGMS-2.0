import { describe, it, expect, beforeEach } from 'vitest';
import { ReservationWorkspaceCoordinator } from '../ReservationWorkspaceCoordinator';
import { InMemoryReservationRepository } from '../../../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationStatus } from '../../../domain/valueObjects/ReservationStatus';
import type { ReservationDraft } from '../../models/ReservationDraft';

describe('ReservationWorkspaceCoordinator Integration Suite', () => {
  let repository: InMemoryReservationRepository;
  let coordinator: ReservationWorkspaceCoordinator;

  const todayStr = new Date().toISOString().split('T')[0];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  beforeEach(() => {
    repository = new InMemoryReservationRepository([]);
    coordinator = new ReservationWorkspaceCoordinator(repository);
  });

  describe('saveReservation Operations', () => {
    it('creates and saves a new Reservation from a valid draft and updates repository state', () => {
      const draft: ReservationDraft = {
        prospectName: 'Karan Mehra',
        mobileNumber: '9988776655',
        expectedJoiningDate: tomorrowStr,
        accommodationPreference: 'Double Sharing',
        tokenAmount: 2000,
        tokenReceivedOn: todayStr,
        tokenRemarks: 'GPay',
        notes: 'Needs upper bunk',
      };

      const result = coordinator.saveReservation(draft);

      expect(result.reservationNumber).toBe('RES-000001');
      expect(result.prospectName).toBe('Karan Mehra');
      expect(result.status).toBe(ReservationStatus.ACTIVE);
      expect(result.auditLog).toHaveLength(1);
      expect(result.auditLog[0].action).toBe('Reservation Created');

      // Refinement #3: Verify repository state after operation
      const repoState = repository.findByIdSync(result.id);
      expect(repoState).toBeDefined();
      expect(repoState?.reservationNumber).toBe('RES-000001');
      expect(repoState?.tokenAmount).toBe(2000);
    });

    it('throws error when draft validation fails', () => {
      const invalidDraft: ReservationDraft = {
        prospectName: '',
        mobileNumber: '123',
        expectedJoiningDate: 'invalid',
      };

      expect(() => coordinator.saveReservation(invalidDraft)).toThrow(
        'Reservation validation failed'
      );
    });

    it('preserves ACTIVE lifecycle without synthetic mutations or audit churn when reservation is overdue', () => {
      // 1. Seed an active reservation directly into the repository with a past joining date
      const nowIso = new Date().toISOString();
      const seeded = repository.saveSync({
        id: 'resv-test-overdue',
        reservationNumber: 'RES-000001',
        prospectName: 'Karan Mehra',
        mobileNumber: '9988776655',
        expectedJoiningDate: yesterdayStr,
        status: ReservationStatus.ACTIVE,
        auditLog: [{ timestamp: nowIso, action: 'Reservation Created', performedBy: 'System Operator', details: 'Reservation created' }],
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      // 2. Load workspace: verifies status remains ACTIVE and zero synthetic audit log entries are generated
      const vm = coordinator.loadWorkspace();
      const repoStateAfterLoad = repository.findByIdSync(seeded.id)!;
      expect(repoStateAfterLoad.status).toBe(ReservationStatus.ACTIVE);
      expect(repoStateAfterLoad.auditLog).toHaveLength(1); // Only the creation audit log
      expect(vm.stats.totalFollowUp).toBe(1); // Derived operational metric

      // 3. Extend joining date to tomorrow (genuine operator action)
      const updated = coordinator.saveReservation(
        {
          ...repoStateAfterLoad,
          expectedJoiningDate: tomorrowStr,
        },
        repoStateAfterLoad,
        'Exams delayed'
      );

      // Verify status remains ACTIVE
      expect(updated.status).toBe(ReservationStatus.ACTIVE);

      // Verify audit events: contains only genuine operator event 'Joining Date Updated', NO synthetic 'Status Updated'
      const auditActions = updated.auditLog.map((a) => a.action);
      expect(auditActions).toContain('Joining Date Updated');
      expect(auditActions).not.toContain('Status Updated');

      // Verify repository state
      const finalRepoState = repository.findByIdSync(seeded.id);
      expect(finalRepoState?.status).toBe(ReservationStatus.ACTIVE);
      expect(finalRepoState?.expectedJoiningDate).toBe(tomorrowStr);
    });

    it('generates Token Updated audit entry when token details are modified (Refinement #3)', () => {
      const res = coordinator.saveReservation({
        prospectName: 'Token Prospect',
        mobileNumber: '9111111111',
        expectedJoiningDate: tomorrowStr,
        tokenAmount: 0,
      });

      const updated = coordinator.saveReservation(
        {
          ...res,
          tokenAmount: 3000,
          tokenReceivedOn: todayStr,
          tokenRemarks: 'Cash',
        },
        res
      );

      expect(updated.tokenAmount).toBe(3000);
      const lastAudit = updated.auditLog[updated.auditLog.length - 1];
      expect(lastAudit.action).toBe('Token Updated');
      expect(lastAudit.details).toContain('Token amount updated to ₹3,000');
    });
  });

  describe('cancelReservation Operations', () => {
    it('cancels an active reservation, updates status to CANCELLED, and logs audit event', () => {
      const res = coordinator.saveReservation({
        prospectName: 'John Doe',
        mobileNumber: '9876543210',
        expectedJoiningDate: tomorrowStr,
      });

      const cancelled = coordinator.cancelReservation(res.id, 'Found alternative accommodation');

      expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
      const lastAudit = cancelled.auditLog[cancelled.auditLog.length - 1];
      expect(lastAudit.action).toBe('Reservation Cancelled');
      expect(lastAudit.details).toContain('Reason: Found alternative accommodation');

      // Refinement #3: Verify repository state after cancellation
      const repoState = repository.findByIdSync(res.id);
      expect(repoState?.status).toBe(ReservationStatus.CANCELLED);
    });

    it('prevents cancelling an already CANCELLED reservation', () => {
      const res = coordinator.saveReservation({
        prospectName: 'John Doe',
        mobileNumber: '9876543210',
        expectedJoiningDate: tomorrowStr,
      });
      coordinator.cancelReservation(res.id);

      expect(() => coordinator.cancelReservation(res.id)).toThrow('Reservation is already cancelled');
    });
  });

  describe('Read-Only Immutability Guards', () => {
    it('prevents editing or modifying a CONVERTED or CANCELLED reservation', () => {
      const res = coordinator.saveReservation({
        prospectName: 'Immutable Prospect',
        mobileNumber: '9555555555',
        expectedJoiningDate: tomorrowStr,
      });

      // Mark as CONVERTED
      repository.saveSync({ ...res, status: ReservationStatus.CONVERTED });
      const convertedRes = repository.findByIdSync(res.id)!;

      // Attempt edit
      expect(() => coordinator.saveReservation({ ...convertedRes, prospectName: 'Changed' }, convertedRes)).toThrow(
        'Reservation is CONVERTED and is read-only'
      );

      // Attempt cancel
      expect(() => coordinator.cancelReservation(res.id)).toThrow('Converted reservations cannot be cancelled');

      // Verify repository state remains completely unchanged
      const finalRepoState = repository.findByIdSync(res.id);
      expect(finalRepoState?.prospectName).toBe('Immutable Prospect');
      expect(finalRepoState?.status).toBe(ReservationStatus.CONVERTED);
    });
  });

  describe('checkDuplicateMobile', () => {
    it('returns warning details when an active reservation exists for the mobile number', () => {
      const draft: ReservationDraft = {
        prospectName: 'John Doe',
        mobileNumber: '9876543210',
        expectedJoiningDate: tomorrowStr,
      };
      coordinator.saveReservation(draft);

      const check = coordinator.checkDuplicateMobile('9876543210');
      expect(check.hasDuplicate).toBe(true);
      expect(check.existingReservation?.reservationNumber).toBe('RES-000001');
      expect(check.warning).toContain('ACTIVE reservation (RES-000001 for John Doe)');
    });
  });

  describe('loadWorkspace and createViewModel', () => {
    it('calculates summary statistics accurately including Arriving Today and Follow-up Required', () => {
      const nowIso = new Date().toISOString();

      coordinator.saveReservation({
        prospectName: 'Active 1',
        mobileNumber: '9000000001',
        expectedJoiningDate: tomorrowStr,
      });

      coordinator.saveReservation({
        prospectName: 'Arriving Today 1',
        mobileNumber: '9000000002',
        expectedJoiningDate: todayStr,
      });

      // Seed an overdue active reservation
      repository.saveSync({
        id: 'resv-overdue-1',
        reservationNumber: 'RES-000003',
        prospectName: 'Overdue Prospect',
        mobileNumber: '9000000003',
        expectedJoiningDate: yesterdayStr,
        status: ReservationStatus.ACTIVE,
        auditLog: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      });

      const viewModel = coordinator.loadWorkspace();
      expect(viewModel.stats.totalActive).toBe(3); // All 3 are ACTIVE
      expect(viewModel.stats.arrivingToday).toBe(1);
      expect(viewModel.stats.totalFollowUp).toBe(1); // Exactly 1 requires follow-up

      // Verify filtering by FOLLOW_UP_REQUIRED returns only the overdue active reservation
      const followUpFiltered = coordinator.loadWorkspace('', 'FOLLOW_UP_REQUIRED');
      expect(followUpFiltered.filteredReservations).toHaveLength(1);
      expect(followUpFiltered.filteredReservations[0].prospectName).toBe('Overdue Prospect');

      // Verify filtering by ACTIVE returns all 3 active reservations
      const activeFiltered = coordinator.loadWorkspace('', 'ACTIVE');
      expect(activeFiltered.filteredReservations).toHaveLength(3);
    });
  });
});
