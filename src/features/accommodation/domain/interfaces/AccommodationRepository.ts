import type { Flat } from '../entities/Flat';

export interface AccommodationRepository {
  findAll(): Flat[];
  findById(id: string): Flat | null;
  save(flat: Flat): Flat;
  saveAll(flats: Flat[]): Flat[];
  delete(id: string): void;
}

