import type { Bill } from '../types';
import { financeStorage } from '../storage/financeStorage';

export const billingService = {
  /**
   * Fetch all bills associated with a specific Stay ID.
   * 
   * @param stayId The Stay ID to retrieve bills for
   * @returns Array of matching Bill objects
   */
  getBillsByStayId(stayId: string): Bill[] {
    const bills = financeStorage.getStoredBills();
    return bills.filter((b) => b.stayId === stayId);
  },

  /**
   * Create and persist a new rent or service bill for a Stay.
   * Posts corresponding DEBIT entry to the ledger via ledgerService.
   * 
   * @param _billData Data required to construct a Bill
   * @returns Created Bill stub
   */
  createBill(_billData: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>): Bill | null {
    // Skeleton stub for Sprint F1
    return null;
  },

  /**
   * Generate a monthly recurring rent bill for a Stay, applying pro-ration if required.
   * 
   * @param _stayId Target Stay ID
   * @param _period Target billing period (e.g. '2026-07')
   * @returns Generated Bill stub
   */
  generateMonthlyRentBill(_stayId: string, _period: string): Bill | null {
    // Skeleton stub for Sprint F1
    return null;
  },
};
