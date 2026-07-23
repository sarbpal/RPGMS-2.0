import type { StayBalance, FinanceSummary, FinanceRepository, AccountType } from '../domain';
import {
  calculateAccountBalance,
  calculateStayBalancesFromLedger,
  calculateFinanceSummaryFromLedger,
} from '../domain';
import { defaultFinanceRepository } from '../infrastructure';

export class BalanceApplicationService {
  private repository: FinanceRepository;

  constructor(repository: FinanceRepository = defaultFinanceRepository) {
    this.repository = repository;
  }

  /**
   * Application Use Case: Calculate total debits and credits for a specific account for a given stay.
   */
  public getAccountTotals(stayId?: string, account?: AccountType): { debit: number; credit: number } {
    const entries = stayId
      ? this.repository.getLedgerEntriesByStayId(stayId)
      : this.repository.getLedgerEntries();

    let debit = 0;
    let credit = 0;

    entries.forEach((e) => {
      if (!account || e.account === account) {
        debit += e.debit || 0;
        credit += e.credit || 0;
      }
    });

    return {
      debit: Math.round(debit * 100) / 100,
      credit: Math.round(credit * 100) / 100,
    };
  }

  /**
   * Application Use Case: Calculate the net balance for a specific account for a given stay.
   * Delegates calculation logic to domain rule calculateAccountBalance.
   */
  public getAccountBalance(stayId: string, account: AccountType): number {
    const entries = this.repository.getLedgerEntries();
    return calculateAccountBalance(entries, stayId, account);
  }

  /**
   * Application Use Case: Derive all dynamic financial balances for a specific Stay ID.
   * Delegates stay balance derivation to domain rule calculateStayBalancesFromLedger.
   */
  public calculateStayBalances(stayId: string): StayBalance {
    if (!stayId || stayId.trim() === '') {
      return {
        receivableBalance: 0,
        securityDepositHeld: 0,
        advanceCreditBalance: 0,
        refundPayable: 0,
        netBalance: 0,
      };
    }
    const entries = this.repository.getLedgerEntriesByStayId(stayId);
    return calculateStayBalancesFromLedger(entries, stayId);
  }

  /**
   * Application Use Case: Derive property-wide aggregated financial summary metrics.
   * Delegates property summary derivation to domain rule calculateFinanceSummaryFromLedger.
   */
  public calculateFinanceSummary(): FinanceSummary {
    const entries = this.repository.getLedgerEntries();
    return calculateFinanceSummaryFromLedger(entries);
  }
}

export const balanceEngine = new BalanceApplicationService();
