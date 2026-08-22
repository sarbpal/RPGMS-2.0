import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../../../infrastructure/supabase/database.types';
import { getSupabaseClient } from '../../../../infrastructure/supabase/supabaseClient';
import type { FinanceRepository } from '../../domain/interfaces/FinanceRepository';
import type { LedgerEntry } from '../../domain/entities/LedgerEntry';
import type { Bill } from '../../domain/entities/Bill';
import type { Payment } from '../../domain/entities/Payment';
import type { Settlement } from '../../domain/entities/Settlement';
import type { DepositTransaction } from '../../domain/entities/DepositTransaction';
import { FinanceMappers } from '../mappers/FinanceMappers';

export class SupabaseFinanceRepository implements FinanceRepository {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database> = getSupabaseClient()) {
    this.client = client;
  }

  // --- Async Methods ---

  public async getLedgerEntriesAsync(stayId?: string): Promise<LedgerEntry[]> {
    let query = this.client
      .from('ledger_entries')
      .select('*')
      .order('posting_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (stayId) {
      query = query.eq('stay_id', stayId);
    }

    const { data, error } = await query;
    if (error || !data) {
      return [];
    }
    return (data as Database['public']['Tables']['ledger_entries']['Row'][]).map(
      FinanceMappers.toLedgerDomain
    );
  }

  public async saveLedgerEntriesAsync(entries: LedgerEntry[]): Promise<LedgerEntry[]> {
    if (entries.length === 0) return [];

    const rows = entries.map(FinanceMappers.toLedgerRow);
    await this.client.from('ledger_entries').upsert(rows as any);
    return entries;
  }

  public async getBillsAsync(stayId?: string): Promise<Bill[]> {
    let query = this.client.from('bills').select('*').order('created_at', { ascending: false });
    if (stayId) {
      query = query.eq('stay_id', stayId);
    }

    const { data: billRows, error } = await query;
    if (error || !billRows) return [];

    const { data: lineItemRows } = await this.client.from('bill_line_items').select('*');

    const typedBills = billRows as Database['public']['Tables']['bills']['Row'][];
    const typedLineItems = (lineItemRows || []) as Database['public']['Tables']['bill_line_items']['Row'][];

    return typedBills.map((b) =>
      FinanceMappers.toBillDomain(
        b,
        typedLineItems.filter((li) => li.bill_id === b.id)
      )
    );
  }

  public async saveBillAsync(bill: Bill): Promise<Bill> {
    const row = FinanceMappers.toBillRow(bill);
    await this.client.from('bills').upsert(row as any);

    if (bill.lineItems && bill.lineItems.length > 0) {
      const items = bill.lineItems.map((li, idx) => ({
        id: `${bill.id}_li_${idx}`,
        bill_id: bill.id,
        category: li.category,
        description: li.description,
        amount: li.amount,
        created_at: new Date().toISOString(),
      }));
      await this.client.from('bill_line_items').upsert(items as any);
    }
    return bill;
  }

  public async saveBillsAsync(bills: Bill[]): Promise<Bill[]> {
    for (const bill of bills) {
      await this.saveBillAsync(bill);
    }
    return bills;
  }

  public async getPaymentsAsync(stayId?: string): Promise<Payment[]> {
    let query = this.client.from('payments').select('*').order('created_at', { ascending: false });
    if (stayId) {
      query = query.eq('stay_id', stayId);
    }

    const { data: paymentRows, error } = await query;
    if (error || !paymentRows) return [];

    const { data: allocRows } = await this.client.from('payment_allocations').select('*');

    const typedPayments = paymentRows as Database['public']['Tables']['payments']['Row'][];
    const typedAllocs = (allocRows || []) as Database['public']['Tables']['payment_allocations']['Row'][];

    return typedPayments.map((p) =>
      FinanceMappers.toPaymentDomain(
        p,
        typedAllocs.filter((a) => a.payment_id === p.id)
      )
    );
  }

  public async savePaymentAsync(payment: Payment): Promise<Payment> {
    const row = FinanceMappers.toPaymentRow(payment);
    await this.client.from('payments').upsert(row as any);

    if (payment.allocations && payment.allocations.length > 0) {
      const allocInserts = payment.allocations.map((a, idx) => ({
        id: `alloc_${payment.id}_${idx}`,
        payment_id: payment.id,
        bill_id: a.billId,
        amount: a.amount,
        allocated_at: new Date().toISOString(),
      }));
      await this.client.from('payment_allocations').upsert(allocInserts as any);
    }
    return payment;
  }

  public async getSettlementsAsync(): Promise<Settlement[]> {
    const { data, error } = await this.client
      .from('settlements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return (data as Database['public']['Tables']['settlements']['Row'][]).map(
      FinanceMappers.toSettlementDomain
    );
  }

  public async getSettlementByStayIdAsync(stayId: string): Promise<Settlement | null> {
    const { data, error } = await this.client
      .from('settlements')
      .select('*')
      .eq('stay_id', stayId)
      .eq('status', 'SETTLED')
      .maybeSingle();

    if (error || !data) return null;
    return FinanceMappers.toSettlementDomain(data as Database['public']['Tables']['settlements']['Row']);
  }

  public async saveSettlementAsync(settlement: Settlement): Promise<Settlement> {
    const row = FinanceMappers.toSettlementRow(settlement);
    await this.client.from('settlements').upsert(row as any);
    return settlement;
  }

  public async getDepositTransactionsAsync(stayId?: string): Promise<DepositTransaction[]> {
    let query = this.client
      .from('deposit_transactions')
      .select('*')
      .order('created_at', { ascending: true });

    if (stayId) {
      query = query.eq('stay_id', stayId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return (data as Database['public']['Tables']['deposit_transactions']['Row'][]).map(
      FinanceMappers.toDepositTxDomain
    );
  }

  public async saveDepositTransactionAsync(tx: DepositTransaction): Promise<DepositTransaction> {
    const row = FinanceMappers.toDepositTxRow(tx);
    await this.client.from('deposit_transactions').upsert(row as any);
    return tx;
  }

  // --- FinanceRepository Interface Implementation (Synchronous Bridge / Fallback) ---

  public getLedgerEntries(): LedgerEntry[] {
    return [];
  }

  public getLedgerEntriesByStayId(_stayId: string): LedgerEntry[] {
    return [];
  }

  public saveLedgerEntries(entries: LedgerEntry[]): LedgerEntry[] {
    return entries;
  }

  public getBills(): Bill[] {
    return [];
  }

  public getBillsByStayId(_stayId: string): Bill[] {
    return [];
  }

  public saveBill(bill: Bill): Bill {
    return bill;
  }

  public saveBills(bills: Bill[]): Bill[] {
    return bills;
  }

  public getPayments(): Payment[] {
    return [];
  }

  public getPaymentsByStayId(_stayId: string): Payment[] {
    return [];
  }

  public savePayment(payment: Payment): Payment {
    return payment;
  }

  public getSettlements(): Settlement[] {
    return [];
  }

  public getSettlementByStayId(_stayId: string): Settlement | null {
    return null;
  }

  public saveSettlement(settlement: Settlement): Settlement {
    return settlement;
  }

  public getDepositTransactions(): DepositTransaction[] {
    return [];
  }

  public getDepositTransactionsByStayId(_stayId: string): DepositTransaction[] {
    return [];
  }

  public saveDepositTransaction(transaction: DepositTransaction): DepositTransaction {
    return transaction;
  }
}
