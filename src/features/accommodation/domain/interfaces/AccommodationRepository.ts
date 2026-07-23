import type { Flat } from '../entities/Flat';

export interface AccommodationRepository {
  findAll(): Promise<Flat[]>;
  findById(id: string): Promise<Flat | null>;
  save(flat: Flat): Promise<Flat>;
  update(flat: Flat): Promise<Flat>;
  delete(id: string): Promise<void>;
  getAllSync?(): Flat[];
  findByIdSync?(id: string): Flat | null;
  saveSync?(flat: Flat): Flat;
  deleteSync?(id: string): void;
  saveAllSync?(flats: Flat[]): Flat[];
}
