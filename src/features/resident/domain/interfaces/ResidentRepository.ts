import type { Resident } from '../entities/Resident';

export interface ResidentRepository {
  getById(id: string): Promise<Resident | null>;
  getAll(): Promise<Resident[]>;
  search(query: string): Promise<Resident[]>;
  save(resident: Resident): Promise<Resident>;
  update(resident: Resident): Promise<Resident>;
  delete(id: string): Promise<void>;
}
