import { describe, it, expect } from 'vitest';
import { InMemoryResidentRepository } from '../repositories/InMemoryResidentRepository';
import { ResidentMappers } from '../mappers/ResidentMappers';
import type { Resident } from '../../domain/entities/Resident';

describe('Resident Persistence & Mapping Contract', () => {
  const sampleResident: Resident = {
    id: 'res_contract_test_1',
    residentCode: 'RESID-009999',
    fullName: 'Rahul Sharma',
    mobileNumber: '+919876543210',
    email: 'rahul@example.com',
    status: 'ACTIVE',
    gender: 'MALE',
    dateOfBirth: '1995-05-15',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: '560001',
    emergencyContact: {
      name: 'Sunita Sharma',
      relationship: 'Mother',
      phone: '+919876543211',
    },
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  it('preserves all resident profile and contact fields across row mapping', () => {
    const row = ResidentMappers.toRow(sampleResident);
    expect(row.id).toBe('res_contract_test_1');
    expect(row.resident_code).toBe('RESID-009999');
    expect(row.full_name).toBe('Rahul Sharma');
    expect(row.mobile_number).toBe('+919876543210');
    expect(row.status).toBe('ACTIVE');

    const domain = ResidentMappers.toDomain({
      id: row.id,
      resident_code: row.resident_code,
      full_name: row.full_name,
      mobile_number: row.mobile_number,
      email: row.email || null,
      status: row.status as 'ACTIVE' | 'INACTIVE' | 'ALUMNI',
      profile_photo: null,
      identification_details: row.identification_details || null,
      emergency_contacts: row.emergency_contacts || null,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    });

    expect(domain.id).toBe(sampleResident.id);
    expect(domain.residentCode).toBe(sampleResident.residentCode);
    expect(domain.fullName).toBe(sampleResident.fullName);
    expect(domain.emergencyContact?.name).toBe('Sunita Sharma');
    expect(domain.city).toBe('Bengaluru');
  });

  it('InMemoryResidentRepository supports CRUD operations and search', async () => {
    const repo = new InMemoryResidentRepository([sampleResident]);
    const found = await repo.getById('res_contract_test_1');
    expect(found).not.toBeNull();
    expect(found?.fullName).toBe('Rahul Sharma');

    const searchResult = await repo.search('Rahul');
    expect(searchResult.length).toBe(1);
    expect(searchResult[0].id).toBe('res_contract_test_1');

    const codeSearch = await repo.search('RESID-009999');
    expect(codeSearch.length).toBe(1);
  });
});
