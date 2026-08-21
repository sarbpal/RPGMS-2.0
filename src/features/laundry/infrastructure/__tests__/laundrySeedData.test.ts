import { describe, it, expect } from 'vitest';
import { laundrySeedData, laundrySeedProps } from '../data/laundrySeedData';
import { LaundryTransaction } from '../../domain/entities/LaundryTransaction';
import { LaundryTransactionStatus } from '../../domain/valueObjects/LaundryTransactionStatus';

describe('laundrySeedData', () => {
  it('Test 16 — Seed Validity: all seed transactions instantiate without error and satisfy invariants', () => {
    expect(laundrySeedData.length).toBeGreaterThan(0);
    expect(laundrySeedProps.length).toBe(laundrySeedData.length);

    for (const tx of laundrySeedData) {
      expect(tx instanceof LaundryTransaction).toBe(true);
      expect(tx.id).toBeTruthy();
      expect(tx.stayId).toBeTruthy();
      expect(tx.residentId).toBeTruthy();
      expect(tx.garmentLines.length).toBeGreaterThan(0);

      // Verify physical piece count invariants
      const totalPhysical = tx.totalPhysicalPieces;
      expect(totalPhysical).toBeGreaterThan(0);
      expect(tx.totalReturnedPieces).toBeLessThanOrEqual(totalPhysical);
      expect(tx.totalDeliveredPieces).toBeLessThanOrEqual(totalPhysical);

      // Verify service allocations
      for (const line of tx.garmentLines) {
        expect(line.serviceAllocations.length).toBeGreaterThan(0);
        for (const sa of line.serviceAllocations) {
          expect(sa.requestedQuantity).toBeLessThanOrEqual(line.physicalQuantity);
        }
      }

      // Verify serialization round-trip
      const json = tx.toJSON();
      const reconstructed = new LaundryTransaction(json);
      expect(reconstructed.id).toBe(tx.id);
      expect(reconstructed.status).toBe(tx.status);
    }
  });

  it('Test 17 — Lifecycle Coverage: seed transactions cover all required operational lifecycle states', () => {
    const statuses = laundrySeedData.map((t) => t.status);

    // Verify representative statuses
    expect(statuses).toContain(LaundryTransactionStatus.COLLECTED);
    expect(statuses).toContain(LaundryTransactionStatus.IN_PROCESS);
    expect(statuses).toContain(LaundryTransactionStatus.RETURNED_FULL);
    expect(statuses).toContain(LaundryTransactionStatus.COMPLETED);

    // Verify LTX-2026-0001 is COLLECTED with rate snapshots
    const collected = laundrySeedData.find((t) => t.id === 'LTX-2026-0001');
    expect(collected?.status).toBe(LaundryTransactionStatus.COLLECTED);
    expect(collected?.collectionEvidence?.photoUris?.length).toBeGreaterThan(0);
    expect(collected?.garmentLines[0].serviceAllocations[0].rateSnapshot).toBeDefined();

    // Verify LTX-2026-0002 is IN_PROCESS with condition observation & external vendor
    const inProcess = laundrySeedData.find((t) => t.id === 'LTX-2026-0002');
    expect(inProcess?.status).toBe(LaundryTransactionStatus.IN_PROCESS);
    expect(inProcess?.isInspected).toBe(true);
    expect(inProcess?.processingVendorId).toBe('VND-001');
    expect(inProcess?.conditionObservations.length).toBeGreaterThan(0);

    // Verify LTX-2026-0003 is RETURNED_FULL
    const returned = laundrySeedData.find((t) => t.id === 'LTX-2026-0003');
    expect(returned?.status).toBe(LaundryTransactionStatus.RETURNED_FULL);
    expect(returned?.returns.length).toBeGreaterThan(0);
    expect(returned?.totalReturnedPieces).toBe(returned?.totalCollectedPieces);

    // Verify LTX-2026-0004 is COMPLETED with charges posted
    const completed = laundrySeedData.find((t) => t.id === 'LTX-2026-0004');
    expect(completed?.status).toBe(LaundryTransactionStatus.COMPLETED);
    expect(completed?.deliveries.length).toBeGreaterThan(0);
    expect(completed?.totalOutstandingPhysicalPieces).toBe(0);
    expect(completed?.charges.length).toBeGreaterThan(0);
    expect(completed?.charges[0].status).toBe('POSTED');

    // Verify LTX-2026-0005 is COMPLETED with Exception resolution
    const resolvedException = laundrySeedData.find((t) => t.id === 'LTX-2026-0005');
    expect(resolvedException?.status).toBe(LaundryTransactionStatus.COMPLETED);
    expect(resolvedException?.exceptions.length).toBeGreaterThan(0);
    expect(resolvedException?.exceptions[0].resolution).toBeDefined();
    expect(resolvedException?.totalOutstandingPhysicalPieces).toBe(0);
  });
});
