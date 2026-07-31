import { describe, it, expect } from 'vitest';
import {
  canBlockBed,
  executeBlockBed,
  canUnblockBed,
  executeUnblockBed,
  canStartMaintenance,
  executeStartMaintenance,
  canCompleteMaintenance,
  executeCompleteMaintenance,
} from '../bedRules';
import { createMockBed } from '../../../test/fixtures/accommodationFixtures';
import { BedStatus } from '../../valueObjects/BedStatus';

describe('bedRules Domain Module', () => {
  describe('Block Bed Operations', () => {
    it('allows blocking a VACANT bed', () => {
      const bed = createMockBed({ status: BedStatus.VACANT });
      const check = canBlockBed(bed);

      expect(check.allowed).toBe(true);

      const blockedBed = executeBlockBed(bed);
      expect(blockedBed.status).toBe(BedStatus.BLOCKED);
    });

    it('allows blocking a MAINTENANCE bed', () => {
      const bed = createMockBed({ status: BedStatus.MAINTENANCE });
      const check = canBlockBed(bed);

      expect(check.allowed).toBe(true);

      const blockedBed = executeBlockBed(bed);
      expect(blockedBed.status).toBe(BedStatus.BLOCKED);
    });

    it('prevents blocking an OCCUPIED bed', () => {
      const bed = createMockBed({ status: BedStatus.OCCUPIED, residentName: 'Jane Doe' });
      const check = canBlockBed(bed);

      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('occupied by a resident');
      expect(() => executeBlockBed(bed)).toThrow(check.reason);
    });

    it('prevents blocking an ON_NOTICE bed', () => {
      const bed = createMockBed({ status: BedStatus.ON_NOTICE, residentName: 'John Doe' });
      const check = canBlockBed(bed);

      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('occupied by a resident');
    });

    it('prevents blocking a RESERVED bed', () => {
      const bed = createMockBed({ status: BedStatus.RESERVED });
      const check = canBlockBed(bed);

      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('reserved');
    });

    it('prevents blocking an already BLOCKED bed', () => {
      const bed = createMockBed({ status: BedStatus.BLOCKED });
      const check = canBlockBed(bed);

      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('already blocked');
    });
  });

  describe('Unblock Bed Operations', () => {
    it('allows unblocking a BLOCKED bed', () => {
      const bed = createMockBed({ status: BedStatus.BLOCKED });
      const check = canUnblockBed(bed);

      expect(check.allowed).toBe(true);

      const unblockedBed = executeUnblockBed(bed);
      expect(unblockedBed.status).toBe(BedStatus.VACANT);
    });

    it('prevents unblocking a non-BLOCKED bed', () => {
      const bed = createMockBed({ status: BedStatus.VACANT });
      const check = canUnblockBed(bed);

      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('not currently blocked');
      expect(() => executeUnblockBed(bed)).toThrow(check.reason);
    });
  });

  describe('Start Bed Maintenance Operations', () => {
    it('allows starting maintenance on a VACANT bed', () => {
      const bed = createMockBed({ status: BedStatus.VACANT });
      const check = canStartMaintenance(bed);

      expect(check.allowed).toBe(true);

      const maintenanceBed = executeStartMaintenance(bed);
      expect(maintenanceBed.status).toBe(BedStatus.MAINTENANCE);
    });

    it('allows starting maintenance on a BLOCKED bed', () => {
      const bed = createMockBed({ status: BedStatus.BLOCKED });
      const check = canStartMaintenance(bed);

      expect(check.allowed).toBe(true);

      const maintenanceBed = executeStartMaintenance(bed);
      expect(maintenanceBed.status).toBe(BedStatus.MAINTENANCE);
    });

    it('prevents starting maintenance on an OCCUPIED or ON_NOTICE bed', () => {
      const occupiedBed = createMockBed({ status: BedStatus.OCCUPIED });
      expect(canStartMaintenance(occupiedBed).allowed).toBe(false);

      const onNoticeBed = createMockBed({ status: BedStatus.ON_NOTICE });
      expect(canStartMaintenance(onNoticeBed).allowed).toBe(false);

      expect(() => executeStartMaintenance(occupiedBed)).toThrow();
    });

    it('prevents starting maintenance on an already MAINTENANCE bed', () => {
      const bed = createMockBed({ status: BedStatus.MAINTENANCE });
      const check = canStartMaintenance(bed);

      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('already under maintenance');
    });
  });

  describe('Complete Bed Maintenance Operations', () => {
    it('allows completing maintenance on a MAINTENANCE bed', () => {
      const bed = createMockBed({ status: BedStatus.MAINTENANCE });
      const check = canCompleteMaintenance(bed);

      expect(check.allowed).toBe(true);

      const vacantBed = executeCompleteMaintenance(bed);
      expect(vacantBed.status).toBe(BedStatus.VACANT);
    });

    it('prevents completing maintenance on a non-MAINTENANCE bed', () => {
      const bed = createMockBed({ status: BedStatus.VACANT });
      const check = canCompleteMaintenance(bed);

      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('not currently under maintenance');
      expect(() => executeCompleteMaintenance(bed)).toThrow(check.reason);
    });
  });
});
