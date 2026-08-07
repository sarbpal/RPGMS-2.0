import { useState, useCallback } from 'react';
import type { Meter, MeterReading } from '../domain';
import { defaultElectricityRepository } from '../infrastructure';
import { InMemoryAccommodationRepository } from '../../accommodation/infrastructure/repositories/InMemoryAccommodationRepository';
import type { Flat } from '../../accommodation/domain/entities/Flat';

export interface MeterWithFlatInfo {
  meter: Meter;
  flat: Flat | null;
  lastReading: MeterReading | null;
}

export function useElectricityWorkspace(
  repo = defaultElectricityRepository,
  accomRepo = new InMemoryAccommodationRepository()
) {
  const [refreshCount, setRefreshCount] = useState<number>(0);
  const [activeModalMeter, setActiveModalMeter] = useState<Meter | null>(null);

  const refresh = useCallback(() => {
    setRefreshCount((prev) => prev + 1);
  }, []);

  const meters = repo.getMeters();
  const flats = accomRepo.findAll();
  const readings = repo.getMeterReadings();
  const tariff = repo.getActiveTariff();

  const meterItems: MeterWithFlatInfo[] = meters.map((meter: Meter) => {
    const flat = flats.find((f: Flat) => f.id === meter.flatId) || null;
    const meterReadings = readings.filter((r: MeterReading) => r.meterId === meter.id);
    const lastReading = meterReadings.length > 0 ? meterReadings[meterReadings.length - 1] : null;
    return {
      meter,
      flat,
      lastReading,
    };
  });

  const totalMetersCount = meters.length;
  const activeMetersCount = meters.filter((m: Meter) => m.status === 'ACTIVE').length;
  const totalReadingsRecorded = readings.length;

  const openReadingModal = (meter: Meter) => {
    setActiveModalMeter(meter);
  };

  const closeReadingModal = () => {
    setActiveModalMeter(null);
  };

  return {
    refreshCount,
    refresh,
    meters,
    meterItems,
    tariff,
    totalMetersCount,
    activeMetersCount,
    totalReadingsRecorded,
    activeModalMeter,
    openReadingModal,
    closeReadingModal,
  };
}
