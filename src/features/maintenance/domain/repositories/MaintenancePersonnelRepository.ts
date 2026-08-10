import type { MaintenancePersonnel } from '../entities/MaintenancePersonnel';

export interface MaintenancePersonnelRepository {
  findById(id: string): Promise<MaintenancePersonnel | null>;
  findAll(includeInactive?: boolean): Promise<readonly MaintenancePersonnel[]>;
  save(personnel: MaintenancePersonnel): Promise<void>;
}
