import type { Stay } from '../entities/Stay';

export interface StayRepository {
  findById(id: string): Promise<Stay | null>;
  findByResidentId(residentId: string): Promise<Stay[]>;
  findActiveByResidentId(residentId: string): Promise<Stay | null>;
  save(stay: Stay): Promise<Stay>;
  update(stay: Stay): Promise<Stay>;
  delete(id: string): Promise<void>;
}
