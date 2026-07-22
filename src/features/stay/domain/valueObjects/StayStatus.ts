export const StayStatus = {
  RESERVED: 'RESERVED',
  ACTIVE: 'ACTIVE',
  ON_NOTICE: 'ON_NOTICE',
  CHECKED_OUT: 'CHECKED_OUT',
  CLOSED: 'CLOSED',
} as const;

export type StayStatus = (typeof StayStatus)[keyof typeof StayStatus];
