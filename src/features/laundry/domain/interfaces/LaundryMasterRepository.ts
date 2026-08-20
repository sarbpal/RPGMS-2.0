import type { LaundryItem } from '../entities/LaundryItem';
import type { LaundryService } from '../entities/LaundryService';
import type { LaundryChargeRate } from '../entities/LaundryChargeRate';

export interface LaundryMasterRepository {
  // Laundry Items
  getItems(includeInactive?: boolean): LaundryItem[];
  getItemById(id: string): LaundryItem | null;
  getItemByCode(code: string): LaundryItem | null;
  saveItem(item: LaundryItem): void;

  // Laundry Services
  getServices(includeInactive?: boolean): LaundryService[];
  getServiceById(id: string): LaundryService | null;
  getServiceByCode(code: string): LaundryService | null;
  saveService(service: LaundryService): void;

  // Laundry Charge Rates
  getRates(includeInactive?: boolean): LaundryChargeRate[];
  getRateById(id: string): LaundryChargeRate | null;
  getEffectiveRate(itemId: string, serviceId: string, dateStr?: string): LaundryChargeRate | null;
  saveRate(rate: LaundryChargeRate): void;
}
