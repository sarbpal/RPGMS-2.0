import type { Meter, MeterReading, ElectricityTariff, ElectricityBill, ElectricityAllocation } from '../index';

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

  // Stage 1 Additions: Supplier Bill & Allocation persistence
  getBills(): ElectricityBill[];
  getBillById(id: string): ElectricityBill | null;
  getBillsByFlatId(flatId: string): ElectricityBill[];
  saveBill(bill: ElectricityBill): void;

  getAllocations(): ElectricityAllocation[];
  getAllocationById(id: string): ElectricityAllocation | null;
  getAllocationByBillId(billId: string): ElectricityAllocation | null;
  saveAllocation(allocation: ElectricityAllocation): void;
}
