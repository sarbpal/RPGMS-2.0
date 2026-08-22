import type { Flat } from '../../domain/entities/Flat';
import type { AccommodationRepository } from '../../domain/interfaces/AccommodationRepository';
import { accommodationSeedData } from '../data/accommodationSeedData';

export class InMemoryAccommodationRepository implements AccommodationRepository {
  private readonly STORAGE_KEY = 'rpgms_flats';
  private flats: Flat[];

  constructor(initialData: Flat[] = accommodationSeedData) {
    this.flats = this.loadFromStorage(initialData);
  }

  private loadFromStorage(seed: Flat[]): Flat[] {
    if (seed !== accommodationSeedData) {
      return seed.map((f) => JSON.parse(JSON.stringify(f)));
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      }
    } catch {
      // Fallback to seed data if localStorage is corrupted or inaccessible
    }
    return seed.map((f) => JSON.parse(JSON.stringify(f)));
  }

  private persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.flats));
      }
    } catch {
      // Ignore storage write failures
    }
  }

  public async findAll(): Promise<Flat[]> {
    return JSON.parse(JSON.stringify(this.flats));
  }

  public findAllSync(): Flat[] {
    return JSON.parse(JSON.stringify(this.flats));
  }

  public async findById(id: string): Promise<Flat | null> {
    const flat = this.flats.find((f) => f.id === id || f.name === id);
    return flat ? JSON.parse(JSON.stringify(flat)) : null;
  }

  public findByIdSync(id: string): Flat | null {
    const flat = this.flats.find((f) => f.id === id || f.name === id);
    return flat ? JSON.parse(JSON.stringify(flat)) : null;
  }

  public async save(flat: Flat): Promise<Flat> {
    const existingIndex = this.flats.findIndex((f) => f.id === flat.id);
    if (existingIndex >= 0) {
      this.flats[existingIndex] = JSON.parse(JSON.stringify(flat));
    } else {
      this.flats.push(JSON.parse(JSON.stringify(flat)));
    }
    this.persist();
    return JSON.parse(JSON.stringify(flat));
  }

  public saveSync(flat: Flat): Flat {
    const existingIndex = this.flats.findIndex((f) => f.id === flat.id);
    if (existingIndex >= 0) {
      this.flats[existingIndex] = JSON.parse(JSON.stringify(flat));
    } else {
      this.flats.push(JSON.parse(JSON.stringify(flat)));
    }
    this.persist();
    return JSON.parse(JSON.stringify(flat));
  }

  public async saveAll(flats: Flat[]): Promise<Flat[]> {
    this.flats = JSON.parse(JSON.stringify(flats));
    this.persist();
    return this.findAll();
  }

  public saveAllSync(flats: Flat[]): Flat[] {
    this.flats = JSON.parse(JSON.stringify(flats));
    this.persist();
    return JSON.parse(JSON.stringify(this.flats));
  }

  public async delete(id: string): Promise<void> {
    this.flats = this.flats.filter((f) => f.id !== id);
    this.persist();
  }

  public deleteSync(id: string): void {
    this.flats = this.flats.filter((f) => f.id !== id);
    this.persist();
  }
}

// Application-wide in-memory composition root singleton.
export const defaultAccommodationRepository = new InMemoryAccommodationRepository();
