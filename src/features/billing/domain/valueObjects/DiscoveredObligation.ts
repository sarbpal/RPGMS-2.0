import type {
  ChargeType,
  RevenueCategory,
  ObligationCommitmentStatus,
} from './BillingTypes';

export interface DiscoveredObligationProps {
  readonly obligationKey: string;
  readonly stayId: string;
  readonly residentId: string;
  readonly residentCode: string;
  readonly chargeType: ChargeType;
  readonly amount: number;
  readonly businessDate: string;
  readonly entryDate: string;
  readonly description: string;
  readonly category: RevenueCategory;
  readonly commitmentStatus: ObligationCommitmentStatus;
  readonly financialReferenceId?: string;
  readonly sourcePeriodLabel?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Value Object representing a normalized discoverable obligation across RPGMS domains.
 *
 * Immutability:
 * - All properties are read-only.
 * - Represents upstream business truth; Billing Engine never recalculates or modifies amounts.
 */
export class DiscoveredObligation {
  readonly obligationKey: string;
  readonly stayId: string;
  readonly residentId: string;
  readonly residentCode: string;
  readonly chargeType: ChargeType;
  readonly amount: number;
  readonly businessDate: string;
  readonly entryDate: string;
  readonly description: string;
  readonly category: RevenueCategory;
  readonly commitmentStatus: ObligationCommitmentStatus;
  readonly financialReferenceId?: string;
  readonly sourcePeriodLabel?: string;
  readonly metadata?: Record<string, unknown>;

  constructor(props: DiscoveredObligationProps) {
    if (!props.obligationKey || props.obligationKey.trim() === '') {
      throw new Error('DiscoveredObligation requires a valid obligationKey.');
    }
    if (!props.stayId || props.stayId.trim() === '') {
      throw new Error('DiscoveredObligation requires a valid stayId.');
    }
    if (!props.residentId || props.residentId.trim() === '') {
      throw new Error('DiscoveredObligation requires a valid residentId.');
    }
    if (typeof props.amount !== 'number' || isNaN(props.amount) || props.amount <= 0) {
      throw new Error('DiscoveredObligation amount must be a positive number greater than zero.');
    }
    if (!props.businessDate || props.businessDate.trim() === '') {
      throw new Error('DiscoveredObligation requires a businessDate.');
    }
    if (!props.entryDate || props.entryDate.trim() === '') {
      throw new Error('DiscoveredObligation requires an entryDate.');
    }
    if (props.commitmentStatus === 'COMMITTED' && !props.financialReferenceId) {
      // If already committed, a financial reference (e.g. Finance Bill ID) is expected for complete traceability
    }

    this.obligationKey = props.obligationKey;
    this.stayId = props.stayId;
    this.residentId = props.residentId;
    this.residentCode = props.residentCode || '';
    this.chargeType = props.chargeType;
    this.amount = Number(props.amount.toFixed(2));
    this.businessDate = props.businessDate;
    this.entryDate = props.entryDate;
    this.description = props.description || '';
    this.category = props.category;
    this.commitmentStatus = props.commitmentStatus;
    this.financialReferenceId = props.financialReferenceId;
    this.sourcePeriodLabel = props.sourcePeriodLabel;
    this.metadata = props.metadata ? Object.freeze({ ...props.metadata }) : undefined;
  }

  /**
   * Helper check to determine if the obligation is eligible for Billing Run claim acquisition.
   * Only UNCOMMITTED obligations can be claimed and posted by Billing Runs.
   */
  isClaimable(): boolean {
    return this.commitmentStatus === 'UNCOMMITTED';
  }

  /**
   * Helper check to determine if the obligation is already financially committed.
   */
  isCommitted(): boolean {
    return this.commitmentStatus === 'COMMITTED';
  }
}
