import type { BedStatus } from '../valueObjects/BedStatus';

export interface Bed {
  id: string; // E.g., '101-B1', '101-H2', '103-S1'
  name: string; // E.g., 'B1', 'H2', 'S1'
  status: BedStatus;
  residentName?: string; // Optional resident name for occupied beds
  stayId?: string; // Derived operational projection referencing active Stay ID
  defaultRent: number;
  defaultDeposit: number;
}
