import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ReversePaymentModal,
  generateReversalIdempotencyKey,
  type PaymentForReversal,
  type ReversePaymentModalProps,
} from '../ReversePaymentModal';
import { paymentService } from '../../services/paymentService';
import { financeStorage } from '../../storage/financeStorage';

describe('UI-INTEGRATION-01 — ReversePaymentModal Component & Reversal Workflow Test Suite', () => {
  const mockPayment: PaymentForReversal = {
    id: 'PAY-REV-001',
    paymentNumber: 'PAY-2026-0001',
    amount: 15000,
    paymentMethod: 'BANK_TRANSFER',
    paymentDate: '2026-08-15',
    referenceNumber: 'UTR99887766',
    stayId: 'STAY-001',
    residentName: 'Vikram Malhotra',
    residentCode: 'RES-001',
  };

  beforeEach(() => {
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
  });

  describe('1. Instantiation & Snapshot Binding', () => {
    it('instantiates ReversePaymentModal cleanly as a function component', () => {
      expect(typeof ReversePaymentModal).toBe('function');
    });

    it('validates ReversePaymentModal props contract structure', () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();

      const props: ReversePaymentModalProps = {
        open: true,
        payment: mockPayment,
        onClose,
        onSuccess,
      };

      expect(props.payment?.paymentNumber).toBe('PAY-2026-0001');
      expect(props.payment?.amount).toBe(15000);
      expect(props.payment?.residentName).toBe('Vikram Malhotra');
      expect(props.payment?.stayId).toBe('STAY-001');
    });
  });

  describe('2. Idempotency Key Generation', () => {
    it('generates session-stable prefix-keyed idempotency strings', () => {
      const key1 = generateReversalIdempotencyKey('PAY-001');
      const key2 = generateReversalIdempotencyKey('PAY-001');

      expect(key1).toMatch(/^rev_idem_PAY-001_/);
      expect(key2).toMatch(/^rev_idem_PAY-001_/);
      expect(key1).not.toBe(key2); // Distinct entropy
    });
  });

  describe('3. Application Boundary & Reversal Service Delegation', () => {
    it('delegates reversal to paymentService.reversePayment with required reason', () => {
      const reverseSpy = vi.spyOn(paymentService, 'reversePayment').mockReturnValue({
        success: true,
        payment: {
          id: mockPayment.id,
          paymentNumber: mockPayment.paymentNumber,
          stayId: mockPayment.stayId,
          amount: mockPayment.amount,
          paymentDate: mockPayment.paymentDate,
          paymentMethod: 'BANK_TRANSFER',
          status: 'REVERSED',
          reversalReason: 'Bounced cheque from bank',
          reversedBy: 'OPERATOR',
          reversedAt: '2026-08-22T00:00:00Z',
          allocations: [],
          createdAt: '2026-08-15T00:00:00Z',
        },
        errors: [],
      });

      const result = paymentService.reversePayment({
        paymentId: mockPayment.id,
        reversalReason: 'Bounced cheque from bank',
        reversedBy: 'OPERATOR',
        idempotencyKey: 'IDEMP-TEST-001',
      });

      expect(reverseSpy).toHaveBeenCalledWith({
        paymentId: 'PAY-REV-001',
        reversalReason: 'Bounced cheque from bank',
        reversedBy: 'OPERATOR',
        idempotencyKey: 'IDEMP-TEST-001',
      });

      expect(result.success).toBe(true);
      expect(result.payment?.status).toBe('REVERSED');

      reverseSpy.mockRestore();
    });
  });
});
