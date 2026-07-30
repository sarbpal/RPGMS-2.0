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
    return [...seed];
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

  public findAll(): Flat[] {
    return this.flats.map((f) => ({ ...f }));
  }

  public findById(id: string): Flat | null {
    const flat = this.flats.find((f) => f.id === id || f.name === id);
    return flat ? { ...flat } : null;
  }

  public save(flat: Flat): Flat {
    const existingIndex = this.flats.findIndex((f) => f.id === flat.id);
    if (existingIndex >= 0) {
      this.flats[existingIndex] = { ...flat };
    } else {
      this.flats.push({ ...flat });
    }
    this.persist();
    return { ...flat };
  }

  public saveAll(flats: Flat[]): Flat[] {
    this.flats = [...flats];
    this.persist();
    return this.findAll();
  }

  public delete(id: string): void {
    this.flats = this.flats.filter((f) => f.id !== id);
    this.persist();
  }
}
