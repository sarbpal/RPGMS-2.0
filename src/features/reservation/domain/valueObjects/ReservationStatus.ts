export const ReservationStatus = {
  ACTIVE: 'ACTIVE',
  FOLLOW_UP_REQUIRED: 'FOLLOW_UP_REQUIRED',
  CONVERTED: 'CONVERTED',
  CANCELLED: 'CANCELLED',
} as const;

export type ReservationStatus = (typeof ReservationStatus)[keyof typeof ReservationStatus];
