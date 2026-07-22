import type { StayStatus } from '../valueObjects/StayStatus';
import type { StayType } from '../valueObjects/StayType';

export interface Stay {
  id: string;
  residentId: string;
  stayType: StayType;
  status: StayStatus;
  checkInDate: string;
  expectedCheckoutDate?: string;
  actualCheckoutDate?: string;
  flatId: string;
  allocatedBedIds: string[];
  agreedRent: number;
  agreedDeposit: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
