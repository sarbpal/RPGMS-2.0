import type { Resident } from '../../domain/entities/Resident';
import type { ResidentRepository } from '../../domain/interfaces/ResidentRepository';
import { residentSeedData } from '../data/residentSeedData';

export class InMemoryResidentRepository implements ResidentRepository {
  private residents: Resident[];

  constructor(initialData: Resident[] = residentSeedData) {
    this.residents = [...initialData];
  }

  public getByIdSync(id: string): Resident | null {
    const resident = this.residents.find((r) => r.id === id || r.residentCode === id);
    return resident ? { ...resident } : null;
  }

  public async getById(id: string): Promise<Resident | null> {
    return this.getByIdSync(id);
  }

  public getAllSync(): Resident[] {
    return this.residents.map((r) => ({ ...r }));
  }

  public async getAll(): Promise<Resident[]> {
    return this.getAllSync();
  }

  public async search(query: string): Promise<Resident[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();
    return this.residents
      .filter(
        (r) =>
          r.fullName.toLowerCase().includes(q) ||
          r.residentCode.toLowerCase().includes(q) ||
          r.mobileNumber.toLowerCase().includes(q) ||
          (r.email && r.email.toLowerCase().includes(q))
      )
      .map((r) => ({ ...r }));
  }

  public async save(resident: Resident): Promise<Resident> {
    const existingIndex = this.residents.findIndex((r) => r.id === resident.id);
    if (existingIndex >= 0) {
      this.residents[existingIndex] = { ...resident };
    } else {
      this.residents.push({ ...resident });
    }
    return { ...resident };
  }

  public async update(resident: Resident): Promise<Resident> {
    return this.save(resident);
  }

  public async delete(id: string): Promise<void> {
    this.residents = this.residents.filter((r) => r.id !== id);
  }
}
