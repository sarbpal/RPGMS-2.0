import type { MeterProps, MeterReadingProps, ElectricityTariffProps } from '../domain';

const STORAGE_KEYS = {
  METERS: 'rpgms_electricity_meters',
  READINGS: 'rpgms_electricity_readings',
  TARIFFS: 'rpgms_electricity_tariffs',
};

export const defaultSeedTariff: ElectricityTariffProps = {
  id: 'tariff-std-001',
  name: 'Standard Commercial Tariff',
  ratePerUnit: 8.5,
  fixedCharge: 150.0,
  effectiveFrom: '2026-01-01',
  slabs: [
    { fromUnits: 0, toUnits: 100, ratePerUnit: 7.5 },
    { fromUnits: 100, toUnits: 300, ratePerUnit: 8.5 },
    { fromUnits: 300, toUnits: null, ratePerUnit: 10.0 },
  ],
};

export const defaultSeedMeters: MeterProps[] = [
  {
    id: 'meter-f101-01',
    meterNumber: 'MTR-101-MAIN',
    flatId: 'flat-101',
    meterType: 'FLAT_SHARED',
    status: 'ACTIVE',
    lastReadingValue: 1250,
    lastReadingDate: '2026-07-01',
  },
  {
    id: 'meter-f102-01',
    meterNumber: 'MTR-102-MAIN',
    flatId: 'flat-102',
    meterType: 'FLAT_SHARED',
    status: 'ACTIVE',
    lastReadingValue: 980,
    lastReadingDate: '2026-07-01',
  },
];

export const electricityStorage = {
  getStoredMeters(): MeterProps[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.METERS);
      if (!data) {
        this.saveStoredMeters(defaultSeedMeters);
        return defaultSeedMeters;
      }
      return JSON.parse(data);
    } catch {
      return defaultSeedMeters;
    }
  },

  saveStoredMeters(meters: MeterProps[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.METERS, JSON.stringify(meters));
    } catch {
      // In-memory fallback
    }
  },

  getStoredReadings(): MeterReadingProps[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.READINGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveStoredReadings(readings: MeterReadingProps[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.READINGS, JSON.stringify(readings));
    } catch {
      // In-memory fallback
    }
  },

  getStoredTariffs(): ElectricityTariffProps[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TARIFFS);
      if (!data) {
        this.saveStoredTariffs([defaultSeedTariff]);
        return [defaultSeedTariff];
      }
      return JSON.parse(data);
    } catch {
      return [defaultSeedTariff];
    }
  },

  saveStoredTariffs(tariffs: ElectricityTariffProps[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TARIFFS, JSON.stringify(tariffs));
    } catch {
      // In-memory fallback
    }
  },
};
