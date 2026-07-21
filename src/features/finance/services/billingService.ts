import type { Bill, BillType, BillLineItem, BillStatus } from '../types';
import { AccountType } from '../types';
import { financeStorage } from '../storage/financeStorage';
import { ledgerService } from './ledgerService';
import { stayService } from '../../residents/stay';

export interface CreateBillResult {
  success: boolean;
  bill: Bill | null;
  errors: string[];
}

export const billingService = {
  /**
   * Helper: Validate billing period string format (YYYY-MM).
   */
  validatePeriod(period: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
  },

  /**
   * Fetch all bills stored in the system.
   */
  getAllBills(): Bill[] {
    return financeStorage.getStoredBills();
  },

  /**
   * Fetch all bills associated with a specific Stay ID.
   * 
   * @param stayId The Stay ID to retrieve bills for
   * @returns Array of matching Bill objects
   */
  getBillsByStayId(stayId: string): Bill[] {
    const bills = this.getAllBills();
    return bills.filter((b) => b.stayId === stayId);
  },

  /**
   * Fetch a single bill by its ID.
   */
  getBillById(id: string): Bill | null {
    const bills = this.getAllBills();
    return bills.find((b) => b.id === id) || null;
  },

  /**
   * Check if a Monthly Rent bill already exists for a Stay in a specific billing period.
   * Prevents duplicate rent generation.
   */
  checkDuplicateMonthlyRentBill(stayId: string, billingPeriod: string): boolean {
    const bills = this.getBillsByStayId(stayId);
    return bills.some(
      (b) => b.billType === 'MONTHLY_RENT' && b.period === billingPeriod && b.status !== 'CANCELLED'
    );
  },

  /**
   * Create, persist, and post balanced ledger entries for a new Bill.
   * Single entry point for all bill creations.
   */
  createBill(
    billPayload: Omit<Bill, 'id' | 'billNumber' | 'paidAmount' | 'balanceAmount' | 'createdAt' | 'updatedAt'>
  ): CreateBillResult {
    const errors: string[] = [];

    if (!billPayload.stayId || billPayload.stayId.trim() === '') {
      errors.push('Missing or invalid stayId.');
    }

    if (!billPayload.period || !this.validatePeriod(billPayload.period)) {
      errors.push(`Invalid billing period '${billPayload.period}'. Must be in YYYY-MM format.`);
    }

    if (typeof billPayload.totalAmount !== 'number' || isNaN(billPayload.totalAmount) || billPayload.totalAmount <= 0) {
      errors.push('Bill total amount must be a positive number greater than zero.');
    }

    if (!billPayload.lineItems || billPayload.lineItems.length === 0) {
      errors.push('Bill must contain at least one line item.');
    }

    if (errors.length > 0) {
      return { success: false, bill: null, errors };
    }

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const existingBills = this.getAllBills();
    const sequenceNum = String(existingBills.length + 1).padStart(4, '0');
    const periodTag = billPayload.period.replace('-', '');
    const billNumber = `BIL-${periodTag}-${sequenceNum}`;

    const newBill: Bill = {
      id: `bil_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      stayId: billPayload.stayId,
      billNumber,
      billType: billPayload.billType,
      period: billPayload.period,
      issueDate: billPayload.issueDate || todayStr,
      dueDate: billPayload.dueDate || todayStr,
      lineItems: billPayload.lineItems,
      totalAmount: billPayload.totalAmount,
      paidAmount: 0,
      balanceAmount: billPayload.totalAmount,
      status: billPayload.status || ('UNPAID' as BillStatus),
      remarks: billPayload.remarks,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Determine Revenue target account (Damage Recovery vs Rent Revenue)
    const revenueAccount =
      billPayload.billType === 'ONE_TIME_CHARGE' &&
      billPayload.lineItems.some((item) => item.description.toLowerCase().includes('damage'))
        ? AccountType.DAMAGE_RECOVERY
        : AccountType.RENT_REVENUE;

    // 2. Post balanced double-entry ledger records
    const postingResult = ledgerService.postEntries([
      {
        stayId: newBill.stayId,
        postingDate: todayStr,
        effectiveDate: newBill.issueDate,
        referenceType: 'BILL',
        referenceId: newBill.id,
        account: AccountType.ACCOUNTS_RECEIVABLE,
        debit: newBill.totalAmount,
        credit: 0,
        remarks: `Bill #${newBill.billNumber}: ${newBill.remarks || newBill.billType}`,
        createdBy: 'BILLING_ENGINE',
      },
      {
        stayId: newBill.stayId,
        postingDate: todayStr,
        effectiveDate: newBill.issueDate,
        referenceType: 'BILL',
        referenceId: newBill.id,
        account: revenueAccount,
        debit: 0,
        credit: newBill.totalAmount,
        remarks: `Revenue recognition for Bill #${newBill.billNumber}`,
        createdBy: 'BILLING_ENGINE',
      },
    ]);

    if (!postingResult.success) {
      return {
        success: false,
        bill: null,
        errors: [`Failed to post ledger entries: ${postingResult.errors.join(', ')}`],
      };
    }

    // 3. Persist bill to storage
    this.saveBills([...existingBills, newBill]);

    return {
      success: true,
      bill: newBill,
      errors: [],
    };
  },

  /**
   * Helper: Save full array of bills to storage.
   */
  saveBills(bills: Bill[]): void {
    financeStorage.saveStoredBills(bills);
  },

  /**
   * Generate a monthly recurring rent bill for a Stay.
   * Validates stay, billing period, rent amount, and prevents duplicate monthly rent bill generation.
   * Posts corresponding balanced DEBIT entry to the ledger.
   * 
   * @param stayId Target Stay ID
   * @param billingPeriod Target billing period (YYYY-MM)
   * @returns CreateBillResult object
   */
  generateMonthlyRentBill(stayId: string, billingPeriod: string): CreateBillResult {
    if (!stayId || stayId.trim() === '') {
      return { success: false, bill: null, errors: ['Missing or invalid stayId.'] };
    }

    if (!this.validatePeriod(billingPeriod)) {
      return {
        success: false,
        bill: null,
        errors: [`Invalid billing period '${billingPeriod}'. Expected YYYY-MM format.`],
      };
    }

    // Check duplicate
    if (this.checkDuplicateMonthlyRentBill(stayId, billingPeriod)) {
      return {
        success: false,
        bill: null,
        errors: [`Monthly rent bill already exists for Stay '${stayId}' in period '${billingPeriod}'.`],
      };
    }

    // Retrieve Stay to get agreedRent
    const stay = stayService.getStay(stayId);
    const rentAmount = stay ? stay.agreedRent : 0;

    if (!stay || rentAmount <= 0) {
      return {
        success: false,
        bill: null,
        errors: [`Stay '${stayId}' not found or has invalid agreed rent amount (${rentAmount}).`],
      };
    }

    const issueDate = `${billingPeriod}-01`;
    const dueDate = `${billingPeriod}-07`;

    const lineItems: BillLineItem[] = [
      {
        id: `li_${Date.now()}_1`,
        description: `Monthly Rent - ${billingPeriod}`,
        amount: rentAmount,
        category: 'RENT',
      },
    ];

    return this.createBill({
      stayId,
      billType: 'MONTHLY_RENT' as BillType,
      period: billingPeriod,
      issueDate,
      dueDate,
      lineItems,
      totalAmount: rentAmount,
      status: 'UNPAID' as BillStatus,
      remarks: `Monthly Rent for ${billingPeriod}`,
    });
  },

  /**
   * Generate a recurring service charge bill for a Stay (e.g. Wi-Fi, Parking, Laundry).
   * Posts balanced double-entry ledger entries.
   * 
   * @param stayId Target Stay ID
   * @param billingPeriod Target billing period (YYYY-MM)
   * @param chargeType Type/name of recurring charge
   * @param description Description of service
   * @param amount Non-negative charge amount
   * @returns CreateBillResult object
   */
  generateRecurringChargeBill(
    stayId: string,
    billingPeriod: string,
    chargeType: string,
    description: string,
    amount: number
  ): CreateBillResult {
    if (amount <= 0) {
      return { success: false, bill: null, errors: ['Recurring charge amount must be greater than zero.'] };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const lineItems: BillLineItem[] = [
      {
        id: `li_${Date.now()}_1`,
        description: description || `${chargeType} Fee`,
        amount,
        category: 'UTILITIES',
      },
    ];

    return this.createBill({
      stayId,
      billType: 'RECURRING_CHARGE' as BillType,
      period: billingPeriod,
      issueDate: todayStr,
      dueDate: todayStr,
      lineItems,
      totalAmount: amount,
      status: 'UNPAID' as BillStatus,
      remarks: `Recurring ${chargeType} Charge (${billingPeriod})`,
    });
  },

  /**
   * Generate a one-time charge bill for a Stay (e.g. Damage Recovery, Cleaning, Penalty).
   * Posts balanced double-entry ledger entries.
   * 
   * @param stayId Target Stay ID
   * @param chargeType Type of charge
   * @param description Detailed description of charge
   * @param amount Non-negative charge amount
   * @param category Line item category (default: 'OTHER')
   * @returns CreateBillResult object
   */
  generateOneTimeChargeBill(
    stayId: string,
    chargeType: string,
    description: string,
    amount: number,
    category: 'RENT' | 'SECURITY_DEPOSIT' | 'UTILITIES' | 'MAINTENANCE' | 'OTHER' = 'OTHER'
  ): CreateBillResult {
    if (amount <= 0) {
      return { success: false, bill: null, errors: ['One-time charge amount must be greater than zero.'] };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const periodStr = todayStr.slice(0, 7);

    const lineItems: BillLineItem[] = [
      {
        id: `li_${Date.now()}_1`,
        description: description || `${chargeType} Charge`,
        amount,
        category,
      },
    ];

    return this.createBill({
      stayId,
      billType: 'ONE_TIME_CHARGE' as BillType,
      period: periodStr,
      issueDate: todayStr,
      dueDate: todayStr,
      lineItems,
      totalAmount: amount,
      status: 'UNPAID' as BillStatus,
      remarks: `One-Time ${chargeType} Charge`,
    });
  },
};
