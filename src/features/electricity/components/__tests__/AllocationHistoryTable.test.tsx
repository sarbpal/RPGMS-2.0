import { describe, it, expect } from 'vitest';
import { AllocationHistoryTable } from '../AllocationHistoryTable';
import { ElectricityAllocation } from '../../domain/entities/ElectricityAllocation';
import { ElectricityBill } from '../../domain/entities/ElectricityBill';

describe('Stage 4 — AllocationHistoryTable Unit Tests', () => {
  it('instantiates AllocationHistoryTable component cleanly', () => {
    expect(typeof AllocationHistoryTable).toBe('function');
  });

  it('structures confirmed historical allocation audit items', () => {
    const mockBill = new ElectricityBill({
      id: 'bill-hist-01',
      flatId: 'flat-101',
      supplierName: 'BSES Rajdhani',
      supplierBillNumber: 'INV-BSES-88',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
      supplierAmount: 4000,
      status: 'CONFIRMED',
    });

    const mockAllocation = new ElectricityAllocation({
      id: 'alloc-hist-01',
      billId: 'bill-hist-01',
      flatId: 'flat-101',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
      totalSupplierAmount: 4000,
      totalPotentialShares: 2,
      totalSelectedShares: 2,
      amountPerShare: 2000,
      remainderPaise: 0,
      allocationMethod: 'SHARE_BASED',
      status: 'CONFIRMED',
      allocationOutcome: 'RESIDENT_ALLOCATED',
      confirmedBy: 'op-admin-01',
      confirmedAt: '2026-07-01T10:00:00.000Z',
      participants: [
        {
          id: 'alloc-hist-01_stay-01',
          allocationId: 'alloc-hist-01',
          stayId: 'stay-01',
          residentId: 'res-01',
          residentCode: 'R-001',
          residentNameSnapshot: 'Vikas Patel',
          flatId: 'flat-101',
          potentialShares: 2,
          selectedShares: 2,
          allocatedAmount: 4000,
          financeBillId: 'fbill-9988',
        },
      ],
      dataQualityIssues: [],
    });

    const item = { allocation: mockAllocation, bill: mockBill };
    expect(item.allocation.allocationOutcome).toBe('RESIDENT_ALLOCATED');
    expect(item.bill?.supplierBillNumber).toBe('INV-BSES-88');
    expect(item.allocation.participants[0].financeBillId).toBe('fbill-9988');
  });

  it('handles REVERSED historical allocation audit items and metadata correctly', () => {
    const mockBill = new ElectricityBill({
      id: 'bill-rev-01',
      flatId: 'flat-101',
      supplierName: 'BSES Rajdhani',
      supplierBillNumber: 'INV-BSES-89',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
      supplierAmount: 4000,
      status: 'CONFIRMED',
    });

    const mockAllocation = new ElectricityAllocation({
      id: 'alloc-rev-01',
      billId: 'bill-rev-01',
      flatId: 'flat-101',
      periodStart: '2026-06-01',
      periodEnd: '2026-06-30',
      totalSupplierAmount: 4000,
      totalPotentialShares: 2,
      totalSelectedShares: 2,
      amountPerShare: 2000,
      remainderPaise: 0,
      allocationMethod: 'SHARE_BASED',
      status: 'CONFIRMED',
      allocationOutcome: 'RESIDENT_ALLOCATED',
      confirmedBy: 'op-admin-01',
      confirmedAt: '2026-07-01T10:00:00.000Z',
    });

    mockAllocation.reverse('sup-supervisor-01', 'rev_alloc-rev-01', 'Wrong billing period entered');

    const item = { allocation: mockAllocation, bill: mockBill };
    expect(item.bill?.id).toBe('bill-rev-01');
    expect(mockAllocation.status).toBe('REVERSED');
    expect(mockAllocation.reversedBy).toBe('sup-supervisor-01');
    expect(mockAllocation.reversalReason).toBe('Wrong billing period entered');
    expect(mockAllocation.reversalReferenceId).toBe('rev_alloc-rev-01');
  });
});
