import { describe, it, expect } from 'vitest';
import { ElectricityAllocation } from '../ElectricityAllocation';

describe('ElectricityAllocation Domain Entity — Stage 5 Reversal Rules (BR-E-49)', () => {
  const mockProps = {
    id: 'alloc_101',
    billId: 'bill_202',
    flatId: 'flat_303',
    periodStart: '2026-07-01',
    periodEnd: '2026-07-31',
    totalSupplierAmount: 1500,
    totalPotentialShares: 3,
    totalSelectedShares: 3,
    amountPerShare: 500,
    remainderPaise: 0,
    participants: [
      {
        id: 'alloc_101_stay_1',
        allocationId: 'alloc_101',
        stayId: 'stay_1',
        residentId: 'res_1',
        residentCode: 'RES-0001',
        residentNameSnapshot: 'Resident Alpha',
        flatId: 'flat_303',
        potentialShares: 1,
        selectedShares: 1,
        allocatedAmount: 500,
      },
    ],
  };

  it('should successfully transition status from CONFIRMED to REVERSED with audit metadata', () => {
    const allocation = new ElectricityAllocation(mockProps);
    allocation.confirm('Operator John', 'Initial confirmation notes');

    expect(allocation.status).toBe('CONFIRMED');
    expect(allocation.confirmedBy).toBe('Operator John');

    allocation.reverse('Supervisor Jane', 'rev_alloc_101', 'Incorrect meter billing period');

    expect(allocation.status).toBe('REVERSED');
    expect(allocation.reversedBy).toBe('Supervisor Jane');
    expect(allocation.reversalReferenceId).toBe('rev_alloc_101');
    expect(allocation.reversalReason).toBe('Incorrect meter billing period');
    expect(allocation.reversedAt).toBeDefined();
    expect(new Date(allocation.reversedAt!).getTime()).not.toBeNaN();
  });

  it('should prevent reversing an allocation in DRAFT status', () => {
    const allocation = new ElectricityAllocation(mockProps);
    expect(allocation.status).toBe('DRAFT');

    expect(() => {
      allocation.reverse('Supervisor Jane', 'rev_alloc_101', 'Reason');
    }).toThrow('Cannot reverse an ElectricityAllocation that is DRAFT');
  });

  it('should prevent reversing an allocation that is already REVERSED', () => {
    const allocation = new ElectricityAllocation(mockProps);
    allocation.confirm('Operator John');
    allocation.reverse('Supervisor Jane', 'rev_alloc_101');

    expect(allocation.status).toBe('REVERSED');

    expect(() => {
      allocation.reverse('Supervisor Jane', 'rev_alloc_101_dup');
    }).toThrow('Cannot reverse an ElectricityAllocation that is REVERSED');
  });

  it('should throw an error if reversedBy identity is missing or empty', () => {
    const allocation = new ElectricityAllocation(mockProps);
    allocation.confirm('Operator John');

    expect(() => {
      allocation.reverse('  ', 'rev_alloc_101');
    }).toThrow('Operator identity (reversedBy) is required');
  });

  it('should throw an error if reversalReferenceId is missing or empty', () => {
    const allocation = new ElectricityAllocation(mockProps);
    allocation.confirm('Operator John');

    expect(() => {
      allocation.reverse('Supervisor Jane', ' ');
    }).toThrow('Reversal reference ID (reversalReferenceId) is required');
  });

  it('should preserve original historical allocation properties immutably after reversal', () => {
    const allocation = new ElectricityAllocation(mockProps);
    allocation.confirm('Operator John', 'Original quality note');
    allocation.reverse('Supervisor Jane', 'rev_alloc_101', 'Reversal note');

    // Immutable original calculation values
    expect(allocation.totalSupplierAmount).toBe(1500);
    expect(allocation.totalPotentialShares).toBe(3);
    expect(allocation.totalSelectedShares).toBe(3);
    expect(allocation.amountPerShare).toBe(500);
    expect(allocation.remainderPaise).toBe(0);
    expect(allocation.periodStart).toBe('2026-07-01');
    expect(allocation.periodEnd).toBe('2026-07-31');
    expect(allocation.flatId).toBe('flat_303');
    expect(allocation.billId).toBe('bill_202');

    // Immutable original confirmation metadata
    expect(allocation.confirmedBy).toBe('Operator John');
    expect(allocation.confirmedAt).toBeDefined();

    // Immutable participant information
    expect(allocation.participants.length).toBe(1);
    expect(allocation.participants[0].stayId).toBe('stay_1');
    expect(allocation.participants[0].allocatedAmount).toBe(500);
  });
});
