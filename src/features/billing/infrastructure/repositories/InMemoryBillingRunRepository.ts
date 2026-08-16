import type { BillingRunRepository } from '../../domain/interfaces/BillingRunRepository';
import type { BillingRun } from '../../domain/entities/BillingRun';

/**
 * In-memory implementation of BillingRunRepository for MVP.
 */
export class InMemoryBillingRunRepository implements BillingRunRepository {
  private runs: Map<string, BillingRun> = new Map();

  async save(run: BillingRun): Promise<void> {
    this.runs.set(run.id, run);
  }

  async getById(id: string): Promise<BillingRun | null> {
    return this.runs.get(id) || null;
  }

  async list(): Promise<BillingRun[]> {
    return Array.from(this.runs.values());
  }

  async getActiveRun(): Promise<BillingRun | null> {
    const active = Array.from(this.runs.values()).find(
      (run) =>
        run.status === 'CONFIRMED' ||
        run.status === 'PROCESSING' ||
        run.status === 'STOPPING'
    );
    return active || null;
  }

  async getByRetryOfRunId(retryOfRunId: string): Promise<BillingRun[]> {
    return Array.from(this.runs.values()).filter((run) => run.retryOfRunId === retryOfRunId);
  }

  clear(): void {
    this.runs.clear();
  }
}

export const defaultBillingRunRepository = new InMemoryBillingRunRepository();
