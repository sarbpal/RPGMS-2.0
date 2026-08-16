import { describe, it, expect } from 'vitest';
import { BillingRun } from '../BillingRun';
import { BillingOperation } from '../BillingOperation';

describe('BillingRun Aggregate Root', () => {
  const defaultProps = {
    id: 'RUN-2026-08',
    periodStart: '2026-08-01',
    periodEnd: '2026-08-31',
    operatorId: 'OP-USER-01',
  };

  it('instantiates with DRAFT_PREVIEW status by default', () => {
    const run = new BillingRun(defaultProps);

    expect(run.id).toBe('RUN-2026-08');
    expect(run.status).toBe('DRAFT_PREVIEW');
    expect(run.totalOperations).toBe(0);
    expect(run.totalAmountBilled).toBe(0);
    expect(run.eligibilityCutoff).toBeUndefined();
  });

  it('rejects invalid period where periodStart > periodEnd', () => {
    expect(
      () =>
        new BillingRun({
          ...defaultProps,
          periodStart: '2026-09-01',
          periodEnd: '2026-08-01',
        })
    ).toThrow('periodStart (2026-09-01) cannot be after periodEnd (2026-08-01)');
  });

  it('transitions lifecycle: DRAFT_PREVIEW -> CONFIRMED -> PROCESSING -> finalize (COMPLETED)', () => {
    const run = new BillingRun(defaultProps);

    const op1 = new BillingOperation({
      id: 'OP-001',
      billingRunId: run.id,
      stayId: 'STAY-101',
      residentId: 'RES-101',
    });
    run.addOperation(op1);

    // Confirm
    run.confirm('2026-08-16T12:00:00.000Z');
    expect(run.status).toBe('CONFIRMED');
    expect(run.eligibilityCutoff).toBe('2026-08-16T12:00:00.000Z');
    expect(run.confirmedAt).toBeDefined();

    // Start processing
    run.startProcessing();
    expect(run.status).toBe('PROCESSING');

    // Complete operation
    op1.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);
    op1.startProcessing();
    op1.markSuccess('INV-FIN-101');

    // Finalize
    run.finalize();
    expect(run.status).toBe('COMPLETED');
    expect(run.completedAt).toBeDefined();
    expect(run.totalAmountBilled).toBe(12000);
    expect(run.successfulOperationsCount).toBe(1);
  });

  it('finalizes to PARTIALLY_COMPLETED when some operations succeed and some fail', () => {
    const run = new BillingRun(defaultProps);

    const op1 = new BillingOperation({
      id: 'OP-001',
      billingRunId: run.id,
      stayId: 'STAY-101',
      residentId: 'RES-101',
    });
    const op2 = new BillingOperation({
      id: 'OP-002',
      billingRunId: run.id,
      stayId: 'STAY-102',
      residentId: 'RES-102',
    });
    run.addOperation(op1);
    run.addOperation(op2);

    run.confirm();
    run.startProcessing();

    op1.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);
    op1.startProcessing();
    op1.markSuccess('INV-FIN-101');

    op2.markClaimFailed('Obligation claimed by competing run');

    run.finalize();
    expect(run.status).toBe('PARTIALLY_COMPLETED');
    expect(run.successfulOperationsCount).toBe(1);
    expect(run.failedOperationsCount).toBe(1);
  });

  it('supports STOPPING and NOT_PROCESSED graceful stop flow', () => {
    const run = new BillingRun(defaultProps);
    const op1 = new BillingOperation({
      id: 'OP-001',
      billingRunId: run.id,
      stayId: 'STAY-101',
      residentId: 'RES-101',
    });
    run.addOperation(op1);

    run.confirm();
    run.startProcessing();
    run.requestStop();

    expect(run.status).toBe('STOPPING');
    expect(run.stoppedAt).toBeDefined();

    op1.markNotProcessed('Graceful stop');
    run.finalize();

    expect(run.status).toBe('FAILED'); // No successful operations
  });

  it('rejects adding duplicate stays to the same billing run', () => {
    const run = new BillingRun(defaultProps);
    const op1 = new BillingOperation({
      id: 'OP-001',
      billingRunId: run.id,
      stayId: 'STAY-101',
      residentId: 'RES-101',
    });
    const op2 = new BillingOperation({
      id: 'OP-002',
      billingRunId: run.id,
      stayId: 'STAY-101', // Same Stay
      residentId: 'RES-101',
    });

    run.addOperation(op1);
    expect(() => run.addOperation(op2)).toThrow('already contains an operation for Stay STAY-101');
  });

  it('rejects invalid state transitions', () => {
    const run = new BillingRun(defaultProps);

    expect(() => run.startProcessing()).toThrow('Must be CONFIRMED');
    expect(() => run.finalize()).toThrow('Cannot finalize');

    run.confirm();
    expect(() => run.confirm()).toThrow('Must be in DRAFT_PREVIEW');
  });

  it('allows cancellation of unstarted runs', () => {
    const run = new BillingRun(defaultProps);
    run.cancel('Operator decided to rerun later');

    expect(run.status).toBe('CANCELLED');
    expect(run.notes).toContain('Operator decided to rerun later');
  });
});
