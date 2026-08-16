import type { Bill, LedgerEntry, FinanceRepository } from '../../../finance/domain';
import { AccountType, LedgerReferenceType } from '../../../finance/domain';
import { defaultFinanceRepository } from '../../../finance/infrastructure';
import { TokenDisposition } from '../../domain/valueObjects/TokenDisposition';
import type { AdmissionDraft } from '../models/AdmissionDraft';
import type { AdmissionResult } from '../models/AdmissionResult';
import type { StayRepository } from '../../../stay/domain/interfaces/StayRepository';
import { defaultStayRepository } from '../../../stay/infrastructure/repositories/InMemoryStayRepository';
import { BillingApplicationService } from '../../../finance/services/billingService';
import { LedgerApplicationService } from '../../../finance/services/ledgerService';

export interface AdmissionFinanceResult {
  success: boolean;
  depositLedgerEntries: LedgerEntry[];
  rentBill: Bill | null;
  advanceCreditEntries: LedgerEntry[];
  errors: string[];
}

export class AdmissionFinanceService {
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
    this.ledgerService = ledgerService ?? new LedgerApplicationService(repository, stayRepository);
    this.billingService = billingService ?? new BillingApplicationService(repository, stayRepository, this.ledgerService);
  }

  public getStayRepository(): StayRepository {
    return this.stayRepository;
  }

  /**
   * Orchestrates complete financial initialization for an Admission (Reservation Conversion or Walk-in).
   * - Security Deposit Liability posting (Debit ACCOUNTS_RECEIVABLE, Credit SECURITY_DEPOSIT_LIABILITY)
   * - Initial Rent Bill creation and posting (Debit ACCOUNTS_RECEIVABLE, Credit RENT_REVENUE)
   * - Token ADVANCE_CREDIT posting when TokenDisposition === LEAVE_PENDING
   */
  public initializeAdmissionFinance(
    admissionResult: AdmissionResult,
    draft: AdmissionDraft
  ): AdmissionFinanceResult {
    const stayId = admissionResult.stayId;

    if (!stayId || stayId.trim() === '') {
      return {
        success: false,
        depositLedgerEntries: [],
        rentBill: null,
        advanceCreditEntries: [],
        errors: ['Missing or invalid stayId in admission result.'],
      };
    }

    const checkInDate = draft.checkInDate || new Date().toISOString().split('T')[0];
    const billingPeriod = checkInDate.slice(0, 7);

    // 1. Idempotency Guard: Prevent duplicate financial initialization for the same stay
    const existingBills = this.repository.getBillsByStayId(stayId);
    if (existingBills.some((b) => b.period === billingPeriod && b.billType === 'MONTHLY_RENT')) {
      return {
        success: false,
        depositLedgerEntries: [],
        rentBill: null,
        advanceCreditEntries: [],
        errors: [`Financial billing already initialized for Stay '${stayId}' in period '${billingPeriod}'.`],
      };
    }

    let depositEntries: LedgerEntry[] = [];
    let rentBill: Bill | null = null;
    let advanceEntries: LedgerEntry[] = [];

    try {
      // Step A: Post Initial Security Deposit Liability if adjusted deposit > 0
      const depositAmount =
        typeof admissionResult.adjustedDepositBalance === 'number'
          ? admissionResult.adjustedDepositBalance
          : Number(admissionResult.agreedDeposit || 0);

      if (depositAmount > 0) {
        const depositPostResult = this.ledgerService.postEntries([
          {
            stayId,
            postingDate: checkInDate,
            effectiveDate: checkInDate,
            referenceType: 'BILL' as LedgerReferenceType,
            referenceId: stayId,
            account: AccountType.ACCOUNTS_RECEIVABLE,
            debit: depositAmount,
            credit: 0,
            remarks: `Security Deposit Obligation - Admission Check-in (${admissionResult.residentName})`,
            createdBy: 'ADMISSION_FINANCE_ENGINE',
          },
          {
            stayId,
            postingDate: checkInDate,
            effectiveDate: checkInDate,
            referenceType: 'BILL' as LedgerReferenceType,
            referenceId: stayId,
            account: AccountType.SECURITY_DEPOSIT_LIABILITY,
            debit: 0,
            credit: depositAmount,
            remarks: `Security Deposit Liability - Admission Check-in (${admissionResult.residentName})`,
            createdBy: 'ADMISSION_FINANCE_ENGINE',
          },
        ]);

        if (!depositPostResult.success) {
          return {
            success: false,
            depositLedgerEntries: [],
            rentBill: null,
            advanceCreditEntries: [],
            errors: [`Security deposit posting failed: ${depositPostResult.errors.join(', ')}`],
          };
        }

        depositEntries = depositPostResult.entries;
      }

      // Step B: Create & Post Initial Rent Bill if adjusted rent > 0
      const rentAmount =
        typeof admissionResult.adjustedRentBalance === 'number'
          ? admissionResult.adjustedRentBalance
          : Number(admissionResult.agreedRent || 0);

      if (rentAmount > 0) {
        const calculateDueDate = (issue: string): string => {
          try {
            const d = new Date(issue);
            d.setDate(d.getDate() + 7);
            return d.toISOString().split('T')[0];
          } catch {
            return `${billingPeriod}-07`;
          }
        };

        const dueDate = calculateDueDate(checkInDate);
        const sourceLabel =
          admissionResult.reservationNumber && admissionResult.reservationNumber !== 'N/A (Walk-in)'
            ? `Reservation ${admissionResult.reservationNumber}`
            : 'Walk-in';

        const billResult = this.billingService.createBill({
          stayId,
          billType: 'MONTHLY_RENT',
          period: billingPeriod,
          issueDate: checkInDate,
          dueDate,
          lineItems: [
            {
              id: `li_admission_rent_${Date.now()}`,
              description: `Initial Monthly Rent - ${billingPeriod} (${sourceLabel})`,
              amount: rentAmount,
              category: 'RENT',
            },
          ],
          totalAmount: rentAmount,
          status: 'UNPAID',
          remarks: `Initial Rent Invoice for ${billingPeriod} (${sourceLabel})`,
        });

        if (!billResult.success || !billResult.bill) {
          // Compensate partial deposit posting if rent creation fails
          if (depositEntries.length > 0) {
            this.ledgerService.reverseEntries('BILL', stayId, 'Rollback failed admission rent bill');
          }

          return {
            success: false,
            depositLedgerEntries: [],
            rentBill: null,
            advanceCreditEntries: [],
            errors: [`Initial rent bill generation failed: ${billResult.errors.join(', ')}`],
          };
        }

        rentBill = billResult.bill;
      }

      // Step C: Handle Token LEAVE_PENDING Advance Credit Posting
      const tokenAmount = admissionResult.tokenAmount || 0;
      if (tokenAmount > 0 && draft.tokenDisposition === TokenDisposition.LEAVE_PENDING) {
        const advancePostResult = this.ledgerService.postEntries([
          {
            stayId,
            postingDate: checkInDate,
            effectiveDate: checkInDate,
            referenceType: 'PAYMENT' as LedgerReferenceType,
            referenceId: stayId,
            account: AccountType.BANK,
            debit: tokenAmount,
            credit: 0,
            remarks: `Reservation Token Receipt - Held Pending (${admissionResult.reservationNumber})`,
            createdBy: 'ADMISSION_FINANCE_ENGINE',
          },
          {
            stayId,
            postingDate: checkInDate,
            effectiveDate: checkInDate,
            referenceType: 'PAYMENT' as LedgerReferenceType,
            referenceId: stayId,
            account: AccountType.ADVANCE_CREDIT,
            debit: 0,
            credit: tokenAmount,
            remarks: `Advance Credit - Reservation Token (${admissionResult.reservationNumber})`,
            createdBy: 'ADMISSION_FINANCE_ENGINE',
          },
        ]);

        if (advancePostResult.success) {
          advanceEntries = advancePostResult.entries;
        }
      }

      return {
        success: true,
        depositLedgerEntries: depositEntries,
        rentBill,
        advanceCreditEntries: advanceEntries,
        errors: [],
      };
    } catch (error: any) {
      // Compensate partial postings on unexpected exception
      if (depositEntries.length > 0) {
        this.ledgerService.reverseEntries('BILL', stayId, 'Rollback exception in admission finance');
      }
      return {
        success: false,
        depositLedgerEntries: [],
        rentBill: null,
        advanceCreditEntries: [],
        errors: [error?.message || 'Unexpected exception during admission financial initialization.'],
      };
    }
  }

  /**
   * Helper for Compensating Rollback: Cleans up any Finance entries associated with a failed admission.
   */
  public rollbackAdmissionFinance(stayId: string): void {
    if (!stayId) return;

    // Delete or reverse bills and ledger entries for the failed stayId
    const storedBills = this.repository.getBills();
    const remainingBills = storedBills.filter((b) => b.stayId !== stayId);
    this.repository.saveBills(remainingBills);

    const storedEntries = this.repository.getLedgerEntries();
    const remainingEntries = storedEntries.filter((e) => e.stayId !== stayId);
    this.repository.saveLedgerEntries(remainingEntries);
  }
}

export const admissionFinanceService = new AdmissionFinanceService();
