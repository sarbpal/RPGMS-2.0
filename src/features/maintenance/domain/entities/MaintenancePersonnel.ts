import type { PersonnelType } from '../types/MaintenanceTypes';

export interface MaintenancePersonnelProps {
  id: string;
  name: string;
  phone: string;
  type: PersonnelType;
  doorId?: string;
  address?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export class MaintenancePersonnel {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly type: PersonnelType;
  readonly doorId?: string;
  readonly address?: string;
  readonly isActive: boolean;
  readonly notes?: string;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: MaintenancePersonnelProps) {
    this.id = props.id;
    this.name = props.name;
    this.phone = props.phone;
    this.type = props.type;
    this.doorId = props.doorId;
    this.address = props.address;
    this.isActive = props.isActive;
    this.notes = props.notes;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  toJSON(): MaintenancePersonnelProps {
    return {
      id: this.id,
      name: this.name,
      phone: this.phone,
      type: this.type,
      doorId: this.doorId,
      address: this.address,
      isActive: this.isActive,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
