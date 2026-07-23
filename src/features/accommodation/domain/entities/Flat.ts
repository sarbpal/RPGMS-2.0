import type { Area } from './Area';

export interface Flat {
  id: string; // E.g., '101'
  name: string; // E.g., '101'
  areas: Area[];
  floor?: string; // Optional floor
  description?: string; // Optional description
}
