import type {
  Settlement,
  SettlementPreview,
  PaymentMethod,
  LedgerEntry,
  FinanceRepository,
  LedgerReferenceType,
} from '../domain';

import { AccountType, SettlementOutcome, deriveSettlementPreview } from '../domain';
import { defaultFinanceRepository } from '../infrastructure';
import { balanceEngine } from './balanceEngine';
import type { StayRepository } from '../../stay';
import { InMemoryStayRepository, StayStatus } from '../../stay';
import { LedgerApplicationService } from './ledgerService';

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

    if (stay.status === StayStatus.CHECKED_OUT) {
      errors.push(`Stay '${stayId}' is already checked out.`);
      return { success: false, preview: null, errors };
    }

    const existingSettlement = this.getSettlementByStayId(stayId);
    if (existingSettlement) {
      errors.push(`Stay '${stayId}' has already been settled via Settlement #${existingSettlement.settlementNumber}.`);
      return { success: false, preview: null, errors };
    }

    const balances = balanceEngine.calculateStayBalances(stayId);
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
   * Creates balanced double-entry ledger postings, stores preview snapshot,
   * updates Settlement status, and financially closes the Stay.
   */
  public confirmSettlement(
    previewPayload: SettlementPreview,
    paymentMethod: PaymentMethod = 'BANK_TRANSFER' as PaymentMethod,
    createdBy = 'SETTLEMENT_ENGINE'
  ): ConfirmSettlementResult {
    const errors: string[] = [];

    if (!previewPayload || !previewPayload.stayId) {
      errors.push('Missing or invalid settlement preview payload.');
      return { success: false, settlement: null, errors };
    }

    const stayId = previewPayload.stayId;

    const existingSettlement = this.getSettlementByStayId(stayId);
    if (existingSettlement) {
      errors.push(`Stay '${stayId}' has already been settled.`);
      return { success: false, settlement: null, errors };
    }

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const periodTag = todayStr.slice(0, 7).replace('-', '');
    const existingSettlements = this.getAllSettlements();
    const sequenceNum = String(existingSettlements.length + 1).padStart(4, '0');
    const settlementNumber = `STL-${periodTag}-${sequenceNum}`;
    const settlementId = `stl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const ledgerEntriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[] = [];
    const ledgerReferences: string[] = [];

    const {
      outstandingReceivable,
      securityDepositHeld,
      advanceCreditBalance,
      damageDeductions,
      netSettlementAmount,
      outcome,
    } = previewPayload;

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

    // 5. Liquid Asset Payment / Receipt or Refund Payable
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

    if (ledgerEntriesData.length > 0) {
      const postingResult = this.ledgerService.postEntries(ledgerEntriesData);
      if (!postingResult.success) {
        return {
          success: false,
          settlement: null,
          errors: [`Failed to post settlement ledger entries: ${postingResult.errors.join(', ')}`],
        };
      }
      postingResult.entries.forEach((e) => ledgerReferences.push(e.id));
    }

    // Create Settlement entity
    const finalizedSettlement: Settlement = {
      id: settlementId,
      stayId,
      settlementNumber,
      settlementDate: todayStr,
      settlementType: 'CHECKOUT',
      previewSnapshot: previewPayload,
      finalAmount: netSettlementAmount,
      outcome,
      paymentMethod,
      remarks: previewPayload.remarks,
      ledgerReferences,
      createdBy,
      status: 'SETTLED',
      createdAt: now,
    };

    // Save Settlement via repository
    this.repository.saveSettlement(finalizedSettlement);

    // Ensure Stay operational checkout is reflected cleanly if not already checked out
    const currentStay = this.stayRepository.findByIdSync(stayId);
    if (currentStay && currentStay.status !== StayStatus.CHECKED_OUT) {
      if (currentStay.status === StayStatus.ACTIVE) {
        currentStay.giveNotice({
          noticeDate: new Date().toISOString().split('T')[0],
          expectedCheckoutDate: new Date().toISOString().split('T')[0],
          reason: 'Settlement checkout',
        });
      }
      currentStay.processCheckout({
        actualCheckoutDate: new Date().toISOString().split('T')[0],
        reason: 'Settlement finalized',
      });
      this.stayRepository.save(currentStay);
    }


    return {
      success: true,
      settlement: finalizedSettlement,
      errors: [],
    };
  }
}

export const settlementService = new SettlementApplicationService();
