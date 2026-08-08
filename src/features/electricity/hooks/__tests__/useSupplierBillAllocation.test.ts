import { describe, it, expect, beforeEach } from 'vitest';
import { SupplierBillAllocationService } from '../../services/supplierBillAllocationService';
import { defaultElectricityRepository } from '../../infrastructure/repositories/InMemoryElectricityRepository';
import { InMemoryStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { InMemoryResidentRepository } from '../../../resident/infrastructure/repositories/InMemoryResidentRepository';
import { Stay } from '../../../stay/domain/entities/Stay';
import type { Resident } from '../../../resident/domain/entities/Resident';

describe('Stage 4 — useSupplierBillAllocation Hook ViewModel Unit Tests', () => {
  let stayRepo: InMemoryStayRepository;
  let residentRepo: InMemoryResidentRepository;
  let service: SupplierBillAllocationService;

  beforeEach(() => {
    stayRepo = new InMemoryStayRepository();
    residentRepo = new InMemoryResidentRepository();
    service = new SupplierBillAllocationService(
      defaultElectricityRepository,
      stayRepo,
      residentRepo
    );

    // Seed test resident and stay
    const testResident: Resident = {
      id: 'res-hook-01',
      residentCode: 'R-HK-01',
      fullName: 'Rahul Sharma',
      mobileNumber: '9876543210',
      status: 'ACTIVE',
      email: 'rahul@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    residentRepo.save(testResident);

    const testStay = new Stay({
      id: 'stay-hook-01',
      residentId: 'res-hook-01',
      flatId: 'flat-hook-101',
      allocatedBedIds: ['bed-1', 'bed-2'],
      checkInDate: '2026-07-01',
      stayType: 'REGULAR',
      status: 'ACTIVE',
    });
    stayRepo.save(testStay);
  });

  it('provides supplier bill allocation service methods and state transitions', () => {
    // 1. Create Draft Bill via service
    const createResult = service.createDraftAllocation(
      {
        supplierName: 'TPDDL Delhi',
        supplierBillNumber: 'INV-HOOK-001',
        supplierAmount: 2000,
      },
      'flat-hook-101',
      '2026-07-01',
      '2026-07-31'
    );

    expect(createResult.success).toBe(true);
    expect(createResult.allocation).not.toBeNull();
    expect(createResult.allocation?.totalSupplierAmount).toBe(2000);
    expect(createResult.bill?.supplierName).toBe('TPDDL Delhi');
    expect(createResult.allocation?.totalPotentialShares).toBe(2);

    // 2. Update Draft Shares
    const updateResult = service.updateDraftShares(createResult.allocation!.id, [
      { stayId: 'stay-hook-01', selectedShares: 1 },
    ]);

    expect(updateResult.success).toBe(true);
    expect(updateResult.allocation?.totalSelectedShares).toBe(1);
    expect(updateResult.allocation?.amountPerShare).toBe(2000);

    // 3. Confirm Allocation (RESIDENT_ALLOCATED)
    const confirmResult = service.confirmAllocation(createResult.allocation!.id, 'op-admin-01', 'Monthly clear');
    expect(confirmResult.success).toBe(true);
    expect(confirmResult.allocation?.status).toBe('CONFIRMED');
    expect(confirmResult.allocation?.allocationOutcome).toBe('RESIDENT_ALLOCATED');
    expect(confirmResult.bill?.supplierBillNumber).toBe('INV-HOOK-001');
  });

  it('handles OWNER_ABSORBED confirmation when selected shares equal zero', () => {
    const createResult = service.createDraftAllocation(
      {
        supplierName: 'TPDDL Delhi',
        supplierBillNumber: 'INV-HOOK-004',
        supplierAmount: 3000,
      },
      'flat-hook-101',
      '2026-07-01',
      '2026-07-31'
    );

    const updateResult = service.updateDraftShares(createResult.allocation!.id, [
      { stayId: 'stay-hook-01', selectedShares: 0 },
    ]);
    expect(updateResult.success).toBe(true);

    const confirmResult = service.confirmAllocation(createResult.allocation!.id, 'op-admin-01', 'Owner absorbs vacant month');
    expect(confirmResult.success).toBe(true);
    expect(confirmResult.allocation?.allocationOutcome).toBe('OWNER_ABSORBED');
    expect(confirmResult.allocation?.ownerAbsorbedAmount).toBe(3000);
  });
});
