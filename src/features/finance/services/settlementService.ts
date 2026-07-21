import type {
  Settlement,
  SettlementPreview,
  SettlementType,
  PaymentMethod,
  LedgerEntry,
} from '../types';
import { AccountType, SettlementOutcome } from '../types';
import { financeStorage } from '../storage/financeStorage';
import { ledgerService } from './ledgerService';
import { balanceEngine } from './balanceEngine';
import { stayService } from '../../residents/stay';

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

export const settlementService = {
  /**
   * Fetch all settlements stored in the system.
   */
  getAllSettlements(): Settlement[] {
    return financeStorage.getStoredSettlements();
  },

  /**
   * Fetch the checkout settlement record for a specific Stay ID (if any).
   * 
   * @param stayId Target Stay ID
   * @returns Settlement object or null
   */
  getSettlementByStayId(stayId: string): Settlement | null {
    const settlements = this.getAllSettlements();
    return settlements.find((s) => s.stayId === stayId && s.status === 'SETTLED') || null;
  },

  /**
   * STAGE 1: Generate a read-only Settlement Preview for a Stay.
   * Calculates outstanding receivables, deposit held, advance credit, damage recovery,
   * total dues, total credits, and net settlement outcome.
   * 
   * STRICTLY READ-ONLY: Performs no storage writes, no ledger entries, no state mutations.
   * 
   * @param stayId Target Stay ID
   * @param damageDeductions Optional damage recovery deduction amount (default: 0)
   * @param remarks Optional operator notes / narrative
   * @returns GeneratePreviewResult object containing read-only SettlementPreview
   */
  generateSettlementPreview(
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

    const stay = stayService.getStay(stayId);
    if (!stay) {
      errors.push(`Stay '${stayId}' not found in system.`);
      return { success: false, preview: null, errors };
    }

    if (stay.status === 'CLOSED') {
      errors.push(`Stay '${stayId}' is already closed.`);
      return { success: false, preview: null, errors };
    }

    const existingSettlement = this.getSettlementByStayId(stayId);
    if (existingSettlement) {
      errors.push(`Stay '${stayId}' has already been settled via Settlement #${existingSettlement.settlementNumber}.`);
      return { success: false, preview: null, errors };
    }

    // Derive financial balances strictly from balanceEngine
    const balances = balanceEngine.calculateStayBalances(stayId);
    const outstandingReceivable = balances.receivableBalance;
    const advanceCreditBalance = balances.advanceCreditBalance;
    const securityDepositHeld = balances.securityDepositHeld;

    const roundedDamage = Math.round(damageDeductions * 100) / 100;
    const totalDues = Math.round((outstandingReceivable + roundedDamage) * 100) / 100;
    const totalAvailableCredits = Math.round((securityDepositHeld + advanceCreditBalance) * 100) / 100;

    let outcome: typeof SettlementOutcome[keyof typeof SettlementOutcome] =
      SettlementOutcome.BALANCED_NO_ACTION;

    let netSettlementAmount = 0;

    if (totalAvailableCredits > totalDues) {
      outcome = SettlementOutcome.HOSTEL_REFUNDS_RESIDENT;
      netSettlementAmount = Math.round((totalAvailableCredits - totalDues) * 100) / 100;
    } else if (totalDues > totalAvailableCredits) {
      outcome = SettlementOutcome.RESIDENT_PAYS_HOSTEL;
      netSettlementAmount = Math.round((totalDues - totalAvailableCredits) * 100) / 100;
    } else {
      outcome = SettlementOutcome.BALANCED_NO_ACTION;
      netSettlementAmount = 0;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const preview: SettlementPreview = {
      stayId,
      previewDate: todayStr,
      outstandingReceivable,
      advanceCreditBalance,
      securityDepositHeld,
      damageDeductions: roundedDamage,
      totalDues,
      totalAvailableCredits,
      netSettlementAmount,
      outcome,
      remarks,
    };

    return {
      success: true,
      preview,
      errors: [],
    };
  },

  /**
   * STAGE 2: Confirm a Settlement using a previously generated read-only SettlementPreview.
   * Creates balanced double-entry ledger postings, stores the complete preview snapshot,
   * creates the Settlement record, and closes the Stay.
   * 
   * @param preview The SettlementPreview object generated in Stage 1
   * @param paymentMethod Payment method for final refund or receipt (CASH or BANK_TRANSFER)
   * @param settlementType Type of settlement (CHECKOUT, EARLY_TERMINATION, NOTICE_EXPIRY)
   * @param createdBy User/system identifier executing settlement
   * @returns ConfirmSettlementResult object
   */
  confirmSettlement(
    preview: SettlementPreview,
    paymentMethod: PaymentMethod = 'BANK_TRANSFER',
    settlementType: SettlementType = 'CHECKOUT',
    createdBy = 'SETTLEMENT_ENGINE'
  ): ConfirmSettlementResult {
    const errors: string[] = [];

    if (!preview || !preview.stayId) {
      errors.push('Invalid or missing settlement preview.');
      return { success: false, settlement: null, errors };
    }

    const stay = stayService.getStay(preview.stayId);
    if (!stay || stay.status === 'CLOSED') {
      errors.push(`Stay '${preview.stayId}' is invalid or already closed.`);
      return { success: false, settlement: null, errors };
    }

    const existingSettlement = this.getSettlementByStayId(preview.stayId);
    if (existingSettlement) {
      errors.push(`Stay '${preview.stayId}' is already settled.`);
      return { success: false, settlement: null, errors };
    }

    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];
    const periodTag = todayStr.slice(0, 7).replace('-', '');
    const existingSettlements = this.getAllSettlements();
    const sequenceNum = String(existingSettlements.length + 1).padStart(4, '0');
    const settlementNumber = `STL-${periodTag}-${sequenceNum}`;
    const settlementId = `stl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const liquidAccount = paymentMethod === 'CASH' ? AccountType.CASH : AccountType.BANK;
    const ledgerEntriesData: Omit<LedgerEntry, 'id' | 'createdAt'>[] = [];

    // 1. Damage Recovery Ledger Entry (if damageDeductions > 0)
    if (preview.damageDeductions > 0) {
      ledgerEntriesData.push({
        stayId: preview.stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'SETTLEMENT',
        referenceId: settlementId,
        account: AccountType.ACCOUNTS_RECEIVABLE,
        debit: preview.damageDeductions,
        credit: 0,
        remarks: `Damage charge deduction for Settlement #${settlementNumber}`,
        createdBy,
      });
      ledgerEntriesData.push({
        stayId: preview.stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'SETTLEMENT',
        referenceId: settlementId,
        account: AccountType.DAMAGE_RECOVERY,
        debit: 0,
        credit: preview.damageDeductions,
        remarks: `Damage recovery revenue for Settlement #${settlementNumber}`,
        createdBy,
      });
    }

    // Total dues to clear against credits
    const totalDuesToClear = preview.totalDues;

    // 2. Advance Credit Offset against Receivables (if advanceCreditBalance > 0)
    const advanceToOffset = Math.min(preview.advanceCreditBalance, totalDuesToClear);
    if (advanceToOffset > 0) {
      ledgerEntriesData.push({
        stayId: preview.stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'SETTLEMENT',
        referenceId: settlementId,
        account: AccountType.ADVANCE_CREDIT,
        debit: advanceToOffset,
        credit: 0,
        remarks: `Advance credit applied to clear dues for Settlement #${settlementNumber}`,
        createdBy,
      });
      ledgerEntriesData.push({
        stayId: preview.stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'SETTLEMENT',
        referenceId: settlementId,
        account: AccountType.ACCOUNTS_RECEIVABLE,
        debit: 0,
        credit: advanceToOffset,
        remarks: `Receivable cleared by advance credit for Settlement #${settlementNumber}`,
        createdBy,
      });
    }

    // Remaining dues to clear with deposit
    const remainingDuesToClear = Math.round((totalDuesToClear - advanceToOffset) * 100) / 100;
    const depositToOffset = Math.min(preview.securityDepositHeld, remainingDuesToClear);

    if (depositToOffset > 0) {
      ledgerEntriesData.push({
        stayId: preview.stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'SETTLEMENT',
        referenceId: settlementId,
        account: AccountType.SECURITY_DEPOSIT_LIABILITY,
        debit: depositToOffset,
        credit: 0,
        remarks: `Security deposit applied to clear dues for Settlement #${settlementNumber}`,
        createdBy,
      });
      ledgerEntriesData.push({
        stayId: preview.stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'SETTLEMENT',
        referenceId: settlementId,
        account: AccountType.ACCOUNTS_RECEIVABLE,
        debit: 0,
        credit: depositToOffset,
        remarks: `Receivable cleared by deposit for Settlement #${settlementNumber}`,
        createdBy,
      });
    }

    // 3. Final Settlement Refund to Resident (Hostel Refunds Resident)
    if (preview.outcome === SettlementOutcome.HOSTEL_REFUNDS_RESIDENT && preview.netSettlementAmount > 0) {
      const remainingDepositToRefund = Math.round((preview.securityDepositHeld - depositToOffset) * 100) / 100;
      const remainingAdvanceToRefund = Math.round((preview.advanceCreditBalance - advanceToOffset) * 100) / 100;

      if (remainingDepositToRefund > 0) {
        ledgerEntriesData.push({
          stayId: preview.stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'SETTLEMENT',
          referenceId: settlementId,
          account: AccountType.SECURITY_DEPOSIT_LIABILITY,
          debit: remainingDepositToRefund,
          credit: 0,
          remarks: `Security deposit refund payout for Settlement #${settlementNumber}`,
          createdBy,
        });
      }

      if (remainingAdvanceToRefund > 0) {
        ledgerEntriesData.push({
          stayId: preview.stayId,
          postingDate: todayStr,
          effectiveDate: todayStr,
          referenceType: 'SETTLEMENT',
          referenceId: settlementId,
          account: AccountType.ADVANCE_CREDIT,
          debit: remainingAdvanceToRefund,
          credit: 0,
          remarks: `Advance credit refund payout for Settlement #${settlementNumber}`,
          createdBy,
        });
      }

      ledgerEntriesData.push({
        stayId: preview.stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'SETTLEMENT',
        referenceId: settlementId,
        account: liquidAccount,
        debit: 0,
        credit: preview.netSettlementAmount,
        remarks: `Net refund paid out via ${paymentMethod} for Settlement #${settlementNumber}`,
        createdBy,
      });
    }

    // 4. Final Settlement Payment from Resident (Resident Pays Hostel)
    if (preview.outcome === SettlementOutcome.RESIDENT_PAYS_HOSTEL && preview.netSettlementAmount > 0) {
      ledgerEntriesData.push({
        stayId: preview.stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'SETTLEMENT',
        referenceId: settlementId,
        account: liquidAccount,
        debit: preview.netSettlementAmount,
        credit: 0,
        remarks: `Final settlement payment received via ${paymentMethod} for Settlement #${settlementNumber}`,
        createdBy,
      });
      ledgerEntriesData.push({
        stayId: preview.stayId,
        postingDate: todayStr,
        effectiveDate: todayStr,
        referenceType: 'SETTLEMENT',
        referenceId: settlementId,
        account: AccountType.ACCOUNTS_RECEIVABLE,
        debit: 0,
        credit: preview.netSettlementAmount,
        remarks: `Receivable cleared by settlement payment for Settlement #${settlementNumber}`,
        createdBy,
      });
    }

    // Post entries via ledgerService
    let ledgerReferences: string[] = [];
    if (ledgerEntriesData.length > 0) {
      const postingResult = ledgerService.postEntries(ledgerEntriesData);
      if (!postingResult.success) {
        return {
          success: false,
          settlement: null,
          errors: [`Failed to post settlement ledger entries: ${postingResult.errors.join(', ')}`],
        };
      }
      ledgerReferences = postingResult.entries.map((e) => e.id);
    }

    // Create & persist Settlement record containing complete SettlementPreview snapshot
    const newSettlement: Settlement = {
      id: settlementId,
      stayId: preview.stayId,
      settlementNumber,
      settlementDate: todayStr,
      settlementType,
      previewSnapshot: preview,
      finalAmount: preview.netSettlementAmount,
      outcome: preview.outcome,
      paymentMethod,
      remarks: preview.remarks,
      ledgerReferences,
      createdBy,
      status: 'SETTLED',
      createdAt: now,
    };

    financeStorage.saveStoredSettlements([...existingSettlements, newSettlement]);

    // Close the Stay in Stay domain
    stayService.closeStay(preview.stayId);

    return {
      success: true,
      settlement: newSettlement,
      errors: [],
    };
  },
};
