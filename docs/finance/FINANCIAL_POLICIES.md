# Financial Policies

Project: RPGMS 2.0
Document: Financial Policies
Version: 1.0.0
Status: Draft
Owner: RPGMS 2.0 Project
Last Updated: 2026-07-20

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0.0 | 2026-07-20 | Draft | Initial Financial Policies document |

---

## Purpose

This document defines the business policies governing financial operations within RPGMS 2.0.

These policies describe the rules that the Finance domain must enforce regardless of implementation technology.

Where the Finance Architecture defines how the system is structured, this document defines the business rules that guide financial behavior.

These policies are the authoritative reference for implementation, testing, and future enhancements.

---

## Policy Classification

Policies are classified according to their importance.

### Mandatory

Business rules that must never be violated.

### Recommended

Business rules that should normally be followed but may allow authorized exceptions.

### Configurable

Business rules that may vary between hostels or business configurations.

---

## Policy Reference IDs

Each policy is assigned a unique identifier to simplify implementation, testing, documentation, and future maintenance.

| Prefix | Category |
|---------|----------|
| BP | Billing Policies |
| PP | Payment Policies |
| DP | Deposit Policies |
| SP | Settlement Policies |
| CP | Checkout Policies |
| FC | Financial Closure Policies |
| LP | Ledger Policies |
| RP | Reporting Policies |
| GP | General Finance Policies |

Policy IDs are permanent references and should remain stable across future document revisions.

---

# 1. Billing Policies

## BP-001
### Bills create financial obligations.

Classification:
Mandatory

A Bill records amounts owed by the Resident.

Bills never receive payments.

---

## BP-002
### Bills are immutable.

Classification:
Mandatory

Issued Bills are never edited.

Corrections are performed through additional financial transactions.

---

## BP-003
### Every Bill belongs to one Stay.

Classification:
Mandatory

Bills cannot span multiple Stays.

---

## BP-004
### Every Bill belongs to one Billing Period.

Classification:
Mandatory

Each Billing Period may contain multiple Bills.

Every Bill references exactly one Billing Period.

# 2. Payment Policies

## PP-001
### Payments record money received.

Classification:
Mandatory

Payments only record receipt of funds.

Payments do not determine allocation.

---

## PP-002
### Payments may settle multiple obligations.

Classification:
Mandatory

One Payment may be allocated across multiple Bills or Financial Accounts.

---

## PP-003
### Overpayments become Advances.

Classification:
Mandatory

Money received in excess of current obligations is recorded in the Advance Account until allocated.

# 3. Deposit Policies

## DP-001
### Deposits remain independent.

Classification:
Mandatory

Security Deposits are maintained separately from Receivable balances.

---

## DP-002
### Deposits are not automatically utilized.

Classification:
Mandatory

Deposits require explicit business approval before being applied to financial obligations.

---

## DP-003
### Deposit refunds occur during Checkout.

Classification:
Recommended

Deposits should normally be refunded during Checkout unless funds are retained through Settlement Hold.

# 4. Settlement Policies

## SP-001
### Settlements allocate value.

Classification:
Mandatory

Settlements move financial value between Financial Accounts.

They never create money.

---

## SP-002
### Settlements preserve history.

Classification:
Mandatory

Settlement corrections create new Settlement records.

Previous Settlements remain unchanged.

---

## SP-003
### Operator approves financial intent.

Classification:
Mandatory

The system may recommend Settlement allocations.

The Operator remains responsible for approval.

# 5. Checkout Policies

## CP-001
### Operational Checkout does not imply Financial Closure.

Classification:
Mandatory

Checkout completes occupancy.

Financial activities may continue afterward.

---

## CP-002
### Settlement Hold may be created during Checkout.

Classification:
Mandatory

Funds retained after Checkout are transferred into Settlement Hold.

---

## CP-003
### Beds become immediately available after Operational Checkout.

Classification:
Mandatory

Accommodation availability is independent of Financial Closure.

# 6. Financial Closure Policies

## FC-001
### Financial Closure requires zero outstanding obligations.

Classification:
Mandatory

No outstanding Receivable balance may remain.

---

## FC-002
### Settlement Hold must be cleared.

Classification:
Mandatory

Financial Closure cannot occur while Settlement Hold contains funds.

---

## FC-003
### Financial Closure is permanent.

Classification:
Mandatory

Closed financial histories remain immutable.

# 7. Ledger Policies

## LP-001
### Ledger entries are append-only.

Classification:
Mandatory

Existing Ledger Entries are never modified.

---

## LP-002
### Ledger is the financial source of truth.

Classification:
Mandatory

Balances are always derived from Ledger history.

# 8. Reporting Policies

## RP-001
### Reports never own financial data.

Classification:
Mandatory

Reports derive information from the Finance domain.

---

## RP-002
### Reports are read-only.

Classification:
Mandatory

Reports never modify financial records.

# 9. General Finance Policies

## GP-001
### Money is never destroyed.

Financial value only moves between Financial Accounts.

---

## GP-002
### Historical records remain permanent.

Completed financial history is never modified.

---

## GP-003
### Every financial action is auditable.

Every financial operation must be traceable.

---

## GP-004
### Business rules take precedence over implementation convenience.

Implementation should adapt to business requirements, not the reverse.

# 10. Future Policy Extensions

Future Finance capabilities should extend these policies rather than replace them.

Examples include:

- Online Payments
- Payment Gateway Integration
- GST
- Multi-property Accounting
- Owner Accounting

