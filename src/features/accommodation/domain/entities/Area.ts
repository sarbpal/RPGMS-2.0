import type { Bed } from './Bed';

export interface Area {
  id: string; // Unique identifier for the logical area within the flat
  name: string; // E.g., 'Bedroom', 'Hall', 'Small Bedroom'
  beds: Bed[];
  bedPrefix?: string; // Optional bed prefix (e.g. 'B', 'H')
  defaultRent: number;
  defaultDeposit: number;
}
