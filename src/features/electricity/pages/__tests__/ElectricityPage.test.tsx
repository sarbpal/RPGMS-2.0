import { describe, it, expect } from 'vitest';
import { defaultElectricityRepository } from '../../infrastructure';
import { Meter } from '../../domain/entities/Meter';
import { ElectricityTariff } from '../../domain/valueObjects/ElectricityTariff';
import { InMemoryAccommodationRepository } from '../../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import type { Flat } from '../../../accommodation/domain/entities/Flat';

describe('Sprint FR-6 / OS-1 — Electricity Workspace ViewModel & Repository Integration', () => {
  it('prepares meter items, tariffs, and property sub-meter counts for Electricity workspace rendering', () => {
    const testMeter = new Meter({
      id: 'm-page-01',
      meterNumber: 'MTR-PAGE-01',
      flatId: 'flat-101',
      meterType: 'FLAT_SHARED',
      status: 'ACTIVE',
      lastReadingValue: 2500,
    });

    const testTariff = new ElectricityTariff({
      id: 't-page-01',
      name: 'Page Test Tariff',
      ratePerUnit: 8.5,
      fixedCharge: 150,
      effectiveFrom: '2026-01-01',
    });

    defaultElectricityRepository.saveMeter(testMeter);
    defaultElectricityRepository.saveTariff(testTariff);

    const accomRepo = new InMemoryAccommodationRepository([
      { id: 'flat-101', name: 'Flat 101 (DeLuxe)', areas: [] },
    ]);

    const meters = defaultElectricityRepository.getMeters();
    const flats = accomRepo.findAll();
    const tariff = defaultElectricityRepository.getActiveTariff();

    expect(meters.length).toBeGreaterThan(0);
    expect(tariff?.ratePerUnit).toBe(8.5);

    const targetMeter = meters.find((m) => m.id === 'm-page-01');
    expect(targetMeter).toBeDefined();
    expect(targetMeter?.meterNumber).toBe('MTR-PAGE-01');

    const flat = flats.find((f: Flat) => f.id === targetMeter?.flatId);
    expect(flat?.name).toBe('Flat 101 (DeLuxe)');
  });
});
