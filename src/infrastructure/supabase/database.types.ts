export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      flats: {
        Row: {
          id: string;
          name: string;
          floor: string;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          floor: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          floor?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      areas: {
        Row: {
          id: string;
          flat_id: string;
          name: string;
          type: string;
          created_at: string;
        };
        Insert: {
          id: string;
          flat_id: string;
          name: string;
          type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          flat_id?: string;
          name?: string;
          type?: string;
          created_at?: string;
        };
      };
      beds: {
        Row: {
          id: string;
          flat_id: string;
          area_id: string;
          name: string;
          status: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
          base_rent: number;
          base_deposit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          flat_id: string;
          area_id: string;
          name: string;
          status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
          base_rent: number;
          base_deposit: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          flat_id?: string;
          area_id?: string;
          name?: string;
          status?: 'VACANT' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
          base_rent?: number;
          base_deposit?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      residents: {
        Row: {
          id: string;
          resident_code: string;
          full_name: string;
          mobile_number: string;
          email: string | null;
          status: 'ACTIVE' | 'INACTIVE' | 'ALUMNI';
          profile_photo: string | null;
          identification_details: Json | null;
          emergency_contacts: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          resident_code: string;
          full_name: string;
          mobile_number: string;
          email?: string | null;
          status?: 'ACTIVE' | 'INACTIVE' | 'ALUMNI';
          profile_photo?: string | null;
          identification_details?: Json | null;
          emergency_contacts?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resident_code?: string;
          full_name?: string;
          mobile_number?: string;
          email?: string | null;
          status?: 'ACTIVE' | 'INACTIVE' | 'ALUMNI';
          profile_photo?: string | null;
          identification_details?: Json | null;
          emergency_contacts?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stays: {
        Row: {
          id: string;
          resident_id: string;
          flat_id: string;
          stay_type: 'REGULAR' | 'TEMPORARY';
          status: 'PLANNED' | 'ACTIVE' | 'ON_NOTICE' | 'CHECKED_OUT' | 'CLOSED';
          check_in_date: string;
          expected_check_out_date: string | null;
          actual_check_out_date: string | null;
          notice_date: string | null;
          agreed_rent: number;
          agreed_deposit: number;
          billing_cycle_anchor_day: number;
          current_commercial_period_start: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          resident_id: string;
          flat_id: string;
          stay_type?: 'REGULAR' | 'TEMPORARY';
          status?: 'PLANNED' | 'ACTIVE' | 'ON_NOTICE' | 'CHECKED_OUT' | 'CLOSED';
          check_in_date: string;
          expected_check_out_date?: string | null;
          actual_check_out_date?: string | null;
          notice_date?: string | null;
          agreed_rent: number;
          agreed_deposit: number;
          billing_cycle_anchor_day?: number;
          current_commercial_period_start?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resident_id?: string;
          flat_id?: string;
          stay_type?: 'REGULAR' | 'TEMPORARY';
          status?: 'PLANNED' | 'ACTIVE' | 'ON_NOTICE' | 'CHECKED_OUT' | 'CLOSED';
          check_in_date?: string;
          expected_check_out_date?: string | null;
          actual_check_out_date?: string | null;
          notice_date?: string | null;
          agreed_rent?: number;
          agreed_deposit?: number;
          billing_cycle_anchor_day?: number;
          current_commercial_period_start?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stay_bed_allocations: {
        Row: {
          id: string;
          stay_id: string;
          bed_id: string;
          allocated_at: string;
          released_at: string | null;
          status: 'ALLOCATED' | 'RELEASED';
        };
        Insert: {
          id: string;
          stay_id: string;
          bed_id: string;
          allocated_at?: string;
          released_at?: string | null;
          status?: 'ALLOCATED' | 'RELEASED';
        };
        Update: {
          id?: string;
          stay_id?: string;
          bed_id?: string;
          allocated_at?: string;
          released_at?: string | null;
          status?: 'ALLOCATED' | 'RELEASED';
        };
      };
      reservations: {
        Row: {
          id: string;
          reservation_number: string;
          guest_name: string;
          mobile_number: string;
          email: string | null;
          bed_id: string | null;
          flat_id: string | null;
          target_stay_type: string;
          expected_joining_date: string;
          status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CONVERTED';
          agreed_rent: number;
          agreed_deposit: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          reservation_number: string;
          guest_name: string;
          mobile_number: string;
          email?: string | null;
          bed_id?: string | null;
          flat_id?: string | null;
          target_stay_type: string;
          expected_joining_date: string;
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CONVERTED';
          agreed_rent: number;
          agreed_deposit: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reservation_number?: string;
          guest_name?: string;
          mobile_number?: string;
          email?: string | null;
          bed_id?: string | null;
          flat_id?: string | null;
          target_stay_type?: string;
          expected_joining_date?: string;
          status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CONVERTED';
          agreed_rent?: number;
          agreed_deposit?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bills: {
        Row: {
          id: string;
          stay_id: string;
          bill_number: string;
          bill_type: 'MONTHLY_RENT' | 'RECURRING_CHARGE' | 'ONE_TIME_CHARGE' | 'SETTLEMENT_CLEARANCE';
          period: string;
          issue_date: string;
          due_date: string;
          total_amount: number;
          paid_amount: number;
          status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
          obligation_key: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          stay_id: string;
          bill_number: string;
          bill_type: 'MONTHLY_RENT' | 'RECURRING_CHARGE' | 'ONE_TIME_CHARGE' | 'SETTLEMENT_CLEARANCE';
          period: string;
          issue_date: string;
          due_date: string;
          total_amount: number;
          paid_amount?: number;
          status?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
          obligation_key?: string | null;
          remarks?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stay_id?: string;
          bill_number?: string;
          bill_type?: 'MONTHLY_RENT' | 'RECURRING_CHARGE' | 'ONE_TIME_CHARGE' | 'SETTLEMENT_CLEARANCE';
          period?: string;
          issue_date?: string;
          due_date?: string;
          total_amount?: number;
          paid_amount?: number;
          status?: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED';
          obligation_key?: string | null;
          remarks?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bill_line_items: {
        Row: {
          id: string;
          bill_id: string;
          category: string;
          description: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id: string;
          bill_id: string;
          category: string;
          description: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          bill_id?: string;
          category?: string;
          description?: string;
          amount?: number;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          stay_id: string;
          payment_number: string;
          amount: number;
          payment_date: string;
          payment_method: string;
          reference_number: string | null;
          idempotency_key: string | null;
          status: 'RECORDED' | 'REVERSED';
          reversal_reason: string | null;
          reversed_by: string | null;
          reversed_at: string | null;
          reversal_idempotency_key: string | null;
          remarks: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id: string;
          stay_id: string;
          payment_number: string;
          amount: number;
          payment_date: string;
          payment_method: string;
          reference_number?: string | null;
          idempotency_key?: string | null;
          status?: 'RECORDED' | 'REVERSED';
          reversal_reason?: string | null;
          reversed_by?: string | null;
          reversed_at?: string | null;
          reversal_idempotency_key?: string | null;
          remarks?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          stay_id?: string;
          payment_number?: string;
          amount?: number;
          payment_date?: string;
          payment_method?: string;
          reference_number?: string | null;
          idempotency_key?: string | null;
          status?: 'RECORDED' | 'REVERSED';
          reversal_reason?: string | null;
          reversed_by?: string | null;
          reversed_at?: string | null;
          reversal_idempotency_key?: string | null;
          remarks?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      payment_allocations: {
        Row: {
          id: string;
          payment_id: string;
          bill_id: string;
          amount: number;
          allocated_at: string;
        };
        Insert: {
          id: string;
          payment_id: string;
          bill_id: string;
          amount: number;
          allocated_at?: string;
        };
        Update: {
          id?: string;
          payment_id?: string;
          bill_id?: string;
          amount?: number;
          allocated_at?: string;
        };
      };
      ledger_transactions: {
        Row: {
          id: string;
          stay_id: string;
          transaction_type: string;
          reference_type: string;
          reference_id: string;
          posting_date: string;
          effective_date: string;
          description: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          stay_id: string;
          transaction_type: string;
          reference_type: string;
          reference_id: string;
          posting_date: string;
          effective_date: string;
          description: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          stay_id?: string;
          transaction_type?: string;
          reference_type?: string;
          reference_id?: string;
          posting_date?: string;
          effective_date?: string;
          description?: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      ledger_entries: {
        Row: {
          id: string;
          transaction_id: string | null;
          stay_id: string;
          account: string;
          debit: number;
          credit: number;
          posting_date: string;
          effective_date: string;
          reference_type: string;
          reference_id: string;
          remarks: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id: string;
          transaction_id?: string | null;
          stay_id: string;
          account: string;
          debit?: number;
          credit?: number;
          posting_date: string;
          effective_date: string;
          reference_type: string;
          reference_id: string;
          remarks?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          transaction_id?: string | null;
          stay_id?: string;
          account?: string;
          debit?: number;
          credit?: number;
          posting_date?: string;
          effective_date?: string;
          reference_type?: string;
          reference_id?: string;
          remarks?: string | null;
          created_by?: string;
          created_at?: string;
        };
      };
      deposit_transactions: {
        Row: {
          id: string;
          stay_id: string;
          transaction_type: 'DEPOSIT_RECEIPT' | 'PARTIAL_RETURN' | 'DEPOSIT_DEDUCTION' | 'SETTLEMENT_REFUND' | 'SETTLEMENT_FORFEIT';
          amount: number;
          payment_method: string | null;
          reference_number: string | null;
          reason: string | null;
          remarks: string | null;
          created_by: string;
          idempotency_key: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          stay_id: string;
          transaction_type: 'DEPOSIT_RECEIPT' | 'PARTIAL_RETURN' | 'DEPOSIT_DEDUCTION' | 'SETTLEMENT_REFUND' | 'SETTLEMENT_FORFEIT';
          amount: number;
          payment_method?: string | null;
          reference_number?: string | null;
          reason?: string | null;
          remarks?: string | null;
          created_by?: string;
          idempotency_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          stay_id?: string;
          transaction_type?: 'DEPOSIT_RECEIPT' | 'PARTIAL_RETURN' | 'DEPOSIT_DEDUCTION' | 'SETTLEMENT_REFUND' | 'SETTLEMENT_FORFEIT';
          amount?: number;
          payment_method?: string | null;
          reference_number?: string | null;
          reason?: string | null;
          remarks?: string | null;
          created_by?: string;
          idempotency_key?: string | null;
          created_at?: string;
        };
      };
      settlements: {
        Row: {
          id: string;
          stay_id: string;
          settlement_number: string;
          settlement_date: string;
          status: 'PENDING' | 'SETTLED';
          outcome: 'HOSTEL_REFUNDS_RESIDENT' | 'RESIDENT_PAYS_HOSTEL' | 'ZERO_BALANCE';
          total_bills_due: number;
          security_deposit_held: number;
          advance_credit: number;
          damage_recovery: number;
          net_refund_amount: number;
          resident_payment_amount: number;
          payment_method: string | null;
          idempotency_key: string | null;
          remarks: string | null;
          finalized_by: string | null;
          finalized_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          stay_id: string;
          settlement_number: string;
          settlement_date: string;
          status?: 'PENDING' | 'SETTLED';
          outcome: 'HOSTEL_REFUNDS_RESIDENT' | 'RESIDENT_PAYS_HOSTEL' | 'ZERO_BALANCE';
          total_bills_due: number;
          security_deposit_held: number;
          advance_credit: number;
          damage_recovery: number;
          net_refund_amount?: number;
          resident_payment_amount?: number;
          payment_method?: string | null;
          idempotency_key?: string | null;
          remarks?: string | null;
          finalized_by?: string | null;
          finalized_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          stay_id?: string;
          settlement_number?: string;
          settlement_date?: string;
          status?: 'PENDING' | 'SETTLED';
          outcome?: 'HOSTEL_REFUNDS_RESIDENT' | 'RESIDENT_PAYS_HOSTEL' | 'ZERO_BALANCE';
          total_bills_due?: number;
          security_deposit_held?: number;
          advance_credit?: number;
          damage_recovery?: number;
          net_refund_amount?: number;
          resident_payment_amount?: number;
          payment_method?: string | null;
          idempotency_key?: string | null;
          remarks?: string | null;
          finalized_by?: string | null;
          finalized_at?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      fn_post_ledger_transaction: {
        Args: {
          p_transaction: Json;
          p_entries: Json[];
        };
        Returns: Json;
      };
      fn_record_payment_atomic: {
        Args: {
          p_payment: Json;
          p_allocations: Json[];
          p_ledger_entries: Json[];
          p_updated_bills: Json[];
        };
        Returns: Json;
      };
      fn_reverse_payment_atomic: {
        Args: {
          p_payment_id: string;
          p_reversed_by: string;
          p_reversal_reason: string;
          p_reversal_idempotency_key: string | null;
          p_counter_ledger_entries: Json[];
          p_restored_bills: Json[];
        };
        Returns: Json;
      };
      fn_record_deposit_tx_atomic: {
        Args: {
          p_deposit_tx: Json;
          p_ledger_entries: Json[];
          p_expected_deposit_balance: number | null;
        };
        Returns: Json;
      };
      fn_apply_advance_credit_atomic: {
        Args: {
          p_stay_id: string;
          p_consumed_total: number;
          p_ledger_entries: Json[];
          p_updated_bills: Json[];
        };
        Returns: Json;
      };
      fn_confirm_settlement_atomic: {
        Args: {
          p_settlement: Json;
          p_clearance_bill: Json | null;
          p_clearance_bill_items: Json[];
          p_ledger_entries: Json[];
          p_deposit_tx: Json | null;
        };
        Returns: Json;
      };
      fn_process_operational_checkout: {
        Args: {
          p_stay_id: string;
          p_actual_checkout_date: string;
          p_bed_ids: string[];
        };
        Returns: Json;
      };
    };
  };
}
