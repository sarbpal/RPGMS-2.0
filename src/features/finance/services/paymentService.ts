import type {
  Payment,
  PaymentMethod,
  PaymentAllocation,
  LedgerEntry,
  FinanceRepository,
  Bill,
  AdvanceAllocation,
} from '../domain';
import { AccountType, LedgerReferenceType, BillStatus, calculateAdvanceAllocations } from '../domain';
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

export interface ApplyAdvanceCreditResult {
  success: boolean;
  stayId: string;
  consumedTotal: number;
  remainingAdvanceCredit: number;
  updatedBills: Bill[];
  allocations: AdvanceAllocation[];
  ledgerEntryIds: string[];
  errors: string[];
}

export class PaymentApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;
  private billingService?: BillingApplicationService;
  private ledgerService: LedgerApplicationService;

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = defaultStayRepository,
    billingService?: BillingApplicationService,
    ledgerService?: LedgerApplicationService
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
    this.billingService = billingService;
    this.ledgerService = ledgerService ?? new LedgerApplicationService(repository, stayRepository);
  }

  private getBillingService(): BillingApplicationService {
    if (!this.billingService) {
      this.billingService = new BillingApplicationService(
        this.repository,
        this.stayRepository,
        this.ledgerService,
        this
      );
    }
    return this.billingService;
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
      allocations = this.getBillingService().allocatePaymentToBills(
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

  private static activeStayLocks = new Set<string>();

  /**
   * Application Use Case: Apply available Advance Credit for a Stay against open unpaid bills.
   * Enforces FC-03A Finance-owned Advance Credit auto-consumption architecture.
   *
   * 1. Evaluates available Advance Credit liability from Ledger via balanceEngine.
   * 2. Queries open unpaid bills for the Stay, cross-verifying against existing ADV-APP ledger entries.
   * 3. Calculates deterministic allocations via pure domain rule calculateAdvanceAllocations.
   * 4. Posts balanced double-entry ledger entries (Debit ADVANCE_CREDIT, Credit ACCOUNTS_RECEIVABLE).
   * 5. Updates and persists Bill financial realization states (paidAmount, balanceAmount, status).
   * 6. Implements concurrency locking and deterministic idempotency (ADV-APP:${bill.id}).
   */
  public applyAdvanceCreditToBills(stayId: string): ApplyAdvanceCreditResult {
    if (!stayId || stayId.trim() === '') {
      return {
        success: false,
        stayId: '',
        consumedTotal: 0,
        remainingAdvanceCredit: 0,
        updatedBills: [],
        allocations: [],
        ledgerEntryIds: [],
        errors: ['Missing or invalid stayId.'],
      };
    }

    // Concurrency protection: prevent overlapping executions on the same Stay
    if (PaymentApplicationService.activeStayLocks.has(stayId)) {
      const currentAdvance = balanceEngine.getAccountBalance(stayId, AccountType.ADVANCE_CREDIT);
      return {
        success: true,
        stayId,
        consumedTotal: 0,
        remainingAdvanceCredit: currentAdvance,
        updatedBills: [],
        allocations: [],
        ledgerEntryIds: [],
        errors: [],
      };
    }

    PaymentApplicationService.activeStayLocks.add(stayId);

    try {
      // 1. Determine available Advance Credit liability from Ledger
      const availableAdvance = balanceEngine.getAccountBalance(
        stayId,
        AccountType.ADVANCE_CREDIT
      );

      if (availableAdvance <= 0) {
        return {
          success: true,
          stayId,
          consumedTotal: 0,
          remainingAdvanceCredit: 0,
          updatedBills: [],
          allocations: [],
          ledgerEntryIds: [],
          errors: [],
        };
      }

      // 2. Fetch all bills and existing ledger entries for the Stay
      const stayBills = this.repository.getBillsByStayId(stayId);
      const existingLedgerEntries = this.repository.getLedgerEntriesByStayId(stayId);

      // Map already-applied advance amounts from Ledger by bill ID to enforce idempotency
      const existingAdvAppMap = new Map<string, number>();
      for (const entry of existingLedgerEntries) {
        if (
          entry.referenceType === LedgerReferenceType.ADVANCE_APPLICATION &&
          entry.referenceId.startsWith('ADV-APP:') &&
          entry.account === AccountType.ADVANCE_CREDIT
        ) {
          const billId = entry.referenceId.replace('ADV-APP:', '');
          const currentSum = existingAdvAppMap.get(billId) || 0;
          existingAdvAppMap.set(billId, Math.round((currentSum + entry.debit) * 100) / 100);
        }
      }

      // Reconcile bills against existing ledger state: if a bill was already 100% covered in ledger, treat as settled
      const reconciledBills = stayBills.map((b) => {
        const alreadyAppliedInLedger = existingAdvAppMap.get(b.id) || 0;
        if (alreadyAppliedInLedger >= b.totalAmount) {
          return {
            ...b,
            paidAmount: b.totalAmount,
            balanceAmount: 0,
            status: BillStatus.PAID,
          };
        }
        return b;
      });

      // 3. Delegate allocation calculation to pure domain rule
      const allocationResult = calculateAdvanceAllocations(reconciledBills, availableAdvance);

      if (allocationResult.allocations.length === 0 || allocationResult.consumedTotal <= 0) {
        return {
          success: true,
          stayId,
          consumedTotal: 0,
          remainingAdvanceCredit: availableAdvance,
          updatedBills: [],
          allocations: [],
          ledgerEntryIds: [],
          errors: [],
        };
      }

      // 4. Construct balanced double-entry ledger postings for each allocation
      const todayStr = new Date().toISOString().split('T')[0];
      const ledgerEntriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[] = [];

      for (const alloc of allocationResult.allocations) {
        const targetBill = allocationResult.updatedBills.find((b) => b.id === alloc.billId);
        const billNumber = targetBill?.billNumber || alloc.billId;
        const refId = `ADV-APP:${alloc.billId}`;

        // Debit ADVANCE_CREDIT (reduces advance liability)
        ledgerEntriesData.push({
          stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.ADVANCE_APPLICATION,
          referenceId: refId,
          account: AccountType.ADVANCE_CREDIT,
          debit: alloc.amount,
          credit: 0,
          remarks: `Advance credit applied to Invoice #${billNumber}`,
          createdBy: 'ADVANCE_ENGINE',
        });

        // Credit ACCOUNTS_RECEIVABLE (reduces invoice receivable asset)
        ledgerEntriesData.push({
          stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.ADVANCE_APPLICATION,
          referenceId: refId,
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 0,
          credit: alloc.amount,
          remarks: `Receivable reduction from Advance Credit for Invoice #${billNumber}`,
          createdBy: 'ADVANCE_ENGINE',
        });
      }

      // 5. Post double-entry entries via ledgerService
      const ledgerResult = this.ledgerService.postEntries(ledgerEntriesData);
      if (!ledgerResult.success) {
        return {
          success: false,
          stayId,
          consumedTotal: 0,
          remainingAdvanceCredit: availableAdvance,
          updatedBills: [],
          allocations: [],
          ledgerEntryIds: [],
          errors: [
            `Failed to post advance application ledger entries: ${ledgerResult.errors.join(', ')}`,
          ],
        };
      }

      // 6. Update and persist Bill financial states
      const allBills = this.repository.getBills();
      allocationResult.updatedBills.forEach((ub) => {
        const idx = allBills.findIndex((b) => b.id === ub.id);
        if (idx >= 0) {
          allBills[idx] = ub;
        }
      });
      this.repository.saveBills(allBills);

      return {
        success: true,
        stayId,
        consumedTotal: allocationResult.consumedTotal,
        remainingAdvanceCredit: allocationResult.remainingAdvance,
        updatedBills: allocationResult.updatedBills,
        allocations: allocationResult.allocations,
        ledgerEntryIds: ledgerResult.entries.map((e) => e.id),
        errors: [],
      };
    } finally {
      PaymentApplicationService.activeStayLocks.delete(stayId);
    }
  }
}

export const paymentService = new PaymentApplicationService();
