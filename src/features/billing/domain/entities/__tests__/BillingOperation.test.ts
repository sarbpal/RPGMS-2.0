import { describe, it, expect } from 'vitest';
import { BillingOperation } from '../BillingOperation';

describe('BillingOperation Entity', () => {
  const defaultProps = {
    id: 'OP-001',
    billingRunId: 'RUN-2026-08',
    stayId: 'STAY-101',
    residentId: 'RES-101',
    residentCode: 'RC-001',
  };

  it('instantiates with PENDING status by default', () => {
    const op = new BillingOperation(defaultProps);

    expect(op.id).toBe('OP-001');
    expect(op.status).toBe('PENDING');
    expect(op.totalAmount).toBe(0);
    expect(op.obligationKeys).toHaveLength(0);
    expect(op.isTerminal()).toBe(false);
  });

  it('transitions from PENDING to CLAIMED when obligations are scoped', () => {
    const op = new BillingOperation(defaultProps);
    op.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);

    expect(op.status).toBe('CLAIMED');
    expect(op.totalAmount).toBe(12000);
    expect(op.obligationKeys).toEqual(['RENT:STAY-101:2026-08-15']);
  });

  it('transitions through CLAIMED -> PROCESSING -> SUCCESS', () => {
    const op = new BillingOperation(defaultProps);
    op.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);
    op.startProcessing();

    expect(op.status).toBe('PROCESSING');
    expect(op.startedAt).toBeDefined();

    op.markSuccess('INV-FIN-2026-001');
    expect(op.status).toBe('SUCCESS');
    expect(op.financialBillId).toBe('INV-FIN-2026-001');
    expect(op.completedAt).toBeDefined();
    expect(op.isTerminal()).toBe(true);
  });

  it('supports NO_CHARGES terminal outcome for stays without billable obligations', () => {
    const op = new BillingOperation(defaultProps);
    op.markNoCharges();

    expect(op.status).toBe('NO_CHARGES');
    expect(op.totalAmount).toBe(0);
    expect(op.isTerminal()).toBe(true);
  });

  it('supports NOT_PROCESSED when operation was never started (Graceful Stop)', () => {
    const op = new BillingOperation(defaultProps);
    op.markNotProcessed('Graceful stop requested by operator');

    expect(op.status).toBe('NOT_PROCESSED');
    expect(op.failureReason).toBe('Graceful stop requested by operator');
    expect(op.isTerminal()).toBe(true);
  });

  it('supports FAILED status for non-financial processing failures', () => {
    const op = new BillingOperation(defaultProps);
    op.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);
    op.startProcessing();
    op.markFailed('Validation failed in calculation provider');

    expect(op.status).toBe('FAILED');
    expect(op.failureReason).toBe('Validation failed in calculation provider');
    expect(op.isTerminal()).toBe(true);
  });

  it('supports CLAIM_FAILED status when claims cannot be acquired', () => {
    const op = new BillingOperation(defaultProps);
    op.markClaimFailed('Obligation claimed by competing run');

    expect(op.status).toBe('CLAIM_FAILED');
    expect(op.isTerminal()).toBe(true);
  });

  it('supports RECOVERY_REQUIRED status for uncertain financial outcomes', () => {
    const op = new BillingOperation(defaultProps);
    op.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);
    op.startProcessing();
    op.markRecoveryRequired('Network timeout during Finance dispatch', 'Check invoice INV-2026-999 in Finance');

    expect(op.status).toBe('RECOVERY_REQUIRED');
    expect(op.failureReason).toBe('Network timeout during Finance dispatch');
    expect(op.recoveryNotes).toBe('Check invoice INV-2026-999 in Finance');
    expect(op.isTerminal()).toBe(true);
  });

  it('prevents marking a successful operation as failed', () => {
    const op = new BillingOperation(defaultProps);
    op.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);
    op.startProcessing();
    op.markSuccess('INV-FIN-2026-001');

    expect(() => op.markFailed('Try fail')).toThrow('Cannot mark successfully completed operation');
  });

  describe('Recovery Resolution Transitions', () => {
    it('resolves RECOVERY_REQUIRED as COMMITTED with valid financialBillId', () => {
      const op = new BillingOperation(defaultProps);
      op.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);
      op.startProcessing();
      op.markRecoveryRequired('Network timeout during dispatch', 'Original error');

      op.resolveCommitted('INV-FIN-2026-001', 'Verified invoice in Finance repository');

      expect(op.status).toBe('SUCCESS');
      expect(op.financialBillId).toBe('INV-FIN-2026-001');
      expect(op.recoveryNotes).toContain('Resolved COMMITTED: Verified invoice in Finance repository');
    });

    it('rejects resolveCommitted if operation is not in RECOVERY_REQUIRED status', () => {
      const op = new BillingOperation(defaultProps);
      expect(() => op.resolveCommitted('INV-FIN-2026-001', 'Notes')).toThrow(
        'Cannot resolve operation OP-001 as COMMITTED from status PENDING'
      );
    });

    it('rejects resolveCommitted with empty bill ID', () => {
      const op = new BillingOperation(defaultProps);
      op.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);
      op.startProcessing();
      op.markRecoveryRequired('Timeout');

      expect(() => op.resolveCommitted('', 'Notes')).toThrow('resolveCommitted requires a valid, non-empty financialBillId');
    });

    it('resolves RECOVERY_REQUIRED as NOT_COMMITTED with mandatory reason', () => {
      const op = new BillingOperation(defaultProps);
      op.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);
      op.startProcessing();
      op.markRecoveryRequired('Network timeout during dispatch');

      op.resolveNotCommitted('Confirmed invoice was never created in Finance', 'Checked ledger logs');

      expect(op.status).toBe('FAILED');
      expect(op.failureReason).toBe('Confirmed invoice was never created in Finance');
      expect(op.recoveryNotes).toContain('Resolved NOT_COMMITTED: Confirmed invoice was never created in Finance');
    });

    it('rejects resolveNotCommitted if operation is not in RECOVERY_REQUIRED status', () => {
      const op = new BillingOperation(defaultProps);
      expect(() => op.resolveNotCommitted('Reason')).toThrow(
        'Cannot resolve operation OP-001 as NOT_COMMITTED from status PENDING'
      );
    });

    it('rejects resolveNotCommitted with empty reason', () => {
      const op = new BillingOperation(defaultProps);
      op.markClaimed(['RENT:STAY-101:2026-08-15'], 12000);
      op.startProcessing();
      op.markRecoveryRequired('Timeout');

      expect(() => op.resolveNotCommitted('', 'Notes')).toThrow('resolveNotCommitted requires a valid reason');
    });
  });
});
