-- RPGMS 2.0: Atomic Persistence Functions & Double-Entry Integrity (S-IMP-01)
-- Provides ACID transaction boundaries for multi-table mutations.

-- 1. Double-Entry Balance Verification Trigger (Deferred Constraint)
CREATE OR REPLACE FUNCTION fn_check_ledger_transaction_balanced()
RETURNS TRIGGER AS $$
DECLARE
    v_diff NUMERIC(12,2);
    v_tx_id VARCHAR(64);
BEGIN
    v_tx_id := COALESCE(NEW.transaction_id, OLD.transaction_id);
    IF v_tx_id IS NOT NULL THEN
        SELECT COALESCE(SUM(debit) - SUM(credit), 0) INTO v_diff
        FROM ledger_entries
        WHERE transaction_id = v_tx_id;

        IF v_diff <> 0 THEN
            RAISE EXCEPTION 'Double-entry transaction % is not balanced. Net difference: %',
                v_tx_id, v_diff;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_entry_balance ON ledger_entries;
CREATE CONSTRAINT TRIGGER trg_ledger_entry_balance
    AFTER INSERT OR UPDATE OR DELETE ON ledger_entries
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION fn_check_ledger_transaction_balanced();

-- 2. Atomic Batch Ledger Transaction Posting Function
CREATE OR REPLACE FUNCTION fn_post_ledger_transaction(
    p_transaction JSONB,
    p_entries JSONB[]
)
RETURNS JSONB AS $$
DECLARE
    v_tx_id VARCHAR(64);
    v_entry JSONB;
    v_total_debit NUMERIC(12,2) := 0;
    v_total_credit NUMERIC(12,2) := 0;
BEGIN
    v_tx_id := p_transaction->>'id';

    -- Pre-validate balance across input entry array
    FOREACH v_entry IN ARRAY p_entries LOOP
        v_total_debit := v_total_debit + COALESCE((v_entry->>'debit')::NUMERIC, 0);
        v_total_credit := v_total_credit + COALESCE((v_entry->>'credit')::NUMERIC, 0);
    END LOOP;

    IF v_total_debit <> v_total_credit THEN
        RAISE EXCEPTION 'Imbalanced ledger transaction. Debit: %, Credit: %', v_total_debit, v_total_credit;
    END IF;

    -- Insert Master Transaction
    INSERT INTO ledger_transactions (
        id, stay_id, transaction_type, reference_type, reference_id,
        posting_date, effective_date, description, metadata, created_at
    ) VALUES (
        v_tx_id,
        p_transaction->>'stay_id',
        p_transaction->>'transaction_type',
        p_transaction->>'reference_type',
        p_transaction->>'reference_id',
        (p_transaction->>'posting_date')::DATE,
        (p_transaction->>'effective_date')::DATE,
        p_transaction->>'description',
        p_transaction->'metadata',
        COALESCE((p_transaction->>'created_at')::TIMESTAMPTZ, NOW())
    );

    -- Insert Entries
    FOREACH v_entry IN ARRAY p_entries LOOP
        INSERT INTO ledger_entries (
            id, transaction_id, stay_id, account, debit, credit,
            posting_date, effective_date, reference_type, reference_id,
            remarks, created_by, created_at
        ) VALUES (
            v_entry->>'id',
            v_tx_id,
            v_entry->>'stay_id',
            v_entry->>'account',
            COALESCE((v_entry->>'debit')::NUMERIC, 0),
            COALESCE((v_entry->>'credit')::NUMERIC, 0),
            (v_entry->>'posting_date')::DATE,
            (v_entry->>'effective_date')::DATE,
            v_entry->>'reference_type',
            v_entry->>'reference_id',
            v_entry->>'remarks',
            COALESCE(v_entry->>'created_by', 'OPERATOR'),
            COALESCE((v_entry->>'created_at')::TIMESTAMPTZ, NOW())
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'transaction_id', v_tx_id);
END;
$$ LANGUAGE plpgsql;

-- 3. Atomic Payment Recording & Allocation Function
CREATE OR REPLACE FUNCTION fn_record_payment_atomic(
    p_payment JSONB,
    p_allocations JSONB[],
    p_ledger_entries JSONB[],
    p_updated_bills JSONB[]
)
RETURNS JSONB AS $$
DECLARE
    v_stay_id VARCHAR(64);
    v_payment_id VARCHAR(64);
    v_alloc JSONB;
    v_bill JSONB;
    v_entry JSONB;
    v_tx_id VARCHAR(64);
    v_idem_key VARCHAR(255);
    v_existing_payment RECORD;
BEGIN
    v_stay_id := p_payment->>'stay_id';
    v_payment_id := p_payment->>'id';
    v_idem_key := p_payment->>'idempotency_key';

    -- 1. Row Lock on Stay
    PERFORM id FROM stays WHERE id = v_stay_id FOR UPDATE;

    -- 2. Idempotency Check (Replay vs Conflict)
    IF v_idem_key IS NOT NULL AND v_idem_key <> '' THEN
        SELECT * INTO v_existing_payment FROM payments WHERE idempotency_key = v_idem_key;
        IF FOUND THEN
            IF v_existing_payment.id = v_payment_id AND v_existing_payment.amount = (p_payment->>'amount')::NUMERIC THEN
                RETURN jsonb_build_object('success', true, 'is_replay', true, 'payment_id', v_existing_payment.id);
            ELSE
                RAISE EXCEPTION 'Idempotency conflict: key % already used for payment %', v_idem_key, v_existing_payment.id;
            END IF;
        END IF;
    END IF;

    -- 3. Insert Payment
    INSERT INTO payments (
        id, stay_id, payment_number, amount, payment_date, payment_method,
        reference_number, idempotency_key, status, remarks, created_by, created_at
    ) VALUES (
        v_payment_id,
        v_stay_id,
        p_payment->>'payment_number',
        (p_payment->>'amount')::NUMERIC,
        (p_payment->>'payment_date')::DATE,
        p_payment->>'payment_method',
        p_payment->>'reference_number',
        v_idem_key,
        'RECORDED',
        p_payment->>'remarks',
        COALESCE(p_payment->>'created_by', 'OPERATOR'),
        COALESCE((p_payment->>'created_at')::TIMESTAMPTZ, NOW())
    );

    -- 4. Insert Allocations
    FOREACH v_alloc IN ARRAY p_allocations LOOP
        INSERT INTO payment_allocations (
            id, payment_id, bill_id, amount, allocated_at
        ) VALUES (
            v_alloc->>'id',
            v_payment_id,
            v_alloc->>'bill_id',
            (v_alloc->>'amount')::NUMERIC,
            COALESCE((v_alloc->>'allocated_at')::TIMESTAMPTZ, NOW())
        );
    END LOOP;

    -- 5. Update Bills
    FOREACH v_bill IN ARRAY p_updated_bills LOOP
        UPDATE bills
        SET paid_amount = (v_bill->>'paid_amount')::NUMERIC,
            status = v_bill->>'status',
            updated_at = NOW()
        WHERE id = v_bill->>'id';
    END LOOP;

    -- 6. Insert Ledger Transaction & Entries
    v_tx_id := 'tx_' || v_payment_id;
    INSERT INTO ledger_transactions (
        id, stay_id, transaction_type, reference_type, reference_id,
        posting_date, effective_date, description, created_at
    ) VALUES (
        v_tx_id,
        v_stay_id,
        'PAYMENT_RECEIPT',
        'PAYMENT',
        v_payment_id,
        (p_payment->>'payment_date')::DATE,
        (p_payment->>'payment_date')::DATE,
        'Payment #' || (p_payment->>'payment_number'),
        NOW()
    );

    FOREACH v_entry IN ARRAY p_ledger_entries LOOP
        INSERT INTO ledger_entries (
            id, transaction_id, stay_id, account, debit, credit,
            posting_date, effective_date, reference_type, reference_id,
            remarks, created_by, created_at
        ) VALUES (
            v_entry->>'id',
            v_tx_id,
            v_stay_id,
            v_entry->>'account',
            COALESCE((v_entry->>'debit')::NUMERIC, 0),
            COALESCE((v_entry->>'credit')::NUMERIC, 0),
            (v_entry->>'posting_date')::DATE,
            (v_entry->>'effective_date')::DATE,
            'PAYMENT',
            v_payment_id,
            v_entry->>'remarks',
            COALESCE(v_entry->>'created_by', 'OPERATOR'),
            NOW()
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'payment_id', v_payment_id);
END;
$$ LANGUAGE plpgsql;

-- 4. Atomic Payment Reversal Function
CREATE OR REPLACE FUNCTION fn_reverse_payment_atomic(
    p_payment_id VARCHAR(64),
    p_reversed_by VARCHAR(64),
    p_reversal_reason TEXT,
    p_reversal_idempotency_key VARCHAR(255),
    p_counter_ledger_entries JSONB[],
    p_restored_bills JSONB[]
)
RETURNS JSONB AS $$
DECLARE
    v_payment RECORD;
    v_tx_id VARCHAR(64);
    v_entry JSONB;
    v_bill JSONB;
BEGIN
    -- 1. Lock Payment & Verify State
    SELECT * INTO v_payment FROM payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment % not found', p_payment_id;
    END IF;

    IF v_payment.status = 'REVERSED' THEN
        RAISE EXCEPTION 'Payment % has already been reversed', p_payment_id;
    END IF;

    -- 2. Lock Stay
    PERFORM id FROM stays WHERE id = v_payment.stay_id FOR UPDATE;

    -- 3. Update Payment Status to REVERSED
    UPDATE payments
    SET status = 'REVERSED',
        reversed_by = p_reversed_by,
        reversed_at = NOW(),
        reversal_reason = p_reversal_reason,
        reversal_idempotency_key = p_reversal_idempotency_key
    WHERE id = p_payment_id;

    -- 4. Restore Bill Paid Amounts
    FOREACH v_bill IN ARRAY p_restored_bills LOOP
        UPDATE bills
        SET paid_amount = (v_bill->>'paid_amount')::NUMERIC,
            status = v_bill->>'status',
            updated_at = NOW()
        WHERE id = v_bill->>'id';
    END LOOP;

    -- 5. Insert Counter Ledger Transaction & Entries
    v_tx_id := 'tx_rev_' || p_payment_id;
    INSERT INTO ledger_transactions (
        id, stay_id, transaction_type, reference_type, reference_id,
        posting_date, effective_date, description, created_at
    ) VALUES (
        v_tx_id,
        v_payment.stay_id,
        'PAYMENT_REVERSAL',
        'REVERSAL',
        p_payment_id,
        CURRENT_DATE,
        CURRENT_DATE,
        'Reversal of Payment #' || v_payment.payment_number,
        NOW()
    );

    FOREACH v_entry IN ARRAY p_counter_ledger_entries LOOP
        INSERT INTO ledger_entries (
            id, transaction_id, stay_id, account, debit, credit,
            posting_date, effective_date, reference_type, reference_id,
            remarks, created_by, created_at
        ) VALUES (
            v_entry->>'id',
            v_tx_id,
            v_payment.stay_id,
            v_entry->>'account',
            COALESCE((v_entry->>'debit')::NUMERIC, 0),
            COALESCE((v_entry->>'credit')::NUMERIC, 0),
            (v_entry->>'posting_date')::DATE,
            (v_entry->>'effective_date')::DATE,
            'REVERSAL',
            p_payment_id,
            v_entry->>'remarks',
            p_reversed_by,
            NOW()
        );
    END LOOP;

    RETURN jsonb_build_object('success', true, 'payment_id', p_payment_id);
END;
$$ LANGUAGE plpgsql;

-- 5. Atomic Operational Checkout Function
CREATE OR REPLACE FUNCTION fn_process_operational_checkout(
    p_stay_id VARCHAR(64),
    p_actual_checkout_date DATE,
    p_bed_ids VARCHAR(64)[]
)
RETURNS JSONB AS $$
BEGIN
    -- 1. Lock Stay
    PERFORM id FROM stays WHERE id = p_stay_id FOR UPDATE;

    -- 2. Update Stay Status
    UPDATE stays
    SET status = 'CHECKED_OUT',
        actual_check_out_date = p_actual_checkout_date,
        updated_at = NOW()
    WHERE id = p_stay_id;

    -- 3. Release Beds in Accommodation
    UPDATE beds
    SET status = 'VACANT',
        updated_at = NOW()
    WHERE id = ANY(p_bed_ids);

    -- 4. Update Stay Bed Allocations
    UPDATE stay_bed_allocations
    SET status = 'RELEASED',
        released_at = NOW()
    WHERE stay_id = p_stay_id AND status = 'ALLOCATED';

    RETURN jsonb_build_object('success', true, 'stay_id', p_stay_id);
END;
$$ LANGUAGE plpgsql;
