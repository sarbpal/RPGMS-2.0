import type { Flat } from '../entities/Flat';

export interface AccommodationRepository {
  findAll(): Promise<Flat[]>;
  findById(id: string): Promise<Flat | null>;
  save(flat: Flat): Promise<Flat>;
  update(flat: Flat): Promise<Flat>;
  delete(id: string): Promise<void>;
}
