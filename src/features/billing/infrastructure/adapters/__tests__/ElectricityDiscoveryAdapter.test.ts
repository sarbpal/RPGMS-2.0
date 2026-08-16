import { describe, it, expect, beforeEach } from 'vitest';
import { ElectricityDiscoveryAdapter } from '../ElectricityDiscoveryAdapter';
import { InMemoryElectricityRepository } from '../../../../electricity/infrastructure/repositories/InMemoryElectricityRepository';
import { ElectricityAllocation } from '../../../../electricity/domain/entities/ElectricityAllocation';
import { AllocationParticipant } from '../../../../electricity/domain/valueObjects/AllocationParticipant';

describe('ElectricityDiscoveryAdapter (Read-Only Observation of Confirmed Electricity Allocations)', () => {
  let elecRepo: InMemoryElectricityRepository;
  let adapter: ElectricityDiscoveryAdapter;

  beforeEach(() => {
    elecRepo = new InMemoryElectricityRepository();
    adapter = new ElectricityDiscoveryAdapter(elecRepo);
  });

  it('discovers confirmed electricity allocations with exact financeBillId and COMMITTED status', async () => {
    const allocation = new ElectricityAllocation({
      id: 'ALLOC-2026-001',
      billId: 'BILL-SUPP-001',
      flatId: 'FLAT-101',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      totalSupplierAmount: 5000,
      totalPotentialShares: 4,
      totalSelectedShares: 4,
      amountPerShare: 1250,
      remainderPaise: 0,
      status: 'CONFIRMED',
      participants: [
        new AllocationParticipant({
          id: 'PART-001',
          allocationId: 'ALLOC-2026-001',
          stayId: 'STAY-101',
          residentId: 'RES-101',
          residentCode: 'RC-101',
          residentNameSnapshot: 'Rahul S.',
          flatId: 'FLAT-101',
          potentialShares: 2,
          selectedShares: 2,
          allocatedAmount: 2500,
          financeBillId: 'INV-FIN-ELEC-888',
        }),
      ],
    });

    elecRepo.saveAllocation(allocation);

    const obligations = await adapter.discoverObligations(
      ['STAY-101'],
      '2026-07-01',
      '2026-07-31',
      '2026-08-01T00:00:00.000Z'
    );

    expect(obligations).toHaveLength(1);
    const ob = obligations[0];
    expect(ob.obligationKey).toBe('ELECTRICITY:STAY-101:PART-001');
    expect(ob.chargeType).toBe('ELECTRICITY');
    expect(ob.category).toBe('UTILITIES');
    expect(ob.amount).toBe(2500);
    expect(ob.commitmentStatus).toBe('COMMITTED');
    expect(ob.financialReferenceId).toBe('INV-FIN-ELEC-888'); // Exact ID, no fabricated string
    expect(ob.isCommitted()).toBe(true);
    expect(ob.isClaimable()).toBe(false);
  });

  it('preserves COMMITTED status even if financeBillId is absent on CONFIRMED allocation (protecting Finance ownership)', async () => {
    const allocation = new ElectricityAllocation({
      id: 'ALLOC-2026-002',
      billId: 'BILL-SUPP-002',
      flatId: 'FLAT-101',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      totalSupplierAmount: 2000,
      totalPotentialShares: 2,
      totalSelectedShares: 2,
      amountPerShare: 1000,
      remainderPaise: 0,
      status: 'CONFIRMED',
      participants: [
        new AllocationParticipant({
          id: 'PART-002',
          allocationId: 'ALLOC-2026-002',
          stayId: 'STAY-102',
          residentId: 'RES-102',
          residentCode: 'RC-102',
          residentNameSnapshot: 'Amit K.',
          flatId: 'FLAT-101',
          potentialShares: 2,
          selectedShares: 2,
          allocatedAmount: 2000,
          // financeBillId absent
        }),
      ],
    });

    elecRepo.saveAllocation(allocation);

    const obligations = await adapter.discoverObligations(
      ['STAY-102'],
      '2026-07-01',
      '2026-07-31',
      '2026-08-01T00:00:00.000Z'
    );

    expect(obligations).toHaveLength(1);
    const ob = obligations[0];
    expect(ob.commitmentStatus).toBe('COMMITTED'); // Must remain COMMITTED, cannot be claimed
    expect(ob.financialReferenceId).toBeUndefined(); // Strictly undefined, NO fake string
    expect(ob.isCommitted()).toBe(true);
    expect(ob.isClaimable()).toBe(false);
  });

  it('ignores DRAFT (unconfirmed) allocations', async () => {
    const draftAllocation = new ElectricityAllocation({
      id: 'ALLOC-DRAFT-01',
      billId: 'BILL-SUPP-003',
      flatId: 'FLAT-101',
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
      totalSupplierAmount: 3000,
      totalPotentialShares: 2,
      totalSelectedShares: 2,
      amountPerShare: 1500,
      remainderPaise: 0,
      status: 'DRAFT',
      participants: [
        new AllocationParticipant({
          id: 'PART-DRAFT-01',
          allocationId: 'ALLOC-DRAFT-01',
          stayId: 'STAY-101',
          residentId: 'RES-101',
          residentCode: 'RC-101',
          residentNameSnapshot: 'Rahul S.',
          flatId: 'FLAT-101',
          potentialShares: 2,
          selectedShares: 2,
          allocatedAmount: 3000,
        }),
      ],
    });

    elecRepo.saveAllocation(draftAllocation);

    const obligations = await adapter.discoverObligations(
      ['STAY-101'],
      '2026-07-01',
      '2026-07-31',
      '2026-08-01T00:00:00.000Z'
    );

    expect(obligations).toHaveLength(0);
  });
});
