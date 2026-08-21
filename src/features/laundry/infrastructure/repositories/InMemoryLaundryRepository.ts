import { LaundryTransaction, type LaundryTransactionProps } from '../../domain/entities/LaundryTransaction';
import type { LaundryRepository } from '../../domain/interfaces/LaundryRepository';
import { laundryStorage } from '../storage/laundryStorage';
import { laundrySeedProps } from '../data/laundrySeedData';

export class InMemoryLaundryRepository implements LaundryRepository {
  private transactions: LaundryTransaction[];
  private readonly useStorage: boolean;

  constructor(
    initialData?: (LaundryTransaction | LaundryTransactionProps)[],
    useStorage = true
  ) {
    this.useStorage = useStorage;

    if (initialData) {
      this.transactions = initialData.map((t) =>
        t instanceof LaundryTransaction ? t : new LaundryTransaction(t)
      );
      if (this.useStorage) {
        laundryStorage.saveStoredTransactions(this.transactions);
      }
    } else {
      const stored = laundryStorage.getStoredTransactions();
      if (stored && stored.length > 0) {
        try {
          this.transactions = stored.map((props) => new LaundryTransaction(props));
        } catch {
          // If hydration fails due to corrupt storage, fall back to seed data
          this.transactions = laundrySeedProps.map((props) => new LaundryTransaction(props));
          if (this.useStorage) {
            laundryStorage.saveStoredTransactions(this.transactions);
          }
        }
      } else {
        this.transactions = laundrySeedProps.map((props) => new LaundryTransaction(props));
        if (this.useStorage) {
          laundryStorage.saveStoredTransactions(this.transactions);
        }
      }
    }
  }

  // --- Synchronous Methods ---

  public findByIdSync(id: string): LaundryTransaction | null {
    if (!id) return null;
    const cleanId = id.trim();
    const transaction = this.transactions.find((t) => t.id === cleanId);
    return transaction ? new LaundryTransaction(transaction.toJSON()) : null;
  }

  public findByStayIdSync(stayId: string): LaundryTransaction[] {
    if (!stayId) return [];
    const cleanStayId = stayId.trim();
    return this.transactions
      .filter((t) => t.stayId === cleanStayId)
      .map((t) => new LaundryTransaction(t.toJSON()));
  }

  public findByResidentIdSync(residentId: string): LaundryTransaction[] {
    if (!residentId) return [];
    const cleanResId = residentId.trim();
    return this.transactions
      .filter((t) => t.residentId === cleanResId)
      .map((t) => new LaundryTransaction(t.toJSON()));
  }

  public getAllSync(): LaundryTransaction[] {
    return this.transactions.map((t) => new LaundryTransaction(t.toJSON()));
  }

  public saveSync(transaction: LaundryTransaction | LaundryTransactionProps): LaundryTransaction {
    const instance =
      transaction instanceof LaundryTransaction
        ? transaction
        : new LaundryTransaction(transaction);

    const existingIndex = this.transactions.findIndex((t) => t.id === instance.id);
    if (existingIndex >= 0) {
      this.transactions[existingIndex] = instance;
    } else {
      this.transactions.push(instance);
    }

    if (this.useStorage) {
      laundryStorage.saveStoredTransactions(this.transactions);
    }

    return new LaundryTransaction(instance.toJSON());
  }

  public deleteSync(id: string): void {
    if (!id) return;
    const cleanId = id.trim();
    this.transactions = this.transactions.filter((t) => t.id !== cleanId);
    if (this.useStorage) {
      laundryStorage.saveStoredTransactions(this.transactions);
    }
  }

  // --- Asynchronous Contract Implementation (LaundryRepository) ---

  public async findById(id: string): Promise<LaundryTransaction | null> {
    return this.findByIdSync(id);
  }

  public async findByStayId(stayId: string): Promise<LaundryTransaction[]> {
    return this.findByStayIdSync(stayId);
  }

  public async findByResidentId(residentId: string): Promise<LaundryTransaction[]> {
    return this.findByResidentIdSync(residentId);
  }

  public async getAll(): Promise<LaundryTransaction[]> {
    return this.getAllSync();
  }

  public async save(transaction: LaundryTransaction): Promise<void> {
    this.saveSync(transaction);
  }

  public async delete(id: string): Promise<void> {
    this.deleteSync(id);
  }
}

/**
 * Application-wide canonical in-memory repository singleton for Laundry.
 */
export const defaultLaundryRepository = new InMemoryLaundryRepository();
