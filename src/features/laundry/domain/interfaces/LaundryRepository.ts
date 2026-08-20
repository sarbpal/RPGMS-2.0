import type { LaundryTransaction } from '../entities/LaundryTransaction';

/**
 * LaundryRepository defines the persistence contract for LaundryTransaction Aggregate Roots.
 */
export interface LaundryRepository {
  findById(id: string): Promise<LaundryTransaction | null>;
  findByStayId(stayId: string): Promise<LaundryTransaction[]>;
  findByResidentId(residentId: string): Promise<LaundryTransaction[]>;
  getAll(): Promise<LaundryTransaction[]>;
  save(transaction: LaundryTransaction): Promise<void>;
  delete(id: string): Promise<void>;
}
