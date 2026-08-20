import { LaundryItem } from '../../domain/entities/LaundryItem';
import { LaundryService } from '../../domain/entities/LaundryService';
import { LaundryChargeRate } from '../../domain/entities/LaundryChargeRate';
import type { LaundryMasterRepository } from '../../domain/interfaces/LaundryMasterRepository';
import {
  initialLaundryItems,
  initialLaundryServices,
  initialLaundryChargeRates,
} from '../data/laundryMasterSeedData';

export class InMemoryLaundryMasterRepository implements LaundryMasterRepository {
  private items: LaundryItem[];
  private services: LaundryService[];
  private rates: LaundryChargeRate[];

  constructor(
    initialItemsList?: LaundryItem[],
    initialServicesList?: LaundryService[],
    initialRatesList?: LaundryChargeRate[]
  ) {
    this.items = initialItemsList ?? initialLaundryItems.map((p) => new LaundryItem(p));
    this.services = initialServicesList ?? initialLaundryServices.map((p) => new LaundryService(p));
    this.rates = initialRatesList ?? initialLaundryChargeRates.map((p) => new LaundryChargeRate(p));
  }

  // --- Laundry Items ---

  public getItems(includeInactive = false): LaundryItem[] {
    if (includeInactive) {
      return [...this.items];
    }
    return this.items.filter((item) => item.isActive);
  }

  public getItemById(id: string): LaundryItem | null {
    return this.items.find((item) => item.id === id) ?? null;
  }

  public getItemByCode(code: string): LaundryItem | null {
    const normalized = code.trim().toUpperCase();
    return this.items.find((item) => item.code === normalized) ?? null;
  }

  public saveItem(item: LaundryItem): void {
    const idx = this.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) {
      this.items[idx] = item;
    } else {
      this.items.push(item);
    }
  }

  // --- Laundry Services ---

  public getServices(includeInactive = false): LaundryService[] {
    if (includeInactive) {
      return [...this.services];
    }
    return this.services.filter((service) => service.isActive);
  }

  public getServiceById(id: string): LaundryService | null {
    return this.services.find((service) => service.id === id) ?? null;
  }

  public getServiceByCode(code: string): LaundryService | null {
    const normalized = code.trim().toUpperCase();
    return this.services.find((service) => service.code === normalized) ?? null;
  }

  public saveService(service: LaundryService): void {
    const idx = this.services.findIndex((s) => s.id === service.id);
    if (idx >= 0) {
      this.services[idx] = service;
    } else {
      this.services.push(service);
    }
  }

  // --- Laundry Charge Rates ---

  public getRates(includeInactive = false): LaundryChargeRate[] {
    if (includeInactive) {
      return [...this.rates];
    }
    return this.rates.filter((rate) => rate.isActive);
  }

  public getRateById(id: string): LaundryChargeRate | null {
    return this.rates.find((rate) => rate.id === id) ?? null;
  }

  public getEffectiveRate(itemId: string, serviceId: string, dateStr?: string): LaundryChargeRate | null {
    const targetDate = dateStr ?? new Date().toISOString();
    return (
      this.rates.find(
        (rate) =>
          rate.itemId === itemId &&
          rate.serviceId === serviceId &&
          rate.isEffectiveAt(targetDate)
      ) ?? null
    );
  }

  public saveRate(rate: LaundryChargeRate): void {
    const idx = this.rates.findIndex((r) => r.id === rate.id);
    if (idx >= 0) {
      this.rates[idx] = rate;
    } else {
      this.rates.push(rate);
    }
  }
}

/**
 * Canonical singleton instance for in-memory master data.
 */
export const defaultLaundryMasterRepository = new InMemoryLaundryMasterRepository();
