/**
 * Billing Engine Canonical Types & Status Enums
 * Authoritative source: docs/BILLING_ENGINE_ARCHITECTURE.md (v1.2)
 */

export type BillingRunStatus =
  | 'DRAFT_PREVIEW'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'STOPPING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type BillingOperationOutcome =
  | 'PENDING'
  | 'CLAIMED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'NO_CHARGES'
  | 'NOT_PROCESSED'
  | 'FAILED'
  | 'CLAIM_FAILED'
  | 'RECOVERY_REQUIRED';

export type BillingClaimStatus =
  | 'CLAIM_ACQUIRED'
  | 'CLAIM_COMMITTED'
  | 'CLAIM_RELEASED';

export type ObligationCommitmentStatus =
  | 'UNCOMMITTED'
  | 'COMMITTED';

export type ChargeType =
  | 'RENT'
  | 'ELECTRICITY'
  | 'LAUNDRY'
  | 'MAINTENANCE'
  | 'OTHER';

export type RevenueCategory =
  | 'RENT'
  | 'UTILITIES'
  | 'MAINTENANCE'
  | 'OTHER';
