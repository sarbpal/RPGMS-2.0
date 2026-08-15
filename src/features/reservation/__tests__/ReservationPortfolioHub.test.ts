import { describe, it, expect, beforeEach } from 'vitest';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationWorkspaceCoordinator } from '../application/coordinator/ReservationWorkspaceCoordinator';
import { validateReservationDraft } from '../domain/rules/reservationRules';
import type { ReservationDraft } from '../application/models/ReservationDraft';

describe('RU-2B.1 — Reservation Portfolio Hub Integration Suite', () => {
  let repository: InMemoryReservationRepository;
  let coordinator: ReservationWorkspaceCoordinator;

  const todayStr = new Date().toISOString().split('T')[0];

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const mockReservations: Reservation[] = [
    {
      id: 'resv-000001',
      reservationNumber: 'RES-000001',
      prospectName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      expectedJoiningDate: tomorrowStr,
      expectedMonthlyRent: 12000,
      expectedSecurityDeposit: 12000,
      accommodationPreference: 'Double Sharing, 1st Floor',
      tokenAmount: 2000,
      tokenReceivedOn: todayStr,
      tokenRemarks: 'GPay',
      status: ReservationStatus.ACTIVE,
      notes: 'Prefers 1st floor',
      auditLog: [],
      createdAt: '2026-08-01T10:00:00.000Z',
      updatedAt: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'resv-000002',
      reservationNumber: 'RES-000002',
      prospectName: 'Priya Patel',
      mobileNumber: '9988776655',
      expectedJoiningDate: todayStr, // Arriving Today
      expectedMonthlyRent: 14000,
      expectedSecurityDeposit: 14000,
      accommodationPreference: 'Single Room',
      tokenAmount: 3000,
      tokenReceivedOn: todayStr,
      status: ReservationStatus.ACTIVE,
      auditLog: [],
      createdAt: '2026-08-02T10:00:00.000Z',
      updatedAt: '2026-08-02T10:00:00.000Z',
    },
    {
      id: 'resv-000003',
      reservationNumber: 'RES-000003',
      prospectName: 'Amit Verma',
      mobileNumber: '9123456780',
      expectedJoiningDate: yesterdayStr, // Follow-up Required (overdue active)
      expectedMonthlyRent: 10000,
      expectedSecurityDeposit: 10000,
      accommodationPreference: 'Triple Sharing',
      tokenAmount: 1000,
      tokenReceivedOn: yesterdayStr,
      status: ReservationStatus.ACTIVE,
      auditLog: [],
      createdAt: '2026-07-25T10:00:00.000Z',
      updatedAt: '2026-07-25T10:00:00.000Z',
    },
    {
      id: 'resv-000004',
      reservationNumber: 'RES-000004',
      prospectName: 'Sneha Rao',
      mobileNumber: '9234567891',
      expectedJoiningDate: '2026-07-20',
      status: ReservationStatus.CONVERTED,
      convertedResidentId: 'resid-000001',
      convertedStayId: 'stay-000001',
      auditLog: [],
      createdAt: '2026-07-15T09:00:00.000Z',
      updatedAt: '2026-07-20T10:00:00.000Z',
    },
    {
      id: 'resv-000005',
      reservationNumber: 'RES-000005',
      prospectName: 'Vikram Malhotra',
      mobileNumber: '9345678902',
      expectedJoiningDate: '2026-07-10',
      status: ReservationStatus.CANCELLED,
      cancellationReason: 'Plan changed',
      auditLog: [],
      createdAt: '2026-07-05T14:00:00.000Z',
      updatedAt: '2026-07-08T16:00:00.000Z',
    },
  ];

  beforeEach(() => {
    repository = new InMemoryReservationRepository(mockReservations);
    coordinator = new ReservationWorkspaceCoordinator(repository);
  });

  describe('1. Summary Cards and Operational Metrics', () => {
    it('1 & 2. renders correct Active count for operational pipeline', () => {
      const vm = coordinator.loadWorkspace();
      expect(vm.stats.totalActive).toBe(3); // resv-000001, resv-000002, resv-000003
    });

    it('3. renders correct Arriving Today count', () => {
      const vm = coordinator.loadWorkspace();
      expect(vm.stats.arrivingToday).toBe(1); // resv-000002 has expectedJoiningDate = todayStr
    });

    it('4. renders correct Follow-up Required count for overdue active arrivals', () => {
      const vm = coordinator.loadWorkspace();
      expect(vm.stats.totalFollowUp).toBe(1); // resv-000003 has expectedJoiningDate < todayStr
    });
  });

  describe('2. Operational Card Filtering', () => {
    it('5. filters list when Active card is selected', () => {
      const vm = coordinator.loadWorkspace('', 'ACTIVE');
      expect(vm.filteredReservations).toHaveLength(3);
      vm.filteredReservations.forEach((r) => {
        expect(r.status).toBe(ReservationStatus.ACTIVE);
      });
    });

    it('6. filters list when Arriving Today card is selected', () => {
      const vm = coordinator.loadWorkspace('', 'ARRIVING_TODAY');
      expect(vm.filteredReservations).toHaveLength(1);
      expect(vm.filteredReservations[0].reservationNumber).toBe('RES-000002');
      expect(vm.filteredReservations[0].expectedJoiningDate).toBe(todayStr);
    });

    it('7. filters list when Follow-up Required card is selected', () => {
      const vm = coordinator.loadWorkspace('', 'FOLLOW_UP_REQUIRED');
      expect(vm.filteredReservations).toHaveLength(1);
      expect(vm.filteredReservations[0].reservationNumber).toBe('RES-000003');
      expect(vm.filteredReservations[0].prospectName).toBe('Amit Verma');
    });
  });

  describe('3. Lifecycle Filters', () => {
    it('8a. supports filtering by ALL reservations', () => {
      const vm = coordinator.loadWorkspace('', 'ALL');
      expect(vm.filteredReservations).toHaveLength(5);
    });

    it('8b. supports filtering by CONVERTED reservations', () => {
      const vm = coordinator.loadWorkspace('', 'CONVERTED');
      expect(vm.filteredReservations).toHaveLength(1);
      expect(vm.filteredReservations[0].status).toBe(ReservationStatus.CONVERTED);
      expect(vm.filteredReservations[0].prospectName).toBe('Sneha Rao');
    });

    it('8c. supports filtering by CANCELLED reservations', () => {
      const vm = coordinator.loadWorkspace('', 'CANCELLED');
      expect(vm.filteredReservations).toHaveLength(1);
      expect(vm.filteredReservations[0].status).toBe(ReservationStatus.CANCELLED);
      expect(vm.filteredReservations[0].prospectName).toBe('Vikram Malhotra');
    });
  });

  describe('4. Universal Search Model', () => {
    it('9. finds reservation by prospect name (case-insensitive substring)', () => {
      const vm = coordinator.loadWorkspace('priya');
      expect(vm.filteredReservations).toHaveLength(1);
      expect(vm.filteredReservations[0].prospectName).toBe('Priya Patel');
    });

    it('10. finds reservation by 10-digit mobile number substring', () => {
      const vm = coordinator.loadWorkspace('9876543210');
      expect(vm.filteredReservations).toHaveLength(1);
      expect(vm.filteredReservations[0].prospectName).toBe('Rahul Sharma');
    });

    it('11. finds reservation by Reservation Number (RES-000003)', () => {
      const vm = coordinator.loadWorkspace('RES-000003');
      expect(vm.filteredReservations).toHaveLength(1);
      expect(vm.filteredReservations[0].prospectName).toBe('Amit Verma');
    });
  });

  describe('5. Zero State Handling', () => {
    it('12. handles Zero Active state gracefully as normal operational value', () => {
      const inactiveRepo = new InMemoryReservationRepository([
        mockReservations[3], // CONVERTED
        mockReservations[4], // CANCELLED
      ]);
      const coord = new ReservationWorkspaceCoordinator(inactiveRepo);
      const vm = coord.loadWorkspace('', 'ACTIVE');

      expect(vm.stats.totalActive).toBe(0);
      expect(vm.filteredReservations).toHaveLength(0);
    });

    it('13. handles Zero Arriving Today state as normal operational value', () => {
      const noArrivalsRepo = new InMemoryReservationRepository([
        mockReservations[0], // joining tomorrow
        mockReservations[3], // CONVERTED
      ]);
      const coord = new ReservationWorkspaceCoordinator(noArrivalsRepo);
      const vm = coord.loadWorkspace('', 'ARRIVING_TODAY');

      expect(vm.stats.arrivingToday).toBe(0);
      expect(vm.filteredReservations).toHaveLength(0);
    });

    it('14. handles Zero Follow-up state as positive/neutral operational value', () => {
      const noFollowUpRepo = new InMemoryReservationRepository([
        mockReservations[0], // joining tomorrow
        mockReservations[1], // joining today
      ]);
      const coord = new ReservationWorkspaceCoordinator(noFollowUpRepo);
      const vm = coord.loadWorkspace('', 'FOLLOW_UP_REQUIRED');

      expect(vm.stats.totalFollowUp).toBe(0);
      expect(vm.filteredReservations).toHaveLength(0);
    });

    it('15. handles completely empty pipeline gracefully', () => {
      const emptyRepo = new InMemoryReservationRepository([]);
      const coord = new ReservationWorkspaceCoordinator(emptyRepo);
      const vm = coord.loadWorkspace('', 'ALL');

      expect(vm.stats.totalActive).toBe(0);
      expect(vm.stats.arrivingToday).toBe(0);
      expect(vm.stats.totalFollowUp).toBe(0);
      expect(vm.stats.totalConverted).toBe(0);
      expect(vm.stats.totalCancelled).toBe(0);
      expect(vm.filteredReservations).toHaveLength(0);
    });
  });

  describe('6. Creation and Validation Preservation', () => {
    it('16 & 18. allows saving new reservation into repository and reflects in portfolio immediately', () => {
      const draft: ReservationDraft = {
        prospectName: 'New Arrival Prospect',
        mobileNumber: '9777777777',
        expectedJoiningDate: tomorrowStr,
        expectedMonthlyRent: 11500,
        expectedSecurityDeposit: 23000,
        accommodationPreference: 'Double Sharing',
        tokenAmount: 2500,
        tokenReceivedOn: todayStr,
        tokenRemarks: 'UPI',
        notes: 'Needs quiet room',
      };

      const created = coordinator.saveReservation(draft);
      expect(created.id).toBeDefined();
      expect(created.reservationNumber).toBe('RES-000006');
      expect(created.status).toBe(ReservationStatus.ACTIVE);
      expect(created.expectedMonthlyRent).toBe(11500);

      // Verify portfolio reload
      const updatedVm = coordinator.loadWorkspace();
      expect(updatedVm.stats.totalActive).toBe(4);
      expect(updatedVm.reservations.some((r) => r.prospectName === 'New Arrival Prospect')).toBe(true);
    });

    it('17. maps row selection by reservation ID', () => {
      const vm = coordinator.loadWorkspace();
      const target = vm.filteredReservations[0];
      expect(target.id).toBe('resv-000001');
    });

    it('19. preserves token received date behaviour (defaults/editable)', () => {
      const draft: ReservationDraft = {
        prospectName: 'Token Test',
        mobileNumber: '9666666666',
        expectedJoiningDate: tomorrowStr,
        tokenAmount: 1000,
        tokenReceivedOn: todayStr,
      };

      const created = coordinator.saveReservation(draft);
      expect(created.tokenReceivedOn).toBe(todayStr);
      expect(created.tokenAmount).toBe(1000);
    });

    it('20. preserves joining-date validation (date >= referenceDate)', () => {
      const invalidValidation = validateReservationDraft(
        'Invalid Date Prospect',
        '9555555555',
        yesterdayStr, // Past date
        todayStr
      );

      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.expectedJoiningDate).toContain('Expected joining date cannot be earlier than today');

      const validValidation = validateReservationDraft(
        'Valid Date Prospect',
        '9555555555',
        tomorrowStr,
        todayStr
      );

      expect(validValidation.isValid).toBe(true);
    });
  });

  describe('7. UX Density Correction Verification (RU-2B.1 Correction)', () => {
    it('21. exposes essential portfolio conceptual fields in filtered list viewmodel', () => {
      const vm = coordinator.loadWorkspace();
      const first = vm.filteredReservations[0];

      // 1. Prospect Identity (Dominant Name + Secondary ID)
      expect(first.prospectName).toBe('Rahul Sharma');
      expect(first.reservationNumber).toBe('RES-000001');

      // 2. Expected Arrival
      expect(first.expectedJoiningDate).toBe(tomorrowStr);

      // 3. Accommodation Preference
      expect(first.accommodationPreference).toBe('Double Sharing, 1st Floor');

      // 4. Status
      expect(first.status).toBe(ReservationStatus.ACTIVE);
    });

    it('22. preserves mobile number for universal search while keeping portfolio surface uncluttered', () => {
      // Mobile search matches correctly even though mobile is not displayed as a primary table column
      const vm = coordinator.loadWorkspace('9876543210');
      expect(vm.filteredReservations).toHaveLength(1);
      expect(vm.filteredReservations[0].prospectName).toBe('Rahul Sharma');
    });
  });
});
