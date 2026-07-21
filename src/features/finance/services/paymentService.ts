import type { Payment, PaymentMethod, PaymentAllocation, LedgerEntry } from '../types';
import { AccountType } from '../types';
import { financeStorage } from '../storage/financeStorage';
import { ledgerService } from './ledgerService';
import { balanceEngine } from './balanceEngine';
import { billingService } from './billingService';

export interface RecordPaymentResult {
  success: boolean;
  payment: Payment | null;
  errors: string[];
}

export const paymentService = {
  /**
   * Fetch all payments stored in the system.
   */
  getAllPayments(): Payment[] {
    return financeStorage.getStoredPayments();
  },

  /**
   * Fetch all payments associated with a specific Stay ID.
   * 
   * @param stayId Target Stay ID
   * @returns Array of matching Payment objects
   */
  getPaymentsByStayId(stayId: string): Payment[] {
    const payments = this.getAllPayments();
    return payments.filter((p) => p.stayId === stayId);
  },

  /**
   * Fetch a single payment by its unique ID.
   */
  getPaymentById(id: string): Payment | null {
    const payments = this.getAllPayments();
    return payments.find((p) => p.id === id) || null;
  },

  /**
   * Record a payment received for a Stay, post balanced double-entry ledger transactions,
   * handle overpayments via Advance Credit, allocate payment across open bills, and persist payment.
   * 
   * @param paymentPayload Data required to construct a Payment
   * @returns RecordPaymentResult object containing success status, Payment object, and error list
   */
  recordPayment(
    paymentPayload: Omit<Payment, 'id' | 'paymentNumber' | 'allocations' | 'createdAt'>
  ): RecordPaymentResult {
    const errors: string[] = [];

    if (!paymentPayload.stayId || paymentPayload.stayId.trim() === '') {
      errors.push('Missing or invalid stayId.');
    }

    if (typeof paymentPayload.amount !== 'number' || isNaN(paymentPayload.amount) || paymentPayload.amount <= 0) {
      errors.push('Payment amount must be a positive number greater than zero.');
    }

    if (!paymentPayload.paymentDate || paymentPayload.paymentDate.trim() === '') {
      errors.push('Missing paymentDate.');
    }

    if (!paymentPayload.paymentMethod) {
      errors.push('Missing paymentMethod.');
    }

    if (errors.length > 0) {
      return { success: false, payment: null, errors };
    }

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const periodTag = todayStr.slice(0, 7).replace('-', '');
    const existingPayments = this.getAllPayments();
    const sequenceNum = String(existingPayments.length + 1).padStart(4, '0');
    const paymentNumber = `PAY-${periodTag}-${sequenceNum}`;

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. Determine Debit Account (Cash vs Bank)
    const debitAccount =
      paymentPayload.paymentMethod === 'CASH' ? AccountType.CASH : AccountType.BANK;

    // 2. Calculate Receivable vs Advance Credit portions
    const outstandingReceivable = balanceEngine.getAccountBalance(
      paymentPayload.stayId,
      AccountType.ACCOUNTS_RECEIVABLE
    );

    const receivablePortion = Math.min(paymentPayload.amount, outstandingReceivable);
    const advancePortion = Math.round((paymentPayload.amount - receivablePortion) * 100) / 100;

    // 3. Construct double-entry ledger postings
    const ledgerEntriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[] = [
      {
        stayId: paymentPayload.stayId,
        postingDate: todayStr,
        effectiveDate: paymentPayload.paymentDate,
        referenceType: 'PAYMENT',
        referenceId: paymentId,
        account: debitAccount,
        debit: paymentPayload.amount,
        credit: 0,
        remarks: `Payment #${paymentNumber} via ${paymentPayload.paymentMethod}`,
        createdBy: 'PAYMENT_ENGINE',
      },
    ];

    if (receivablePortion > 0) {
      ledgerEntriesData.push({
        stayId: paymentPayload.stayId,
        postingDate: todayStr,
        effectiveDate: paymentPayload.paymentDate,
        referenceType: 'PAYMENT' as const,
        referenceId: paymentId,
        account: AccountType.ACCOUNTS_RECEIVABLE,
        debit: 0,
        credit: receivablePortion,
        remarks: `Receivable reduction for Payment #${paymentNumber}`,
        createdBy: 'PAYMENT_ENGINE',
      });
    }

    if (advancePortion > 0) {
      ledgerEntriesData.push({
        stayId: paymentPayload.stayId,
        postingDate: todayStr,
        effectiveDate: paymentPayload.paymentDate,
        referenceType: 'PAYMENT' as const,
        referenceId: paymentId,
        account: AccountType.ADVANCE_CREDIT,
        debit: 0,
        credit: advancePortion,
        remarks: `Advance credit overpayment for Payment #${paymentNumber}`,
        createdBy: 'PAYMENT_ENGINE',
      });
    }

    // 4. Post balanced ledger entries
    const postingResult = ledgerService.postEntries(ledgerEntriesData);
    if (!postingResult.success) {
      return {
        success: false,
        payment: null,
        errors: [`Failed to post payment ledger entries: ${postingResult.errors.join(', ')}`],
      };
    }

    // 5. Allocate receivable portion across open bills
    let allocations: PaymentAllocation[] = [];
    if (receivablePortion > 0) {
      allocations = billingService.allocatePaymentToBills(
        paymentPayload.stayId,
        receivablePortion
      );
    }

    // 6. Create and persist Payment record
    const newPayment: Payment = {
      id: paymentId,
      stayId: paymentPayload.stayId,
      paymentNumber,
      paymentDate: paymentPayload.paymentDate,
      amount: paymentPayload.amount,
      paymentMethod: paymentPayload.paymentMethod as PaymentMethod,
      referenceNumber: paymentPayload.referenceNumber,
      allocations,
      remarks: paymentPayload.remarks,
      createdAt: now,
    };

    financeStorage.saveStoredPayments([...existingPayments, newPayment]);

    return {
      success: true,
      payment: newPayment,
      errors: [],
    };
  },
};
