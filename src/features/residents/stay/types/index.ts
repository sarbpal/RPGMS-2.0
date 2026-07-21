export const StayStatus = {
  ACTIVE: 'ACTIVE',
  ON_NOTICE: 'ON_NOTICE',
  CHECKED_OUT: 'CHECKED_OUT',
  CLOSED: 'CLOSED',
} as const;

export type StayStatus = typeof StayStatus[keyof typeof StayStatus];

export interface Stay {
  id: string;
  residentId: string;
  joiningDate: string;
  noticeDate?: string;
  checkoutDate?: string;
  flatId: string;
  allocatedBedIds: string[];
  agreedRent: number;
  agreedDeposit: number;
  status: StayStatus;
  createdAt: string;
  updatedAt: string;
}

export const StayEventType = {
  JOINED: 'JOINED',
  NOTICE_GIVEN: 'NOTICE_GIVEN',
  BED_CHANGED: 'BED_CHANGED',
  RENT_CHANGED: 'RENT_CHANGED',
  CHECKED_OUT: 'CHECKED_OUT',
} as const;

export type StayEventType = typeof StayEventType[keyof typeof StayEventType];

export interface StayEvent {
  id: string;
  stayId: string;
  eventType: StayEventType;
  description: string;
  performedBy?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}
