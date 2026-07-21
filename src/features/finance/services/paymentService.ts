import type { Payment } from '../types';
import { financeStorage } from '../storage/financeStorage';

export const paymentService = {
  /**
   * Fetch all payments associated with a specific Stay ID.
   * 
   * @param stayId The Stay ID to retrieve payments for
   * @returns Array of matching Payment objects
   */
  getPaymentsByStayId(stayId: string): Payment[] {
    const payments = financeStorage.getStoredPayments();
    return payments.filter((p) => p.stayId === stayId);
  },

  /**
   * Record a payment received for a Stay, allocate it against open bills, and post ledger CREDIT entry.
   * 
   * @param _paymentData Data required to construct a Payment
   * @returns Created Payment stub
   */
  recordPayment(_paymentData: Omit<Payment, 'id' | 'createdAt'>): Payment | null {
    // Skeleton stub for Sprint F1
    return null;
  },
};
