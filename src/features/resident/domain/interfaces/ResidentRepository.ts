import type { Resident } from '../entities/Resident';

export interface ResidentRepository {
  getById(id: string): Promise<Resident | null>;
  getByIdSync(id: string): Resident | null;
  getAll(): Promise<Resident[]>;
  getAllSync(): Resident[];
  search(query: string): Promise<Resident[]>;
  save(resident: Resident): Promise<Resident>;
  update(resident: Resident): Promise<Resident>;
  delete(id: string): Promise<void>;
}
