export const BedStatus = {
  VACANT: 'VACANT',
  OCCUPIED: 'OCCUPIED',
  RESERVED: 'RESERVED',
  ON_NOTICE: 'ON_NOTICE',
  MAINTENANCE: 'MAINTENANCE',
  BLOCKED: 'BLOCKED',
} as const;

export type BedStatus = typeof BedStatus[keyof typeof BedStatus];

export interface Bed {
  id: string; // E.g., '101-B1', '101-H2', '103-S1'
  name: string; // E.g., 'B1', 'H2', 'S1'
  status: BedStatus;
  residentName?: string; // Optional mock resident name for occupied beds
  defaultRent: number;
  defaultDeposit: number;
}

export interface Area {
  id: string; // Unique identifier for the logical area within the flat
  name: string; // E.g., 'Bedroom', 'Hall', 'Small Bedroom'
  beds: Bed[];
  bedPrefix?: string; // Optional bed prefix (e.g. 'B', 'H')
  defaultRent: number;
  defaultDeposit: number;
}

export interface Flat {
  id: string; // E.g., '101'
  name: string; // E.g., '101'
  areas: Area[];
  floor?: string; // Optional floor
  description?: string; // Optional description
}
