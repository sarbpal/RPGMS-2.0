import { Meter, MeterReading, ElectricityTariff } from '../index';

export interface ElectricityRepository {
  getMeters(): Meter[];
  getMeterById(id: string): Meter | null;
  getMetersByFlatId(flatId: string): Meter[];
  saveMeter(meter: Meter): void;
  
  getMeterReadings(): MeterReading[];
  getMeterReadingsByMeterId(meterId: string): MeterReading[];
  getMeterReadingByMeterAndPeriod(meterId: string, readingPeriod: string): MeterReading | null;
  saveMeterReading(reading: MeterReading): void;
  deleteMeterReading(id: string): void;

  getTariffs(): ElectricityTariff[];
  getActiveTariff(date?: string): ElectricityTariff | null;
  saveTariff(tariff: ElectricityTariff): void;
}
