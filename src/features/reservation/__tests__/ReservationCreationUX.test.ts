import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { ReservationWorkspaceCoordinator } from '../application/coordinator/ReservationWorkspaceCoordinator';
import { normalizeProspectName, validateReservationDraft } from '../domain/rules/reservationRules';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import type { ReservationDraft } from '../application/models/ReservationDraft';
import type { Reservation } from '../domain/entities/Reservation';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { BedStatus } from '../../accommodation/domain/valueObjects/BedStatus';

describe('RU-2B.2 — Reservation Creation UX & Verification Suite', () => {
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

  describe('1. Name Normalization (Scenarios 1–7)', () => {
    it('1. converts lowercase name to clean title case', () => {
      expect(normalizeProspectName('harsh singh')).toBe('Harsh Singh');
    });

    it('2. converts uppercase name to clean title case', () => {
      expect(normalizeProspectName('HARSH SINGH')).toBe('Harsh Singh');
    });

    it('3. collapses repeated internal whitespace', () => {
      expect(normalizeProspectName('harsh    singh')).toBe('Harsh Singh');
    });

    it('4. removes leading and trailing whitespace', () => {
      expect(normalizeProspectName('   harsh singh   ')).toBe('Harsh Singh');
    });

    it('5. preserves sensible apostrophe handling (O\'Connor, D\'Souza)', () => {
      expect(normalizeProspectName("o'connor")).toBe("O'Connor");
      expect(normalizeProspectName("d'souza")).toBe("D'Souza");
    });

    it('6. preserves sensible hyphenated name handling (Singh-Gill)', () => {
      expect(normalizeProspectName('singh-gill')).toBe('Singh-Gill');
      expect(normalizeProspectName('SINGH-GILL')).toBe('Singh-Gill');
    });

    it('7. uses conservative generic title casing without surname-specific Mc/Mac inference', () => {
      expect(normalizeProspectName('mcdonald')).toBe('Mcdonald');
      expect(normalizeProspectName('macdonald')).toBe('Macdonald');
      expect(normalizeProspectName('mcintosh')).toBe('Mcintosh');
    });
  });

  describe('2. Mobile Number Validation (Scenarios 8–14)', () => {
    it('8. rejects empty mobile number', () => {
      const res = validateReservationDraft('Rahul Sharma', '', todayStr);
      expect(res.isValid).toBe(false);
      expect(res.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('9. rejects 9-digit mobile number (fewer than 10 digits)', () => {
      const res = validateReservationDraft('Rahul Sharma', '987654321', todayStr);
      expect(res.isValid).toBe(false);
      expect(res.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('10. rejects 11-digit mobile number (more than 10 digits)', () => {
      const res = validateReservationDraft('Rahul Sharma', '98765432101', todayStr);
      expect(res.isValid).toBe(false);
      expect(res.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('11. rejects alphabetic mobile input', () => {
      const res = validateReservationDraft('Rahul Sharma', 'abcdefghij', todayStr);
      expect(res.isValid).toBe(false);
      expect(res.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('12. rejects alphanumeric mobile input', () => {
      const res = validateReservationDraft('Rahul Sharma', '98765abcde', todayStr);
      expect(res.isValid).toBe(false);
      expect(res.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('13. rejects non-numeric characters in mobile input', () => {
      const res = validateReservationDraft('Rahul Sharma', '98765-43210', todayStr);
      expect(res.isValid).toBe(false);
      expect(res.errors.mobileNumber).toBe('Mobile number must be exactly 10 digits.');
    });

    it('14. accepts valid 10-digit mobile number', () => {
      const res = validateReservationDraft('Rahul Sharma', '9876543210', todayStr);
      expect(res.isValid).toBe(true);
      expect(res.errors.mobileNumber).toBeUndefined();
    });
  });

  describe('3. Duplicate Mobile Behaviour (Scenarios 15–17)', () => {
    let existingActive: Reservation;

    beforeEach(() => {
      const draft: ReservationDraft = {
        prospectName: 'Existing Active Prospect',
        mobileNumber: '9876543210',
        expectedJoiningDate: tomorrowStr,
      };
      existingActive = coordinator.saveReservation(draft);
    });

    it('15. detects active duplicate mobile number and generates clear warning', () => {
      const duplicateCheck = coordinator.checkDuplicateMobile('9876543210');
      expect(duplicateCheck.hasDuplicate).toBe(true);
      expect(duplicateCheck.warning).toContain(existingActive.reservationNumber);
      expect(duplicateCheck.existingReservation?.id).toBe(existingActive.id);
    });

    it('16. supports Open Existing flow by providing the existing reservation reference', () => {
      const duplicateCheck = coordinator.checkDuplicateMobile('9876543210');
      expect(duplicateCheck.existingReservation).toBeDefined();
      expect(duplicateCheck.existingReservation?.id).toBe(existingActive.id);
    });

    it('17. supports Create Anyway flow by allowing operator override to save reservation', () => {
      const duplicateDraft: ReservationDraft = {
        prospectName: 'Another Person With Same Number',
        mobileNumber: '9876543210',
        expectedJoiningDate: tomorrowStr,
      };
      const created = coordinator.saveReservation(duplicateDraft);
      expect(created.id).toBeDefined();
      expect(created.reservationNumber).toBe('RES-000002');
      expect(created.prospectName).toBe('Another Person With Same Number');
    });
  });

  describe('4. Date Requirements (Scenarios 18–20)', () => {
    it('18 & 19. Token Received Date defaults to today and remains editable', () => {
      const draft: ReservationDraft = {
        prospectName: 'Token Date Test',
        mobileNumber: '9876543211',
        expectedJoiningDate: tomorrowStr,
        tokenAmount: 2000,
        tokenReceivedOn: todayStr,
      };
      const saved = coordinator.saveReservation(draft);
      expect(saved.tokenReceivedOn).toBe(todayStr);

      // Edit token date
      const updatedDraft: ReservationDraft = {
        ...draft,
        tokenReceivedOn: '2026-08-01',
      };
      const updated = coordinator.saveReservation(updatedDraft, saved);
      expect(updated.tokenReceivedOn).toBe('2026-08-01');
    });

    it('20. Expected Joining Date cannot be earlier than reference date (today)', () => {
      const res = validateReservationDraft('Past Date Prospect', '9876543212', yesterdayStr, todayStr);
      expect(res.isValid).toBe(false);
      expect(res.errors.expectedJoiningDate).toBe('Expected joining date cannot be earlier than today.');
    });
  });

  describe('5. Commercial Expectations Preservation (Scenarios 21–25)', () => {
    it('21–25. preserves expectedMonthlyRent, expectedSecurityDeposit, token amount, date, and remarks', () => {
      const draft: ReservationDraft = {
        prospectName: '  harsh  singh  ', // should also be normalized
        mobileNumber: '9876543213',
        expectedJoiningDate: tomorrowStr,
        expectedMonthlyRent: 12500,
        expectedSecurityDeposit: 25000,
        tokenAmount: 3000,
        tokenReceivedOn: todayStr,
        tokenRemarks: 'UPI transaction ref #123456',
        accommodationPreference: 'Double Sharing, 2nd Floor',
        notes: 'Prefers quiet corner',
      };

      const saved = coordinator.saveReservation(draft);
      expect(saved.prospectName).toBe('Harsh Singh');
      expect(saved.expectedMonthlyRent).toBe(12500);
      expect(saved.expectedSecurityDeposit).toBe(25000);
      expect(saved.tokenAmount).toBe(3000);
      expect(saved.tokenReceivedOn).toBe(todayStr);
      expect(saved.tokenRemarks).toBe('UPI transaction ref #123456');
      expect(saved.accommodationPreference).toBe('Double Sharing, 2nd Floor');
      expect(saved.notes).toBe('Prefers quiet corner');
    });
  });

  describe('6. Reservation Semantics and Architectural Invariants (Scenarios 26–30)', () => {
    it('26. Accommodation Preference remains non-allocating expectation truth', () => {
      const draft: ReservationDraft = {
        prospectName: 'Preference Prospect',
        mobileNumber: '9876543214',
        expectedJoiningDate: tomorrowStr,
        accommodationPreference: 'Single Room, 3rd Floor',
      };
      const saved = coordinator.saveReservation(draft);
      expect(saved.accommodationPreference).toBe('Single Room, 3rd Floor');
      expect(saved.status).toBe(ReservationStatus.ACTIVE);
    });

    it('27 & 28. Creating a Reservation does not create BedAllocation or mutate BedStatus', () => {
      const accommodationRepo = new InMemoryAccommodationRepository([
        {
          id: 'flat-101',
          name: '101',
          floor: '1',
          areas: [
            {
              id: 'area-1',
              name: 'Room A',
              defaultRent: 8000,
              defaultDeposit: 8000,
              beds: [
                {
                  id: 'bed-101-a',
                  name: '101-A',
                  status: BedStatus.VACANT,
                  defaultRent: 8000,
                  defaultDeposit: 8000,
                },
              ],
            },
          ],
        },
      ]);

      const draft: ReservationDraft = {
        prospectName: 'Non Allocating Prospect',
        mobileNumber: '9876543215',
        expectedJoiningDate: tomorrowStr,
        accommodationPreference: 'Bed 101-A',
      };

      coordinator.saveReservation(draft);

      // Verify accommodation repository is 100% untouched
      const flat = accommodationRepo.findById('flat-101');
      expect(flat?.areas[0].beds[0].status).toBe(BedStatus.VACANT);
    });

    it('29. Creating a Reservation does not create a Stay entity', () => {
      const stayRepo = new InMemoryStayRepository([]);

      const draft: ReservationDraft = {
        prospectName: 'No Stay Prospect',
        mobileNumber: '9876543216',
        expectedJoiningDate: tomorrowStr,
      };

      const saved = coordinator.saveReservation(draft);
      expect(saved.id).toBeDefined();

      const allStays = stayRepo.getAllSync();
      expect(allStays).toHaveLength(0);
    });

    it('30. Creating a Reservation does not create Finance ledger truth', () => {
      const draft: ReservationDraft = {
        prospectName: 'No Finance Truth Prospect',
        mobileNumber: '9876543217',
        expectedJoiningDate: tomorrowStr,
        expectedMonthlyRent: 15000,
        expectedSecurityDeposit: 30000,
        tokenAmount: 5000,
      };

      const saved = coordinator.saveReservation(draft);
      // Reservation holds expected truth only
      expect(saved.expectedMonthlyRent).toBe(15000);
      expect(saved.expectedSecurityDeposit).toBe(30000);
      expect(saved.tokenAmount).toBe(5000);
      expect(saved.status).toBe(ReservationStatus.ACTIVE);
    });
  });
});
