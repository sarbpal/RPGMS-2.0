import type { Stay } from '../../domain/entities/Stay';
import type { StayRepository } from '../../domain/interfaces/StayRepository';
import { StayStatus } from '../../domain/valueObjects/StayStatus';
import { staySeedData } from '../data/staySeedData';

export class InMemoryStayRepository implements StayRepository {
  private stays: Stay[];

  constructor(initialData: Stay[] = staySeedData) {
    this.stays = [...initialData];
  }

  public findByIdSync(id: string): Stay | null {
    const stay = this.stays.find((s) => s.id === id);
    return stay ? { ...stay } : null;
  }

  public async findById(id: string): Promise<Stay | null> {
    return this.findByIdSync(id);
  }

  public async findByResidentId(residentId: string): Promise<Stay[]> {
    return this.stays
      .filter((s) => s.residentId === residentId)
      .map((s) => ({ ...s }));
  }

  public async findActiveByResidentId(residentId: string): Promise<Stay | null> {
    const stay = this.stays.find(
      (s) => s.residentId === residentId && s.status === StayStatus.ACTIVE
    );
    return stay ? { ...stay } : null;
  }

  public async save(stay: Stay): Promise<Stay> {
    const existingIndex = this.stays.findIndex((s) => s.id === stay.id);
    if (existingIndex >= 0) {
      this.stays[existingIndex] = { ...stay };
    } else {
      this.stays.push({ ...stay });
    }
    return { ...stay };
  }

  public async update(stay: Stay): Promise<Stay> {
    return this.save(stay);
  }

  public async delete(id: string): Promise<void> {
    this.stays = this.stays.filter((s) => s.id !== id);
  }
}
