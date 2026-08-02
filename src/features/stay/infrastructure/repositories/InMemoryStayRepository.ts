import { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { StayStatus } from '../../domain/valueObjects/StayStatus';
import { staySeedData } from '../data/staySeedData';

export class InMemoryStayRepository implements StayRepository {
  private stays: Stay[];

  constructor(initialData: Stay[] = staySeedData) {
    this.stays = initialData.map((s) => (s instanceof Stay ? s : new Stay(s)));
  }

  public findByIdSync(id: string): Stay | null {
    const stay = this.stays.find((s) => s.id === id);
    return stay ? new Stay(stay) : null;
  }

  public async findById(id: string): Promise<Stay | null> {
    return this.findByIdSync(id);
  }

  public getAllSync(): Stay[] {
    return this.stays.map((s) => new Stay(s));
  }

  public async findByResidentId(residentId: string): Promise<Stay[]> {
    return this.stays
      .filter((s) => s.residentId === residentId)
      .map((s) => new Stay(s));
  }

  public async findActiveByResidentId(residentId: string): Promise<Stay | null> {
    const stay = this.stays.find(
      (s) => s.residentId === residentId && s.status === StayStatus.ACTIVE
    );
    return stay ? new Stay(stay) : null;
  }

  public saveSync(stay: Stay): Stay {
    const stayInstance = stay instanceof Stay ? stay : new Stay(stay);
    const existingIndex = this.stays.findIndex((s) => s.id === stayInstance.id);
    if (existingIndex >= 0) {
      this.stays[existingIndex] = stayInstance;
    } else {
      this.stays.push(stayInstance);
    }
    return new Stay(stayInstance);
  }

  public async save(stay: Stay): Promise<Stay> {
    return this.saveSync(stay);
  }

  public async update(stay: Stay): Promise<Stay> {
    return this.save(stay);
  }

  public async delete(id: string): Promise<void> {
    this.stays = this.stays.filter((s) => s.id !== id);
  }
}
