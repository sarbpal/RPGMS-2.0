export const DeliveryHandoverMethod = {
  DIRECT_HANDOVER: 'DIRECT_HANDOVER',
  ROOM_PLACEMENT: 'ROOM_PLACEMENT',
} as const;

export type DeliveryHandoverMethod = (typeof DeliveryHandoverMethod)[keyof typeof DeliveryHandoverMethod];
