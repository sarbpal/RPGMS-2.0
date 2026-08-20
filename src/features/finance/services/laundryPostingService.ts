import type { Bill, FinanceRepository } from '../domain';
import { defaultFinanceRepository } from '../infrastructure';
import { BillingApplicationService, defaultBillingService } from './billingService';
import type { StayRepository } from '../../stay/domain/interfaces/StayRepository';
import { defaultStayRepository } from '../../stay/infrastructure/repositories/InMemoryStayRepository';
import type { LaundryChargeRecord } from '../../laundry/domain/entities/LaundryChargeRecord';
import type { LaundryBusinessEvent } from '../../laundry/domain/valueObjects/LaundryBusinessEvent';

export interface LaundryChargeEventPayload {
  stayId: string;
  residentId?: string;
  businessChargeId: string;
  transactionId?: string;
  garmentLineId?: string;
  serviceId?: string;
  bracketIndex?: number;
  chargeableQuantity: number;
  unitRate: number;
  totalAmount: number;
  currency?: string;
  calculatedAt?: string;
  description?: string;
}

export interface PostLaundryChargeResult {
  success: boolean;
  bill: Bill | null;
  businessChargeId: string;
  isDuplicate: boolean;
  errors: string[];
}

/**
 * LaundryPostingService is the Finance-side integration service responsible for consuming
 * canonical LaundryChargeRaised events and creating authoritative Finance Bills and Ledger Entries.
 *
 * Core Architectural Boundaries (BR-L-012, BR-L-013, ADR-031):
 * 1. Commercial Calculation Ownership: Laundry owns quantity, unit rate, charge amount, and businessChargeId.
 *    Finance consumes these values as authoritative commercial facts and NEVER recalculates them.
 * 2. Financial Authority: Finance creates the authoritative Bill and LedgerEntry in the Unified Stay Ledger.
 *    Laundry never maintains parallel financial ledgers or balances.
 * 3. Idempotency: Guaranteed by businessChargeId (`transactionId:garmentLineId:serviceId:BRK-XX`).
 *    Duplicate event deliveries produce at most ONE Finance posting.
 * 4. Failure Atomicity & Recovery: If Finance posting fails, LaundryChargeRecord remains PENDING_POSTING.
 *    If Finance posting already succeeded (crash-window), retry updates LaundryChargeRecord to POSTED
 *    without duplicating financial records.
 */
export class LaundryPostingService {
  private readonly billingService: BillingApplicationService;
  private readonly financeRepository: FinanceRepository;
  private readonly stayRepository: StayRepository;

  constructor(
    billingService: BillingApplicationService = defaultBillingService,
    financeRepository: FinanceRepository = defaultFinanceRepository,
    stayRepository: StayRepository = defaultStayRepository
  ) {
    this.billingService = billingService;
    this.financeRepository = financeRepository;
    this.stayRepository = stayRepository;
  }

  /**
   * Processes a LaundryChargeRaised event or payload, creating an authoritative Finance Bill.
   *
   * @param eventOrPayload - Canonical LaundryBusinessEvent or structured LaundryChargeEventPayload
   * @param chargeRecord - Optional originating LaundryChargeRecord to update to POSTED on success
   */
  public postLaundryCharge(
    eventOrPayload: LaundryBusinessEvent | LaundryChargeEventPayload,
    chargeRecord?: LaundryChargeRecord
  ): PostLaundryChargeResult {
    const payload = this.extractPayload(eventOrPayload);
    const errors: string[] = [];

    // 1. Validate payload attributes
    if (!payload.businessChargeId || payload.businessChargeId.trim() === '') {
      errors.push('Missing or invalid businessChargeId.');
    }
    if (!payload.stayId || payload.stayId.trim() === '') {
      errors.push('Missing or invalid stayId.');
    }
    if (typeof payload.totalAmount !== 'number' || isNaN(payload.totalAmount) || payload.totalAmount <= 0) {
      errors.push('Laundry charge totalAmount must be a positive number greater than zero.');
    }
    if (
      typeof payload.chargeableQuantity !== 'number' ||
      isNaN(payload.chargeableQuantity) ||
      payload.chargeableQuantity <= 0
    ) {
      errors.push('Laundry charge chargeableQuantity must be a positive number.');
    }
    if (typeof payload.unitRate !== 'number' || isNaN(payload.unitRate) || payload.unitRate < 0) {
      errors.push('Laundry charge unitRate must be a non-negative number.');
    }

    if (errors.length > 0) {
      return {
        success: false,
        bill: null,
        businessChargeId: payload.businessChargeId || '',
        isDuplicate: false,
        errors,
      };
    }

    const businessChargeId = payload.businessChargeId.trim();
    const stayId = payload.stayId.trim();

    // 2. Idempotency Check: check if a Finance bill for this businessChargeId already exists
    const existingBill = this.findBillByBusinessChargeId(businessChargeId);
    if (existingBill) {
      if (chargeRecord && chargeRecord.status !== 'POSTED') {
        chargeRecord.markPosted(existingBill.id, existingBill.createdAt);
      }
      return {
        success: true,
        bill: existingBill,
        businessChargeId,
        isDuplicate: true,
        errors: [],
      };
    }

    // 3. Verify Stay existence in Stay repository
    const stay = this.stayRepository.findByIdSync(stayId);
    if (!stay) {
      return {
        success: false,
        bill: null,
        businessChargeId,
        isDuplicate: false,
        errors: [`Stay '${stayId}' not found in Stay repository. Cannot post Laundry charge.`],
      };
    }

    // 4. Determine dates
    const effectiveDate = payload.calculatedAt
      ? payload.calculatedAt.split('T')[0]
      : new Date().toISOString().split('T')[0];
    const periodStr = effectiveDate.slice(0, 7);
    const description =
      payload.description ||
      `Laundry Service Charge - ${payload.serviceId || 'Standard'} (${payload.chargeableQuantity} unit(s) @ ₹${payload.unitRate})`;

    // 5. Create authoritative Finance Bill and balanced Double-Entry Ledger entries
    const billResult = this.billingService.createBill({
      stayId,
      billType: 'ONE_TIME_CHARGE',
      period: periodStr,
      issueDate: effectiveDate,
      dueDate: effectiveDate,
      totalAmount: payload.totalAmount,
      status: 'UNPAID',
      remarks: `Laundry Charge: ${businessChargeId}`,
      lineItems: [
        {
          id: `li_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          description,
          amount: payload.totalAmount,
          category: 'LAUNDRY',
          obligationKey: businessChargeId,
        },
      ],
    });

    if (!billResult.success || !billResult.bill) {
      return {
        success: false,
        bill: null,
        businessChargeId,
        isDuplicate: false,
        errors: billResult.errors,
      };
    }

    // 6. On successful Finance posting, transition LaundryChargeRecord to POSTED
    if (chargeRecord) {
      chargeRecord.markPosted(billResult.bill.id, billResult.bill.createdAt);
    }

    return {
      success: true,
      bill: billResult.bill,
      businessChargeId,
      isDuplicate: false,
      errors: [],
    };
  }

  /**
   * Helper to find an existing Bill by businessChargeId (via lineItem.obligationKey).
   */
  public findBillByBusinessChargeId(businessChargeId: string): Bill | null {
    if (!businessChargeId) return null;
    const bills = this.financeRepository.getBills();
    return (
      bills.find((b) =>
        b.lineItems.some((li) => li.obligationKey === businessChargeId)
      ) || null
    );
  }

  private extractPayload(
    eventOrPayload: LaundryBusinessEvent | LaundryChargeEventPayload
  ): LaundryChargeEventPayload {
    // If it's a LaundryBusinessEvent
    if ('eventType' in eventOrPayload && eventOrPayload.eventType === 'LaundryChargeRaised') {
      const meta = (eventOrPayload.metadata || {}) as Record<string, any>;
      return {
        stayId: String(meta.stayId || ''),
        residentId: meta.residentId ? String(meta.residentId) : undefined,
        businessChargeId: String(meta.businessChargeId || ''),
        transactionId: eventOrPayload.transactionId,
        garmentLineId: meta.garmentLineId ? String(meta.garmentLineId) : undefined,
        serviceId: meta.serviceId ? String(meta.serviceId) : undefined,
        bracketIndex: typeof meta.bracketIndex === 'number' ? meta.bracketIndex : undefined,
        chargeableQuantity: typeof meta.chargeableQuantity === 'number' ? meta.chargeableQuantity : 0,
        unitRate: typeof meta.unitRate === 'number' ? meta.unitRate : 0,
        totalAmount: typeof meta.totalAmount === 'number' ? meta.totalAmount : 0,
        currency: meta.currency ? String(meta.currency) : 'INR',
        calculatedAt: eventOrPayload.timestamp,
        description: eventOrPayload.description,
      };
    }

    return eventOrPayload as LaundryChargeEventPayload;
  }
}

export const defaultLaundryPostingService = new LaundryPostingService();
