/**
 * Lifecycle states of a Laundry Transaction.
 * In L-02, the initial active state is DRAFT.
 */
export const LaundryTransactionStatus = {
  DRAFT: 'DRAFT',
  COLLECTED: 'COLLECTED',
  IN_PROCESS: 'IN_PROCESS',
  RETURNED_PARTIAL: 'RETURNED_PARTIAL',
  RETURNED_FULL: 'RETURNED_FULL',
  DELIVERED_PARTIAL: 'DELIVERED_PARTIAL',
  DELIVERED_FULL: 'DELIVERED_FULL',
  EXCEPTION_RAISED: 'EXCEPTION_RAISED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type LaundryTransactionStatus =
  (typeof LaundryTransactionStatus)[keyof typeof LaundryTransactionStatus];
