export const LaundryExceptionStatus = {
  OPEN: 'OPEN',
  UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
  RESOLVED: 'RESOLVED',
} as const;

export type LaundryExceptionStatus = (typeof LaundryExceptionStatus)[keyof typeof LaundryExceptionStatus];
