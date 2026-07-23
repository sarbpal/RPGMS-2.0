export const BedStatus = {
  VACANT: 'VACANT',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
  ON_NOTICE: 'ON_NOTICE',
  MAINTENANCE: 'MAINTENANCE',
  BLOCKED: 'BLOCKED',
} as const;

export type BedStatus = (typeof BedStatus)[keyof typeof BedStatus];
