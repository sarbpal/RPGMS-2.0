import type { Flat } from '../entities/Flat';

export interface AccommodationRepository {
  findAll(): Promise<Flat[]>;
  findById(id: string): Promise<Flat | null>;
  save(flat: Flat): Promise<Flat>;
  saveAll(flats: Flat[]): Promise<Flat[]>;
  delete(id: string): Promise<void>;
}
