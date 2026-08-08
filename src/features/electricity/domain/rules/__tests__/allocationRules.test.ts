import { describe, it, expect } from 'vitest';
import { calculateShareBasedAllocation, type ParticipantShareInput } from '../allocationRules';

describe('Stage 1 — Electricity Allocation Pure Domain Rules (allocationRules.ts)', () => {
  it('calculates exact share allocation evenly when bill divides evenly', () => {
    const participants: ParticipantShareInput[] = [
      { stayId: 'stay-01', residentId: 'res-01', residentCode: 'R-001', flatId: 'flat-101', potentialShares: 1, selectedShares: 1 },
      { stayId: 'stay-02', residentId: 'res-02', residentCode: 'R-002', flatId: 'flat-101', potentialShares: 1, selectedShares: 1 },
    ];

    const result = calculateShareBasedAllocation(1000, participants);

    expect(result.totalSupplierAmount).toBe(1000);
    expect(result.totalSelectedShares).toBe(2);
    expect(result.calculatedTotal).toBe(1000);
    expect(result.participantShares.length).toBe(2);
    expect(result.participantShares[0].allocatedAmount).toBe(500);
    expect(result.participantShares[1].allocatedAmount).toBe(500);
  });

  it('distributes remainder paise deterministically sorted by residentCode ASC, then stayId ASC', () => {
    // Bill = 10000.01 (1000001 paise) across 3 selected shares.
    // 1000001 / 3 = 333333 paise (₹3,333.33) with remainder 2 paise.
    // Deterministic order: R-001 (gets 1 paise extra), R-002 (gets 1 paise extra), R-003 (gets 0).
    const participants: ParticipantShareInput[] = [
      { stayId: 'stay-03', residentId: 'res-03', residentCode: 'R-003', flatId: 'flat-101', potentialShares: 1, selectedShares: 1 },
      { stayId: 'stay-01', residentId: 'res-01', residentCode: 'R-001', flatId: 'flat-101', potentialShares: 1, selectedShares: 1 },
      { stayId: 'stay-02', residentId: 'res-02', residentCode: 'R-002', flatId: 'flat-101', potentialShares: 1, selectedShares: 1 },
    ];

    const result = calculateShareBasedAllocation(10000.01, participants);

    expect(result.totalSupplierAmount).toBe(10000.01);
    expect(result.calculatedTotal).toBe(10000.01);
    expect(result.remainderPaise).toBe(2);

    const r001 = result.participantShares.find((p) => p.residentCode === 'R-001');
    const r002 = result.participantShares.find((p) => p.residentCode === 'R-002');
    const r003 = result.participantShares.find((p) => p.residentCode === 'R-003');

    expect(r001?.allocatedAmount).toBe(3333.34);
    expect(r002?.allocatedAmount).toBe(3333.34);
    expect(r003?.allocatedAmount).toBe(3333.33);

    // Sum must equal total supplier bill exactly
    const sum = Number(
      (
        (r001?.allocatedAmount || 0) +
        (r002?.allocatedAmount || 0) +
        (r003?.allocatedAmount || 0)
      ).toFixed(2)
    );
    expect(sum).toBe(10000.01);
  });

  it('allocates 2 potential/selected shares to a resident occupying 2 beds', () => {
    const participants: ParticipantShareInput[] = [
      { stayId: 'stay-multi', residentId: 'res-multi', residentCode: 'R-001', flatId: 'flat-101', potentialShares: 2, selectedShares: 2 },
      { stayId: 'stay-single', residentId: 'res-single', residentCode: 'R-002', flatId: 'flat-101', potentialShares: 1, selectedShares: 1 },
    ];

    // Bill = ₹3,000 across 3 total selected shares (R-001 has 2, R-002 has 1)
    const result = calculateShareBasedAllocation(3000, participants);

    expect(result.totalPotentialShares).toBe(3);
    expect(result.totalSelectedShares).toBe(3);
    expect(result.amountPerShare).toBe(1000);

    const pMulti = result.participantShares.find((p) => p.stayId === 'stay-multi');
    const pSingle = result.participantShares.find((p) => p.stayId === 'stay-single');

    expect(pMulti?.allocatedAmount).toBe(2000);
    expect(pSingle?.allocatedAmount).toBe(1000);
  });

  it('handles draft selectedShares = 0 as pure calculation without setting business outcome', () => {
    const participants: ParticipantShareInput[] = [
      { stayId: 'stay-01', residentId: 'res-01', residentCode: 'R-001', flatId: 'flat-101', potentialShares: 2, selectedShares: 0 },
      { stayId: 'stay-02', residentId: 'res-02', residentCode: 'R-002', flatId: 'flat-101', potentialShares: 1, selectedShares: 0 },
    ];

    const result = calculateShareBasedAllocation(5000, participants);

    expect(result.totalSupplierAmount).toBe(5000);
    expect(result.totalPotentialShares).toBe(3);
    expect(result.totalSelectedShares).toBe(0);
    expect(result.calculatedTotal).toBe(0);
    expect(result.participantShares.every((p) => p.allocatedAmount === 0)).toBe(true);
  });

  it('throws error for non-positive supplier bill amount', () => {
    expect(() => calculateShareBasedAllocation(0, [])).toThrow('positive number');
    expect(() => calculateShareBasedAllocation(-500, [])).toThrow('positive number');
  });
});
