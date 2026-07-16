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
}

export interface Area {
  id: string; // Unique identifier for the logical area within the flat
  name: string; // E.g., 'Bedroom', 'Hall', 'Small Bedroom'
  beds: Bed[];
}

export interface Flat {
  id: string; // E.g., '101'
  name: string; // E.g., '101'
  areas: Area[];
}
