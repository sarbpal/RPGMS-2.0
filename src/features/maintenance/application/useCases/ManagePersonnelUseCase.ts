import { MaintenancePersonnel } from '../../domain/entities/MaintenancePersonnel';
import type { MaintenancePersonnelRepository } from '../../domain/repositories/MaintenancePersonnelRepository';
import type { PersonnelType } from '../../domain/types/MaintenanceTypes';

export interface CreatePersonnelDTO {
  name: string;
  phone: string;
  type: PersonnelType;
  doorId?: string;
  address?: string;
  notes?: string;
}

export class ManagePersonnelUseCase {
  private personnelRepo: MaintenancePersonnelRepository;

  constructor(personnelRepo: MaintenancePersonnelRepository) {
    this.personnelRepo = personnelRepo;
  }

  async createPersonnel(dto: CreatePersonnelDTO): Promise<MaintenancePersonnel> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error('Personnel name is required.');
    }
    if (!dto.phone || dto.phone.trim().length === 0) {
      throw new Error('Personnel phone number is required.');
    }

    const now = new Date().toISOString();
    const personnel = new MaintenancePersonnel({
      id: `per-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      type: dto.type,
      doorId: dto.doorId ? dto.doorId.trim() : undefined,
      address: dto.address ? dto.address.trim() : undefined,
      isActive: true,
      notes: dto.notes ? dto.notes.trim() : undefined,
      createdAt: now,
      updatedAt: now,
    });

    await this.personnelRepo.save(personnel);
    return personnel;
  }

  async toggleActiveStatus(id: string): Promise<MaintenancePersonnel> {
    const existing = await this.personnelRepo.findById(id);
    if (!existing) {
      throw new Error(`Personnel with ID ${id} not found.`);
    }

    const updated = new MaintenancePersonnel({
      ...existing.toJSON(),
      isActive: !existing.isActive,
      updatedAt: new Date().toISOString(),
    });

    await this.personnelRepo.save(updated);
    return updated;
  }
}
