export const ReservationStatus = {
  ACTIVE: 'ACTIVE',
  CONVERTED: 'CONVERTED',
  CANCELLED: 'CANCELLED',
} as const;

export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];
