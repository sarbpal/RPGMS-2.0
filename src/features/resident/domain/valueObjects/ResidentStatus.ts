export const ResidentStatus = {
  ACTIVE: 'ACTIVE',
  ON_NOTICE: 'ON_NOTICE',
  CHECKED_OUT: 'CHECKED_OUT',
  ALUMNI: 'ALUMNI',
} as const;

export type ResidentStatus = (typeof ResidentStatus)[keyof typeof ResidentStatus];
