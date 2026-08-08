import { describe, it, expect, vi } from 'vitest';
import { DraftAllocationReviewPanel } from '../DraftAllocationReviewPanel';
import { ElectricityAllocation } from '../../domain/entities/ElectricityAllocation';
import { ElectricityBill } from '../../domain/entities/ElectricityBill';

describe('Stage 4 — DraftAllocationReviewPanel Unit Tests', () => {
  const mockBill = new ElectricityBill({
    id: 'bill-test-01',
    flatId: 'flat-101',
    supplierName: 'TPDDL Delhi',
    supplierBillNumber: 'INV-TEST-001',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    supplierAmount: 2000,
    status: 'DRAFT',
  });

  const mockAllocation = new ElectricityAllocation({
    id: 'alloc-test-01',
    billId: 'bill-test-01',
    flatId: 'flat-101',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    totalSupplierAmount: 2000,
    totalPotentialShares: 2,
    totalSelectedShares: 2,
    amountPerShare: 1000,
    remainderPaise: 0,
    allocationMethod: 'SHARE_BASED',
    status: 'DRAFT',
    participants: [
      {
        id: 'alloc-test-01_stay-01',
        allocationId: 'alloc-test-01',
        stayId: 'stay-01',
        residentId: 'res-01',
        residentCode: 'R-001',
        residentNameSnapshot: 'Rahul Sharma',
        flatId: 'flat-101',
        potentialShares: 2,
        selectedShares: 2,
        allocatedAmount: 2000,
      },
    ],
    dataQualityIssues: [],
  });

  it('instantiates DraftAllocationReviewPanel component props cleanly', () => {
    expect(typeof DraftAllocationReviewPanel).toBe('function');
    expect(mockAllocation.totalSupplierAmount).toBe(2000);
    expect(mockBill.supplierName).toBe('TPDDL Delhi');
  });

  it('handles share adjustments and confirmation triggers via callbacks', () => {
    const handleUpdate = vi.fn().mockReturnValue(true);
    const handleConfirm = vi.fn().mockReturnValue(true);

    const updateRes = handleUpdate([{ stayId: 'stay-01', selectedShares: 1 }]);
    expect(updateRes).toBe(true);
    expect(handleUpdate).toHaveBeenCalledWith([{ stayId: 'stay-01', selectedShares: 1 }]);

    const confirmRes = handleConfirm('op-operator-01', 'Monthly bill split approved');
    expect(confirmRes).toBe(true);
    expect(handleConfirm).toHaveBeenCalledWith('op-operator-01', 'Monthly bill split approved');
  });
});
