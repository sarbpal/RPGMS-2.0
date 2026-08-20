/**
 * Supported processing routes for Laundry transactions in RPGMS 2.0.
 *
 * Invariant: Processing Route is an operational routing decision made by staff.
 * It is completely independent of resident-facing commercial pricing and RateSnapshots.
 */
export const ProcessingRoute = {
  IN_HOUSE: 'IN_HOUSE',
  EXTERNAL_VENDOR: 'EXTERNAL_VENDOR',
} as const;

export type ProcessingRoute = (typeof ProcessingRoute)[keyof typeof ProcessingRoute];
