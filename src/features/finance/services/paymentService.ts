import type {
  Payment,
  PaymentMethod,
  PaymentAllocation,
  LedgerEntry,
  FinanceRepository,
  LedgerReferenceType,
} from '../domain';
import { AccountType } from '../domain';
import { defaultFinanceRepository } from '../infrastructure';
import { balanceEngine } from './balanceEngine';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import { defaultStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { BillingApplicationService } from './billingService';
import { LedgerApplicationService } from './ledgerService';

export interface RecordPaymentResult {
  success: boolean;
  payment: Payment | null;
  errors: string[];
}

export class PaymentApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;
  private billingService: BillingApplicationService;
  private ledgerService: LedgerApplicationService;

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = defaultStayRepository,
    billingService?: BillingApplicationService,
    ledgerService?: LedgerApplicationService
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
    this.billingService = billingService ?? new BillingApplicationService(repository, stayRepository);
    this.ledgerService = ledgerService ?? new LedgerApplicationService(repository, stayRepository);
  }

  public getStayRepository(): StayRepository {
    return this.stayRepository;
  }

  /**
   * Application Use Case: Fetch all payments stored in the system.
   */
  public getAllPayments(): Payment[] {
    return this.repository.getPayments();
  }

  /**
   * Application Use Case: Fetch all payments associated with a specific Stay ID.
   */
  public getPaymentsByStayId(stayId: string): Payment[] {
    return this.repository.getPaymentsByStayId(stayId);
  }

  /**
   * Application Use Case: Fetch a single payment by its unique ID.
   */
  public getPaymentById(id: string): Payment | null {
    const payments = this.getAllPayments();
    return payments.find((p) => p.id === id) || null;
  }

  /**
   * Application Use Case: Record a payment received for a Stay, post balanced double-entry ledger transactions,
   * handle overpayments via Advance Credit, allocate payment across open bills, and persist payment.
   */
  public recordPayment(
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

    // 2. Calculate Receivable vs Advance Credit portions via balanceEngine
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
        referenceType: 'PAYMENT' as LedgerReferenceType,
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
        referenceType: 'PAYMENT' as LedgerReferenceType,
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
        referenceType: 'PAYMENT' as LedgerReferenceType,
        referenceId: paymentId,
        account: AccountType.ADVANCE_CREDIT,
        debit: 0,
        credit: advancePortion,
        remarks: `Advance credit overpayment for Payment #${paymentNumber}`,
        createdBy: 'PAYMENT_ENGINE',
      });
    }

    // 4. Post balanced ledger entries via ledgerService
    const postingResult = this.ledgerService.postEntries(ledgerEntriesData);
    if (!postingResult.success) {
      return {
        success: false,
        payment: null,
        errors: [`Failed to post payment ledger entries: ${postingResult.errors.join(', ')}`],
      };
    }

    // 5. Allocate receivable portion across open bills via billingService
    let allocations: PaymentAllocation[] = [];
    if (receivablePortion > 0) {
      allocations = this.billingService.allocatePaymentToBills(
        paymentPayload.stayId,
        receivablePortion
      );
    }

    // 6. Create and persist Payment record via repository
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

    this.repository.savePayment(newPayment);

    return {
      success: true,
      payment: newPayment,
      errors: [],
    };
  }
}

export const paymentService = new PaymentApplicationService();
