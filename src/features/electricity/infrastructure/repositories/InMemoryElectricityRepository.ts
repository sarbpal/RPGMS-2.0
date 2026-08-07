import { Meter, MeterReading, ElectricityTariff } from '../../domain';
import type { ElectricityRepository } from '../../domain/interfaces/ElectricityRepository';
import { electricityStorage } from '../../storage/electricityStorage';

export class InMemoryElectricityRepository implements ElectricityRepository {
  private meters: Meter[];
  private readings: MeterReading[];
  private tariffs: ElectricityTariff[];

  constructor(
    initialMeters?: Meter[],
    initialReadings?: MeterReading[],
    initialTariffs?: ElectricityTariff[]
  ) {
    if (initialMeters) {
      this.meters = initialMeters;
    } else {
      const storedM = electricityStorage.getStoredMeters();
      this.meters = storedM.map((m) => new Meter(m));
    }

    if (initialReadings) {
      this.readings = initialReadings;
    } else {
      const storedR = electricityStorage.getStoredReadings();
      this.readings = storedR.map((r) => new MeterReading(r));
    }

    if (initialTariffs) {
      this.tariffs = initialTariffs;
    } else {
      const storedT = electricityStorage.getStoredTariffs();
      this.tariffs = storedT.map((t) => new ElectricityTariff(t));
    }
  }

  public getMeters(): Meter[] {
    return [...this.meters];
  }

  public getMeterById(id: string): Meter | null {
    return this.meters.find((m) => m.id === id) || null;
  }

  public getMetersByFlatId(flatId: string): Meter[] {
    return this.meters.filter((m) => m.flatId === flatId);
  }

  public saveMeter(meter: Meter): void {
    const index = this.meters.findIndex((m) => m.id === meter.id);
    if (index >= 0) {
      this.meters[index] = meter;
    } else {
      this.meters.push(meter);
    }
    electricityStorage.saveStoredMeters(this.meters.map(this.toMeterProps));
  }

  public getMeterReadings(): MeterReading[] {
    return [...this.readings];
  }

  public getMeterReadingsByMeterId(meterId: string): MeterReading[] {
    return this.readings.filter((r) => r.meterId === meterId);
  }

  public getMeterReadingByMeterAndPeriod(meterId: string, readingPeriod: string): MeterReading | null {
    return (
      this.readings.find((r) => r.meterId === meterId && r.readingPeriod === readingPeriod) || null
    );
  }

  public saveMeterReading(reading: MeterReading): void {
    const index = this.readings.findIndex((r) => r.id === reading.id);
    if (index >= 0) {
      this.readings[index] = reading;
    } else {
      this.readings.push(reading);
    }
    electricityStorage.saveStoredReadings(this.readings.map(this.toReadingProps));
  }

  public deleteMeterReading(id: string): void {
    this.readings = this.readings.filter((r) => r.id !== id);
    electricityStorage.saveStoredReadings(this.readings.map(this.toReadingProps));
  }

  public getTariffs(): ElectricityTariff[] {
    return [...this.tariffs];
  }

  public getActiveTariff(dateStr?: string): ElectricityTariff | null {
    if (this.tariffs.length === 0) return null;
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const active = this.tariffs.find((t) => {
      const fromOk = t.effectiveFrom <= targetDate;
      const untilOk = !t.effectiveUntil || t.effectiveUntil >= targetDate;
      return fromOk && untilOk;
    });
    return active || this.tariffs[0];
  }

  public saveTariff(tariff: ElectricityTariff): void {
    const index = this.tariffs.findIndex((t) => t.id === tariff.id);
    if (index >= 0) {
      this.tariffs[index] = tariff;
    } else {
      this.tariffs.push(tariff);
    }
    electricityStorage.saveStoredTariffs(this.tariffs.map(this.toTariffProps));
  }

  private toMeterProps(m: Meter) {
    return {
      id: m.id,
      meterNumber: m.meterNumber,
      flatId: m.flatId,
      bedId: m.bedId,
      meterType: m.meterType,
      status: m.status,
      lastReadingValue: m.lastReadingValue,
      lastReadingDate: m.lastReadingDate,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  }

  private toReadingProps(r: MeterReading) {
    return {
      id: r.id,
      meterId: r.meterId,
      readingDate: r.readingDate,
      readingPeriod: r.readingPeriod,
      previousReading: r.previousReading,
      currentReading: r.currentReading,
      recordedBy: r.recordedBy,
      remarks: r.remarks,
      createdAt: r.createdAt,
    };
  }

  private toTariffProps(t: ElectricityTariff) {
    return {
      id: t.id,
      name: t.name,
      ratePerUnit: t.ratePerUnit,
      fixedCharge: t.fixedCharge,
      effectiveFrom: t.effectiveFrom,
      effectiveUntil: t.effectiveUntil,
      slabs: t.slabs,
    };
  }
}

export const defaultElectricityRepository = new InMemoryElectricityRepository();
