import type { BillingRun } from '../entities/BillingRun';

export interface BillingRunRepository {
  save(run: BillingRun): Promise<void>;
  getById(id: string): Promise<BillingRun | null>;
  list(): Promise<BillingRun[]>;
  getActiveRun(): Promise<BillingRun | null>;
  getByRetryOfRunId(retryOfRunId: string): Promise<BillingRun[]>;
}
