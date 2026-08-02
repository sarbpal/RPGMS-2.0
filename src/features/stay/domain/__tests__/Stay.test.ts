import { describe, expect, it } from 'vitest';
import { Stay } from '../entities/Stay';
import { BedAllocation } from '../valueObjects/BedAllocation';
import { BusinessEvent } from '../valueObjects/BusinessEvent';
import { CommercialAgreement } from '../valueObjects/CommercialAgreement';
import { StayStatus } from '../valueObjects/StayStatus';
import { StayType } from '../valueObjects/StayType';

describe('Stay Aggregate Root (CR-3.1 Foundation)', () => {
  it('should instantiate Stay aggregate with defaults and derive backward-compatible accessors', () => {
    const stay = new Stay({
      id: 'STAY-001',
      residentId: 'RES-101',
      stayType: StayType.REGULAR,
      status: StayStatus.ACTIVE,
      checkInDate: '2026-01-01',
      flatId: 'FLAT-101',
      allocatedBedIds: ['BED-A1'],
      agreedRent: 10000,
      agreedDeposit: 20000,
    });

    expect(stay.id).toBe('STAY-001');
    expect(stay.residentId).toBe('RES-101');
    expect(stay.status).toBe(StayStatus.ACTIVE);
    expect(stay.flatId).toBe('FLAT-101');
    expect(stay.allocatedBedIds).toEqual(['BED-A1']);
    expect(stay.agreedRent).toBe(10000);
    expect(stay.agreedDeposit).toBe(20000);

    expect(stay.commercialAgreements).toHaveLength(1);
    expect(stay.bedAllocations).toHaveLength(1);
    expect(stay.businessEvents).toHaveLength(1);
  });

  it('should instantiate Stay aggregate with rich domain value objects', () => {
    const ca = new CommercialAgreement({
      id: 'CA-001',
      stayId: 'STAY-002',
      rent: 12000,
      securityDeposit: 24000,
      effectiveFrom: '2026-02-01',
      amendmentReason: 'Initial admission',
      status: 'ACTIVE',
    });

    const ba = new BedAllocation({
      id: 'BA-001',
      stayId: 'STAY-002',
      flatId: 'FLAT-202',
      bedId: 'BED-B2',
      allocatedFrom: '2026-02-01',
      status: 'ACTIVE',
    });

    const be = new BusinessEvent({
      id: 'BE-001',
      stayId: 'STAY-002',
      eventType: 'ADMISSION',
      timestamp: '2026-02-01',
      description: 'Admission complete',
    });

    const stay = new Stay({
      id: 'STAY-002',
      residentId: 'RES-102',
      stayType: StayType.REGULAR,
      status: StayStatus.ACTIVE,
      checkInDate: '2026-02-01',
      commercialAgreements: [ca],
      bedAllocations: [ba],
      businessEvents: [be],
    });

    expect(stay.agreedRent).toBe(12000);
    expect(stay.agreedDeposit).toBe(24000);
    expect(stay.flatId).toBe('FLAT-202');
    expect(stay.allocatedBedIds).toEqual(['BED-B2']);
    expect(stay.businessEvents).toHaveLength(1);
    expect(stay.businessEvents[0].eventType).toBe('ADMISSION');
  });

  it('should derive CurrentProjection from Stay aggregate API', () => {
    const stay = new Stay({
      id: 'STAY-003',
      residentId: 'RES-103',
      stayType: StayType.REGULAR,
      status: StayStatus.ON_NOTICE,
      checkInDate: '2026-03-01',
      flatId: 'FLAT-303',
      allocatedBedIds: ['BED-C1', 'BED-C2'],
      agreedRent: 15000,
      agreedDeposit: 30000,
    });

    const projection = stay.getCurrentProjection();

    expect(projection.stayId).toBe('STAY-003');
    expect(projection.residentId).toBe('RES-103');
    expect(projection.status).toBe(StayStatus.ON_NOTICE);
    expect(projection.flatId).toBe('FLAT-303');
    expect(projection.activeBedIds).toEqual(['BED-C1', 'BED-C2']);
    expect(projection.currentRent).toBe(15000);
    expect(projection.currentDeposit).toBe(30000);
    expect(projection.noticeStatus).toBe('ON_NOTICE');
  });

  describe('Accommodation Operations & History Preservation (CR-3.3)', () => {
    it('allocates an additional bed within the same flat, preserves history, and logs BusinessEvent', () => {
      const stay = new Stay({
        id: 'STAY-101',
        residentId: 'RES-201',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-03-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1'],
        agreedRent: 8000,
        agreedDeposit: 6500,
      });

      const projection = stay.allocateAdditionalBed({
        flatId: 'FLAT-101',
        bedId: 'BED-A2',
        effectiveFrom: '2026-03-10',
        reason: 'Added second bed for sibling',
      });

      expect(projection.activeBedIds).toEqual(['BED-A1', 'BED-A2']);
      expect(stay.allocatedBedIds).toEqual(['BED-A1', 'BED-A2']);
      expect(stay.bedAllocations).toHaveLength(2);
      expect(stay.bedAllocations[0].status).toBe('ACTIVE');
      expect(stay.bedAllocations[1].status).toBe('ACTIVE');

      expect(stay.businessEvents).toHaveLength(2); // Initial ADMISSION + ADDITIONAL_BED_ALLOCATED
      const lastEvent = stay.businessEvents[stay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('ADDITIONAL_BED_ALLOCATED');
      expect(lastEvent.description).toContain('Added second bed for sibling');
    });

    it('rejects additional bed allocation in a different flat', () => {
      const stay = new Stay({
        id: 'STAY-102',
        residentId: 'RES-202',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-03-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1'],
        agreedRent: 8000,
        agreedDeposit: 6500,
      });

      expect(() =>
        stay.allocateAdditionalBed({
          flatId: 'FLAT-202',
          bedId: 'BED-B1',
          effectiveFrom: '2026-03-10',
        })
      ).toThrow('All active bed allocations for a Stay must belong to the same Flat');
    });

    it('releases a bed when Stay has multiple active beds, preserving historical allocation record', () => {
      const stay = new Stay({
        id: 'STAY-103',
        residentId: 'RES-203',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-03-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1', 'BED-A2'],
        agreedRent: 16000,
        agreedDeposit: 13000,
      });

      const projection = stay.releaseBed({
        bedId: 'BED-A2',
        effectiveUntil: '2026-03-15',
        reason: 'Released second bed',
      });

      expect(projection.activeBedIds).toEqual(['BED-A1']);
      expect(stay.allocatedBedIds).toEqual(['BED-A1']);
      expect(stay.bedAllocations).toHaveLength(2); // 1 ACTIVE + 1 RELEASED

      const releasedAlloc = stay.bedAllocations.find((ba) => ba.bedId === 'BED-A2');
      expect(releasedAlloc).toBeDefined();
      expect(releasedAlloc?.status).toBe('RELEASED');
      expect(releasedAlloc?.allocatedUntil).toBe('2026-03-15');

      const lastEvent = stay.businessEvents[stay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('BED_RELEASED');
    });

    it('rejects releasing the last active bed of an active Stay', () => {
      const stay = new Stay({
        id: 'STAY-104',
        residentId: 'RES-204',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-03-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1'],
        agreedRent: 8000,
        agreedDeposit: 6500,
      });

      expect(() =>
        stay.releaseBed({
          bedId: 'BED-A1',
          effectiveUntil: '2026-03-20',
        })
      ).toThrow('A Stay must retain at least 1 active Bed Allocation while active');
    });

    it('executes atomic bed transfer within the same flat, closing previous allocation and creating new allocation', () => {
      const stay = new Stay({
        id: 'STAY-105',
        residentId: 'RES-205',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-03-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1'],
        agreedRent: 8000,
        agreedDeposit: 6500,
      });

      const projection = stay.transferBed({
        fromBedId: 'BED-A1',
        toBedId: 'BED-A2',
        effectiveDate: '2026-03-20',
        reason: 'Moved to window bed',
      });

      expect(projection.activeBedIds).toEqual(['BED-A2']);
      expect(stay.allocatedBedIds).toEqual(['BED-A2']);
      expect(stay.bedAllocations).toHaveLength(2);

      const oldAlloc = stay.bedAllocations.find((ba) => ba.bedId === 'BED-A1');
      const newAlloc = stay.bedAllocations.find((ba) => ba.bedId === 'BED-A2');
      expect(oldAlloc?.status).toBe('RELEASED');
      expect(oldAlloc?.allocatedUntil).toBe('2026-03-20');
      expect(newAlloc?.status).toBe('ACTIVE');
      expect(newAlloc?.allocatedFrom).toBe('2026-03-20');

      const lastEvent = stay.businessEvents[stay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('BED_TRANSFER');
      expect(lastEvent.description).toContain('Moved to window bed');
    });

    it('executes atomic flat transfer, closing all previous flat allocations and creating new flat allocations', () => {
      const stay = new Stay({
        id: 'STAY-106',
        residentId: 'RES-206',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-03-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1', 'BED-A2'],
        agreedRent: 16000,
        agreedDeposit: 13000,
      });

      const projection = stay.transferFlat({
        newFlatId: 'FLAT-202',
        newBedIds: ['BED-B1', 'BED-B2'],
        effectiveDate: '2026-04-01',
        reason: 'Relocated to 2nd floor flat',
      });

      expect(projection.flatId).toBe('FLAT-202');
      expect(projection.activeBedIds).toEqual(['BED-B1', 'BED-B2']);
      expect(stay.flatId).toBe('FLAT-202');
      expect(stay.allocatedBedIds).toEqual(['BED-B1', 'BED-B2']);

      expect(stay.bedAllocations).toHaveLength(4); // 2 RELEASED in FLAT-101 + 2 ACTIVE in FLAT-202
      const flat101Allocs = stay.bedAllocations.filter((ba) => ba.flatId === 'FLAT-101');
      const flat202Allocs = stay.bedAllocations.filter((ba) => ba.flatId === 'FLAT-202');

      expect(flat101Allocs.every((ba) => ba.status === 'RELEASED')).toBe(true);
      expect(flat202Allocs.every((ba) => ba.status === 'ACTIVE')).toBe(true);

      const lastEvent = stay.businessEvents[stay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('FLAT_TRANSFER');
      expect(lastEvent.description).toContain('Relocated to 2nd floor flat');
    });
  });

  describe('Commercial Operations & History Preservation (CR-3.4)', () => {
    it('revises rent, closes previous agreement, preserves history, and logs RENT_REVISED BusinessEvent', () => {
      const stay = new Stay({
        id: 'STAY-301',
        residentId: 'RES-301',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1'],
        agreedRent: 8000,
        agreedDeposit: 6500,
      });

      const projection = stay.reviseRent({
        newRent: 8500,
        effectiveDate: '2026-04-01',
        reason: 'Annual 6% Rent Escalation',
      });

      expect(projection.currentRent).toBe(8500);
      expect(projection.currentDeposit).toBe(6500);
      expect(stay.agreedRent).toBe(8500);
      expect(stay.agreedDeposit).toBe(6500);

      // Verify Commercial Agreement History
      expect(stay.commercialAgreements).toHaveLength(2);

      const previousAgreement = stay.commercialAgreements[0];
      const activeAgreement = stay.commercialAgreements[1];

      expect(previousAgreement.status).toBe('HISTORICAL');
      expect(previousAgreement.rent).toBe(8000);
      expect(previousAgreement.effectiveUntil).toBe('2026-04-01');

      expect(activeAgreement.status).toBe('ACTIVE');
      expect(activeAgreement.rent).toBe(8500);
      expect(activeAgreement.securityDeposit).toBe(6500);
      expect(activeAgreement.effectiveFrom).toBe('2026-04-01');
      expect(activeAgreement.amendmentReason).toBe('Annual 6% Rent Escalation');

      // Verify Business Event
      const lastEvent = stay.businessEvents[stay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('RENT_REVISED');
      expect(lastEvent.description).toBe('Annual 6% Rent Escalation');
      expect(lastEvent.metadata).toMatchObject({
        previousRent: 8000,
        newRent: 8500,
        effectiveDate: '2026-04-01',
      });
    });

    it('revises security deposit, closes previous agreement, preserves history, and logs DEPOSIT_REVISED BusinessEvent', () => {
      const stay = new Stay({
        id: 'STAY-302',
        residentId: 'RES-302',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1'],
        agreedRent: 8000,
        agreedDeposit: 6500,
      });

      const projection = stay.reviseDeposit({
        newDeposit: 8000,
        effectiveDate: '2026-04-01',
        reason: 'Deposit top-up for AC room upgrade',
      });

      expect(projection.currentDeposit).toBe(8000);
      expect(projection.currentRent).toBe(8000);

      expect(stay.commercialAgreements).toHaveLength(2);
      expect(stay.commercialAgreements[0].status).toBe('HISTORICAL');
      expect(stay.commercialAgreements[0].securityDeposit).toBe(6500);
      expect(stay.commercialAgreements[0].effectiveUntil).toBe('2026-04-01');

      expect(stay.commercialAgreements[1].status).toBe('ACTIVE');
      expect(stay.commercialAgreements[1].securityDeposit).toBe(8000);
      expect(stay.commercialAgreements[1].rent).toBe(8000);

      const lastEvent = stay.businessEvents[stay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('DEPOSIT_REVISED');
    });

    it('revises both rent and deposit via reviseCommercialTerms in a single atomic domain action', () => {
      const stay = new Stay({
        id: 'STAY-303',
        residentId: 'RES-303',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1'],
        agreedRent: 8000,
        agreedDeposit: 6500,
      });

      const projection = stay.reviseCommercialTerms({
        newRent: 9500,
        newDeposit: 9500,
        effectiveDate: '2026-05-01',
        reason: 'Upgraded to Master Suite with attached bath',
      });

      expect(projection.currentRent).toBe(9500);
      expect(projection.currentDeposit).toBe(9500);

      expect(stay.commercialAgreements).toHaveLength(2);
      expect(stay.commercialAgreements[1].status).toBe('ACTIVE');
      expect(stay.commercialAgreements[1].rent).toBe(9500);
      expect(stay.commercialAgreements[1].securityDeposit).toBe(9500);

      const lastEvent = stay.businessEvents[stay.businessEvents.length - 1];
      expect(lastEvent.eventType).toBe('COMMERCIAL_TERMS_REVISED');
    });

    it('enforces invariants: rejects negative/zero rent, negative deposit, or missing amendment reason', () => {
      const stay = new Stay({
        id: 'STAY-304',
        residentId: 'RES-304',
        stayType: StayType.REGULAR,
        status: StayStatus.ACTIVE,
        checkInDate: '2026-01-01',
        flatId: 'FLAT-101',
        allocatedBedIds: ['BED-A1'],
        agreedRent: 8000,
        agreedDeposit: 6500,
      });

      // Invalid rent
      expect(() =>
        stay.reviseRent({
          newRent: 0,
          effectiveDate: '2026-04-01',
          reason: 'Free rent',
        })
      ).toThrow('Revised monthly rent must be a positive number greater than 0');

      // Invalid deposit
      expect(() =>
        stay.reviseDeposit({
          newDeposit: -500,
          effectiveDate: '2026-04-01',
          reason: 'Negative deposit',
        })
      ).toThrow('Revised security deposit must be a non-negative number');

      // Missing reason
      expect(() =>
        stay.reviseRent({
          newRent: 9000,
          effectiveDate: '2026-04-01',
          reason: '',
        })
      ).toThrow('An explicit amendment reason is required for commercial term revision');
    });
  });
});
