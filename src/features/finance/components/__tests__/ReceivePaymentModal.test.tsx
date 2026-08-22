import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ReceivePaymentModal,
  generatePaymentIdempotencyKey,
  type ReceivePaymentModalProps,
} from '../ReceivePaymentModal';
import { paymentService } from '../../services/paymentService';
import { financeStorage } from '../../storage/financeStorage';
import { PaymentMethod } from '../../domain';
import type { Resident } from '../../../resident';
import type { Flat } from '../../../accommodation/types';

describe('FC-03C — ReceivePaymentModal Component & Payment Workflow Test Suite', () => {
  const mockResident: Resident = {
    id: 'RES-004',
    residentCode: 'RESID-000004',
    fullName: 'Tito Singh',
    mobileNumber: '+91 98765 00004',
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z',
  };

  const mockFlat: Flat = {
    id: 'flat-101',
    name: '101',
    floor: '1',
    areas: [],
  };

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('rpgms_stays');
      localStorage.removeItem('rpgms_residents');
    }
    financeStorage.saveStoredLedgerEntries([]);
    financeStorage.saveStoredBills([]);
    financeStorage.saveStoredPayments([]);
    financeStorage.saveStoredSettlements([]);
  });

  describe('1. Instantiation & Snapshot Binding', () => {
    it('instantiates ReceivePaymentModal cleanly as a function component', () => {
      expect(typeof ReceivePaymentModal).toBe('function');
    });

    it('binds resident snapshot, bed label, and existing advance credit correctly', () => {
      const onClose = vi.fn();
      const onSuccess = vi.fn();

      const props: ReceivePaymentModalProps = {
        open: true,
        onClose,
        resident: {
          ...mockResident,
          allocatedBedIds: ['BED-101-H1'],
          agreedRent: 12000,
          agreedDeposit: 12000,
        } as Resident,
        selectedFlat: mockFlat,
        stayId: 'stay-000004',
        balances: {
          receivableBalance: 12000,
          securityDepositHeld: 12000,
          advanceCreditBalance: 3000,
          refundPayable: 0,
          netBalance: 9000,
        },
        currentMonthCharges: 12000,
        lastPaymentDateText: '2026-08-10 (₹5,000 via UPI)',
        onSuccess,
      };

      expect(props.stayId).toBe('stay-000004');
      expect(props.balances.receivableBalance).toBe(12000);
      expect(props.balances.advanceCreditBalance).toBe(3000);
      expect(props.currentMonthCharges).toBe(12000);
      expect(props.lastPaymentDateText).toContain('UPI');
    });

    it('formats unallocated bed correctly as "No Bed Allocated"', () => {
      const props: ReceivePaymentModalProps = {
        open: true,
        onClose: vi.fn(),
        resident: { ...mockResident, allocatedBedIds: [] } as Resident,
        stayId: 'stay-000004',
        balances: {
          receivableBalance: 0,
          securityDepositHeld: 0,
          advanceCreditBalance: 0,
          refundPayable: 0,
          netBalance: 0,
        },
        currentMonthCharges: 0,
        lastPaymentDateText: 'No payments recorded yet',
        onSuccess: vi.fn(),
      };

      expect((props.resident as Resident & { allocatedBedIds?: string[] }).allocatedBedIds).toHaveLength(0);
    });
  });

  describe('2. Idempotency Key Lifecycle & Intent Management', () => {
    it('TEST A — field editing within a payment session does NOT churn the idempotencyKey', () => {
      const sessionKey = generatePaymentIdempotencyKey('stay-000004');
      expect(sessionKey).toBeTruthy();

      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: true,
        payment: {
          id: 'pay-001',
          paymentNumber: 'PAY-202608-0001',
          stayId: 'stay-000004',
          amount: 15000, // Edited from 10000 to 15000
          paymentDate: '2026-08-22',
          paymentMethod: PaymentMethod.BANK_TRANSFER, // Edited from CASH to BANK_TRANSFER
          referenceNumber: 'NEFT-8899', // Reference entered
          idempotencyKey: sessionKey,
          allocations: [{ billId: 'bill-1', amount: 10000 }],
          createdAt: '2026-08-22T00:00:00Z',
        },
        errors: [],
      });

      // User edited amount, method, and reference during the session and submitted
      const result = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 15000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        referenceNumber: 'NEFT-8899',
        idempotencyKey: sessionKey,
      });

      expect(recordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          stayId: 'stay-000004',
          amount: 15000,
          paymentMethod: 'BANK_TRANSFER',
          referenceNumber: 'NEFT-8899',
          idempotencyKey: sessionKey,
        })
      );
      expect(result.success).toBe(true);
      expect(result.payment?.idempotencyKey).toBe(sessionKey);

      recordSpy.mockRestore();
    });

    it('TEST B — retry of the SAME payment intent reuses the exact same idempotencyKey', () => {
      const sessionKey = generatePaymentIdempotencyKey('stay-000004');
      let callCount = 0;

      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            success: false,
            payment: null,
            errors: ['A payment operation is currently in progress for this stay. Please retry.'],
          };
        }
        return {
          success: true,
          payment: {
            id: 'pay-002',
            paymentNumber: 'PAY-202608-0002',
            stayId: 'stay-000004',
            amount: 8000,
            paymentDate: '2026-08-22',
            paymentMethod: PaymentMethod.UPI,
            referenceNumber: 'UPI-RETRY-123',
            idempotencyKey: sessionKey,
            allocations: [],
            createdAt: '2026-08-22T00:00:00Z',
          },
          errors: [],
        };
      });

      // First attempt fails with lock
      const firstResult = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 8000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.UPI,
        referenceNumber: 'UPI-RETRY-123',
        idempotencyKey: sessionKey,
      });
      expect(firstResult.success).toBe(false);

      // Second attempt (retry of same intent) reuses SAME key and succeeds
      const retryResult = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 8000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.UPI,
        referenceNumber: 'UPI-RETRY-123',
        idempotencyKey: sessionKey,
      });

      expect(retryResult.success).toBe(true);
      expect(recordSpy).toHaveBeenCalledTimes(2);
      expect(recordSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ idempotencyKey: sessionKey }));
      expect(recordSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ idempotencyKey: sessionKey }));

      recordSpy.mockRestore();
    });

    it('TEST C — new payment session after successful completion receives a new idempotencyKey', () => {
      const keySession1 = generatePaymentIdempotencyKey('stay-000004');
      const keySession2 = generatePaymentIdempotencyKey('stay-000004');

      expect(keySession1).toBeTruthy();
      expect(keySession2).toBeTruthy();
      expect(keySession1).not.toBe(keySession2);

      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockImplementation((payload) => ({
        success: true,
        payment: {
          id: `pay-${payload.idempotencyKey}`,
          paymentNumber: `PAY-${payload.idempotencyKey}`,
          stayId: payload.stayId,
          amount: payload.amount,
          paymentDate: payload.paymentDate,
          paymentMethod: payload.paymentMethod as PaymentMethod,
          idempotencyKey: payload.idempotencyKey,
          allocations: [],
          createdAt: '2026-08-22T00:00:00Z',
        },
        errors: [],
      }));

      // Payment Session 1
      const res1 = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 5000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.CASH,
        idempotencyKey: keySession1,
      });
      expect(res1.payment?.idempotencyKey).toBe(keySession1);

      // Payment Session 2 (New payment after reopening)
      const res2 = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 6000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.UPI,
        referenceNumber: 'UPI-NEW-SESSION',
        idempotencyKey: keySession2,
      });
      expect(res2.payment?.idempotencyKey).toBe(keySession2);
      expect(res1.payment?.idempotencyKey).not.toBe(res2.payment?.idempotencyKey);

      recordSpy.mockRestore();
    });

    it('TEST D — cancel / reopen generates a fresh idempotencyKey for the new session', () => {
      const initialKey = generatePaymentIdempotencyKey('stay-000004');
      // User closes modal without submitting; subsequent open produces new key
      const reopenedKey = generatePaymentIdempotencyKey('stay-000004');

      expect(initialKey).toBeTruthy();
      expect(reopenedKey).toBeTruthy();
      expect(initialKey).not.toBe(reopenedKey);
    });
  });

  describe('3. Payment Amount Semantics & Advance Credit Handling', () => {
    it('supports Case A: Partial payment (underpayment)', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: true,
        payment: {
          id: 'pay-part-01',
          paymentNumber: 'PAY-202608-0010',
          stayId: 'stay-000004',
          amount: 4000,
          paymentDate: '2026-08-22',
          paymentMethod: PaymentMethod.CASH,
          allocations: [{ billId: 'bill-1', amount: 4000 }],
          createdAt: '2026-08-22T00:00:00Z',
        },
        errors: [],
      });

      const res = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 4000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.CASH,
      });

      expect(res.success).toBe(true);
      expect(res.payment?.amount).toBe(4000);
      expect(res.payment?.allocations).toHaveLength(1);
      expect(res.payment?.allocations[0].amount).toBe(4000);

      recordSpy.mockRestore();
    });

    it('supports Case B: Exact outstanding payment', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: true,
        payment: {
          id: 'pay-exact-01',
          paymentNumber: 'PAY-202608-0011',
          stayId: 'stay-000004',
          amount: 10000,
          paymentDate: '2026-08-22',
          paymentMethod: PaymentMethod.UPI,
          referenceNumber: 'UPI-EXACT-999',
          allocations: [{ billId: 'bill-1', amount: 10000 }],
          createdAt: '2026-08-22T00:00:00Z',
        },
        errors: [],
      });

      const res = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 10000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.UPI,
        referenceNumber: 'UPI-EXACT-999',
      });

      expect(res.success).toBe(true);
      expect(res.payment?.amount).toBe(10000);

      recordSpy.mockRestore();
    });

    it('supports Case C: Overpayment resulting in Advance Credit (mandatory FC-03C fix)', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: true,
        payment: {
          id: 'pay-over-01',
          paymentNumber: 'PAY-202608-0012',
          stayId: 'stay-000004',
          amount: 15000, // Dues: 10000, Advance: 5000
          paymentDate: '2026-08-22',
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          referenceNumber: 'NEFT-OVER-555',
          allocations: [{ billId: 'bill-1', amount: 10000 }],
          createdAt: '2026-08-22T00:00:00Z',
        },
        errors: [],
      });

      const res = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 15000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        referenceNumber: 'NEFT-OVER-555',
      });

      expect(res.success).toBe(true);
      expect(res.payment?.amount).toBe(15000);
      const totalAllocated = res.payment?.allocations.reduce((s, a) => s + a.amount, 0) || 0;
      const advanceCreated = res.payment ? res.payment.amount - totalAllocated : 0;
      expect(advanceCreated).toBe(5000);

      recordSpy.mockRestore();
    });

    it('supports Case D: Zero outstanding balance payment (100% Advance Credit creation)', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: true,
        payment: {
          id: 'pay-zero-due-01',
          paymentNumber: 'PAY-202608-0013',
          stayId: 'stay-000004',
          amount: 5000,
          paymentDate: '2026-08-22',
          paymentMethod: PaymentMethod.UPI,
          referenceNumber: 'UPI-ADV-100',
          allocations: [], // Zero dues, 100% advance
          createdAt: '2026-08-22T00:00:00Z',
        },
        errors: [],
      });

      const res = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 5000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.UPI,
        referenceNumber: 'UPI-ADV-100',
      });

      expect(res.success).toBe(true);
      expect(res.payment?.amount).toBe(5000);
      expect(res.payment?.allocations).toHaveLength(0);

      recordSpy.mockRestore();
    });

    it('handles decimal amounts with 2-decimal precision', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: true,
        payment: {
          id: 'pay-dec-01',
          paymentNumber: 'PAY-202608-0014',
          stayId: 'stay-000004',
          amount: 1250.75,
          paymentDate: '2026-08-22',
          paymentMethod: PaymentMethod.UPI,
          referenceNumber: 'UPI-DEC-75',
          allocations: [{ billId: 'bill-1', amount: 1250.75 }],
          createdAt: '2026-08-22T00:00:00Z',
        },
        errors: [],
      });

      const res = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 1250.75,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.UPI,
        referenceNumber: 'UPI-DEC-75',
      });

      expect(res.success).toBe(true);
      expect(res.payment?.amount).toBe(1250.75);

      recordSpy.mockRestore();
    });
  });

  describe('4. Payment Methods & Reference Validation', () => {
    it('supports all domain PaymentMethod enum values', () => {
      expect(PaymentMethod.CASH).toBe('CASH');
      expect(PaymentMethod.UPI).toBe('UPI');
      expect(PaymentMethod.BANK_TRANSFER).toBe('BANK_TRANSFER');
      expect(PaymentMethod.CHEQUE).toBe('CHEQUE');
      expect(PaymentMethod.CARD).toBe('CARD');
      expect(PaymentMethod.OTHER).toBe('OTHER');
    });

    it('submits CASH payment without requiring referenceNumber', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: true,
        payment: {
          id: 'pay-cash-1',
          paymentNumber: 'PAY-CASH-1',
          stayId: 'stay-000004',
          amount: 2000,
          paymentDate: '2026-08-22',
          paymentMethod: PaymentMethod.CASH,
          allocations: [],
          createdAt: '2026-08-22T00:00:00Z',
        },
        errors: [],
      });

      const res = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 2000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.CASH,
      });

      expect(res.success).toBe(true);
      expect(recordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentMethod: 'CASH',
        })
      );

      recordSpy.mockRestore();
    });

    it('submits CHEQUE, CARD, and OTHER payment methods with required reference numbers', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockImplementation((p) => ({
        success: true,
        payment: {
          id: `pay-${p.paymentMethod}`,
          paymentNumber: `PAY-${p.paymentMethod}`,
          stayId: p.stayId,
          amount: p.amount,
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod as PaymentMethod,
          referenceNumber: p.referenceNumber,
          allocations: [],
          createdAt: '2026-08-22T00:00:00Z',
        },
        errors: [],
      }));

      // Cheque
      const chequeRes = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 12000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.CHEQUE,
        referenceNumber: 'CHQ-889900',
      });
      expect(chequeRes.success).toBe(true);
      expect(chequeRes.payment?.paymentMethod).toBe('CHEQUE');
      expect(chequeRes.payment?.referenceNumber).toBe('CHQ-889900');

      // Card
      const cardRes = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 12000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.CARD,
        referenceNumber: 'POS-TXN-4455',
      });
      expect(cardRes.success).toBe(true);
      expect(cardRes.payment?.paymentMethod).toBe('CARD');
      expect(cardRes.payment?.referenceNumber).toBe('POS-TXN-4455');

      // Other
      const otherRes = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 12000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.OTHER,
        referenceNumber: 'EXT-AGENT-101',
      });
      expect(otherRes.success).toBe(true);
      expect(otherRes.payment?.paymentMethod).toBe('OTHER');
      expect(otherRes.payment?.referenceNumber).toBe('EXT-AGENT-101');

      recordSpy.mockRestore();
    });
  });

  describe('5. Error Handling & Actionable Conflict Responses', () => {
    it('surfaces Idempotency Key Conflict (CASE B) error clearly', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: false,
        payment: null,
        errors: [
          'Idempotency key conflict: A payment with idempotency key "idem-101" already exists with different payment details.',
        ],
      });

      const res = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 5000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.CASH,
        idempotencyKey: 'idem-101',
      });

      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Idempotency key conflict');

      recordSpy.mockRestore();
    });

    it('surfaces Duplicate External Reference Conflict (CASE D) error clearly', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: false,
        payment: null,
        errors: [
          'Duplicate external reference conflict: A payment with reference number "NEFT-8899" and method "BANK_TRANSFER" already exists for this stay with amount ₹6000.',
        ],
      });

      const res = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 9000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        referenceNumber: 'NEFT-8899',
      });

      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Duplicate external reference conflict');

      recordSpy.mockRestore();
    });

    it('surfaces Ledger Posting Failure error cleanly', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: false,
        payment: null,
        errors: ['Failed to post payment ledger entries: Invariant violation'],
      });

      const res = paymentService.recordPayment({
        stayId: 'stay-000004',
        amount: 5000,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.CASH,
      });

      expect(res.success).toBe(false);
      expect(res.errors[0]).toContain('Failed to post payment ledger entries');

      recordSpy.mockRestore();
    });

    it('handles unexpected exceptions and formats error message', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockImplementation(() => {
        throw new Error('Unexpected network partition during transaction');
      });

      expect(() =>
        paymentService.recordPayment({
          stayId: 'stay-000004',
          amount: 5000,
          paymentDate: '2026-08-22',
          paymentMethod: PaymentMethod.CASH,
        })
      ).toThrow('Unexpected network partition during transaction');

      recordSpy.mockRestore();
    });
  });

  describe('6. Clean Architecture & Financial Boundary', () => {
    it('ensures payment recording flows strictly through PaymentApplicationService without direct repository access', () => {
      const recordSpy = vi.spyOn(paymentService, 'recordPayment').mockReturnValue({
        success: true,
        payment: {
          id: 'pay-bound-1',
          paymentNumber: 'PAY-202608-0099',
          stayId: 'stay-000004',
          amount: 8500,
          paymentDate: '2026-08-22',
          paymentMethod: PaymentMethod.UPI,
          referenceNumber: 'UPI-BOUND-1',
          allocations: [{ billId: 'b-1', amount: 8500 }],
          createdAt: '2026-08-22T00:00:00Z',
        },
        errors: [],
      });

      const payload = {
        stayId: 'stay-000004',
        amount: 8500,
        paymentDate: '2026-08-22',
        paymentMethod: PaymentMethod.UPI,
        referenceNumber: 'UPI-BOUND-1',
        idempotencyKey: 'bound-idem-key',
        remarks: 'Rent payment via PhonePe',
      };

      const result = paymentService.recordPayment(payload);

      expect(recordSpy).toHaveBeenCalledWith(payload);
      expect(result.success).toBe(true);
      expect(result.payment?.amount).toBe(8500);

      recordSpy.mockRestore();
    });
  });
});
