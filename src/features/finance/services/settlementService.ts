import type {
  Settlement,
  SettlementPreview,
  PaymentMethod,
  LedgerEntry,
  FinanceRepository,
  LedgerReferenceType,
  DepositTransaction,
} from '../domain';

import {
  AccountType,
  SettlementOutcome,
  BillStatus,
  deriveSettlementPreview,
  calculatePaymentAllocations,
} from '../domain';
import { defaultFinanceRepository } from '../infrastructure';
import { BalanceApplicationService } from './balanceEngine';
import type { StayRepository } from '../../stay';
import { defaultStayRepository, StayStatus } from '../../stay';

import type { ResidentRepository, Resident } from '../../resident';
import { defaultResidentRepository, ResidentStatus } from '../../resident';
import { LedgerApplicationService } from './ledgerService';
import { BillingApplicationService } from './billingService';
import { financeStorage } from '../storage/financeStorage';

export interface GeneratePreviewResult {
  success: boolean;
  preview: SettlementPreview | null;
  errors: string[];
}

export interface ConfirmSettlementResult {
  success: boolean;
  settlement: Settlement | null;
  errors: string[];
}

export class SettlementApplicationService {
  private repository: FinanceRepository;
  private stayRepository: StayRepository;
  private residentRepository: ResidentRepository;
  private ledgerService: LedgerApplicationService;
  private balanceService: BalanceApplicationService;
  private billingService?: BillingApplicationService;

  private static activeStayLocks = new Set<string>();

  constructor(
    repository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = defaultStayRepository,
    ledgerService?: LedgerApplicationService,
    residentRepository: ResidentRepository = defaultResidentRepository,
    balanceService?: BalanceApplicationService,
    billingService?: BillingApplicationService
  ) {
    this.repository = repository;
    this.stayRepository = stayRepository;
    this.residentRepository = residentRepository;
    this.ledgerService = ledgerService ?? new LedgerApplicationService(repository, stayRepository);
    this.balanceService = balanceService ?? new BalanceApplicationService(repository);
    this.billingService = billingService;
  }

  public getBalanceService(): BalanceApplicationService {
    return this.balanceService;
  }

  public getBillingService(): BillingApplicationService {
    if (!this.billingService) {
      this.billingService = new BillingApplicationService(
        this.repository,
        this.stayRepository,
        this.ledgerService
      );
    }
    return this.billingService;
  }

  public getStayRepository(): StayRepository {
    return this.stayRepository;
  }

  public getResidentRepository(): ResidentRepository {
    return this.residentRepository;
  }

  public getRepository(): FinanceRepository {
    return this.repository;
  }

  /**
   * Application Use Case: Fetch all settlements stored in the system.
   */
  public getAllSettlements(): Settlement[] {
    return this.repository.getSettlements();
  }

  /**
   * Application Use Case: Fetch the checkout settlement record for a specific Stay ID (if any).
   */
  public getSettlementByStayId(stayId: string): Settlement | null {
    return this.repository.getSettlementByStayId(stayId);
  }

  /**
   * STAGE 1 Use Case: Generate a read-only Settlement Preview for a Stay.
   * Delegates preview calculations to domain rule deriveSettlementPreview.
   * STRICTLY READ-ONLY: Performs no storage writes, no ledger entries, no state mutations.
   * Note: Decoupled from operational checkout (BR-460) - Stays with status CHECKED_OUT remain eligible for settlement preview.
   */
  public generateSettlementPreview(
    stayId: string,
    damageDeductions = 0,
    remarks = ''
  ): GeneratePreviewResult {
    const errors: string[] = [];

    if (!stayId || stayId.trim() === '') {
      errors.push('Missing or invalid stayId.');
      return { success: false, preview: null, errors };
    }

    if (typeof damageDeductions !== 'number' || isNaN(damageDeductions) || damageDeductions < 0) {
      errors.push('Damage deduction amount must be a non-negative number.');
      return { success: false, preview: null, errors };
    }

    const stay = this.stayRepository.findByIdSync(stayId);
    if (!stay) {
      errors.push(`Stay '${stayId}' not found in system.`);
      return { success: false, preview: null, errors };
    }

    const existingSettlement = this.getSettlementByStayId(stayId);
    if (existingSettlement) {
      errors.push(`Stay '${stayId}' has already been settled via Settlement #${existingSettlement.settlementNumber}.`);
      return { success: false, preview: null, errors };
    }

    const balances = this.balanceService.calculateStayBalances(stayId);
    const todayStr = new Date().toISOString().split('T')[0];
    const preview = deriveSettlementPreview(balances, stayId, todayStr, damageDeductions, remarks);

    return {
      success: true,
      preview,
      errors: [],
    };
  }

  /**
   * STAGE 2 Use Case: Confirm a Settlement using a previously generated read-only SettlementPreview.
   * Enforces FC-04 Authoritative Financial Synchronization & Compensating Safety:
   * 1. Re-derives live T2 ledger balances and asserts snapshot consistency against previewPayload.
   * 2. Supports session-scoped idempotency keys (Case A: new, Case B: replay, Case C: conflict, Case D: already settled).
   * 3. Implements per-stay in-memory concurrency locking (activeStayLocks).
   * 4. Establishes compensating snapshot rollback boundary guarding against partial failures.
   * 5. Posts balanced double-entry ledger entries.
   * 6. Persists SETTLEMENT_CLEARANCE DepositTransaction audit history when deposit liability is cleared.
   * 7. Synchronizes corresponding open Bill entities strictly for the resolved receivable amount using canonical FIFO allocation.
   * 8. Persists Settlement record and transitions Resident status to ALUMNI upon full financial closure (BR-461).
   * 9. Decoupled from operational checkout (BR-460) - Does NOT directly mutate Stay occupancy or accommodation bed allocations.
   */
  public confirmSettlement(
    previewPayload: SettlementPreview,
    paymentMethod: PaymentMethod = 'BANK_TRANSFER' as PaymentMethod,
    createdBy = 'SETTLEMENT_ENGINE',
    idempotencyKey?: string
  ): ConfirmSettlementResult {
    const errors: string[] = [];

    if (!previewPayload || !previewPayload.stayId || typeof previewPayload.stayId !== 'string' || previewPayload.stayId.trim() === '') {
      errors.push('Missing or invalid settlement preview payload.');
      return { success: false, settlement: null, errors };
    }

    const stayId = previewPayload.stayId.trim();

    // Idempotency Key Replay / Conflict Checks (Case B / Case C)
    if (idempotencyKey && idempotencyKey.trim() !== '') {
      const normalizedKey = idempotencyKey.trim();
      const allSettlements = this.getAllSettlements();
      const existingByKey = allSettlements.find((s) => s.idempotencyKey === normalizedKey);
      if (existingByKey) {
        const isSameStay = existingByKey.stayId === stayId;
        const isSameAmount = Math.abs(existingByKey.finalAmount - previewPayload.netSettlementAmount) < 0.01;
        const isSameOutcome = existingByKey.outcome === previewPayload.outcome;
        const isSameMethod = existingByKey.paymentMethod === paymentMethod;
        const isSameDamage =
          Math.abs((existingByKey.previewSnapshot?.damageDeductions || 0) - (previewPayload.damageDeductions || 0)) < 0.01;

        if (isSameStay && isSameAmount && isSameOutcome && isSameMethod && isSameDamage) {
          // Idempotent Replay (Case B)
          return { success: true, settlement: existingByKey, errors: [] };
        } else {
          // Idempotency Conflict (Case C)
          return {
            success: false,
            settlement: null,
            errors: ['Idempotency conflict: A settlement already exists with this idempotencyKey but with conflicting financial parameters.'],
          };
        }
      }
    }

    // Already-Settled Check (Case D)
    const existingSettlement = this.getSettlementByStayId(stayId);
    if (existingSettlement) {
      return {
        success: false,
        settlement: null,
        errors: [`Stay '${stayId}' has already been settled via Settlement #${existingSettlement.settlementNumber}.`],
      };
    }

    // Concurrency Protection
    if (SettlementApplicationService.activeStayLocks.has(stayId)) {
      return {
        success: false,
        settlement: null,
        errors: [`Settlement confirmation is already in progress for Stay '${stayId}'. Please wait.`],
      };
    }

    SettlementApplicationService.activeStayLocks.add(stayId);

    // Pre-operation snapshot for compensating rollback safety
    const snapshotLedger = this.repository.getLedgerEntries();
    const snapshotBills = this.repository.getBills();
    const snapshotDepositTxs = this.repository.getDepositTransactions();
    const snapshotSettlements = this.repository.getSettlements();
    const currentStay = this.stayRepository.findByIdSync(stayId);
    const snapshotResident = currentStay ? this.residentRepository.getByIdSync(currentStay.residentId) : null;

    try {
      // Re-verify existing settlement after lock acquisition
      const postLockExisting = this.getSettlementByStayId(stayId);
      if (postLockExisting) {
        return {
          success: false,
          settlement: null,
          errors: [`Stay '${stayId}' has already been settled via Settlement #${postLockExisting.settlementNumber}.`],
        };
      }

      const now = new Date().toISOString();
      const todayStr = now.split('T')[0];

      // Live T2 Balance Re-Derivation & Revalidation (Phase 3)
      const liveBalances = this.balanceService.calculateStayBalances(stayId);
      const damageDeductions =
        typeof previewPayload.damageDeductions === 'number' &&
        !isNaN(previewPayload.damageDeductions) &&
        previewPayload.damageDeductions >= 0
          ? previewPayload.damageDeductions
          : 0;

      const livePreview = deriveSettlementPreview(
        liveBalances,
        stayId,
        todayStr,
        damageDeductions,
        previewPayload.remarks
      );

      const isReceivableMismatch = Math.abs(liveBalances.receivableBalance - previewPayload.outstandingReceivable) > 0.01;
      const isDepositMismatch = Math.abs(liveBalances.securityDepositHeld - previewPayload.securityDepositHeld) > 0.01;
      const isAdvanceMismatch = Math.abs(liveBalances.advanceCreditBalance - previewPayload.advanceCreditBalance) > 0.01;
      const isNetMismatch = Math.abs(livePreview.netSettlementAmount - previewPayload.netSettlementAmount) > 0.01;
      const isOutcomeMismatch = livePreview.outcome !== previewPayload.outcome;

      if (isReceivableMismatch || isDepositMismatch || isAdvanceMismatch || isNetMismatch || isOutcomeMismatch) {
        return {
          success: false,
          settlement: null,
          errors: [
            'Settlement preview is stale. Financial balances have changed since the preview was generated. Please refresh the settlement preview and try again.',
          ],
        };
      }

      const periodTag = todayStr.slice(0, 7).replace('-', '');
      const existingSettlements = this.getAllSettlements();
      const sequenceNum = String(existingSettlements.length + 1).padStart(4, '0');
      const settlementNumber = `STL-${periodTag}-${sequenceNum}`;
      const settlementId = idempotencyKey
        ? `stl_id_${idempotencyKey.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}`
        : `stl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const ledgerEntriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[] = [];
      const ledgerReferences: string[] = [];

      const {
        outstandingReceivable,
        securityDepositHeld,
        advanceCreditBalance,
        netSettlementAmount,
        outcome,
      } = livePreview;

      // 1. Clear Security Deposit Liability
      if (securityDepositHeld > 0) {
        ledgerEntriesData.push({
          stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'SETTLEMENT' as LedgerReferenceType,
          referenceId: settlementId,
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: securityDepositHeld,
          credit: 0,
          remarks: `Clear Deposit Liability for Settlement #${settlementNumber}`,
          createdBy,
        });
      }

      // 2. Clear Advance Credit Liability
      if (advanceCreditBalance > 0) {
        ledgerEntriesData.push({
          stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'SETTLEMENT' as LedgerReferenceType,
          referenceId: settlementId,
          account: AccountType.ADVANCE_CREDIT,
          debit: advanceCreditBalance,
          credit: 0,
          remarks: `Clear Advance Credit for Settlement #${settlementNumber}`,
          createdBy,
        });
      }

      // 3. Clear Accounts Receivable Asset
      if (outstandingReceivable > 0) {
        ledgerEntriesData.push({
          stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'SETTLEMENT' as LedgerReferenceType,
          referenceId: settlementId,
          account: AccountType.ACCOUNTS_RECEIVABLE,
          debit: 0,
          credit: outstandingReceivable,
          remarks: `Clear Receivable for Settlement #${settlementNumber}`,
          createdBy,
        });
      }

      // 4. Recognize Damage Recovery Income (if damage deductions applied)
      if (damageDeductions > 0) {
        ledgerEntriesData.push({
          stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'SETTLEMENT' as LedgerReferenceType,
          referenceId: settlementId,
          account: AccountType.DAMAGE_RECOVERY,
          debit: 0,
          credit: damageDeductions,
          remarks: `Damage Deduction Recovery for Settlement #${settlementNumber}`,
          createdBy,
        });
      }

      // 5. Liquid Asset Payment / Receipt or Refund Payout
      const assetAccount = paymentMethod === 'CASH' ? AccountType.CASH : AccountType.BANK;

      if (outcome === SettlementOutcome.HOSTEL_REFUNDS_RESIDENT && netSettlementAmount > 0) {
        ledgerEntriesData.push({
          stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'SETTLEMENT' as LedgerReferenceType,
          referenceId: settlementId,
          account: assetAccount,
          debit: 0,
          credit: netSettlementAmount,
          remarks: `Deposit Refund Payout via ${paymentMethod} for Settlement #${settlementNumber}`,
          createdBy,
        });
      } else if (outcome === SettlementOutcome.RESIDENT_PAYS_HOSTEL && netSettlementAmount > 0) {
        ledgerEntriesData.push({
          stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'SETTLEMENT' as LedgerReferenceType,
          referenceId: settlementId,
          account: assetAccount,
          debit: netSettlementAmount,
          credit: 0,
          remarks: `Final Settlement Receipt via ${paymentMethod} for Settlement #${settlementNumber}`,
          createdBy,
        });
      }

      // Execute Double-Entry Ledger Postings
      if (ledgerEntriesData.length > 0) {
        const postingResult = this.ledgerService.postEntries(ledgerEntriesData);
        if (!postingResult.success) {
          throw new Error(`Failed to post settlement ledger entries: ${postingResult.errors.join(', ')}`);
        }
        postingResult.entries.forEach((e) => ledgerReferences.push(e.id));
      }

      // Record Deposit Clearance Transaction (SETTLEMENT_CLEARANCE)
      if (securityDepositHeld > 0) {
        const depTxId = `dpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const depositTransaction: DepositTransaction = {
          id: depTxId,
          stayId,
          residentId: currentStay ? currentStay.residentId : (livePreview.stayId || ''),
          transactionType: 'SETTLEMENT_CLEARANCE',
          amount: securityDepositHeld,
          postingDate: todayStr,
          effectiveDate: todayStr,
          paymentMethod,
          remarks: livePreview.remarks || `Security deposit clearance for Settlement #${settlementNumber}`,
          ledgerEntryIds: ledgerReferences,
          createdBy,
          createdAt: now,
        };
        this.repository.saveDepositTransaction(depositTransaction);
      }

      // Bill Obligation Synchronization:
      // Apply exact resolved receivable amount across open bills in due-date order using canonical calculatePaymentAllocations
      if (outstandingReceivable > 0) {
        const allStayBills = this.repository.getBillsByStayId(stayId);
        const openBills = allStayBills.filter(
          (b) => b.status === BillStatus.UNPAID || b.status === BillStatus.PARTIALLY_PAID
        );
        if (openBills.length > 0) {
          const { updatedBills } = calculatePaymentAllocations(openBills, outstandingReceivable);
          const allBills = this.repository.getBills();
          updatedBills.forEach((updatedBill) => {
            const idx = allBills.findIndex((b) => b.id === updatedBill.id);
            if (idx >= 0) {
              allBills[idx] = updatedBill;
            }
          });
          this.repository.saveBills(allBills);
        }
      }

      // Persist Finalized Settlement Entity
      const finalizedSettlement: Settlement = {
        id: settlementId,
        stayId,
        settlementNumber,
        settlementDate: todayStr,
        settlementType: 'CHECKOUT',
        previewSnapshot: livePreview,
        finalAmount: netSettlementAmount,
        outcome,
        paymentMethod,
        remarks: livePreview.remarks,
        ledgerReferences,
        createdBy,
        status: 'SETTLED',
        createdAt: now,
        idempotencyKey: idempotencyKey ? idempotencyKey.trim() : undefined,
      };

      this.repository.saveSettlement(finalizedSettlement);

      // Convert Resident status to ALUMNI upon final financial completion if all stays are closed/settled (BR-461)
      if (currentStay) {
        const resident = this.residentRepository.getByIdSync(currentStay.residentId);
        if (resident) {
          const allStays = this.stayRepository.getAllSync();
          const residentStays = allStays.filter((s) => s.residentId === resident.id);
          const hasActiveStay = residentStays.some(
            (s) => s.id !== stayId && (s.status === StayStatus.ACTIVE || s.status === StayStatus.ON_NOTICE)
          );
          if (!hasActiveStay) {
            const updatedResident: Resident = {
              ...resident,
              status: ResidentStatus.ALUMNI,
              updatedAt: now,
            };
            this.residentRepository.save(updatedResident);
          }
        }
      }

      return {
        success: true,
        settlement: finalizedSettlement,
        errors: [],
      };
    } catch (err: unknown) {
      // Compensating Rollback: restore all repositories to pre-operation snapshot
      try {
        this.repository.saveLedgerEntries(snapshotLedger);
        this.repository.saveBills(snapshotBills);
        financeStorage.saveStoredDepositTransactions(snapshotDepositTxs);
        financeStorage.saveStoredSettlements(snapshotSettlements);
        if (snapshotResident) {
          this.residentRepository.save(snapshotResident);
        }
      } catch {
        // Rollback best-effort
      }
      return {
        success: false,
        settlement: null,
        errors: [
          err instanceof Error
            ? `Settlement confirmation failed and was rolled back: ${err.message}`
            : 'Settlement confirmation failed and was rolled back cleanly.',
        ],
      };
    } finally {
      SettlementApplicationService.activeStayLocks.delete(stayId);
    }
  }
}

export const settlementService = new SettlementApplicationService();
