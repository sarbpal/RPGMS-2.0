import { describe, it, expect } from 'vitest';
import { InMemoryAccommodationRepository } from '../repositories/InMemoryAccommodationRepository';
import { AccommodationMappers } from '../mappers/AccommodationMappers';
import type { Flat } from '../../domain/entities/Flat';

describe('Accommodation Persistence & Mapping Contract', () => {
  const sampleFlat: Flat = {
    id: 'FLAT-TEST-101',
    name: 'Flat 101',
    floor: '1st Floor',
    description: 'Spacious flat',
    areas: [
      {
        id: 'AREA-TEST-1',
        name: 'Hall',
        defaultRent: 8000,
        defaultDeposit: 15000,
        beds: [
          {
            id: 'BED-TEST-101-H1',
            name: 'Bed H1',
            status: 'VACANT',
            defaultRent: 8000,
            defaultDeposit: 15000,
          },
          {
            id: 'BED-TEST-101-H2',
            name: 'Bed H2',
            status: 'OCCUPIED',
            defaultRent: 8000,
            defaultDeposit: 15000,
          },
        ],
      },
    ],
  };

  it('preserves complete hierarchy across mapper toDomain and toInsert', () => {
    const flatInsert = AccommodationMappers.toFlatInsert(sampleFlat);
    expect(flatInsert.id).toBe('FLAT-TEST-101');
    expect(flatInsert.name).toBe('Flat 101');

    const areaInsert = AccommodationMappers.toAreaInsert(sampleFlat.areas[0], sampleFlat.id);
    expect(areaInsert.id).toBe('AREA-TEST-1');
    expect(areaInsert.flat_id).toBe('FLAT-TEST-101');

    const bedInsert = AccommodationMappers.toBedInsert(
      sampleFlat.areas[0].beds[0],
      sampleFlat.areas[0].id,
      sampleFlat.id
    );
    expect(bedInsert.id).toBe('BED-TEST-101-H1');
    expect(bedInsert.base_rent).toBe(8000);
    expect(bedInsert.base_deposit).toBe(15000);

    const reconstructed = AccommodationMappers.toDomain(
      {
        id: flatInsert.id,
        name: flatInsert.name,
        floor: flatInsert.floor,
        status: flatInsert.status || 'AVAILABLE',
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      [
        {
          id: areaInsert.id,
          flat_id: areaInsert.flat_id,
          name: areaInsert.name,
          type: areaInsert.type,
          created_at: new Date().toISOString(),
        },
      ],
      [
        {
          id: bedInsert.id,
          flat_id: bedInsert.flat_id,
          area_id: bedInsert.area_id,
          name: bedInsert.name,
          status: (bedInsert.status as 'VACANT') || 'VACANT',
          base_rent: bedInsert.base_rent,
          base_deposit: bedInsert.base_deposit,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
    );

    expect(reconstructed.id).toBe(sampleFlat.id);
    expect(reconstructed.areas[0].beds[0].id).toBe('BED-TEST-101-H1');
    expect(reconstructed.areas[0].beds[0].defaultRent).toBe(8000);
  });

  it('InMemoryAccommodationRepository satisfies async contract with deep isolation', async () => {
    const repo = new InMemoryAccommodationRepository([sampleFlat]);
    const found = await repo.findById('FLAT-TEST-101');
    expect(found).not.toBeNull();
    expect(found?.name).toBe('Flat 101');
    expect(found?.areas[0].beds.length).toBe(2);

    // Mutation isolation check
    found!.name = 'Mutated Name';
    const reQueried = await repo.findById('FLAT-TEST-101');
    expect(reQueried?.name).toBe('Flat 101');

    // Async findAll
    const all = await repo.findAll();
    expect(all.length).toBe(1);

    // Async save
    await repo.save({ ...sampleFlat, id: 'FLAT-TEST-102', name: 'Flat 102' });
    const allAfterSave = await repo.findAll();
    expect(allAfterSave.length).toBe(2);

    // Async delete
    await repo.delete('FLAT-TEST-102');
    const allAfterDelete = await repo.findAll();
    expect(allAfterDelete.length).toBe(1);
  });
});
