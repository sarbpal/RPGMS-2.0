import type {
  LedgerEntry,
  Bill,
  Payment,
  Settlement,
  DepositTransaction,
  AccountType,
  LedgerReferenceType,
  BillStatus,
  BillType,
  PaymentMethod,
  SettlementOutcome,
  DepositTransactionType,
  BillLineItem,
} from '../../domain';
import type { Database } from '../../../../infrastructure/supabase/database.types';

type LedgerEntryRow = Database['public']['Tables']['ledger_entries']['Row'];
type BillRow = Database['public']['Tables']['bills']['Row'];
type BillLineItemRow = Database['public']['Tables']['bill_line_items']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];
type AllocationRow = Database['public']['Tables']['payment_allocations']['Row'];
type SettlementRow = Database['public']['Tables']['settlements']['Row'];
type DepositTxRow = Database['public']['Tables']['deposit_transactions']['Row'];

export class FinanceMappers {
  // Ledger Entry Mappers
  public static toLedgerDomain(row: LedgerEntryRow): LedgerEntry {
    return {
      id: row.id,
      stayId: row.stay_id,
      postingDate: row.posting_date,
      effectiveDate: row.effective_date,
      referenceType: row.reference_type as LedgerReferenceType,
      referenceId: row.reference_id,
      account: row.account as AccountType,
      debit: Number(row.debit),
      credit: Number(row.credit),
      remarks: row.remarks || '',
      createdBy: row.created_by,
      createdAt: row.created_at,
    };
  }

  public static toLedgerRow(entry: LedgerEntry): Database['public']['Tables']['ledger_entries']['Insert'] {
    return {
      id: entry.id,
      stay_id: entry.stayId,
      account: entry.account,
      debit: entry.debit,
      credit: entry.credit,
      posting_date: entry.postingDate,
      effective_date: entry.effectiveDate,
      reference_type: entry.referenceType,
      reference_id: entry.referenceId,
      remarks: entry.remarks || null,
      created_by: entry.createdBy || 'OPERATOR',
      created_at: entry.createdAt || new Date().toISOString(),
    };
  }

  // Bill Mappers
  public static toBillDomain(row: BillRow, lineItemRows: BillLineItemRow[] = []): Bill {
    const totalAmount = Number(row.total_amount);
    const paidAmount = Number(row.paid_amount);
    const balanceAmount = Math.max(0, Math.round((totalAmount - paidAmount) * 100) / 100);

    const lineItems: BillLineItem[] = lineItemRows.map((li) => ({
      id: li.id,
      category: (li.category as BillLineItem['category']) || 'RENT',
      description: li.description,
      amount: Number(li.amount),
    }));

    return {
      id: row.id,
      stayId: row.stay_id,
      billNumber: row.bill_number,
      billType: row.bill_type as BillType,
      period: row.period,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      totalAmount,
      paidAmount,
      balanceAmount,
      status: row.status as BillStatus,
      remarks: row.remarks || undefined,
      lineItems,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  public static toBillRow(bill: Bill): Database['public']['Tables']['bills']['Insert'] {
    return {
      id: bill.id,
      stay_id: bill.stayId,
      bill_number: bill.billNumber,
      bill_type: (bill.billType as 'MONTHLY_RENT' | 'RECURRING_CHARGE' | 'ONE_TIME_CHARGE') || 'MONTHLY_RENT',
      period: bill.period,
      issue_date: bill.issueDate,
      due_date: bill.dueDate,
      total_amount: bill.totalAmount,
      paid_amount: bill.paidAmount || 0,
      status: (bill.status as 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED') || 'UNPAID',
      obligation_key: null,
      remarks: bill.remarks || null,
      created_at: bill.createdAt || new Date().toISOString(),
      updated_at: bill.updatedAt || new Date().toISOString(),
    };
  }

  // Payment Mappers
  public static toPaymentDomain(row: PaymentRow, allocRows: AllocationRow[] = []): Payment {
    const allocations = allocRows.map((a) => ({
      billId: a.bill_id,
      amount: Number(a.amount),
    }));

    return {
      id: row.id,
      stayId: row.stay_id,
      paymentNumber: row.payment_number,
      amount: Number(row.amount),
      paymentDate: row.payment_date,
      paymentMethod: row.payment_method as PaymentMethod,
      referenceNumber: row.reference_number || undefined,
      idempotencyKey: row.idempotency_key || undefined,
      status: row.status,
      reversalReason: row.reversal_reason || undefined,
      reversedBy: row.reversed_by || undefined,
      reversedAt: row.reversed_at || undefined,
      reversalIdempotencyKey: row.reversal_idempotency_key || undefined,
      remarks: row.remarks || undefined,
      createdAt: row.created_at,
      allocations,
    };
  }

  public static toPaymentRow(payment: Payment): Database['public']['Tables']['payments']['Insert'] {
    return {
      id: payment.id,
      stay_id: payment.stayId,
      payment_number: payment.paymentNumber,
      amount: payment.amount,
      payment_date: payment.paymentDate,
      payment_method: payment.paymentMethod,
      reference_number: payment.referenceNumber || null,
      idempotency_key: payment.idempotencyKey || null,
      status: payment.status || 'RECORDED',
      reversal_reason: payment.reversalReason || null,
      reversed_by: payment.reversedBy || null,
      reversed_at: payment.reversedAt || null,
      reversal_idempotency_key: payment.reversalIdempotencyKey || null,
      remarks: payment.remarks || null,
      created_by: 'OPERATOR',
      created_at: payment.createdAt || new Date().toISOString(),
    };
  }

  // Settlement Mappers
  public static toSettlementDomain(row: SettlementRow): Settlement {
    const dbOutcome = row.outcome;
    const outcome: SettlementOutcome =
      dbOutcome === 'ZERO_BALANCE' ? 'BALANCED_NO_ACTION' : (dbOutcome as SettlementOutcome);

    return {
      id: row.id,
      stayId: row.stay_id,
      settlementNumber: row.settlement_number,
      settlementDate: row.settlement_date,
      status: row.status as Settlement['status'],
      settlementType: 'CHECKOUT',
      previewSnapshot: {
        stayId: row.stay_id,
        previewDate: row.settlement_date,
        outstandingReceivable: Number(row.total_bills_due),
        advanceCreditBalance: Number(row.advance_credit),
        securityDepositHeld: Number(row.security_deposit_held),
        damageDeductions: Number(row.damage_recovery),
        totalDues: Number(row.total_bills_due) + Number(row.damage_recovery),
        totalAvailableCredits: Number(row.security_deposit_held) + Number(row.advance_credit),
        netSettlementAmount: Number(row.net_refund_amount || row.resident_payment_amount || 0),
        outcome,
      },
      finalAmount: Number(row.net_refund_amount || row.resident_payment_amount || 0),
      outcome,
      paymentMethod: (row.payment_method as PaymentMethod) || 'BANK_TRANSFER',
      ledgerReferences: [],
      createdBy: row.finalized_by || 'OPERATOR',
      idempotencyKey: row.idempotency_key || undefined,
      remarks: row.remarks || undefined,
      createdAt: row.created_at,
    };
  }

  public static toSettlementRow(settlement: Settlement): Database['public']['Tables']['settlements']['Insert'] {
    const preview = settlement.previewSnapshot;
    const dbOutcome: 'HOSTEL_REFUNDS_RESIDENT' | 'RESIDENT_PAYS_HOSTEL' | 'ZERO_BALANCE' =
      settlement.outcome === 'BALANCED_NO_ACTION'
        ? 'ZERO_BALANCE'
        : (settlement.outcome as 'HOSTEL_REFUNDS_RESIDENT' | 'RESIDENT_PAYS_HOSTEL');

    return {
      id: settlement.id,
      stay_id: settlement.stayId,
      settlement_number: settlement.settlementNumber,
      settlement_date: settlement.settlementDate,
      status: settlement.status === 'SETTLED' ? 'SETTLED' : 'PENDING',
      outcome: dbOutcome,
      total_bills_due: preview?.outstandingReceivable || 0,
      security_deposit_held: preview?.securityDepositHeld || 0,
      advance_credit: preview?.advanceCreditBalance || 0,
      damage_recovery: preview?.damageDeductions || 0,
      net_refund_amount: settlement.outcome === 'HOSTEL_REFUNDS_RESIDENT' ? settlement.finalAmount : 0,
      resident_payment_amount: settlement.outcome === 'RESIDENT_PAYS_HOSTEL' ? settlement.finalAmount : 0,
      payment_method: settlement.paymentMethod || null,
      idempotency_key: settlement.idempotencyKey || null,
      remarks: settlement.remarks || null,
      finalized_by: settlement.createdBy || null,
      finalized_at: new Date().toISOString(),
      created_at: settlement.createdAt || new Date().toISOString(),
    };
  }

  // Deposit Transaction Mappers
  public static toDepositTxDomain(row: DepositTxRow): DepositTransaction {
    return {
      id: row.id,
      stayId: row.stay_id,
      residentId: 'res_' + row.stay_id,
      transactionType: (row.transaction_type as DepositTransactionType) || 'DEPOSIT_RECEIPT',
      amount: Number(row.amount),
      postingDate: row.created_at.split('T')[0],
      effectiveDate: row.created_at.split('T')[0],
      paymentMethod: (row.payment_method as PaymentMethod) || undefined,
      reason: row.reason || undefined,
      remarks: row.remarks || undefined,
      ledgerEntryIds: [],
      createdBy: row.created_by,
      idempotencyKey: row.idempotency_key || undefined,
      createdAt: row.created_at,
    };
  }

  public static toDepositTxRow(tx: DepositTransaction): Database['public']['Tables']['deposit_transactions']['Insert'] {
    const validTxType: 'DEPOSIT_RECEIPT' | 'PARTIAL_RETURN' | 'DEPOSIT_DEDUCTION' | 'SETTLEMENT_REFUND' | 'SETTLEMENT_FORFEIT' =
      tx.transactionType === 'SETTLEMENT_CLEARANCE' ? 'SETTLEMENT_REFUND' : tx.transactionType;

    return {
      id: tx.id,
      stay_id: tx.stayId,
      transaction_type: validTxType,
      amount: tx.amount,
      payment_method: tx.paymentMethod || null,
      reference_number: null,
      reason: tx.reason || null,
      remarks: tx.remarks || null,
      created_by: tx.createdBy || 'OPERATOR',
      idempotency_key: tx.idempotencyKey || null,
      created_at: tx.createdAt || new Date().toISOString(),
    };
  }
}
