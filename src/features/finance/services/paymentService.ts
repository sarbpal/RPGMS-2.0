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
import { BalanceApplicationService } from './balanceEngine';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import { defaultStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import { BillingApplicationService } from './billingService';
import { LedgerApplicationService } from './ledgerService';

export interface RecordPaymentPayload {
  stayId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod | string;
  referenceNumber?: string;
  idempotencyKey?: string;
  remarks?: string;
}

export interface RecordPaymentResult {
  success: boolean;
  payment: Payment | null;
  errors: string[];
}

export interface ReversePaymentPayload {
  paymentId: string;
  reversalReason: string;
  reversedBy?: string;
  idempotencyKey?: string;
}

export interface ReversePaymentResult {
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
  private balanceService: BalanceApplicationService;
  private billingService?: BillingApplicationService;
  private ledgerService: LedgerApplicationService;

  private static activePaymentLocks = new Set<string>();
  private static activeStayLocks = new Set<string>();

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = defaultStayRepository,
    billingService?: BillingApplicationService,
    ledgerService?: LedgerApplicationService,
    balanceService?: BalanceApplicationService
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
    this.billingService = billingService;
    this.ledgerService = ledgerService ?? new LedgerApplicationService(repository, stayRepository);
    this.balanceService = balanceService ?? new BalanceApplicationService(repository);
  }

  public getBalanceService(): BalanceApplicationService {
    return this.balanceService;
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
   *
   * Enforces FC-03B:
   * 1. Idempotent replay on identical idempotencyKey + attributes.
   * 2. Idempotency conflict rejection on identical idempotencyKey + conflicting attributes.
   * 3. External reference duplicate detection (matching stayId, paymentMethod, referenceNumber).
   * 4. External reference conflict rejection (matching referenceNumber with conflicting amount).
   * 5. Current-process per-stay concurrency locking.
   * 6. Hermetic balance querying via injected BalanceApplicationService.
   */
  public recordPayment(
    paymentPayload: RecordPaymentPayload
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

    const trimmedStayId = paymentPayload.stayId.trim();
    const trimmedIdemKey = paymentPayload.idempotencyKey?.trim() || undefined;
    const trimmedRef = paymentPayload.referenceNumber?.trim() || undefined;

    // Concurrency protection: prevent overlapping payment operations on the same Stay
    if (PaymentApplicationService.activePaymentLocks.has(trimmedStayId)) {
      return {
        success: false,
        payment: null,
        errors: ['A payment operation is currently in progress for this stay. Please retry.'],
      };
    }

    PaymentApplicationService.activePaymentLocks.add(trimmedStayId);

    try {
      const stayPayments = this.repository.getPaymentsByStayId(trimmedStayId);

      // 1. Idempotency Key Validation (CASE A & CASE B)
      if (trimmedIdemKey) {
        const matchingIdem = stayPayments.find((p) => p.idempotencyKey === trimmedIdemKey);
        if (matchingIdem) {
          const isAmountMatch = Math.abs(matchingIdem.amount - paymentPayload.amount) < 0.0001;
          const isMethodMatch = matchingIdem.paymentMethod === paymentPayload.paymentMethod;
          const existingRef = matchingIdem.referenceNumber?.trim() || undefined;
          const isRefMatch = trimmedRef === existingRef;

          if (isAmountMatch && isMethodMatch && isRefMatch) {
            // CASE A: Exact Idempotent Replay
            return {
              success: true,
              payment: matchingIdem,
              errors: [],
            };
          } else {
            // CASE B: Idempotency Key Conflict
            return {
              success: false,
              payment: null,
              errors: [
                `Idempotency key conflict: A payment with idempotency key "${trimmedIdemKey}" already exists with different payment details.`,
              ],
            };
          }
        }
      }

      // 2. External Reference Number Validation (CASE C & CASE D)
      if (trimmedRef) {
        const matchingRef = stayPayments.find(
          (p) =>
            p.paymentMethod === paymentPayload.paymentMethod &&
            p.referenceNumber?.trim() === trimmedRef
        );

        if (matchingRef) {
          const isAmountMatch = Math.abs(matchingRef.amount - paymentPayload.amount) < 0.0001;
          if (isAmountMatch) {
            // CASE C: External Reference Exact Duplicate / Replay
            return {
              success: true,
              payment: matchingRef,
              errors: [],
            };
          } else {
            // CASE D: External Reference Conflict
            return {
              success: false,
              payment: null,
              errors: [
                `Duplicate external reference conflict: A payment with reference number "${trimmedRef}" and method "${paymentPayload.paymentMethod}" already exists for this stay with amount ₹${matchingRef.amount}.`,
              ],
            };
          }
        }
      }

      // 3. CASE E: New Payment Processing
      const now = new Date().toISOString();
      const todayStr = now.split('T')[0];
      const periodTag = todayStr.slice(0, 7).replace('-', '');
      const existingPayments = this.getAllPayments();
      const sequenceNum = String(existingPayments.length + 1).padStart(4, '0');
      const paymentNumber = `PAY-${periodTag}-${sequenceNum}`;

      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Determine Debit Account (Cash vs Bank)
      const debitAccount =
        paymentPayload.paymentMethod === 'CASH' ? AccountType.CASH : AccountType.BANK;

      // Calculate Receivable vs Advance Credit portions via injected balanceService
      const outstandingReceivable = this.balanceService.getAccountBalance(
        trimmedStayId,
        AccountType.ACCOUNTS_RECEIVABLE
      );

      const receivablePortion = Math.min(paymentPayload.amount, outstandingReceivable);
      const advancePortion = Math.round((paymentPayload.amount - receivablePortion) * 100) / 100;

      // Construct double-entry ledger postings
      const ledgerEntriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[] = [
        {
          stayId: trimmedStayId,
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
          stayId: trimmedStayId,
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
          stayId: trimmedStayId,
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

      // Post balanced ledger entries via ledgerService
      const postingResult = this.ledgerService.postEntries(ledgerEntriesData);
      if (!postingResult.success) {
        return {
          success: false,
          payment: null,
          errors: [`Failed to post payment ledger entries: ${postingResult.errors.join(', ')}`],
        };
      }

      // Snapshot bills before allocation for safe failure-boundary rollback
      const originalBillsSnapshot = this.repository.getBills().map((b) => ({ ...b }));

      // Allocate receivable portion across open bills via billingService
      let allocations: PaymentAllocation[] = [];
      try {
        if (receivablePortion > 0) {
          allocations = this.getBillingService().allocatePaymentToBills(
            trimmedStayId,
            receivablePortion
          );
        }

        // Create and persist Payment record via repository
        const newPayment: Payment = {
          id: paymentId,
          stayId: trimmedStayId,
          paymentNumber,
          paymentDate: paymentPayload.paymentDate,
          amount: paymentPayload.amount,
          paymentMethod: paymentPayload.paymentMethod as PaymentMethod,
          referenceNumber: trimmedRef,
          idempotencyKey: trimmedIdemKey,
          allocations,
          remarks: paymentPayload.remarks?.trim() || undefined,
          status: 'RECORDED',
          createdAt: now,
        };

        this.repository.savePayment(newPayment);

        return {
          success: true,
          payment: newPayment,
          errors: [],
        };
      } catch (postLedgerError) {
        // Compensating rollback for in-memory persistence failure:
        // Revert the uncommitted ledger postings and restore original bill states
        const currentLedger = this.repository.getLedgerEntries();
        const postedIds = new Set(postingResult.entries.map((e) => e.id));
        this.repository.saveLedgerEntries(currentLedger.filter((e) => !postedIds.has(e.id)));
        this.repository.saveBills(originalBillsSnapshot);
        throw postLedgerError;
      }
    } finally {
      PaymentApplicationService.activePaymentLocks.delete(trimmedStayId);
    }
  }

  /**
   * Application Use Case: Reverse a recorded Payment in full.
   * FC-07: Enforces immutable historical facts, compensating double-entry ledger counter-postings,
   * deterministic FIFO bill allocation restoration, advance credit derecognition, consumed advance credit guard,
   * settlement protection, idempotency replay/conflict detection, per-payment/stay concurrency locking,
   * T2 live balance revalidation, and application-level compensating rollback boundaries.
   */
  public reversePayment(payload: ReversePaymentPayload): ReversePaymentResult {
    const errors: string[] = [];

    if (!payload.paymentId || payload.paymentId.trim() === '') {
      errors.push('Missing or invalid paymentId.');
    }

    if (!payload.reversalReason || payload.reversalReason.trim() === '') {
      errors.push('Reversal reason is mandatory.');
    }

    if (errors.length > 0) {
      return { success: false, payment: null, errors };
    }

    const trimmedPaymentId = payload.paymentId.trim();
    const trimmedReason = payload.reversalReason.trim();
    const trimmedIdemKey = payload.idempotencyKey?.trim() || undefined;
    const reversedBy = payload.reversedBy?.trim() || 'OPERATOR';

    const payment = this.getPaymentById(trimmedPaymentId);
    if (!payment) {
      return {
        success: false,
        payment: null,
        errors: [`Payment '${trimmedPaymentId}' not found.`],
      };
    }

    // 1. Idempotency Check (Replay vs Conflict)
    if (trimmedIdemKey) {
      const allPayments = this.getAllPayments();
      const existingByKey = allPayments.find(
        (p) => p.reversalIdempotencyKey === trimmedIdemKey
      );

      if (existingByKey) {
        const isSamePayment = existingByKey.id === payment.id;
        const isReversed = existingByKey.status === 'REVERSED';
        const isSameReason = existingByKey.reversalReason === trimmedReason;

        if (isSamePayment && isReversed && isSameReason) {
          // Exact Idempotent Replay
          return {
            success: true,
            payment: existingByKey,
            errors: [],
          };
        } else {
          // Idempotency Key Conflict
          return {
            success: false,
            payment: null,
            errors: [
              `Idempotency key conflict: A payment reversal with idempotency key "${trimmedIdemKey}" already exists with conflicting details.`,
            ],
          };
        }
      }
    }

    // 2. Already Reversed Check (Double Reversal Guard)
    if (payment.status === 'REVERSED') {
      return {
        success: false,
        payment: null,
        errors: [
          `Payment #${payment.paymentNumber} has already been reversed on ${payment.reversedAt || 'an earlier date'}.`,
        ],
      };
    }

    // 3. T2 Validation: Settlement Protection Guard (Rule 11)
    const settlement = this.repository.getSettlementByStayId(payment.stayId);
    if (settlement && settlement.status === 'SETTLED') {
      return {
        success: false,
        payment: null,
        errors: [
          `Cannot reverse payment #${payment.paymentNumber} for stay '${payment.stayId}' because the stay has already completed financial settlement.`,
        ],
      };
    }

    // 4. Advance Credit & Allocation Portions
    const allocatedPortion = (payment.allocations || []).reduce((sum, a) => sum + a.amount, 0);
    const advancePortion = Math.max(0, Math.round((payment.amount - allocatedPortion) * 100) / 100);

    // 5. T2 Validation: Consumed Advance Credit Guard (Rule 8)
    if (advancePortion > 0) {
      const liveAdvance = this.balanceService.getAccountBalance(
        payment.stayId,
        AccountType.ADVANCE_CREDIT
      );

      if (liveAdvance < advancePortion) {
        const consumedAmount = Math.round((advancePortion - liveAdvance) * 100) / 100;
        return {
          success: false,
          payment: null,
          errors: [
            `Cannot reverse payment because ₹${consumedAmount.toLocaleString('en-IN')} of its advance credit has already been consumed by subsequent bills. Reverse downstream bill advance applications first.`,
          ],
        };
      }
    }

    // 6. Concurrency Protection (Rule 16)
    if (
      PaymentApplicationService.activePaymentLocks.has(payment.id) ||
      PaymentApplicationService.activeStayLocks.has(payment.stayId)
    ) {
      return {
        success: false,
        payment: null,
        errors: [
          'A payment or financial operation is currently in progress for this payment/stay. Please retry.',
        ],
      };
    }

    PaymentApplicationService.activePaymentLocks.add(payment.id);
    PaymentApplicationService.activeStayLocks.add(payment.stayId);

    // 7. Pre-Operation Snapshots for Compensating Rollback Boundary (Rule 18)
    const snapshotLedger = this.repository.getLedgerEntries();
    const snapshotBills = this.repository.getBills();
    const snapshotPayments = this.repository.getPayments();

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();
      const assetAccount =
        payment.paymentMethod === 'CASH' ? AccountType.CASH : AccountType.BANK;

      // 8. Balanced Reversal Ledger Postings:
      // Credit CASH/BANK for total amount A
      // Debit ACCOUNTS_RECEIVABLE for allocated portion P_AR
      // Debit ADVANCE_CREDIT for advance portion P_ADV
      const ledgerEntriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[] = [
        {
          stayId: payment.stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.REVERSAL,
          referenceId: payment.id,
          account: assetAccount,
          debit: 0,
          credit: payment.amount,
          remarks: `Reversal of Payment #${payment.paymentNumber} via ${payment.paymentMethod}: ${trimmedReason}`,
          createdBy: reversedBy,
        },
      ];

      if (allocatedPortion > 0) {
        ledgerEntriesData.push({
          stayId: payment.stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.REVERSAL,
          referenceId: payment.id,
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: allocatedPortion,
          credit: 0,
          remarks: `Receivable restoration for reversed Payment #${payment.paymentNumber}`,
          createdBy: reversedBy,
        });
      }

      if (advancePortion > 0) {
        ledgerEntriesData.push({
          stayId: payment.stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.REVERSAL,
          referenceId: payment.id,
          account: AccountType.ADVANCE_CREDIT,
          debit: advancePortion,
          credit: 0,
          remarks: `Advance credit derecognition for reversed Payment #${payment.paymentNumber}`,
          createdBy: reversedBy,
        });
      }

      const ledgerResult = this.ledgerService.postEntries(ledgerEntriesData);
      if (!ledgerResult.success) {
        return {
          success: false,
          payment: null,
          errors: [`Failed to post payment reversal ledger entries: ${ledgerResult.errors.join(', ')}`],
        };
      }

      // 9. Restore Bill Allocations (Rule 6)
      const allBills = this.repository.getBills();
      if (payment.allocations && payment.allocations.length > 0) {
        for (const alloc of payment.allocations) {
          const billIndex = allBills.findIndex((b) => b.id === alloc.billId);
          if (billIndex >= 0) {
            const targetBill = allBills[billIndex];
            const newPaidAmount = Math.max(
              0,
              Math.round((targetBill.paidAmount - alloc.amount) * 100) / 100
            );
            const newBalanceAmount = Math.round(
              (targetBill.totalAmount - newPaidAmount) * 100
            ) / 100;
            const newStatus =
              newPaidAmount === 0 ? BillStatus.UNPAID : BillStatus.PARTIALLY_PAID;

            allBills[billIndex] = {
              ...targetBill,
              paidAmount: newPaidAmount,
              balanceAmount: newBalanceAmount,
              status: newStatus,
              updatedAt: now,
            };
          }
        }
        this.repository.saveBills(allBills);
      }

      // 10. Update & Persist Payment Record with Reversal Metadata (Rule 2 & 22)
      const reversedPayment: Payment = {
        ...payment,
        status: 'REVERSED',
        reversedAt: now,
        reversedBy,
        reversalReason: trimmedReason,
        reversalIdempotencyKey: trimmedIdemKey,
        reversalLedgerEntryIds: ledgerResult.entries.map((e) => e.id),
      };

      this.repository.savePayment(reversedPayment);

      return {
        success: true,
        payment: reversedPayment,
        errors: [],
      };
    } catch (err: unknown) {
      // Compensating Rollback: restore all repositories to pre-operation snapshot
      try {
        this.repository.saveLedgerEntries(snapshotLedger);
        this.repository.saveBills(snapshotBills);
        const prevPayment = snapshotPayments.find((p) => p.id === payment.id);
        if (prevPayment) {
          this.repository.savePayment(prevPayment);
        }
      } catch {
        /* rollback best-effort */
      }
      return {
        success: false,
        payment: null,
        errors: [
          err instanceof Error
            ? `Payment reversal failed and was rolled back: ${err.message}`
            : 'Payment reversal failed and was rolled back cleanly.',
        ],
      };
    } finally {
      PaymentApplicationService.activePaymentLocks.delete(payment.id);
      PaymentApplicationService.activeStayLocks.delete(payment.stayId);
    }
  }

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
      const currentAdvance = this.balanceService.getAccountBalance(stayId, AccountType.ADVANCE_CREDIT);
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
      const availableAdvance = this.balanceService.getAccountBalance(
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
