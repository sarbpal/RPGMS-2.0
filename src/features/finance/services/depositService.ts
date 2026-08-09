import type {
  DepositTransaction,
  DepositTransactionType,
  PaymentMethod,
  FinanceRepository,
  LedgerReferenceType,
} from '../domain';


import { AccountType } from '../domain';
import { defaultFinanceRepository } from '../infrastructure';
import { balanceEngine } from './balanceEngine';
import { LedgerApplicationService } from './ledgerService';
import type { StayRepository } from '../../stay';
import { InMemoryStayRepository } from '../../stay';

export interface DepositTransactionResult {
  success: boolean;
  transaction: DepositTransaction | null;
  errors: string[];
}

export class DepositApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;
  private ledgerService: LedgerApplicationService;

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = new InMemoryStayRepository(),
    ledgerService?: LedgerApplicationService
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
    this.ledgerService = ledgerService ?? new LedgerApplicationService(repository, stayRepository);
  }

  public getDepositTransactionsByStayId(stayId: string): DepositTransaction[] {
    return this.repository.getDepositTransactionsByStayId(stayId);
  }

  public getDepositBalance(stayId: string): number {
    return balanceEngine.getAccountBalance(stayId, AccountType.SECURITY_DEPOSIT_LIABILITY);
  }

  /**
   * Application Use Case: Record an initial or additional Deposit Contribution for a Stay.
   * DEC-DEP-02 APPROVED: Additional deposit contributions are permitted after admission deposit.
   */
  public recordDepositContribution(
    stayId: string,
    amount: number,
    paymentMethod: PaymentMethod = 'BANK_TRANSFER' as PaymentMethod,
    remarks = '',
    createdBy = 'DEPOSIT_ENGINE'
  ): DepositTransactionResult {
    const errors: string[] = [];

    if (!stayId || stayId.trim() === '') {
      errors.push('Missing or invalid stayId.');
      return { success: false, transaction: null, errors };
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      errors.push('Deposit contribution amount must be a positive number greater than zero.');
      return { success: false, transaction: null, errors };
    }

    const stay = this.stayRepository.findByIdSync(stayId);
    if (!stay) {
      errors.push(`Stay '${stayId}' not found.`);
      return { success: false, transaction: null, errors };
    }

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const txId = `dpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const assetAccount = paymentMethod === 'CASH' ? AccountType.CASH : AccountType.BANK;

    // Double-entry ledger: Debit CASH/BANK (asset), Credit SECURITY_DEPOSIT_LIABILITY (liability)
    const ledgerResult = this.ledgerService.postEntries([
      {
        stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'DEPOSIT_TRANSACTION' as LedgerReferenceType,
        referenceId: txId,
        account: assetAccount,
        debit: amount,
        credit: 0,
        remarks: remarks || `Deposit Contribution via ${paymentMethod}`,
        createdBy,
      },
      {
        stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'DEPOSIT_TRANSACTION' as LedgerReferenceType,
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
      stayId,
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
    };

    this.repository.saveDepositTransaction(transaction);

    return {
      success: true,
      transaction,
      errors: [],
    };
  }

  /**
   * Application Use Case: Record a Partial Deposit Return for a Stay.
   * DEC-DEP-01 APPROVED: Partial deposit returns are permitted during ACTIVE, ON_NOTICE, and CHECKED_OUT.
   * Enforces over-return guard: return amount cannot exceed available deposit balance.
   */
  public recordPartialDepositReturn(
    stayId: string,
    amount: number,
    paymentMethod: PaymentMethod = 'BANK_TRANSFER' as PaymentMethod,
    remarks = '',
    createdBy = 'DEPOSIT_ENGINE'
  ): DepositTransactionResult {
    const errors: string[] = [];

    if (!stayId || stayId.trim() === '') {
      errors.push('Missing or invalid stayId.');
      return { success: false, transaction: null, errors };
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      errors.push('Partial deposit return amount must be a positive number greater than zero.');
      return { success: false, transaction: null, errors };
    }

    const stay = this.stayRepository.findByIdSync(stayId);
    if (!stay) {
      errors.push(`Stay '${stayId}' not found.`);
      return { success: false, transaction: null, errors };
    }

    const currentDepositHeld = this.getDepositBalance(stayId);
    if (amount > currentDepositHeld) {
      errors.push(
        `Cannot return ₹${amount.toLocaleString('en-IN')}. Available security deposit balance is only ₹${currentDepositHeld.toLocaleString('en-IN')}.`
      );
      return { success: false, transaction: null, errors };
    }

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const txId = `dpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const assetAccount = paymentMethod === 'CASH' ? AccountType.CASH : AccountType.BANK;

    // Double-entry ledger: Debit SECURITY_DEPOSIT_LIABILITY (reduces liability), Credit CASH/BANK (reduces asset)
    const ledgerResult = this.ledgerService.postEntries([
      {
        stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'DEPOSIT_TRANSACTION' as LedgerReferenceType,
        referenceId: txId,
        account: AccountType.SECURITY_DEPOSIT_LIABILITY,
        debit: amount,
        credit: 0,
        remarks: remarks || `Partial Deposit Return via ${paymentMethod}`,
        createdBy,
      },
      {
        stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'DEPOSIT_TRANSACTION' as LedgerReferenceType,
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
      stayId,
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
    };

    this.repository.saveDepositTransaction(transaction);

    return {
      success: true,
      transaction,
      errors: [],
    };
  }

  /**
   * Application Use Case: Record a Deposit Deduction (damage/penalty adjustment) against deposit liability.
   * Enforces over-deduction guard: deduction amount cannot exceed available deposit balance.
   */
  public recordDepositDeduction(
    stayId: string,
    amount: number,
    reason: string,
    remarks = '',
    createdBy = 'DEPOSIT_ENGINE'
  ): DepositTransactionResult {
    const errors: string[] = [];

    if (!stayId || stayId.trim() === '') {
      errors.push('Missing or invalid stayId.');
      return { success: false, transaction: null, errors };
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      errors.push('Deposit deduction amount must be a positive number greater than zero.');
      return { success: false, transaction: null, errors };
    }

    if (!reason || reason.trim() === '') {
      errors.push('Deduction reason is mandatory.');
      return { success: false, transaction: null, errors };
    }

    const stay = this.stayRepository.findByIdSync(stayId);
    if (!stay) {
      errors.push(`Stay '${stayId}' not found.`);
      return { success: false, transaction: null, errors };
    }

    const currentDepositHeld = this.getDepositBalance(stayId);
    if (amount > currentDepositHeld) {
      errors.push(
        `Cannot deduct ₹${amount.toLocaleString('en-IN')}. Available security deposit balance is only ₹${currentDepositHeld.toLocaleString('en-IN')}.`
      );
      return { success: false, transaction: null, errors };
    }

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const txId = `dpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Double-entry ledger: Debit SECURITY_DEPOSIT_LIABILITY (reduces liability), Credit DAMAGE_RECOVERY (income)
    const ledgerResult = this.ledgerService.postEntries([
      {
        stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'DEPOSIT_TRANSACTION' as LedgerReferenceType,
        referenceId: txId,
        account: AccountType.SECURITY_DEPOSIT_LIABILITY,
        debit: amount,
        credit: 0,
        remarks: `Deposit Deduction for ${reason}`,
        createdBy,
      },
      {
        stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'DEPOSIT_TRANSACTION' as LedgerReferenceType,
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
      stayId,
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
    };

    this.repository.saveDepositTransaction(transaction);

    return {
      success: true,
      transaction,
      errors: [],
    };
  }
}

export const depositService = new DepositApplicationService();
