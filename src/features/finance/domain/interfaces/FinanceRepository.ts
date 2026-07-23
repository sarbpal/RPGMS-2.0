import type { LedgerEntry } from '../entities/LedgerEntry';
import type { Bill } from '../entities/Bill';
import type { Payment } from '../entities/Payment';
import type { Settlement } from '../entities/Settlement';

export interface FinanceRepository {
  // Ledger Entry operations
  getLedgerEntries(): LedgerEntry[];
  getLedgerEntriesByStayId(stayId: string): LedgerEntry[];
  saveLedgerEntries(entries: LedgerEntry[]): LedgerEntry[];

  // Bill operations
  getBills(): Bill[];
  getBillsByStayId(stayId: string): Bill[];
  saveBill(bill: Bill): Bill;
  saveBills(bills: Bill[]): Bill[];

  // Payment operations
  getPayments(): Payment[];
  getPaymentsByStayId(stayId: string): Payment[];
  savePayment(payment: Payment): Payment;

  // Settlement operations
  getSettlements(): Settlement[];
  getSettlementByStayId(stayId: string): Settlement | null;
  saveSettlement(settlement: Settlement): Settlement;
}
