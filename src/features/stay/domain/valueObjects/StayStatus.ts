export const StayStatus = {
  PLANNED: 'PLANNED',
  ACTIVE: 'ACTIVE',
  ON_NOTICE: 'ON_NOTICE',
  CHECKED_OUT: 'CHECKED_OUT',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
} as const;

export type StayStatus = (typeof StayStatus)[keyof typeof StayStatus];
