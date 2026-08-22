import type {
  DepositTransaction,
  DepositTransactionType,
  PaymentMethod,
  FinanceRepository,
} from '../domain';
import { AccountType, LedgerReferenceType } from '../domain';
import { defaultFinanceRepository } from '../infrastructure';
import { BalanceApplicationService } from './balanceEngine';
import { LedgerApplicationService } from './ledgerService';
import type { StayRepository } from '../../stay';
import { defaultStayRepository } from '../../stay';
import { financeStorage } from '../storage/financeStorage';

export interface DepositTransactionResult {
  success: boolean;
  transaction: DepositTransaction | null;
  errors: string[];
}

export interface RecordDepositContributionPayload {
  stayId: string;
  amount: number;
  paymentMethod?: PaymentMethod | string;
  remarks?: string;
  createdBy?: string;
  idempotencyKey?: string;
}

export interface RecordPartialDepositReturnPayload {
  stayId: string;
  amount: number;
  paymentMethod?: PaymentMethod | string;
  expectedDepositBalance?: number;
  remarks?: string;
  createdBy?: string;
  idempotencyKey?: string;
}

export interface RecordDepositDeductionPayload {
  stayId: string;
  amount: number;
  reason: string;
  expectedDepositBalance?: number;
  remarks?: string;
  createdBy?: string;
  idempotencyKey?: string;
}

export class DepositApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;
  private ledgerService: LedgerApplicationService;
  private balanceService: BalanceApplicationService;

  private static activeStayLocks = new Set<string>();

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = defaultStayRepository,
    ledgerService?: LedgerApplicationService,
    balanceService?: BalanceApplicationService
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
    this.ledgerService = ledgerService ?? new LedgerApplicationService(repository, stayRepository);
    this.balanceService = balanceService ?? new BalanceApplicationService(repository);
  }

  public getRepository(): FinanceRepository {
    return this.repository;
  }

  public getStayRepository(): StayRepository {
    return this.stayRepository;
  }

  public getBalanceService(): BalanceApplicationService {
    return this.balanceService;
  }

  public getDepositTransactionsByStayId(stayId: string): DepositTransaction[] {
    return this.repository.getDepositTransactionsByStayId(stayId);
  }

  public getDepositBalance(stayId: string): number {
    return this.balanceService.getAccountBalance(stayId, AccountType.SECURITY_DEPOSIT_LIABILITY);
  }

  /**
   * Helper: Checks session-scoped idempotencyKey against existing deposit transactions.
   */
  private checkIdempotency(
    stayId: string,
    transactionType: DepositTransactionType,
    amount: number,
    idempotencyKey?: string,
    paymentMethod?: PaymentMethod | string,
    reason?: string
  ): { isReplay: boolean; existingTransaction: DepositTransaction | null; conflictError?: string } {
    if (!idempotencyKey || idempotencyKey.trim() === '') {
      return { isReplay: false, existingTransaction: null };
    }

    const trimmedKey = idempotencyKey.trim();
    const allTransactions = this.repository.getDepositTransactions();
    const existing = allTransactions.find((tx) => tx.idempotencyKey === trimmedKey);

    if (!existing) {
      return { isReplay: false, existingTransaction: null };
    }

    const isSameStay = existing.stayId === stayId;
    const isSameType = existing.transactionType === transactionType;
    const isSameAmount = Math.abs(existing.amount - amount) < 0.0001;
    const isSameMethod = !paymentMethod || existing.paymentMethod === paymentMethod;
    const isSameReason = !reason || existing.reason === reason;

    if (isSameStay && isSameType && isSameAmount && isSameMethod && isSameReason) {
      return { isReplay: true, existingTransaction: existing };
    }

    return {
      isReplay: false,
      existingTransaction: null,
      conflictError: `Idempotency conflict: A deposit transaction with idempotency key "${trimmedKey}" already exists with conflicting parameters.`,
    };
  }

  /**
   * Application Use Case: Record an initial or additional Deposit Contribution for a Stay.
   * DEC-DEP-02 APPROVED: Additional deposit contributions are permitted after admission deposit.
   *
   * Enforces:
   * 1. Idempotency Key validation (Replay vs Conflict).
   * 2. Per-stay in-memory concurrency locking (activeStayLocks).
   * 3. Snapshot-based compensating rollback boundary.
   * 4. Double-entry ledger posting: Debit CASH/BANK, Credit SECURITY_DEPOSIT_LIABILITY.
   */
  public recordDepositContribution(
    payloadOrStayId: RecordDepositContributionPayload | string,
    amountArg?: number,
    paymentMethodArg: PaymentMethod | string = 'BANK_TRANSFER',
    remarksArg = '',
    createdByArg = 'DEPOSIT_ENGINE',
    idempotencyKeyArg?: string
  ): DepositTransactionResult {
    let stayId: string;
    let amount: number;
    let paymentMethod: PaymentMethod;
    let remarks: string;
    let createdBy: string;
    let idempotencyKey: string | undefined;

    if (typeof payloadOrStayId === 'object' && payloadOrStayId !== null) {
      stayId = payloadOrStayId.stayId;
      amount = payloadOrStayId.amount;
      paymentMethod = (payloadOrStayId.paymentMethod as PaymentMethod) || ('BANK_TRANSFER' as PaymentMethod);
      remarks = payloadOrStayId.remarks || '';
      createdBy = payloadOrStayId.createdBy || 'DEPOSIT_ENGINE';
      idempotencyKey = payloadOrStayId.idempotencyKey;
    } else {
      stayId = payloadOrStayId;
      amount = amountArg as number;
      paymentMethod = (paymentMethodArg as PaymentMethod) || ('BANK_TRANSFER' as PaymentMethod);
      remarks = remarksArg || '';
      createdBy = createdByArg || 'DEPOSIT_ENGINE';
      idempotencyKey = idempotencyKeyArg;
    }

    const errors: string[] = [];

    if (!stayId || stayId.trim() === '') {
      errors.push('Missing or invalid stayId.');
      return { success: false, transaction: null, errors };
    }

    const trimmedStayId = stayId.trim();

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      errors.push('Deposit contribution amount must be a positive number greater than zero.');
      return { success: false, transaction: null, errors };
    }

    const stay = this.stayRepository.findByIdSync(trimmedStayId);
    if (!stay) {
      errors.push(`Stay '${trimmedStayId}' not found.`);
      return { success: false, transaction: null, errors };
    }

    // 1. Idempotency Check
    const idempCheck = this.checkIdempotency(
      trimmedStayId,
      'DEPOSIT_RECEIPT',
      amount,
      idempotencyKey,
      paymentMethod
    );

    if (idempCheck.conflictError) {
      return { success: false, transaction: null, errors: [idempCheck.conflictError] };
    }
    if (idempCheck.isReplay && idempCheck.existingTransaction) {
      return { success: true, transaction: idempCheck.existingTransaction, errors: [] };
    }

    // 2. Concurrency Lock
    if (DepositApplicationService.activeStayLocks.has(trimmedStayId)) {
      return {
        success: false,
        transaction: null,
        errors: ['A deposit operation is currently in progress for this stay. Please retry.'],
      };
    }

    DepositApplicationService.activeStayLocks.add(trimmedStayId);

    // 3. Capture Pre-Operation Snapshots for Compensating Rollback
    const snapshotLedger = this.repository.getLedgerEntries();
    const snapshotDepositTxs = this.repository.getDepositTransactions();

    try {
      const now = new Date().toISOString();
      const todayStr = now.split('T')[0];
      const normalizedKey = idempotencyKey?.trim();
      const txId = normalizedKey
        ? `dpt_id_${normalizedKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`
        : `dpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const assetAccount = paymentMethod === 'CASH' ? AccountType.CASH : AccountType.BANK;

      // Double-entry ledger: Debit CASH/BANK (asset), Credit SECURITY_DEPOSIT_LIABILITY (liability)
      const ledgerResult = this.ledgerService.postEntries([
        {
          stayId: trimmedStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.DEPOSIT_TRANSACTION,
          referenceId: txId,
          account: assetAccount,
          debit: amount,
          credit: 0,
          remarks: remarks || `Deposit Contribution via ${paymentMethod}`,
          createdBy,
        },
        {
          stayId: trimmedStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.DEPOSIT_TRANSACTION,
          referenceId: txId,
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: 0,
          credit: amount,
          remarks: remarks || `Security Deposit Liability for Contribution`,
          createdBy,
        },
      ]);

      if (!ledgerResult.success) {
        return {
          success: false,
          transaction: null,
          errors: [`Failed to post deposit contribution ledger entries: ${ledgerResult.errors.join(', ')}`],
        };
      }

      const transaction: DepositTransaction = {
        id: txId,
        stayId: trimmedStayId,
        residentId: stay.residentId,
        transactionType: 'DEPOSIT_RECEIPT' as DepositTransactionType,
        amount,
        postingDate: todayStr,
        effectiveDate: todayStr,
        paymentMethod,
        remarks,
        ledgerEntryIds: ledgerResult.entries.map((e) => e.id),
        createdBy,
        createdAt: now,
        idempotencyKey: normalizedKey,
      };

      this.repository.saveDepositTransaction(transaction);

      return {
        success: true,
        transaction,
        errors: [],
      };
    } catch (err: unknown) {
      // Compensating Rollback: restore all repositories to pre-operation snapshot
      try {
        this.repository.saveLedgerEntries(snapshotLedger);
        financeStorage.saveStoredDepositTransactions(snapshotDepositTxs);
      } catch {
        /* rollback best-effort */
      }
      return {
        success: false,
        transaction: null,
        errors: [
          err instanceof Error
            ? `Deposit contribution failed and was rolled back: ${err.message}`
            : 'Deposit contribution failed and was rolled back cleanly.',
        ],
      };
    } finally {
      DepositApplicationService.activeStayLocks.delete(trimmedStayId);
    }
  }

  /**
   * Application Use Case: Record a Partial Deposit Return for a Stay.
   * DEC-DEP-01 APPROVED: Partial deposit returns are permitted during ACTIVE, ON_NOTICE, and CHECKED_OUT.
   *
   * Enforces:
   * 1. Idempotency Key validation (Replay vs Conflict).
   * 2. Per-stay in-memory concurrency locking (activeStayLocks).
   * 3. T2 Authoritative Live Balance Revalidation (rejects stale preview / over-return).
   * 4. Snapshot-based compensating rollback boundary.
   * 5. Double-entry ledger posting: Debit SECURITY_DEPOSIT_LIABILITY, Credit CASH/BANK.
   */
  public recordPartialDepositReturn(
    payloadOrStayId: RecordPartialDepositReturnPayload | string,
    amountArg?: number,
    paymentMethodArg: PaymentMethod | string = 'BANK_TRANSFER',
    remarksArg = '',
    createdByArg = 'DEPOSIT_ENGINE',
    idempotencyKeyArg?: string,
    expectedDepositBalanceArg?: number
  ): DepositTransactionResult {
    let stayId: string;
    let amount: number;
    let paymentMethod: PaymentMethod;
    let remarks: string;
    let createdBy: string;
    let idempotencyKey: string | undefined;
    let expectedDepositBalance: number | undefined;

    if (typeof payloadOrStayId === 'object' && payloadOrStayId !== null) {
      stayId = payloadOrStayId.stayId;
      amount = payloadOrStayId.amount;
      paymentMethod = (payloadOrStayId.paymentMethod as PaymentMethod) || ('BANK_TRANSFER' as PaymentMethod);
      remarks = payloadOrStayId.remarks || '';
      createdBy = payloadOrStayId.createdBy || 'DEPOSIT_ENGINE';
      idempotencyKey = payloadOrStayId.idempotencyKey;
      expectedDepositBalance = payloadOrStayId.expectedDepositBalance;
    } else {
      stayId = payloadOrStayId;
      amount = amountArg as number;
      paymentMethod = (paymentMethodArg as PaymentMethod) || ('BANK_TRANSFER' as PaymentMethod);
      remarks = remarksArg || '';
      createdBy = createdByArg || 'DEPOSIT_ENGINE';
      idempotencyKey = idempotencyKeyArg;
      expectedDepositBalance = expectedDepositBalanceArg;
    }

    const errors: string[] = [];

    if (!stayId || stayId.trim() === '') {
      errors.push('Missing or invalid stayId.');
      return { success: false, transaction: null, errors };
    }

    const trimmedStayId = stayId.trim();

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      errors.push('Partial deposit return amount must be a positive number greater than zero.');
      return { success: false, transaction: null, errors };
    }

    const stay = this.stayRepository.findByIdSync(trimmedStayId);
    if (!stay) {
      errors.push(`Stay '${trimmedStayId}' not found.`);
      return { success: false, transaction: null, errors };
    }

    // 1. Idempotency Check
    const idempCheck = this.checkIdempotency(
      trimmedStayId,
      'PARTIAL_RETURN',
      amount,
      idempotencyKey,
      paymentMethod
    );

    if (idempCheck.conflictError) {
      return { success: false, transaction: null, errors: [idempCheck.conflictError] };
    }
    if (idempCheck.isReplay && idempCheck.existingTransaction) {
      return { success: true, transaction: idempCheck.existingTransaction, errors: [] };
    }

    // 2. Concurrency Lock
    if (DepositApplicationService.activeStayLocks.has(trimmedStayId)) {
      return {
        success: false,
        transaction: null,
        errors: ['A deposit operation is currently in progress for this stay. Please retry.'],
      };
    }

    DepositApplicationService.activeStayLocks.add(trimmedStayId);

    // 3. Capture Pre-Operation Snapshots for Compensating Rollback
    const snapshotLedger = this.repository.getLedgerEntries();
    const snapshotDepositTxs = this.repository.getDepositTransactions();

    try {
      // 4. Live T2 Balance Re-Derivation & Revalidation
      const currentDepositHeld = this.getDepositBalance(trimmedStayId);

      if (
        expectedDepositBalance !== undefined &&
        typeof expectedDepositBalance === 'number' &&
        Math.abs(currentDepositHeld - expectedDepositBalance) > 0.01
      ) {
        return {
          success: false,
          transaction: null,
          errors: [
            'Deposit balance is stale. Available security deposit balance has changed. Please refresh and try again.',
          ],
        };
      }

      if (amount > currentDepositHeld) {
        return {
          success: false,
          transaction: null,
          errors: [
            `Cannot return ₹${amount.toLocaleString('en-IN')}. Available security deposit balance is only ₹${currentDepositHeld.toLocaleString('en-IN')}.`,
          ],
        };
      }

      const now = new Date().toISOString();
      const todayStr = now.split('T')[0];
      const normalizedKey = idempotencyKey?.trim();
      const txId = normalizedKey
        ? `dpt_id_${normalizedKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`
        : `dpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const assetAccount = paymentMethod === 'CASH' ? AccountType.CASH : AccountType.BANK;

      // Double-entry ledger: Debit SECURITY_DEPOSIT_LIABILITY (reduces liability), Credit CASH/BANK (reduces asset)
      const ledgerResult = this.ledgerService.postEntries([
        {
          stayId: trimmedStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.DEPOSIT_TRANSACTION,
          referenceId: txId,
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: amount,
          credit: 0,
          remarks: remarks || `Partial Deposit Return via ${paymentMethod}`,
          createdBy,
        },
        {
          stayId: trimmedStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.DEPOSIT_TRANSACTION,
          referenceId: txId,
          account: assetAccount,
          debit: 0,
          credit: amount,
          remarks: remarks || `Deposit Refund Payout via ${paymentMethod}`,
          createdBy,
        },
      ]);

      if (!ledgerResult.success) {
        return {
          success: false,
          transaction: null,
          errors: [`Failed to post partial deposit return ledger entries: ${ledgerResult.errors.join(', ')}`],
        };
      }

      const transaction: DepositTransaction = {
        id: txId,
        stayId: trimmedStayId,
        residentId: stay.residentId,
        transactionType: 'PARTIAL_RETURN' as DepositTransactionType,
        amount,
        postingDate: todayStr,
        effectiveDate: todayStr,
        paymentMethod,
        remarks,
        ledgerEntryIds: ledgerResult.entries.map((e) => e.id),
        createdBy,
        createdAt: now,
        idempotencyKey: normalizedKey,
      };

      this.repository.saveDepositTransaction(transaction);

      return {
        success: true,
        transaction,
        errors: [],
      };
    } catch (err: unknown) {
      // Compensating Rollback: restore all repositories to pre-operation snapshot
      try {
        this.repository.saveLedgerEntries(snapshotLedger);
        financeStorage.saveStoredDepositTransactions(snapshotDepositTxs);
      } catch {
        /* rollback best-effort */
      }
      return {
        success: false,
        transaction: null,
        errors: [
          err instanceof Error
            ? `Partial deposit return failed and was rolled back: ${err.message}`
            : 'Partial deposit return failed and was rolled back cleanly.',
        ],
      };
    } finally {
      DepositApplicationService.activeStayLocks.delete(trimmedStayId);
    }
  }

  /**
   * Application Use Case: Record a Deposit Deduction (damage/penalty adjustment) against deposit liability.
   *
   * Enforces:
   * 1. Mandatory deduction reason.
   * 2. Idempotency Key validation (Replay vs Conflict).
   * 3. Per-stay in-memory concurrency locking (activeStayLocks).
   * 4. T2 Authoritative Live Balance Revalidation (rejects stale preview / over-deduction).
   * 5. Snapshot-based compensating rollback boundary.
   * 6. Double-entry ledger posting: Debit SECURITY_DEPOSIT_LIABILITY, Credit DAMAGE_RECOVERY.
   */
  public recordDepositDeduction(
    payloadOrStayId: RecordDepositDeductionPayload | string,
    amountArg?: number,
    reasonArg = '',
    remarksArg = '',
    createdByArg = 'DEPOSIT_ENGINE',
    idempotencyKeyArg?: string,
    expectedDepositBalanceArg?: number
  ): DepositTransactionResult {
    let stayId: string;
    let amount: number;
    let reason: string;
    let remarks: string;
    let createdBy: string;
    let idempotencyKey: string | undefined;
    let expectedDepositBalance: number | undefined;

    if (typeof payloadOrStayId === 'object' && payloadOrStayId !== null) {
      stayId = payloadOrStayId.stayId;
      amount = payloadOrStayId.amount;
      reason = payloadOrStayId.reason || '';
      remarks = payloadOrStayId.remarks || '';
      createdBy = payloadOrStayId.createdBy || 'DEPOSIT_ENGINE';
      idempotencyKey = payloadOrStayId.idempotencyKey;
      expectedDepositBalance = payloadOrStayId.expectedDepositBalance;
    } else {
      stayId = payloadOrStayId;
      amount = amountArg as number;
      reason = reasonArg;
      remarks = remarksArg || '';
      createdBy = createdByArg || 'DEPOSIT_ENGINE';
      idempotencyKey = idempotencyKeyArg;
      expectedDepositBalance = expectedDepositBalanceArg;
    }

    const errors: string[] = [];

    if (!stayId || stayId.trim() === '') {
      errors.push('Missing or invalid stayId.');
      return { success: false, transaction: null, errors };
    }

    const trimmedStayId = stayId.trim();

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      errors.push('Deposit deduction amount must be a positive number greater than zero.');
      return { success: false, transaction: null, errors };
    }

    if (!reason || reason.trim() === '') {
      errors.push('Deduction reason is mandatory.');
      return { success: false, transaction: null, errors };
    }

    const stay = this.stayRepository.findByIdSync(trimmedStayId);
    if (!stay) {
      errors.push(`Stay '${trimmedStayId}' not found.`);
      return { success: false, transaction: null, errors };
    }

    // 1. Idempotency Check
    const idempCheck = this.checkIdempotency(
      trimmedStayId,
      'DEPOSIT_DEDUCTION',
      amount,
      idempotencyKey,
      undefined,
      reason
    );

    if (idempCheck.conflictError) {
      return { success: false, transaction: null, errors: [idempCheck.conflictError] };
    }
    if (idempCheck.isReplay && idempCheck.existingTransaction) {
      return { success: true, transaction: idempCheck.existingTransaction, errors: [] };
    }

    // 2. Concurrency Lock
    if (DepositApplicationService.activeStayLocks.has(trimmedStayId)) {
      return {
        success: false,
        transaction: null,
        errors: ['A deposit operation is currently in progress for this stay. Please retry.'],
      };
    }

    DepositApplicationService.activeStayLocks.add(trimmedStayId);

    // 3. Capture Pre-Operation Snapshots for Compensating Rollback
    const snapshotLedger = this.repository.getLedgerEntries();
    const snapshotDepositTxs = this.repository.getDepositTransactions();

    try {
      // 4. Live T2 Balance Re-Derivation & Revalidation
      const currentDepositHeld = this.getDepositBalance(trimmedStayId);

      if (
        expectedDepositBalance !== undefined &&
        typeof expectedDepositBalance === 'number' &&
        Math.abs(currentDepositHeld - expectedDepositBalance) > 0.01
      ) {
        return {
          success: false,
          transaction: null,
          errors: [
            'Deposit balance is stale. Available security deposit balance has changed. Please refresh and try again.',
          ],
        };
      }

      if (amount > currentDepositHeld) {
        return {
          success: false,
          transaction: null,
          errors: [
            `Cannot deduct ₹${amount.toLocaleString('en-IN')}. Available security deposit balance is only ₹${currentDepositHeld.toLocaleString('en-IN')}.`,
          ],
        };
      }

      const now = new Date().toISOString();
      const todayStr = now.split('T')[0];
      const normalizedKey = idempotencyKey?.trim();
      const txId = normalizedKey
        ? `dpt_id_${normalizedKey.replace(/[^a-zA-Z0-9_-]/g, '_')}`
        : `dpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Double-entry ledger: Debit SECURITY_DEPOSIT_LIABILITY (reduces liability), Credit DAMAGE_RECOVERY (income)
      const ledgerResult = this.ledgerService.postEntries([
        {
          stayId: trimmedStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.DEPOSIT_TRANSACTION,
          referenceId: txId,
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: amount,
          credit: 0,
          remarks: `Deposit Deduction for ${reason}`,
          createdBy,
        },
        {
          stayId: trimmedStayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: LedgerReferenceType.DEPOSIT_TRANSACTION,
          referenceId: txId,
          account: AccountType.DAMAGE_RECOVERY,
          debit: 0,
          credit: amount,
          remarks: `Damage Recovery from Deposit: ${reason}`,
          createdBy,
        },
      ]);

      if (!ledgerResult.success) {
        return {
          success: false,
          transaction: null,
          errors: [`Failed to post deposit deduction ledger entries: ${ledgerResult.errors.join(', ')}`],
        };
      }

      const transaction: DepositTransaction = {
        id: txId,
        stayId: trimmedStayId,
        residentId: stay.residentId,
        transactionType: 'DEPOSIT_DEDUCTION' as DepositTransactionType,
        amount,
        postingDate: todayStr,
        effectiveDate: todayStr,
        reason,
        remarks,
        ledgerEntryIds: ledgerResult.entries.map((e) => e.id),
        createdBy,
        createdAt: now,
        idempotencyKey: normalizedKey,
      };

      this.repository.saveDepositTransaction(transaction);

      return {
        success: true,
        transaction,
        errors: [],
      };
    } catch (err: unknown) {
      // Compensating Rollback: restore all repositories to pre-operation snapshot
      try {
        this.repository.saveLedgerEntries(snapshotLedger);
        financeStorage.saveStoredDepositTransactions(snapshotDepositTxs);
      } catch {
        /* rollback best-effort */
      }
      return {
        success: false,
        transaction: null,
        errors: [
          err instanceof Error
            ? `Deposit deduction failed and was rolled back: ${err.message}`
            : 'Deposit deduction failed and was rolled back cleanly.',
        ],
      };
    } finally {
      DepositApplicationService.activeStayLocks.delete(trimmedStayId);
    }
  }
}

export const depositService = new DepositApplicationService();
