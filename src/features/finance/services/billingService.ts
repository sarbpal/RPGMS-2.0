import type {
  Bill,
  BillStatus,
  BillType,
  BillLineItem,
  PaymentAllocation,
  FinanceRepository,
} from '../domain';
import { AccountType, LedgerReferenceType, hasDuplicateRentBill, calculatePaymentAllocations } from '../domain';
import { defaultFinanceRepository } from '../infrastructure';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import { defaultStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { LedgerApplicationService } from './ledgerService';

export interface CreateBillResult {
  success: boolean;
  bill: Bill | null;
  errors: string[];
}

export class BillingApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;
  private ledgerService: LedgerApplicationService;

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = defaultStayRepository,
    ledgerService?: LedgerApplicationService
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
    this.ledgerService = ledgerService ?? new LedgerApplicationService(repository, stayRepository);
  }

  /**
   * Helper: Validate billing period string format (YYYY-MM).
   */
  public validatePeriod(period: string): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
  }

  /**
   * Application Use Case: Fetch all bills stored in the system.
   */
  public getAllBills(): Bill[] {
    return this.repository.getBills();
  }

  /**
   * Application Use Case: Fetch all bills associated with a specific Stay ID.
   */
  public getBillsByStayId(stayId: string): Bill[] {
    return this.repository.getBillsByStayId(stayId);
  }

  /**
   * Application Use Case: Fetch a single bill by its ID.
   */
  public getBillById(id: string): Bill | null {
    const bills = this.getAllBills();
    return bills.find((b) => b.id === id) || null;
  }

  /**
   * Application Use Case: Check if a Monthly Rent bill already exists for a Stay in a specific billing period.
   * Delegates duplicate invariant check to domain rule hasDuplicateRentBill.
   */
  public checkDuplicateMonthlyRentBill(stayId: string, billingPeriod: string): boolean {
    const bills = this.getAllBills();
    return hasDuplicateRentBill(bills, stayId, billingPeriod);
  }

  /**
   * Application Use Case: Create, persist, and post balanced ledger entries for a new Bill.
   * Coordinates bill creation workflow.
   */
  public createBill(
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
    const periodTag = billPayload.period.replace('-', '');
    const existingBills = this.getAllBills();
    const sequenceNum = String(existingBills.length + 1).padStart(4, '0');
    const billNumber = `INV-${periodTag}-${sequenceNum}`;
    const billId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Select credit account: UTILITIES line items route to ELECTRICITY_REVENUE, SECURITY_DEPOSIT to SECURITY_DEPOSIT_LIABILITY, LAUNDRY to LAUNDRY_REVENUE, others to RENT_REVENUE
    const isElectricity = billPayload.lineItems.some((item) => item.category === 'UTILITIES');
    const isDeposit = billPayload.lineItems.some((item) => item.category === 'SECURITY_DEPOSIT');
    const isLaundry = billPayload.lineItems.some((item) => item.category === 'LAUNDRY');
    const revenueAccount = isElectricity
      ? AccountType.ELECTRICITY_REVENUE
      : isDeposit
      ? AccountType.SECURITY_DEPOSIT_LIABILITY
      : isLaundry
      ? AccountType.LAUNDRY_REVENUE
      : AccountType.RENT_REVENUE;
    const referenceType: LedgerReferenceType = isElectricity
      ? LedgerReferenceType.ELECTRICITY_ALLOCATION
      : isLaundry
      ? LedgerReferenceType.LAUNDRY_CHARGE
      : LedgerReferenceType.BILL;

    // Post double-entry ledger entries: Debit ACCOUNTS_RECEIVABLE, Credit RENT_REVENUE, ELECTRICITY_REVENUE, LAUNDRY_REVENUE, or SECURITY_DEPOSIT_LIABILITY
    const ledgerResult = this.ledgerService.postEntries([
      {
        stayId: billPayload.stayId,
        postingDate: now.split('T')[0],
        effectiveDate: billPayload.issueDate,
        referenceType,
        referenceId: billId,
        account: AccountType.ACCOUNTS_RECEIVABLE,
        debit: billPayload.totalAmount,
        credit: 0,
        remarks: `Invoice #${billNumber} - ${billPayload.billType} (${billPayload.period})`,
        createdBy: 'BILLING_ENGINE',
      },
      {
        stayId: billPayload.stayId,
        postingDate: now.split('T')[0],
        effectiveDate: billPayload.issueDate,
        referenceType,
        referenceId: billId,
        account: revenueAccount,
        debit: 0,
        credit: billPayload.totalAmount,
        remarks: `Revenue recognition for Invoice #${billNumber}`,
        createdBy: 'BILLING_ENGINE',
      },
    ]);

    if (!ledgerResult.success) {
      return {
        success: false,
        bill: null,
        errors: [`Failed to post bill ledger entries: ${ledgerResult.errors.join(', ')}`],
      };
    }

    const newBill: Bill = {
      ...billPayload,
      id: billId,
      billNumber,
      paidAmount: 0,
      balanceAmount: billPayload.totalAmount,
      status: billPayload.status || 'UNPAID',
      createdAt: now,
      updatedAt: now,
    };

    this.repository.saveBill(newBill);

    return {
      success: true,
      bill: newBill,
      errors: [],
    };
  }

  /**
   * Application Use Case: Allocate a payment amount across open bills for a Stay.
   * Delegates payment allocation logic to domain rule calculatePaymentAllocations.
   */
  public allocatePaymentToBills(stayId: string, paymentAmount: number): PaymentAllocation[] {
    if (paymentAmount <= 0) return [];

    const openBills = this.getBillsByStayId(stayId).filter(
      (b) => b.status === 'UNPAID' || b.status === 'PARTIALLY_PAID'
    );

    const { updatedBills, allocations } = calculatePaymentAllocations(openBills, paymentAmount);

    if (updatedBills.length > 0) {
      const allBills = this.getAllBills();
      updatedBills.forEach((ub) => {
        const idx = allBills.findIndex((b) => b.id === ub.id);
        if (idx >= 0) {
          allBills[idx] = ub;
        }
      });
      this.repository.saveBills(allBills);
    }

    return allocations;
  }

  /**
   * Application Use Case: Generate a monthly recurring rent bill for a Stay.
   */
  public generateMonthlyRentBill(
    stayId: string,
    billingPeriod: string,
    customRemarks?: string,
    customDueDate?: string
  ): CreateBillResult {
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

    if (this.checkDuplicateMonthlyRentBill(stayId, billingPeriod)) {
      return {
        success: false,
        bill: null,
        errors: [`Monthly rent bill already exists for Stay '${stayId}' in period '${billingPeriod}'.`],
      };
    }

    const stay = this.stayRepository.findByIdSync(stayId);
    const rentAmount = stay ? stay.agreedRent : 0;

    if (!stay || rentAmount <= 0) {
      return {
        success: false,
        bill: null,
        errors: [`Stay '${stayId}' not found or has invalid agreed rent amount (${rentAmount}).`],
      };
    }

    const issueDate = `${billingPeriod}-01`;
    const dueDate = customDueDate || `${billingPeriod}-07`;

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
      remarks: customRemarks || `Monthly Rent for ${billingPeriod}`,
    });
  }

  /**
   * Application Use Case: Generate a recurring service charge bill for a Stay.
   */
  public generateRecurringChargeBill(
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
  }

  /**
   * Application Use Case: Generate a one-time charge bill for a Stay.
   */
  public generateOneTimeChargeBill(
    stayId: string,
    chargeType: string,
    description: string,
    amount: number,
    category: 'RENT' | 'SECURITY_DEPOSIT' | 'UTILITIES' | 'MAINTENANCE' | 'LAUNDRY' | 'OTHER' = 'OTHER'
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
  }

  /**
   * Application Use Case: Generate an ancillary Laundry Charge bill for a Stay.
   * Posts double-entry ledger entries (Debit ACCOUNTS_RECEIVABLE, Credit LAUNDRY_REVENUE) via ledgerService,
   * updates resident outstanding balance, and persists the Bill entity.
   */
  public generateLaundryChargeBill(
    stayId: string,
    amount: number,
    chargeDate?: string,
    description?: string,
    remarks?: string
  ): CreateBillResult {
    if (!stayId || stayId.trim() === '') {
      return { success: false, bill: null, errors: ['Missing or invalid stayId.'] };
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return { success: false, bill: null, errors: ['Laundry charge amount must be a positive number greater than zero.'] };
    }

    const effectiveDate = chargeDate || new Date().toISOString().split('T')[0];
    const periodStr = effectiveDate.slice(0, 7);

    const lineItems: BillLineItem[] = [
      {
        id: `li_${Date.now()}_1`,
        description: description || 'Laundry Service Charge',
        amount,
        category: 'LAUNDRY',
      },
    ];

    return this.createBill({
      stayId,
      billType: 'ONE_TIME_CHARGE' as BillType,
      period: periodStr,
      issueDate: effectiveDate,
      dueDate: effectiveDate,
      lineItems,
      totalAmount: amount,
      status: 'UNPAID' as BillStatus,
      remarks: remarks || description || `Laundry Charge (${effectiveDate})`,
    });
  }

  /**
   * Application Use Case: Check if an electricity allocation bill has already been posted to Finance.
   * Enforces idempotency using LedgerReferenceType.ELECTRICITY_ALLOCATION and participantAllocationId.
   */
  public hasDuplicateElectricityBill(participantAllocationId: string): boolean {
    if (!participantAllocationId) return false;
    const entries = this.repository.getLedgerEntries();
    return entries.some(
      (e) => e.referenceType === 'ELECTRICITY_ALLOCATION' && e.referenceId === participantAllocationId
    );
  }

  /**
   * Application Use Case: Check if a laundry charge bill has already been posted to Finance.
   * Enforces idempotency using lineItem.obligationKey (businessChargeId).
   */
  public hasDuplicateLaundryCharge(businessChargeId: string): boolean {
    if (!businessChargeId) return false;
    const bills = this.repository.getBills();
    return bills.some((b) =>
      b.lineItems.some((li) => li.obligationKey === businessChargeId)
    );
  }
}

export const billingService = new BillingApplicationService();
export const defaultBillingService = billingService;
