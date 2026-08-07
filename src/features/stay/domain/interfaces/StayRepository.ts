import type { Stay } from '../entities/Stay';

export interface StayRepository {
  findById(id: string): Promise<Stay | null>;
  findByIdSync(id: string): Stay | null;
  getAllSync(): Stay[];
  findByResidentId(residentId: string): Promise<Stay[]>;
  findActiveByResidentId(residentId: string): Promise<Stay | null>;
  save(stay: Stay): Promise<Stay>;
  update(stay: Stay): Promise<Stay>;
  delete(id: string): Promise<void>;
}
