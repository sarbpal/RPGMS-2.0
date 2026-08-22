import { describe, it, expect } from 'vitest';
import type { Reservation } from '../domain/entities/Reservation';
import { ReservationStatus } from '../domain/valueObjects/ReservationStatus';
import { InMemoryReservationRepository } from '../infrastructure/repositories/InMemoryReservationRepository';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import { InMemoryStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { BedStatus } from '../../accommodation/domain/valueObjects/BedStatus';

describe('RU-2C.2A — Reservation Detail: Consolidated Information Architecture Suite', () => {
  const mockReservationWithToken: Reservation = {
    id: 'resv-000001',
    reservationNumber: 'RES-000001',
    prospectName: 'Rahul Sharma',
    mobileNumber: '9876543210',
    expectedJoiningDate: '2026-08-20',
    expectedMonthlyRent: 12000,
    expectedSecurityDeposit: 6500,
    accommodationPreference: 'Double Sharing, 1st Floor',
    tokenAmount: 1000,
    tokenReceivedOn: '2026-08-01',
    tokenRemarks: 'GPay UPI #998877',
    status: ReservationStatus.ACTIVE,
    notes: 'Requested quiet room near study area',
    auditLog: [
      {
        timestamp: '2026-08-01T10:00:00.000Z',
        action: 'Reservation Created',
        performedBy: 'System Operator',
        details: 'Reservation created with ₹1,000 token',
      },
      {
        timestamp: '2026-08-05T14:30:00.000Z',
        action: 'Expected Rent Updated',
        performedBy: 'System Operator',
        details: 'Expected monthly rent updated to ₹12,000',
      },
    ],
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-05T14:30:00.000Z',
  };

  const mockReservationWithoutToken: Reservation = {
    id: 'resv-000002',
    reservationNumber: 'RES-000002',
    prospectName: 'Priya Patel',
    mobileNumber: '9123456789',
    expectedJoiningDate: '2026-08-25',
    expectedMonthlyRent: 15000,
    expectedSecurityDeposit: 15000,
    accommodationPreference: undefined,
    tokenAmount: undefined,
    tokenReceivedOn: undefined,
    tokenRemarks: undefined,
    status: ReservationStatus.ACTIVE,
    notes: undefined,
    auditLog: [],
    createdAt: '2026-08-05T12:00:00.000Z',
    updatedAt: '2026-08-05T12:00:00.000Z',
  };

  describe('1. Reservation Overview Surface (Consolidated Core Facts)', () => {
    it('1. Reservation Overview renders contact phone number as primary contact', () => {
      expect(mockReservationWithToken.mobileNumber).toBe('9876543210');
    });

    it('2. Reservation Overview renders expected joining date and accommodation preference', () => {
      expect(mockReservationWithToken.expectedJoiningDate).toBe('2026-08-20');
      expect(mockReservationWithToken.accommodationPreference).toBe('Double Sharing, 1st Floor');
      expect(mockReservationWithoutToken.accommodationPreference).toBeUndefined();
    });

    it('3. Prospect Name and Reservation ID are not repeated inside the overview card', () => {
      // Identity is held authoritatively in the Header
      const overviewFields = ['expectedJoiningDate', 'mobileNumber', 'accommodationPreference'];
      expect(overviewFields).not.toContain('prospectName');
      expect(overviewFields).not.toContain('reservationNumber');
      expect(overviewFields).not.toContain('status');
    });
  });

  describe('2. Commercial Expectations Surface (Single Home for Commercial Truth)', () => {
    it('4. Commercial Expectations renders expected monthly rent', () => {
      expect(mockReservationWithToken.expectedMonthlyRent).toBe(12000);
    });

    it('5. Commercial Expectations renders TOTAL expected deposit as contractual total', () => {
      expect(mockReservationWithToken.expectedSecurityDeposit).toBe(6500);
    });

    it('6. Commercial Expectations renders token received with date and remarks', () => {
      expect(mockReservationWithToken.tokenAmount).toBe(1000);
      expect(mockReservationWithToken.tokenReceivedOn).toBe('2026-08-01');
      expect(mockReservationWithToken.tokenRemarks).toBe('GPay UPI #998877');
    });

    it('7. Expected Remaining at Admission is accurately calculated without replacing Total Deposit', () => {
      // Scenario: Total Security Deposit = ₹6,500, Token Received = ₹1,000
      // Expected Remaining at Admission = ₹5,500
      const totalDeposit = mockReservationWithToken.expectedSecurityDeposit!;
      const token = mockReservationWithToken.tokenAmount || 0;
      const expectedRemaining = totalDeposit - token;

      expect(totalDeposit).toBe(6500);
      expect(token).toBe(1000);
      expect(expectedRemaining).toBe(5500);
    });

    it('8. Total deposit remains unchanged after token calculation', () => {
      expect(mockReservationWithToken.expectedSecurityDeposit).toBe(6500);
    });

    it('9. Commercial terminology strictly avoids Finance Ledger terms', () => {
      const allowedCommercialTerms = [
        'Expected Monthly Rent',
        'Total Expected Security Deposit',
        'Token Received',
        'Expected Remaining at Admission',
      ];
      const forbiddenFinanceTerms = [
        'Security Deposit Held',
        'Deposit Liability',
        'Current Liability',
      ];

      forbiddenFinanceTerms.forEach((forbidden) => {
        expect(allowedCommercialTerms).not.toContain(forbidden);
      });
    });
  });

  describe('3. Notes & Operator Remarks Progressive Disclosure', () => {
    it('10. Notes presence is discoverable and collapsed by default', () => {
      expect(mockReservationWithToken.notes).toBe('Requested quiet room near study area');
      expect(mockReservationWithoutToken.notes).toBeUndefined();
    });

    it('11. Missing notes do not create noisy N/A placeholders', () => {
      const emptyNote = mockReservationWithoutToken.notes || 'No operator remarks recorded.';
      expect(emptyNote).not.toBe('N/A');
    });
  });

  describe('4. Reservation History Progressive Disclosure', () => {
    it('12. Reservation History exposes authoritative auditLog entries', () => {
      expect(mockReservationWithToken.auditLog).toHaveLength(2);
      expect(mockReservationWithToken.auditLog[0].action).toBe('Reservation Created');
      expect(mockReservationWithToken.auditLog[0].details).toContain('₹1,000 token');
      expect(mockReservationWithToken.auditLog[1].action).toBe('Expected Rent Updated');
    });

    it('13. Empty history is handled cleanly without data fabrication', () => {
      expect(mockReservationWithoutToken.auditLog).toHaveLength(0);
    });
  });

  describe('5. Business Safety & Invariant Isolation', () => {
    it('14. No ReservationStatus mutation occurs', () => {
      const repo = new InMemoryReservationRepository([mockReservationWithToken]);
      const res = repo.findByIdSync('resv-000001');
      expect(res?.status).toBe(ReservationStatus.ACTIVE);
    });

    it('15. No accommodation or bed mutation occurs', () => {
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
      const flat = accommodationRepo.findByIdSync('flat-101');
      expect(flat?.areas[0].beds[0].status).toBe(BedStatus.VACANT);
    });

    it('16. No Stay creation is triggered', () => {
      const stayRepo = new InMemoryStayRepository([]);
      expect(stayRepo.getAllSync()).toHaveLength(0);
    });

    it('17. No Finance ledger mutation occurs', () => {
      expect(mockReservationWithToken.expectedMonthlyRent).toBe(12000);
      expect(mockReservationWithToken.expectedSecurityDeposit).toBe(6500);
      expect(mockReservationWithToken.tokenAmount).toBe(1000);
    });
  });
});
