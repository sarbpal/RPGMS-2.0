-- RPGMS 2.0: Core Relational Schema Foundation (S-IMP-01)
-- Preserves all domain identity semantics, numeric precision, and foreign-key constraints.

-- 1. Physical Infrastructure Tables
CREATE TABLE IF NOT EXISTS flats (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    floor VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS areas (
    id VARCHAR(64) PRIMARY KEY,
    flat_id VARCHAR(64) NOT NULL REFERENCES flats(id) ON DELETE RESTRICT,
    name VARCHAR(64) NOT NULL,
    type VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beds (
    id VARCHAR(64) PRIMARY KEY,
    flat_id VARCHAR(64) NOT NULL REFERENCES flats(id) ON DELETE RESTRICT,
    area_id VARCHAR(64) NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    name VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'VACANT' CHECK (status IN ('VACANT', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
    base_rent NUMERIC(12,2) NOT NULL CHECK (base_rent >= 0),
    base_deposit NUMERIC(12,2) NOT NULL CHECK (base_deposit >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(flat_id, area_id, name)
);

-- 2. Resident Domain Tables
CREATE TABLE IF NOT EXISTS residents (
    id VARCHAR(64) PRIMARY KEY,
    resident_code VARCHAR(32) NOT NULL UNIQUE,
    full_name VARCHAR(128) NOT NULL,
    mobile_number VARCHAR(32) NOT NULL,
    email VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ALUMNI')),
    profile_photo TEXT,
    identification_details JSONB,
    emergency_contacts JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_residents_mobile ON residents(mobile_number);
CREATE INDEX IF NOT EXISTS idx_residents_status ON residents(status);

-- 3. Stays & Bed Allocations
CREATE TABLE IF NOT EXISTS stays (
    id VARCHAR(64) PRIMARY KEY,
    resident_id VARCHAR(64) NOT NULL REFERENCES residents(id) ON DELETE RESTRICT,
    flat_id VARCHAR(64) NOT NULL REFERENCES flats(id) ON DELETE RESTRICT,
    stay_type VARCHAR(32) NOT NULL DEFAULT 'REGULAR' CHECK (stay_type IN ('REGULAR', 'TEMPORARY')),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PLANNED', 'ACTIVE', 'ON_NOTICE', 'CHECKED_OUT', 'CLOSED')),
    check_in_date DATE NOT NULL,
    expected_check_out_date DATE,
    actual_check_out_date DATE,
    notice_date DATE,
    agreed_rent NUMERIC(12,2) NOT NULL CHECK (agreed_rent >= 0),
    agreed_deposit NUMERIC(12,2) NOT NULL CHECK (agreed_deposit >= 0),
    billing_cycle_anchor_day SMALLINT NOT NULL DEFAULT 1 CHECK (billing_cycle_anchor_day BETWEEN 1 AND 28),
    current_commercial_period_start DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stays_resident ON stays(resident_id);
CREATE INDEX IF NOT EXISTS idx_stays_status ON stays(status);
CREATE INDEX IF NOT EXISTS idx_stays_flat_dates ON stays(flat_id, check_in_date, actual_check_out_date);

CREATE TABLE IF NOT EXISTS stay_bed_allocations (
    id VARCHAR(64) PRIMARY KEY,
    stay_id VARCHAR(64) NOT NULL REFERENCES stays(id) ON DELETE CASCADE,
    bed_id VARCHAR(64) NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    released_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'ALLOCATED' CHECK (status IN ('ALLOCATED', 'RELEASED'))
);

CREATE INDEX IF NOT EXISTS idx_stay_bed_alloc_stay ON stay_bed_allocations(stay_id);
CREATE INDEX IF NOT EXISTS idx_stay_bed_alloc_bed ON stay_bed_allocations(bed_id);

-- 4. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(64) PRIMARY KEY,
    reservation_number VARCHAR(32) NOT NULL UNIQUE,
    guest_name VARCHAR(128) NOT NULL,
    mobile_number VARCHAR(32) NOT NULL,
    email VARCHAR(128),
    bed_id VARCHAR(64) REFERENCES beds(id) ON DELETE SET NULL,
    flat_id VARCHAR(64) REFERENCES flats(id) ON DELETE SET NULL,
    target_stay_type VARCHAR(32) NOT NULL DEFAULT 'REGULAR',
    expected_joining_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'CONVERTED')),
    agreed_rent NUMERIC(12,2) NOT NULL CHECK (agreed_rent >= 0),
    agreed_deposit NUMERIC(12,2) NOT NULL CHECK (agreed_deposit >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Financial Obligations (Bills)
CREATE TABLE IF NOT EXISTS bills (
    id VARCHAR(64) PRIMARY KEY,
    stay_id VARCHAR(64) NOT NULL REFERENCES stays(id) ON DELETE RESTRICT,
    bill_number VARCHAR(64) NOT NULL UNIQUE,
    bill_type VARCHAR(32) NOT NULL CHECK (bill_type IN ('MONTHLY_RENT', 'RECURRING_CHARGE', 'ONE_TIME_CHARGE', 'SETTLEMENT_CLEARANCE')),
    period VARCHAR(16) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0 AND paid_amount <= total_amount),
    status VARCHAR(32) NOT NULL DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED')),
    obligation_key VARCHAR(255) UNIQUE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bills_stay ON bills(stay_id);
CREATE INDEX IF NOT EXISTS idx_bills_stay_status ON bills(stay_id, status);

CREATE TABLE IF NOT EXISTS bill_line_items (
    id VARCHAR(64) PRIMARY KEY,
    bill_id VARCHAR(64) NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    category VARCHAR(32) NOT NULL CHECK (category IN ('RENT', 'ELECTRICITY', 'LAUNDRY', 'MAINTENANCE', 'SECURITY_DEPOSIT', 'DAMAGE_REPAIR', 'OTHER')),
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bill_line_items_bill ON bill_line_items(bill_id);

-- 6. Financial Payments & Allocation Mappings
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(64) PRIMARY KEY,
    stay_id VARCHAR(64) NOT NULL REFERENCES stays(id) ON DELETE RESTRICT,
    payment_number VARCHAR(64) NOT NULL UNIQUE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(32) NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'DEBIT_CARD', 'CREDIT_CARD')),
    reference_number VARCHAR(128),
    idempotency_key VARCHAR(255) UNIQUE,
    status VARCHAR(32) NOT NULL DEFAULT 'RECORDED' CHECK (status IN ('RECORDED', 'REVERSED')),
    reversal_reason TEXT,
    reversed_by VARCHAR(64),
    reversed_at TIMESTAMPTZ,
    reversal_idempotency_key VARCHAR(255) UNIQUE,
    remarks TEXT,
    created_by VARCHAR(64) NOT NULL DEFAULT 'OPERATOR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_stay ON payments(stay_id);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id VARCHAR(64) PRIMARY KEY,
    payment_id VARCHAR(64) NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    bill_id VARCHAR(64) NOT NULL REFERENCES bills(id) ON DELETE RESTRICT,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(payment_id, bill_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_alloc_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_alloc_bill ON payment_allocations(bill_id);

-- 7. Authoritative Double-Entry Ledger
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id VARCHAR(64) PRIMARY KEY,
    stay_id VARCHAR(64) NOT NULL REFERENCES stays(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(32) NOT NULL,
    reference_type VARCHAR(32) NOT NULL CHECK (reference_type IN ('BILL', 'PAYMENT', 'DEPOSIT', 'SETTLEMENT', 'REVERSAL', 'ADJUSTMENT', 'ADVANCE_CREDIT')),
    reference_id VARCHAR(128) NOT NULL,
    posting_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_tx_stay ON ledger_transactions(stay_id);
CREATE INDEX IF NOT EXISTS idx_ledger_tx_ref ON ledger_transactions(reference_type, reference_id);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) REFERENCES ledger_transactions(id) ON DELETE CASCADE,
    stay_id VARCHAR(64) NOT NULL REFERENCES stays(id) ON DELETE RESTRICT,
    account VARCHAR(64) NOT NULL CHECK (account IN (
        'ACCOUNTS_RECEIVABLE',
        'RENT_REVENUE',
        'ELECTRICITY_REVENUE',
        'LAUNDRY_REVENUE',
        'CASH',
        'BANK',
        'SECURITY_DEPOSIT_LIABILITY',
        'ADVANCE_CREDIT',
        'DAMAGE_RECOVERY',
        'REFUND_PAYABLE'
    )),
    debit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
    credit NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
    posting_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    reference_type VARCHAR(32) NOT NULL,
    reference_id VARCHAR(128) NOT NULL,
    remarks TEXT,
    created_by VARCHAR(64) NOT NULL DEFAULT 'OPERATOR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (debit > 0 OR credit > 0),
    CHECK (debit = 0 OR credit = 0)
);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_stay ON ledger_entries(stay_id, posting_date ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries(stay_id, account);

-- 8. Running Deposit Transactions Table
CREATE TABLE IF NOT EXISTS deposit_transactions (
    id VARCHAR(64) PRIMARY KEY,
    stay_id VARCHAR(64) NOT NULL REFERENCES stays(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(32) NOT NULL CHECK (transaction_type IN ('DEPOSIT_RECEIPT', 'PARTIAL_RETURN', 'DEPOSIT_DEDUCTION', 'SETTLEMENT_REFUND', 'SETTLEMENT_FORFEIT')),
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(32),
    reference_number VARCHAR(128),
    reason TEXT,
    remarks TEXT,
    created_by VARCHAR(64) NOT NULL DEFAULT 'OPERATOR',
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposit_tx_stay ON deposit_transactions(stay_id, created_at ASC);

-- 9. Decoupled Financial Settlements
CREATE TABLE IF NOT EXISTS settlements (
    id VARCHAR(64) PRIMARY KEY,
    stay_id VARCHAR(64) NOT NULL REFERENCES stays(id) ON DELETE RESTRICT,
    settlement_number VARCHAR(64) NOT NULL UNIQUE,
    settlement_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SETTLED')),
    outcome VARCHAR(32) NOT NULL CHECK (outcome IN ('HOSTEL_REFUNDS_RESIDENT', 'RESIDENT_PAYS_HOSTEL', 'ZERO_BALANCE')),
    total_bills_due NUMERIC(12,2) NOT NULL CHECK (total_bills_due >= 0),
    security_deposit_held NUMERIC(12,2) NOT NULL CHECK (security_deposit_held >= 0),
    advance_credit NUMERIC(12,2) NOT NULL CHECK (advance_credit >= 0),
    damage_recovery NUMERIC(12,2) NOT NULL CHECK (damage_recovery >= 0),
    net_refund_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (net_refund_amount >= 0),
    resident_payment_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (resident_payment_amount >= 0),
    payment_method VARCHAR(32),
    idempotency_key VARCHAR(255) UNIQUE,
    remarks TEXT,
    finalized_by VARCHAR(64),
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_settlements_stay_settled ON settlements(stay_id) WHERE (status = 'SETTLED');

-- 10. Enable Row Level Security (RLS) on all tables with Permissive Access (anon and authenticated)
ALTER TABLE flats ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;
ALTER TABLE stay_bed_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permissive operator access on flats" ON flats FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on areas" ON areas FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on beds" ON beds FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on residents" ON residents FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on stays" ON stays FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on stay_bed_allocations" ON stay_bed_allocations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on reservations" ON reservations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on bills" ON bills FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on bill_line_items" ON bill_line_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on payments" ON payments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on payment_allocations" ON payment_allocations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on ledger_transactions" ON ledger_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on ledger_entries" ON ledger_entries FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on deposit_transactions" ON deposit_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permissive operator access on settlements" ON settlements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
