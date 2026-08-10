import { MaintenancePersonnel } from '../../domain/entities/MaintenancePersonnel';
import type { MaintenancePersonnelRepository } from '../../domain/repositories/MaintenancePersonnelRepository';
import { personnelSeedData } from '../data/personnelSeedData';

const STORAGE_KEY = 'rpgms_maintenance_personnel_v1';

export class InMemoryMaintenancePersonnelRepository
  implements MaintenancePersonnelRepository
{
  private personnelMap = new Map<string, MaintenancePersonnel>();

  constructor() {
    this.loadStorage();
  }

  private loadStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            parsed.forEach((item) => {
              this.personnelMap.set(item.id, new MaintenancePersonnel(item));
            });
            return;
          }
        }
      }
    } catch {
      // Fallback to seed data on error
    }

    // Initialize seed data
    personnelSeedData.forEach((props) => {
      this.personnelMap.set(props.id, new MaintenancePersonnel(props));
    });
    this.persist();
  }

  private persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const array = Array.from(this.personnelMap.values()).map((p) => p.toJSON());
        localStorage.setItem(STORAGE_KEY, JSON.stringify(array));
      }
    } catch {
      // Storage save error ignored for in-memory fallback
    }
  }

  async findById(id: string): Promise<MaintenancePersonnel | null> {
    return this.personnelMap.get(id) || null;
  }

  async findAll(includeInactive = false): Promise<readonly MaintenancePersonnel[]> {
    const list = Array.from(this.personnelMap.values());
    if (includeInactive) return Object.freeze(list);
    return Object.freeze(list.filter((p) => p.isActive));
  }

  async save(personnel: MaintenancePersonnel): Promise<void> {
    this.personnelMap.set(personnel.id, personnel);
    this.persist();
  }
}
