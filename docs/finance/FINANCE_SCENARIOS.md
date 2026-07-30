# Finance Scenarios

**Project:** RPGMS 2.0  
**Domain:** Finance  
**Document:** Finance Scenarios  
**Version:** 1.0.0  
**Status:** Draft  
**Owner:** RPGMS 2.0 Project  
**Last Updated:** YYYY-MM-DD

---

## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0.0 | YYYY-MM-DD | Draft | Initial Finance Scenarios |

---

# Purpose

This document illustrates how the Finance Architecture behaves during common business situations.

The scenarios demonstrate the interaction between Domain Events, Financial Accounts, the Settlement Engine, and the Ledger.

These examples improve understanding of the Finance Architecture and serve as reference material during implementation, testing, and future enhancements.

This document complements the Finance Architecture, Financial Policies, and Financial Transaction Types documents. It does not replace them.

---

# How to Read These Scenarios

Each scenario follows the same structure.

- Business Situation
- Initial State
- Domain Events
- Financial Processing
- Final State
- Key Principles

The focus is on business behaviour rather than implementation details.

---

# 1. Admission Scenarios

## Scenario A-001 – New Resident Admission

### Business Situation

A new Resident joins the hostel.

### Initial State

- Resident exists.
- No active Stay.
- No Financial Accounts.

### Domain Events

Resident Admitted

↓

Stay Created

↓

Security Deposit Received

↓

Advance Payment Received (Optional)

### Financial Processing

- Stay created.
- Deposit Account created.
- Advance Account created (if applicable).
- Ledger Entries recorded.

### Final State

- Stay Active
- Financial State = Open
- Deposit Recorded

### Key Principles

- Finance belongs to the Stay.
- Deposit remains independent.
- Ledger records all financial activity.

---

## Scenario A-002 – Admission with Advance Payment

### Business Situation

Resident pays rent before the first Bill is generated.

### Initial State

- Active Stay
- No Bill generated

### Domain Events

Advance Payment Received

↓

Advance Recorded

↓

Monthly Bill Generated

↓

Settlement Performed

### Financial Processing

- Advance Account increased.
- Bill created.
- Settlement allocates Advance toward Receivable.

### Final State

Advance reduced or exhausted.

### Key Principles

- Advance is independent until settled.
- Bills create obligations.
- Settlements allocate value.

---

# 2. Billing Scenarios

## Scenario B-001 – Monthly Billing

### Business Situation

Monthly billing cycle is generated.

### Initial State

- Active Stay
- Financial State = Open

### Domain Events

Billing Cycle Started

↓

Monthly Bill Generated

### Financial Processing

- Monthly Bill created.
- Receivable increased.
- Ledger updated.

### Final State

Outstanding Receivable exists.

### Key Principles

- Bills create obligations.
- Bills never receive payments.

---

## Scenario B-002 – Manual Charge

### Business Situation

Laundry charges are added after monthly billing.

### Initial State

Monthly Bill already exists.

### Domain Events

Manual Bill Created

### Financial Processing

- Manual Bill issued.
- Receivable increased.
- Ledger updated.

### Final State

Outstanding balance increased.

### Key Principles

Manual charges follow the same financial rules as regular Bills.

---

# 3. Payment Scenarios

## Scenario P-001 – Full Payment

### Business Situation

Resident pays the complete outstanding amount.

### Initial State

Outstanding Receivable ₹6,800

### Domain Events

Payment Received

↓

Settlement

### Financial Processing

- Payment recorded.
- Settlement clears Receivable.
- Ledger updated.

### Final State

Outstanding Receivable ₹0

### Key Principles

Payments receive money.

Settlements allocate money.

---

## Scenario P-002 – Partial Payment

### Business Situation

Resident pays only part of the outstanding amount.

### Initial State

Outstanding Receivable ₹6,800

### Domain Events

Payment Received

↓

Settlement

### Financial Processing

Settlement allocates ₹3,000.

Receivable balance remains ₹3,800.

### Final State

Outstanding balance remains.

### Key Principles

Partial settlements are supported.

---

## Scenario P-003 – Overpayment

### Business Situation

Resident pays more than the outstanding balance.

### Initial State

Outstanding Receivable ₹6,800

Payment ₹8,000

### Financial Processing

- ₹6,800 settles Receivable.
- ₹1,200 transferred to Advance Account.

### Final State

Advance Balance ₹1,200

### Key Principles

Overpayments become Advances.

---

# 4. Deposit Scenarios

## Scenario D-001 – Deposit Refund

### Business Situation

Resident completes checkout with no outstanding dues.

### Financial Processing

- Deposit evaluated.
- Full Deposit refunded.
- Ledger updated.

### Final State

Deposit Account closed.

### Key Principles

Deposit remains independent until Checkout.

---

## Scenario D-002 – Deposit Utilized

### Business Situation

Resident has outstanding dues during Checkout.

### Financial Processing

Deposit applied against Receivable after operator approval.

### Final State

Outstanding dues reduced.

### Key Principles

Deposits are never automatically utilized.

---

# 5. Checkout Scenarios

## Scenario C-001 – Normal Checkout

### Business Situation

Resident checks out with all obligations settled.

### Domain Events

Operational Checkout

↓

Deposit Refund

↓

Financial Closure

### Final State

Financial State = Financially Closed

### Key Principles

Checkout and Financial Closure occur together.

---

## Scenario C-002 – Checkout with Settlement Hold

### Business Situation

Electricity bill has not yet been received.

### Initial State

Deposit ₹6,500

### Domain Events

Operational Checkout

↓

Checkout Bill

↓

Settlement Hold Created

↓

Immediate Refund ₹6,000

↓

Electricity Bill Received ₹400

↓

Final Refund ₹100

↓

Financial Closure

### Financial Processing

- Deposit evaluated.
- ₹500 transferred to Settlement Hold.
- Electricity recovered.
- Remaining balance refunded.

### Final State

Settlement Hold ₹0

Financial State = Financially Closed

### Key Principles

- Checkout is not Financial Closure.
- Settlement Hold is temporary.
- Historical integrity preserved.

---

# 6. Settlement Scenarios

## Scenario S-001 – Settlement Allocation

### Business Situation

One payment settles multiple obligations.

### Financial Processing

Payment ₹10,000

↓

Rent ₹6,500

Deposit ₹3,500

### Key Principles

One payment may settle multiple Financial Accounts.

---

## Scenario S-002 – Settlement Reversal

### Business Situation

Incorrect settlement performed.

### Financial Processing

Reversal transaction created.

Original settlement remains unchanged.

### Key Principles

History is never edited.

---

# 7. Exceptional Scenarios

## Scenario E-001 – Goodwill Adjustment

### Business Situation

Operator grants goodwill credit after a maintenance issue.

### Financial Processing

Administrative Adjustment created.

Ledger updated.

### Key Principles

Adjustments create new history.

---

## Scenario E-002 – Incorrect Payment

### Business Situation

Payment entered incorrectly.

### Financial Processing

Payment Reversal created.

Correct Payment recorded.

### Key Principles

Financial history remains immutable.

---

# 8. Future Scenarios

Examples of future scenarios include:

- Online Payment Gateway
- QR Code Payments
- Bank Reconciliation
- GST Adjustments
- Multi-property Accounting
- Vendor Payments

---

# Scenario Coverage Matrix

| Scenario | Architecture | Policies | Transaction Types |
|----------|--------------|----------|-------------------|
| New Admission | ✓ | ✓ | ✓ |
| Monthly Billing | ✓ | ✓ | ✓ |
| Payment Received | ✓ | ✓ | ✓ |
| Deposit Refund | ✓ | ✓ | ✓ |
| Settlement Hold | ✓ | ✓ | ✓ |
| Financial Closure | ✓ | ✓ | ✓ |

---

# Related Documents

- FINANCE_ARCHITECTURE.md
- FINANCE_GLOSSARY.md
- FINANCIAL_POLICIES.md
- FINANCIAL_TRANSACTION_TYPES.md
- ARCHITECTURE.md

---

# Closing Statement

These scenarios demonstrate the intended business behaviour of the Finance domain within RPGMS 2.0.

They are designed to validate architectural decisions, support implementation, guide testing, and provide practical examples of real-world financial workflows.

All future Finance scenarios should build upon the principles established by the Finance Architecture rather than introducing alternative business models.

