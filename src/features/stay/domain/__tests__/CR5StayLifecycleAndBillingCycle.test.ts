import { describe, expect, it } from 'vitest';
import { Stay } from '../entities/Stay';
import { StayStatus } from '../valueObjects/StayStatus';
import { StayType } from '../valueObjects/StayType';

describe('CR-5 Stay Capability & Accommodation Foundation Hardening - Domain Unit Tests', () => {
  describe('Stay Lifecycle Transitions', () => {
    it('activates a PLANNED Stay upon physical check-in (PLANNED -> ACTIVE)', () => {
      const stay = new Stay({
        id: 'STAY-PLANNED-01',
        residentId: 'RES-001',
        stayType: StayType.REGULAR,
        status: StayStatus.PLANNED,
        checkInDate: '2026-05-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1'],
        agreedRent: 10000,
        agreedDeposit: 20000,
      });

      expect(stay.status).toBe(StayStatus.PLANNED);

      const projection = stay.activateStay({ effectiveDate: '2026-05-01', reason: 'Physical check-in' });

      expect(stay.status).toBe(StayStatus.ACTIVE);
      expect(projection.status).toBe(StayStatus.ACTIVE);

      const lastEvent = stay.businessEvents[stay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('STAY_ACTIVATED');
      expect(lastEvent.description).toBe('Physical check-in');
    });

    it('cancels a PLANNED Stay before occupancy (PLANNED -> CANCELLED)', () => {
      const stay = new Stay({
        id: 'STAY-PLANNED-02',
        residentId: 'RES-002',
        stayType: StayType.REGULAR,
        status: StayStatus.PLANNED,
        checkInDate: '2026-06-01',
        flatId: 'FLAT-102',
        allocatedBedIds: ['BED-B1'],
        agreedRent: 11000,
        agreedDeposit: 22000,
      });

      const projection = stay.cancelPlannedStay({ cancellationDate: '2026-05-25', reason: 'Resident cancelled booking' });

      expect(stay.status).toBe(StayStatus.CANCELLED);
      expect(projection.status).toBe(StayStatus.CANCELLED);
      expect(stay.activeBedAllocations).toHaveLength(0);

      const lastEvent = stay.businessEvents[stay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('STAY_CANCELLED');
    });

    it('places an ACTIVE Stay on Notice (ACTIVE -> ON_NOTICE)', () => {
      const stay = new Stay({
        id: 'STAY-ACTIVE-01',
        residentId: 'RES-003',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-01',
        flatId: 'FLAT-103',
        allocatedBedIds: ['BED-C1'],
        agreedRent: 9000,
        agreedDeposit: 18000,
      });

      const projection = stay.giveNotice({ noticeDate: '2026-04-01', expectedCheckoutDate: '2026-05-01' });

      expect(stay.status).toBe(StayStatus.ON_NOTICE);
      expect(projection.status).toBe(StayStatus.ON_NOTICE);
    });

    it('executes operational checkout from ACTIVE or ON_NOTICE (ACTIVE/ON_NOTICE -> CHECKED_OUT)', () => {
      const activeStay = new Stay({
        id: 'STAY-ACTIVE-02',
        residentId: 'RES-004',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-01',
        flatId: 'FLAT-104',
        allocatedBedIds: ['BED-D1'],
        agreedRent: 9500,
        agreedDeposit: 19000,
      });

      const projection = activeStay.processCheckout({ actualCheckoutDate: '2026-04-30', reason: 'Direct checkout' });
      expect(activeStay.status).toBe(StayStatus.CHECKED_OUT);
      expect(projection.status).toBe(StayStatus.CHECKED_OUT);
      expect(projection.activeBedIds).toEqual([]);
    });

    it('closes a CHECKED_OUT Stay (CHECKED_OUT -> CLOSED)', () => {
      const checkedOutStay = new Stay({
        id: 'STAY-CHECKED-01',
        residentId: 'RES-005',
        stayType: StayType.REGULAR,
        status: StayStatus.CHECKED_OUT,
        checkInDate: '2026-01-01',
        actualCheckoutDate: '2026-04-30',
        flatId: 'FLAT-105',
        allocatedBedIds: ['BED-E1'],
        agreedRent: 9000,
        agreedDeposit: 18000,
      });

      const projection = checkedOutStay.closeStay({ closedDate: '2026-05-05', reason: 'Final settlement complete' });

      expect(checkedOutStay.status).toBe(StayStatus.CLOSED);
      expect(projection.status).toBe(StayStatus.CLOSED);

      const lastEvent = checkedOutStay.businessEvents[checkedOutStay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('STAY_CLOSED');
    });

    it('enforces semantic distinction: CANCELLED != CLOSED and prevents invalid state transitions', () => {
      const plannedStay = new Stay({
        id: 'STAY-INVALID-01',
        residentId: 'RES-006',
        stayType: StayType.REGULAR,
        status: StayStatus.PLANNED,
        checkInDate: '2026-07-01',
      });

      // Cannot close a PLANNED stay directly
      expect(() => plannedStay.closeStay({ closedDate: '2026-07-01' })).toThrow(
        'Cannot close Stay with status PLANNED. Only CHECKED_OUT Stays can be closed.'
      );

      // Cannot activate a CANCELLED stay
      const cancelledStay = new Stay({
        id: 'STAY-INVALID-02',
        residentId: 'RES-007',
        stayType: StayType.REGULAR,
        status: StayStatus.CANCELLED,
        checkInDate: '2026-07-01',
      });

      expect(() => cancelledStay.activateStay()).toThrow(
        'Cannot activate Stay with status CANCELLED. Only PLANNED Stays can be activated.'
      );

      // Cannot activate a CLOSED stay
      const closedStay = new Stay({
        id: 'STAY-INVALID-03',
        residentId: 'RES-008',
        stayType: StayType.REGULAR,
        status: StayStatus.CLOSED,
        checkInDate: '2026-01-01',
      });

      expect(() => closedStay.activateStay()).toThrow(
        'Cannot activate Stay with status CLOSED. Only PLANNED Stays can be activated.'
      );
    });
  });

  describe('Billing Cycle Representation & History', () => {
    it('executes billing cycle change, preserving immutable checkInDate and recording full history', () => {
      const stay = new Stay({
        id: 'STAY-BILLING-01',
        residentId: 'RES-010',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-10',
        billingAnchorDay: 10,
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1'],
      });

      expect(stay.checkInDate).toBe('2026-01-10');
      expect(stay.billingAnchorDay).toBe(10);
      expect(stay.billingCycleRecords).toHaveLength(1);
      expect(stay.billingCycleRecords[0].billingAnchorDay).toBe(10);
      expect(stay.billingCycleRecords[0].effectiveTo).toBeUndefined();

      // Change billing anchor from 10th to 20th
      const projection = stay.changeBillingCycle({
        requestedBillingAnchor: 20,
        effectiveFrom: '2026-04-20',
        reason: 'Resident requested anchor change to 20th due to salary shift',
        financialAdjustmentReference: 'ADJ-2026-0099',
      });

      // IMMUTABLE checkInDate check
      expect(stay.checkInDate).toBe('2026-01-10');
      expect(stay.billingAnchorDay).toBe(20);
      expect(projection.billingAnchorDay).toBe(20);

      // Verify Billing Cycle History preservation
      expect(stay.billingCycleRecords).toHaveLength(2);
      expect(stay.billingCycleRecords[0].billingAnchorDay).toBe(10);
      expect(stay.billingCycleRecords[0].effectiveFrom).toBe('2026-01-10');
      expect(stay.billingCycleRecords[0].effectiveTo).toBe('2026-04-20');

      expect(stay.billingCycleRecords[1].billingAnchorDay).toBe(20);
      expect(stay.billingCycleRecords[1].effectiveFrom).toBe('2026-04-20');
      expect(stay.billingCycleRecords[1].effectiveTo).toBeUndefined();

      // Verify Billing Cycle Change record
      expect(stay.billingCycleChanges).toHaveLength(1);
      const change = stay.billingCycleChanges[0];
      expect(change.previousBillingAnchor).toBe(10);
      expect(change.requestedBillingAnchor).toBe(20);
      expect(change.effectiveFrom).toBe('2026-04-20');
      expect(change.reason).toBe('Resident requested anchor change to 20th due to salary shift');
      expect(change.status).toBe('EFFECTIVE');
      expect(change.financialAdjustmentReference).toBe('ADJ-2026-0099');

      // Verify Business Event
      const lastEvent = stay.businessEvents[stay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('BILLING_CYCLE_CHANGED');
      expect(lastEvent.metadata).toMatchObject({
        previousBillingAnchor: 10,
        requestedBillingAnchor: 20,
        effectiveFrom: '2026-04-20',
        financialAdjustmentReference: 'ADJ-2026-0099',
      });
    });

    it('supports multiple sequential billing cycle anchor changes over time', () => {
      const stay = new Stay({
        id: 'STAY-BILLING-02',
        residentId: 'RES-011',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-10',
        billingAnchorDay: 10,
      });

      // Change 1: 10 -> 20
      stay.changeBillingCycle({
        requestedBillingAnchor: 20,
        effectiveFrom: '2026-04-20',
        reason: 'First adjustment',
      });

      // Change 2: 20 -> 25
      stay.changeBillingCycle({
        requestedBillingAnchor: 25,
        effectiveFrom: '2026-09-25',
        reason: 'Second adjustment',
        financialAdjustmentReference: 'ADJ-2026-0150',
      });

      expect(stay.billingAnchorDay).toBe(25);
      expect(stay.checkInDate).toBe('2026-01-10'); // Must remain 10 Jan!
      expect(stay.billingCycleRecords).toHaveLength(3);

      expect(stay.billingCycleRecords[0].billingAnchorDay).toBe(10);
      expect(stay.billingCycleRecords[0].effectiveTo).toBe('2026-04-20');

      expect(stay.billingCycleRecords[1].billingAnchorDay).toBe(20);
      expect(stay.billingCycleRecords[1].effectiveTo).toBe('2026-09-25');

      expect(stay.billingCycleRecords[2].billingAnchorDay).toBe(25);
      expect(stay.billingCycleRecords[2].effectiveTo).toBeUndefined();

      expect(stay.billingCycleChanges).toHaveLength(2);
    });

    it('rejects invalid billing anchor day or changing billing cycle on checked-out/closed stays', () => {
      const activeStay = new Stay({
        id: 'STAY-BILLING-03',
        residentId: 'RES-012',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-10',
      });

      expect(() =>
        activeStay.changeBillingCycle({
          requestedBillingAnchor: 32,
          effectiveFrom: '2026-04-01',
          reason: 'Invalid anchor',
        })
      ).toThrow('Requested billing anchor day must be between 1 and 31.');

      const closedStay = new Stay({
        id: 'STAY-BILLING-04',
        residentId: 'RES-013',
        stayType: StayType.REGULAR,
        status: StayStatus.CLOSED,
        checkInDate: '2026-01-10',
      });

      expect(() =>
        closedStay.changeBillingCycle({
          requestedBillingAnchor: 15,
          effectiveFrom: '2026-04-01',
          reason: 'Change on closed stay',
        })
      ).toThrow('Cannot change billing cycle for a Stay with status CLOSED.');
    });
  });

  describe('Repeat Stay Isolation', () => {
    it('maintains independent billing history and anchor days for repeat stays of the same resident', () => {
      const residentId = 'RES-REPEAT-99';

      const stay1 = new Stay({
        id: 'STAY-REPEAT-01',
        residentId,
        stayType: StayType.REGULAR,
        status: StayStatus.CHECKED_OUT,
        checkInDate: '2025-01-10',
        actualCheckoutDate: '2025-12-31',
        billingAnchorDay: 10,
      });

      const stay2 = new Stay({
        id: 'STAY-REPEAT-02',
        residentId,
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-03-15',
        billingAnchorDay: 15,
      });

      // Modify stay 2 billing cycle
      stay2.changeBillingCycle({
        requestedBillingAnchor: 25,
        effectiveFrom: '2026-05-25',
        reason: 'Change for repeat stay',
      });

      expect(stay1.billingAnchorDay).toBe(10);
      expect(stay1.billingCycleRecords).toHaveLength(1);

      expect(stay2.billingAnchorDay).toBe(25);
      expect(stay2.billingCycleRecords).toHaveLength(2);
      expect(stay2.residentId).toBe(residentId);
      expect(stay1.residentId).toBe(residentId);
    });
  });
});
