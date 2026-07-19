# Financial Transaction Type

## Purpose

This document defines every financial transaction type recognized by the Finance domain.

Each transaction type represents a distinct business activity.

Transaction Types provide a common vocabulary for implementation, reporting, auditing, integrations, and future extensions.

This document does not define workflows or business rules.

Those are documented separately in the Finance Architecture and Financial Policies.

## Transaction Classification

Financial Transactions are grouped according to their business purpose.

Categories include:

• Billing

• Payment

• Deposit

• Settlement

• Adjustment

• Checkout

• System

# 1. Billing Transactions

## BT-001
### Monthly Bill

Purpose

Creates the regular billing obligation for a Billing Period.

Origin

Billing Engine

Financial Impact

Increases Receivable.

---

## BT-002
### Transition Bill

Purpose

Creates a bill when billing cycles change.

Origin

Billing Engine

Financial Impact

Increases Receivable.

---

## BT-003
### Manual Bill

Purpose

Creates an operator-issued bill.

Origin

Operator

Financial Impact

Increases Receivable.

---

## BT-004
### Checkout Bill

Purpose

Creates the final bill at Operational Checkout.

Origin

Checkout Process

Financial Impact

Increases Receivable.

# 2. Payment Transactions

## PT-001
### Payment Received

Purpose

Records money received.

Financial Impact

Increases available financial value.

---

## PT-002
### Payment Reversal

Purpose

Reverses an incorrect Payment.

Financial Impact

Negates original Payment.

# 3. Deposit Transactions

## DT-001
### Deposit Received

Purpose

Records security deposit.

---

## DT-002
### Deposit Refunded

Purpose

Returns Deposit.

---

## DT-003
### Deposit Utilized

Purpose

Uses Deposit toward obligations.

---

## DT-004
### Deposit Transferred to Settlement Hold

Purpose

Moves retained Deposit into Settlement Hold.

# 4. Settlement Transactions

## ST-001
### Rent Settlement

Allocates value toward Rent.

---

## ST-002
### Deposit Settlement

Allocates value toward Deposit.

---

## ST-003
### Advance Settlement

Allocates Advance.

---

## ST-004
### Settlement Reversal

Reverses Settlement.

---

## ST-005
### Settlement Hold Release

Releases retained funds.

# 5. Adjustment Transactions

## AT-001
### Administrative Credit

Purpose

Credits Resident.

---

## AT-002
### Administrative Debit

Purpose

Creates additional obligation.

---

## AT-003
### Goodwill Adjustment

Purpose

Financial goodwill.

# 6. Checkout Transactions

## CT-001
### Checkout Settlement

Purpose

Performs final settlement.

---

## CT-002
### Settlement Hold Created

Purpose

Creates Settlement Hold.

---

## CT-003
### Final Refund

Purpose

Returns remaining funds.

---

## CT-004
### Financial Closure

Purpose

Completes financial history.

# 7. System Transactions

## SY-001
### Opening Balance

Purpose

Creates initial financial position.

---

## SY-002
### Migration Adjustment

Purpose

Used during data migration.

---

## SY-003
### System Correction

Purpose

Administrative system correction.

# 8. Future Transaction Types

Examples

- GST Adjustment
- Payment Gateway Settlement
- Bank Reconciliation
- Vendor Payment
- Owner Distribution

