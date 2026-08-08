import { describe, it, expect } from 'vitest';
import { ElectricityBill } from '../ElectricityBill';
import { ElectricityAllocation } from '../ElectricityAllocation';
import { AllocationParticipant } from '../../valueObjects/AllocationParticipant';

describe('Stage 1 — Electricity Domain Entity & Aggregate Tests', () => {
  describe('ElectricityBill', () => {
    it('creates ElectricityBill aggregate with DRAFT status', () => {
      const bill = new ElectricityBill({
        id: 'ebill-101',
        supplierName: 'TPDDL Electricity',
        supplierBillNumber: 'INV-2026-99',
        flatId: 'flat-101',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        billDate: '2026-08-01',
        supplierAmount: 12500.50,
      });

      expect(bill.id).toBe('ebill-101');
      expect(bill.supplierAmount).toBe(12500.50);
      expect(bill.status).toBe('DRAFT');
    });

    it('enforces constructor invariants and throws on invalid inputs', () => {
      expect(() => new ElectricityBill({
        id: '',
        supplierName: 'TPDDL',
        supplierBillNumber: '123',
        flatId: 'flat-101',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        supplierAmount: 100,
      })).toThrow('valid id');

      expect(() => new ElectricityBill({
        id: 'b1',
        supplierName: 'TPDDL',
        supplierBillNumber: '123',
        flatId: 'flat-101',
        periodStart: '2026-07-31',
        periodEnd: '2026-07-01',
        supplierAmount: 100,
      })).toThrow('cannot precede periodStart');
    });
  });

  describe('ElectricityAllocation & AllocationParticipant', () => {
    it('creates ElectricityAllocation in DRAFT status with selectedShares = 0 keeping outcome undefined', () => {
      const participant = new AllocationParticipant({
        id: 'apart-1',
        allocationId: 'alloc-101',
        stayId: 'stay-01',
        residentId: 'res-01',
        residentCode: 'R-001',
        residentNameSnapshot: 'John Doe',
        flatId: 'flat-101',
        potentialShares: 2,
        selectedShares: 0,
        allocatedAmount: 0,
      });

      const allocation = new ElectricityAllocation({
        id: 'alloc-101',
        billId: 'ebill-101',
        flatId: 'flat-101',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        totalSupplierAmount: 10000,
        totalPotentialShares: 2,
        totalSelectedShares: 0,
        amountPerShare: 0,
        remainderPaise: 0,
        participants: [participant],
      });

      expect(allocation.status).toBe('DRAFT');
      // selectedShares = 0 in draft does NOT automatically set OWNER_ABSORBED
      expect(allocation.allocationOutcome).toBeUndefined();
      expect(allocation.ownerAbsorbedAmount).toBe(0);
    });

    it('explicitly confirms resident allocation when totalSelectedShares > 0', () => {
      const participant = new AllocationParticipant({
        id: 'apart-1',
        allocationId: 'alloc-101',
        stayId: 'stay-01',
        residentId: 'res-01',
        residentCode: 'R-001',
        residentNameSnapshot: 'John Doe',
        flatId: 'flat-101',
        potentialShares: 1,
        selectedShares: 1,
        allocatedAmount: 10000,
      });

      const allocation = new ElectricityAllocation({
        id: 'alloc-101',
        billId: 'ebill-101',
        flatId: 'flat-101',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        totalSupplierAmount: 10000,
        totalPotentialShares: 1,
        totalSelectedShares: 1,
        amountPerShare: 10000,
        remainderPaise: 0,
        participants: [participant],
      });

      allocation.confirm('Operator Admin');

      expect(allocation.status).toBe('CONFIRMED');
      expect(allocation.allocationOutcome).toBe('RESIDENT_ALLOCATED');
      expect(allocation.confirmedBy).toBe('Operator Admin');
      expect(allocation.confirmedAt).toBeDefined();
    });

    it('explicitly confirms OWNER_ABSORBED when totalSelectedShares === 0 and operator confirms', () => {
      const participant = new AllocationParticipant({
        id: 'apart-1',
        allocationId: 'alloc-101',
        stayId: 'stay-01',
        residentId: 'res-01',
        residentCode: 'R-001',
        residentNameSnapshot: 'John Doe',
        flatId: 'flat-101',
        potentialShares: 2,
        selectedShares: 0,
        allocatedAmount: 0,
      });

      const allocation = new ElectricityAllocation({
        id: 'alloc-101',
        billId: 'ebill-101',
        flatId: 'flat-101',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        totalSupplierAmount: 10000,
        totalPotentialShares: 2,
        totalSelectedShares: 0,
        amountPerShare: 0,
        remainderPaise: 0,
        participants: [participant],
      });

      allocation.confirmOwnerAbsorbed('Operator Manager');

      expect(allocation.status).toBe('CONFIRMED');
      expect(allocation.allocationOutcome).toBe('OWNER_ABSORBED');
      expect(allocation.ownerAbsorbedAmount).toBe(10000);
      expect(allocation.confirmedBy).toBe('Operator Manager');
    });

    it('prevents confirming standard allocation with totalSelectedShares === 0 via confirm()', () => {
      const allocation = new ElectricityAllocation({
        id: 'alloc-102',
        billId: 'ebill-102',
        flatId: 'flat-101',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        totalSupplierAmount: 5000,
        totalPotentialShares: 1,
        totalSelectedShares: 0,
        amountPerShare: 0,
        remainderPaise: 0,
      });

      expect(() => allocation.confirm('Operator Admin')).toThrow('confirmOwnerAbsorbed()');
    });

    it('prevents confirmOwnerAbsorbed() when totalSelectedShares > 0', () => {
      const allocation = new ElectricityAllocation({
        id: 'alloc-103',
        billId: 'ebill-103',
        flatId: 'flat-101',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        totalSupplierAmount: 5000,
        totalPotentialShares: 1,
        totalSelectedShares: 1,
        amountPerShare: 5000,
        remainderPaise: 0,
      });

      expect(() => allocation.confirmOwnerAbsorbed('Operator Admin')).toThrow('requires totalSelectedShares to be 0');
    });

    it('throws error when trying to confirm an already CONFIRMED allocation', () => {
      const allocation = new ElectricityAllocation({
        id: 'alloc-104',
        billId: 'ebill-104',
        flatId: 'flat-101',
        periodStart: '2026-07-01',
        periodEnd: '2026-07-31',
        totalSupplierAmount: 5000,
        totalPotentialShares: 1,
        totalSelectedShares: 1,
        amountPerShare: 5000,
        remainderPaise: 0,
      });

      allocation.confirm('Admin');
      expect(() => allocation.confirm('Admin')).toThrow('already CONFIRMED');
    });
  });
});
