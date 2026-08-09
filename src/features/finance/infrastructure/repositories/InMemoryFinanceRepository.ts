import type { FinanceRepository } from '../../domain/interfaces/FinanceRepository';
import type { LedgerEntry } from '../../domain/entities/LedgerEntry';
import type { Bill } from '../../domain/entities/Bill';
import type { Payment } from '../../domain/entities/Payment';
import type { Settlement } from '../../domain/entities/Settlement';
import type { DepositTransaction } from '../../domain/entities/DepositTransaction';
import { financeStorage } from '../../storage/financeStorage';

export class InMemoryFinanceRepository implements FinanceRepository {
  public getLedgerEntries(): LedgerEntry[] {
    return financeStorage.getStoredLedgerEntries();
  }

  public getLedgerEntriesByStayId(stayId: string): LedgerEntry[] {
    return this.getLedgerEntries().filter((e) => e.stayId === stayId);
  }

  public saveLedgerEntries(entries: LedgerEntry[]): LedgerEntry[] {
    financeStorage.saveStoredLedgerEntries(entries);
    return entries;
  }

  public getBills(): Bill[] {
    return financeStorage.getStoredBills();
  }

  public getBillsByStayId(stayId: string): Bill[] {
    return this.getBills().filter((b) => b.stayId === stayId);
  }

  public saveBill(bill: Bill): Bill {
    const bills = this.getBills();
    const idx = bills.findIndex((b) => b.id === bill.id);
    if (idx >= 0) {
      bills[idx] = bill;
    } else {
      bills.push(bill);
    }
    financeStorage.saveStoredBills(bills);
    return bill;
  }

  public saveBills(bills: Bill[]): Bill[] {
    financeStorage.saveStoredBills(bills);
    return bills;
  }

  public getPayments(): Payment[] {
    return financeStorage.getStoredPayments();
  }

  public getPaymentsByStayId(stayId: string): Payment[] {
    return this.getPayments().filter((p) => p.stayId === stayId);
  }

  public savePayment(payment: Payment): Payment {
    const payments = this.getPayments();
    const idx = payments.findIndex((p) => p.id === payment.id);
    if (idx >= 0) {
      payments[idx] = payment;
    } else {
      payments.push(payment);
    }
    financeStorage.saveStoredPayments(payments);
    return payment;
  }

  public getSettlements(): Settlement[] {
    return financeStorage.getStoredSettlements();
  }

  public getSettlementByStayId(stayId: string): Settlement | null {
    const settlements = this.getSettlements();
    return settlements.find((s) => s.stayId === stayId && s.status === 'SETTLED') || null;
  }

  public saveSettlement(settlement: Settlement): Settlement {
    const settlements = this.getSettlements();
    const idx = settlements.findIndex((s) => s.id === settlement.id);
    if (idx >= 0) {
      settlements[idx] = settlement;
    } else {
      settlements.push(settlement);
    }
    financeStorage.saveStoredSettlements(settlements);
    return settlement;
  }

  public getDepositTransactions(): DepositTransaction[] {
    return financeStorage.getStoredDepositTransactions();
  }

  public getDepositTransactionsByStayId(stayId: string): DepositTransaction[] {
    return this.getDepositTransactions().filter((t) => t.stayId === stayId);
  }

  public saveDepositTransaction(transaction: DepositTransaction): DepositTransaction {
    const transactions = this.getDepositTransactions();
    const idx = transactions.findIndex((t) => t.id === transaction.id);
    if (idx >= 0) {
      transactions[idx] = transaction;
    } else {
      transactions.push(transaction);
    }
    financeStorage.saveStoredDepositTransactions(transactions);
    return transaction;
  }
}

export const defaultFinanceRepository = new InMemoryFinanceRepository();

