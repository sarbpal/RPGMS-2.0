export const StayStatus = {
  ACTIVE: 'ACTIVE',
  ON_NOTICE: 'ON_NOTICE',
  CHECKED_OUT: 'CHECKED_OUT',
} as const;

export type StayStatus = (typeof StayStatus)[keyof typeof StayStatus];
