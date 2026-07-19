# Finance Architecture

**Project:** RPGMS 2.0  
**Document:** Finance Architecture  
**Version:** 1.0.0  
**Status:** FROZEN (Architecture v1.0)  
**Owner:** RPGMS 2.0 Project  
**Last Updated:** TBD

---
## Version History

| Version | Date | Status | Notes |
|---------|------|--------|-------|
| 1.0.0 | 2026-07-20 | Frozen | Initial Finance Architecture for RPGMS 2.0 |

# 1. Purpose

This document defines the canonical Finance Architecture for RPGMS 2.0.

Its purpose is to establish the business model, architectural principles, domain boundaries, and financial workflows that govern all finance-related functionality within the system.

This document intentionally describes **business architecture**, not implementation.

Technology choices, database design, APIs, UI, and framework-specific details are documented separately.

This document is considered the single source of truth for Finance.

---

# 2. Design Goals

The Finance Architecture has been designed to achieve the following goals:

- Reflect real-world PG business operations.
- Preserve complete financial history.
- Eliminate ambiguity in financial calculations.
- Support future business growth without architectural redesign.
- Keep operational workflows separate from financial workflows.
- Produce a complete audit trail.
- Support automation while keeping operators in control.

---

# 3. Non-Goals

The Finance Architecture does not define:

- Database schema
- REST APIs
- React components
- UI layouts
- Reports implementation
- Accounting standards compliance
- Taxation rules

Those are implementation concerns and are intentionally excluded from this document.

---

# 4. Design Philosophy

The Finance domain follows a number of core philosophies that influence every architectural decision.

## 4.1 Business First

The software models the actual business processes of a PG rather than forcing the business to adapt to software limitations.

Real operational scenarios take precedence over theoretical accounting models.

---

## 4.2 Stay is the Financial Boundary

Finance belongs to a Stay.

It does not belong directly to a Resident.

A Resident may have multiple Stays.

Each Stay owns its own independent financial history.

---

## 4.3 History is Immutable

Financial history is never overwritten.

Incorrect information is corrected through reversal transactions rather than editing historical records.

Every financial event remains permanently auditable.

---

## 4.4 Money Never Changes. Money Only Moves.

Money is never modified.

Money moves between financial accounts through well-defined transactions.

This philosophy simplifies reasoning, reporting and auditing.

---

## 4.5 Balances are Derived

Balances are never treated as the source of truth.

All balances are calculated from historical transactions.

Examples include:

- Outstanding Receivable
- Deposit Held
- Advance Balance
- Settlement Hold
- Net Financial Position

---

## 4.6 System Recommends. Operator Decides.

The Settlement Engine may recommend allocations.

The operator remains responsible for approving financial decisions.

Automation must never silently alter financial intent.

---

# 5. Core Architectural Principles

The Finance Architecture is governed by the following principles.

1. Finance belongs to a Stay.
2. Ledger is append-only.
3. Bills create obligations.
4. Payments record money received.
5. Settlements apply financial value.
6. Deposits are independent of rent.
7. Deposit collection may occur in installments.
8. Checkout and Financial Closure are independent business events.
9. Financial balances are derived from transactions.
10. Financial history is permanent.
                        Finance Domain

                    +--------------------+
                    |       Stay         |
                    +---------+----------+
                              |
        +---------------------+----------------------+
        |                     |                      |
        v                     v                      v

 Billing Engine      Settlement Engine      Financial Accounts

        |                     |                      |

        +---------------------+----------------------+
                              |
                              v
                        Ledger Engine
                              |
                              v
                     Financial Reporting

# 6. Finance Domain Overview

## Overview

The Finance domain is responsible for managing every financial aspect of a Resident's Stay.

It records financial obligations, money received, financial settlements, deposits, advances, adjustments, refunds, and financial history.

The Finance domain is intentionally independent from operational modules such as Accommodation and Resident Management. Operational actions may trigger financial events, but Finance remains the authoritative source of financial truth.

The Finance domain is designed around immutable business events rather than mutable balances.

---

## Responsibilities

The Finance domain is responsible for:

- Billing
- Payments
- Security Deposits
- Advance Payments
- Financial Adjustments
- Refunds
- Settlement Processing
- Ledger
- Financial Timeline
- Financial Reporting

---

## Domain Boundary

Finance begins when a Stay creates or affects a financial obligation.

Finance ends only after the Stay has been financially closed.

Operational completion (Checkout) does not necessarily imply financial completion.

---

## High-Level Architecture

                      Stay
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
 Billing Engine   Settlement Engine   Financial Accounts
        │               │                │
        └───────────────┼────────────────┘
                        ▼
                 Ledger Engine
                        ▼
                Financial Reports

---

## Relationship with Other Domains

### Resident Domain

Provides:

- Resident Identity
- Contact Information

Consumes:

- Financial Summary
- Outstanding Dues
- Deposit Status

---

### Stay Domain

Provides:

- Admission
- Checkout
- Billing Period
- Billing Cycle

Triggers:

- Bill Generation
- Checkout Settlement
- Financial Closure

---

### Accommodation Domain

Provides:

- Accommodation Assignment
- Rent
- Bed Changes

Triggers:

- Rent Changes
- Billing Changes

Accommodation never performs financial calculations directly.

---

### Reporting Domain

Consumes financial information only.

Reports never calculate business logic independently.

All financial reports derive their information from the Finance domain.

---

## Source of Truth

Finance owns the following information:

- Bills
- Payments
- Deposits
- Advances
- Refunds
- Settlements
- Ledger Entries

No other module may maintain its own financial balances.

All financial values must originate from Finance.

# 7. Financial Accounts

## Overview

Financial Accounts represent independent pools of financial value associated with a Stay.

An account does not represent money stored in a database.

Instead, it represents a business concept whose balance is derived from transactions.

Each account maintains complete historical integrity.

Accounts never overwrite history.

---

## Types of Financial Accounts

### 1. Receivable Account

Purpose

Tracks everything the Resident owes.

Examples

- Monthly Rent
- Laundry Charges
- Electricity Charges
- Damage Recovery
- Manual Charges
- Late Fees

Balance

Receivable Balance

=

Total Charges

−

Total Settlements

---

### 2. Deposit Account

Purpose

Tracks security deposit held on behalf of the Resident.

Transactions

- Deposit Receipt
- Deposit Withdrawal
- Deposit Utilization
- Deposit Refund
- Deposit Adjustment

The Deposit Account is independent of the Receivable Account.

---

### 3. Advance Account

Purpose

Tracks money received before becoming due.

Examples

Resident pays next month's rent today.

The money is stored in the Advance Account until applied by the Settlement Engine.

---

### 4. Settlement Hold Account

Purpose

Tracks money retained after Checkout while waiting for post-checkout obligations.

Typical examples include:

- Electricity Adjustment
- Water Charges
- Damage Recovery
- Cleaning Charges

The Settlement Hold Account exists only during the Settlement Pending phase.

Once all obligations have been settled, the account balance becomes zero and the Stay becomes eligible for Financial Closure.

---

### 5. Adjustment Account

Purpose

Represents administrative financial corrections.

Examples

- Goodwill Discount
- Manual Credit
- Manual Debit
- Exceptional Recovery
- Administrative Adjustment

Every adjustment must be auditable.

Adjustments never modify historical transactions.

Instead, they create new financial events.

---

## General Rules

All Financial Accounts follow the same principles.

• Accounts are append-only.

• Transactions are immutable.

• Balances are derived.

• Accounts support audit history.

• Accounts may participate in settlements.

• Accounts never directly modify one another.

Deposit Account
        │
        ▼
Checkout
        │
        ├── Immediate Refund
        │
        └── Settlement Hold Account
                     │
        ├── Electricity Adjustment
        ├── Damage Recovery
        ├── Water Charges
        ├── Cleaning Charges
        └── Final Refund
                     │
                     ▼
            Financial Closure

# 8. Billing Engine

## Purpose

The Billing Engine is responsible for creating financial obligations for a Stay.

It determines **what the Resident owes**, **when it becomes due**, and **why the obligation exists**.

The Billing Engine does **not** collect payments, allocate payments, or maintain balances. Those responsibilities belong to other Finance components.

---

## Responsibilities

The Billing Engine is responsible for:

- Monthly Bill Generation
- Transition Bill Generation
- Manual Bill Creation
- Checkout Bill Generation
- Bill Reversals
- Bill Adjustments
- Bill Line Management

---

## Design Principles

### Bills belong to a Stay

Every bill belongs to exactly one Stay.

Bills never belong directly to a Resident.

---

### Bills represent Billing Periods

Bills represent the agreed billing period of a Stay.

A bill does not necessarily correspond to a calendar month.

For example:

Billing Period

15 January → 14 February

is a perfectly valid monthly bill.

---

### Bills are Immutable

Once generated, a bill becomes part of the financial history.

Incorrect bills are reversed.

They are never edited.

---

### Bills create obligations

A bill creates a financial obligation.

It does not represent payment.

It does not represent settlement.

---

## Bill Lifecycle

Draft
    ↓
Generated
    ↓
Outstanding
    ↓
Partially Settled
    ↓
Fully Settled

or

Generated
    ↓
Reversed

---

## Bill Types

### Monthly Bill

Generated automatically according to the Stay's billing cycle.

---

### Transition Bill

Generated when the billing cycle changes.

Transition Bills preserve billing continuity without modifying historical bills.

---

### Manual Bill

Generated manually by an operator.

Typical examples:

- Damage Recovery
- Special Charges
- Administrative Fees

---

### Checkout Bill

Generated during checkout for charges that are known immediately.

Examples:

- Final Rent
- Laundry
- Known Utility Charges

Future charges such as delayed electricity bills are not included.

Those are handled through Settlement Hold.

---

## Bill Lines

Every bill consists of one or more Bill Lines.

Examples:

- Rent
- Laundry
- Electricity
- Damage
- Discount
- Other Charges

Bill Lines represent business meaning.

The bill represents the financial obligation.

---

## Why This Design?

Separating Bills from Payments allows obligations and money movement to evolve independently.

This keeps billing predictable while allowing flexible settlement strategies.

# 9. Settlement Engine
# 9. Settlement Engine

The Finance Architecture separates business operations from financial processing.

Every financial event passes through four distinct layers.

```text
Business Event
        │
        ▼
Business Transaction
        │
        ▼
Settlement
        │
        ▼
Ledger Entry
```

Example

```text
Operator receives ₹5,000
        │
        ▼
Payment Received
        │
        ▼
Settlement
₹3,000 → Monthly Bill
₹2,000 → Deposit
        │
        ▼
Ledger Entries
```

This layered architecture ensures that:

- Business operations remain simple and understandable.
- Settlement logic remains flexible and reusable.
- The Ledger remains the permanent financial source of truth.
- Every financial movement is completely auditable.

This separation is one of the fundamental architectural principles of RPGMS 2.0 and allows new financial workflows to be introduced without changing the Billing or Ledger Engines.

---

## Purpose

The Settlement Engine determines how financial value is applied to financial obligations.

It is responsible for moving value between Financial Accounts while preserving complete financial history.

The Settlement Engine never creates money.

It only applies existing financial value.

---

## Responsibilities

- Apply Payments
- Apply Deposits
- Apply Advances
- Apply Adjustments
- Process Refunds
- Manage Settlement Hold
- Support Guided Allocation

---

## Philosophy

Bills create obligations.

Payments record money received.

Settlements connect the two.

---

## Settlement Flow

Financial Source

↓

Settlement

↓

Financial Target

Examples

Payment

↓

Monthly Bill

Advance

↓

Monthly Bill

Deposit

↓

Checkout Bill

Settlement Hold

↓

Electricity Charge

---

## Guided Allocation

The Settlement Engine recommends allocations.

The operator confirms or modifies the recommendation.

The system never silently reallocates money.

---

## Settlement Rules

A settlement always contains:

- Source
- Target
- Amount
- Timestamp
- Operator
- Reason

---

## Settlement Reversal

Incorrect settlements are reversed.

Settlement history remains permanent.

---

## Why This Design?

Separating Settlements from Payments provides flexibility for future financial workflows without changing the Billing Engine.

# 10. Ledger Engine

## Purpose

The Ledger Engine provides the permanent financial history for every Stay.

Every financial movement is recorded in the Ledger.

The Ledger is the financial source of truth.

---

## Responsibilities

- Record Financial Events
- Preserve Audit History
- Calculate Derived Balances
- Support Financial Reporting
- Support Financial Investigation

---

## Design Principles

### Append Only

Ledger entries are never modified.

---

### Immutable

Corrections are recorded as reversing entries.

---

### Complete History

Every financial movement remains permanently visible.

---

### Derived Balances

Outstanding amounts are calculated from Ledger history.

Balances are never manually maintained.

---

## Ledger Sources

Ledger entries may originate from:

- Bills
- Payments
- Deposits
- Advances
- Adjustments
- Settlements
- Refunds

---

## Audit Philosophy

Every Ledger Entry answers:

Who?

When?

Why?

What changed?

How much?

---

## Why This Design?

The Ledger provides complete traceability while keeping operational modules independent from financial calculations.

# 11. Financial Timeline

## Purpose

The Financial Timeline provides a complete chronological history of every financial event associated with a Stay.

It allows operators to understand not only the current financial position, but also how that position evolved over time.

The timeline is append-only and forms part of the permanent audit history of the Stay.

---

## Design Philosophy

Finance is a sequence of business events.

Every significant financial event contributes to the Financial Timeline.

Events are never removed or reordered.

Corrections are recorded as new events.

---

## Timeline Sources

The Financial Timeline includes events generated by:

- Billing Engine
- Settlement Engine
- Deposit Management
- Advance Management
- Payment Processing
- Refund Processing
- Financial Adjustments
- Financial Closure

---

## Example Timeline

01 Jan

Resident Admitted

↓

Deposit Requirement Created

↓

Deposit Received ₹2,000

↓

Deposit Received ₹4,500

↓

Monthly Bill Generated

↓

Payment Received ₹6,500

↓

Laundry Charge Added

↓

Laundry Settled

↓

Advance Received

↓

Advance Applied

↓

Checkout

↓

Settlement Hold Created

↓

Electricity Adjustment

↓

Final Refund

↓

Financial Closure

---

## Design Principles

The Financial Timeline:

- is chronological
- is append-only
- never removes history
- supports audit and investigation
- explains how balances evolved

---

## Relationship with the Business Timeline

The Business Timeline records operational events.

The Financial Timeline records financial events.

Both timelines complement each other but remain independent.

Example

Business Timeline

Admission

↓

Bed Change

↓

Notice Given

↓

Checkout

Financial Timeline

Deposit Received

↓

Monthly Bill

↓

Payment Received

↓

Settlement Hold

↓

Final Refund

↓

Financial Closure

---

## Why This Design?

Separating operational history from financial history keeps both timelines focused while allowing operators to understand the complete lifecycle of a Stay.

# 12. Financial Lifecycle

## Purpose

The Financial Lifecycle describes the progression of a Stay through its financial journey, from admission until financial closure.

At any point in time, a Stay is in one Financial State within this lifecycle

They are independent of operational states such as Admission, On Notice, or Checkout.

A Resident may have completed operational checkout while financial activities continue.

---

## Financial Lifecycle

Open

↓

Settlement Pending

↓

Financially Closed

---

## Open

The Stay has active financial activity.

Examples

- Bills may be generated.
- Payments may be received.
- Deposits may be collected.
- Advances may be recorded.

---

## Settlement Pending

The Resident has completed operational checkout.

However, financial obligations remain outstanding.

Typical examples include:

- Settlement Hold retained
- Electricity adjustment pending
- Damage assessment pending
- Final refund pending

The Stay remains financially active.

---

## Financially Closed

All financial obligations have been resolved.

Settlement Hold balance is zero.

No further financial transactions are expected.

The Finance domain considers the Stay complete.

---

## Design Principles

Operational completion does not imply financial completion.

Financial Closure is an independent business event.

Only financially closed Stays are considered complete from the Finance perspective.

---

## Why This Design?

Many real-world obligations occur after checkout.

Separating Checkout from Financial Closure accurately models real business operations and prevents premature closure of financial records.

## Relationship with Stay Lifecycle

The operational lifecycle and financial lifecycle are intentionally independent.

Operational events describe the Resident's physical occupancy.

Financial events describe the financial relationship associated with the Stay.

Although related, the two lifecycles progress independently and may complete at different times.

### Operational Lifecycle

Admission

↓

Active

↓

On Notice

↓

Checkout

### Financial Lifecycle

Financial Open

↓

Settlement Pending

↓

Financially Closed

### Combined Example

| Date | Operational State | Financial State |
|------|-------------------|-----------------|
| 1 Jan | Active | Open |
| 15 Jun | On Notice | Open |
| 30 Jun | Checked Out | Settlement Pending |
| 20 Jul | Checked Out | Settlement Pending |
| 21 Jul | Checked Out | Financially Closed |

This separation accurately models real business operations where a Resident may vacate accommodation before all financial obligations have been resolved.

Examples include:

- Pending electricity adjustment
- Damage assessment
- Cleaning charges
- Final refund
- Outstanding recoveries

Financial Closure is achieved only after all financial obligations have been settled.

Only then is the Stay considered completely closed.

## Domain State Ownership

Different domains own different lifecycle states.

| Domain | State Owner |
|---------|-------------|
| Resident | Resident |
| Stay | Stay |
| Finance | Finance |

Each domain owns its own lifecycle.

One domain must never directly modify another domain's state.

Instead, domains communicate through business events.

Examples:

- Checkout Completed
- Financial Closure Completed
- Stay Archived

This separation preserves loose coupling between domains and allows each domain to evolve independently.

# 13. Checkout & Financial Closure

## Purpose

Operational Checkout and Financial Closure are two independent business events.

A Resident may vacate accommodation before all financial obligations have been resolved.

The Finance Architecture intentionally separates these events to accurately model real-world business operations.

---

## Design Philosophy

Checking out ends occupancy.

Financial Closure ends the financial relationship.

These events may occur on different dates.

Separating them allows post-checkout financial activities to be managed without compromising historical integrity.

---

## Operational Checkout

Operational Checkout is managed by the Stay domain.

Typical operational activities include:

- Vacating the accommodation
- Returning keys (if applicable)
- Releasing the bed
- Completing exit formalities

Operational Checkout does not imply that the Stay is financially complete.

After Checkout, the Stay may enter the Settlement Pending financial state.

---

## Checkout Bill

The Billing Engine generates a Checkout Bill containing all charges that are known at the time of checkout.

Typical examples include:

- Final Rent
- Laundry Charges
- Known Utility Charges
- Miscellaneous Charges

Charges that are not yet known must not be estimated or included.

Future obligations are handled separately through the Settlement Hold process.

---

## Deposit Settlement

At Checkout, the Deposit Account is evaluated.

Possible outcomes include:

- Full refund
- Partial refund
- Deposit utilization against outstanding dues
- Transfer of remaining funds to Settlement Hold

The Deposit Account itself is completed during Checkout.

Any retained amount becomes part of the Settlement Hold Account.

---

## Settlement Hold

Settlement Hold represents money temporarily retained after Checkout while awaiting future financial obligations.

Typical examples include:

- Electricity Adjustment
- Water Charges
- Damage Recovery
- Cleaning Charges
- Other post-checkout recoveries

Settlement Hold is a temporary Financial Account.

It exists only while the Stay is in the Settlement Pending financial state.

Settlement Hold is not part of the Deposit Account.

It is an independent account created during Checkout.

---

## Settlement Hold Lifecycle

Deposit Account

↓

Checkout Settlement

↓

Immediate Refund

+

Settlement Hold Created

↓

Post-Checkout Adjustments

↓

Final Refund (or Recovery)

↓

Settlement Hold Balance = 0

↓

Financial Closure

---

## Real Business Example

Resident Deposit Held

₹6,500

At Checkout:

Immediate Refund

₹6,000

Settlement Hold

₹500

One month later:

Electricity Share

₹400

Settlement Hold becomes:

₹100

Final Refund

₹100

Settlement Hold Balance

₹0

Financial State

Financially Closed

---

## Financial Closure

Financial Closure is the final financial event of a Stay.

A Stay may be financially closed only when:

- All Bills have been settled.
- No outstanding Receivables exist.
- Settlement Hold balance is zero.
- No pending refunds remain.
- No pending recoveries remain.

Once Financial Closure is complete, no further financial activity is expected for the Stay.

---

## Why This Design?

Separating Checkout from Financial Closure allows the Finance domain to accurately model real-world business operations where certain financial obligations become known only after a Resident has left the accommodation.

This design eliminates the need for manual workarounds, preserves complete financial history, and provides a clear audit trail from admission to final settlement.

## Financial Closure Checklist

Before a Stay may be marked as Financially Closed, the system should verify:

✓ All Bills are fully settled.

✓ No outstanding Receivable balance exists.

✓ Settlement Hold balance is zero.

✓ No pending Deposit Refund exists.

✓ No pending Recovery exists.

✓ No pending Settlement exists.

Only after all checks pass may the Financial State transition to Financially Closed.

# 14. Reporting Philosophy

## Purpose

The Reporting Domain presents financial information to operators, management, and future analytical systems.

Reports provide insight into the financial state of the business but do not perform business logic or maintain financial data.

The Finance domain remains the sole source of financial truth.

---

## Reporting Principles

### Reports Never Own Data

Reports consume information from the Finance domain.

They never maintain independent balances or calculations.

---

### Reports are Read-Only

Reports do not modify financial information.

All financial changes originate through business operations within the Finance domain.

---

### Reports are Derived

Every report is derived from immutable financial transactions.

Examples include:

- Outstanding Receivables
- Deposit Held
- Advance Balance
- Settlement Hold
- Financial Position
- Revenue
- Collections

No report should store its own calculated totals.

---

### Historical Accuracy

Reports must accurately represent the financial state at any point in time.

Historical reports must never change because of future transactions.

Financial history remains immutable.

---

## Reporting Categories

The Finance domain supports reporting such as:

### Operational Reports

- Outstanding Dues
- Collection Summary
- Deposit Summary
- Settlement Pending
- Financial Closure Status

---

### Financial Reports

- Revenue
- Collections
- Refunds
- Advances
- Adjustments
- Ledger Activity

---

### Audit Reports

- Transaction History
- Settlement History
- Deposit History
- Payment History
- Complete Financial Timeline

---

## Design Principles

Reports answer questions.

They do not perform business decisions.

Business decisions belong to the Finance domain.

---

## Why This Design?

Separating reporting from financial processing ensures consistency, improves maintainability, and guarantees that every report reflects the same financial truth.

# 15. Extension Guidelines

## Purpose

The Finance Architecture is designed to evolve without requiring fundamental redesign.

Future enhancements should integrate into the existing architecture rather than bypassing it.

---

## General Principles

New functionality should reuse existing architectural concepts whenever possible.

Avoid introducing new financial concepts when an existing concept already satisfies the business requirement.

---

## Preferred Extension Order

When implementing a new feature, consider the following sequence:

1. Is it a new Business Event?

2. Does it create a new Business Transaction?

3. Does it require a Settlement?

4. Does it generate Ledger Entries?

5. Does it affect Financial Reporting?

Most future features should fit naturally into this model.

---

## Domain Ownership

Each domain owns its own business rules.

Resident owns identity.

Stay owns occupancy.

Accommodation owns physical allocation.

Finance owns money.

Reporting owns presentation.

Cross-domain modifications should occur only through business events.

---

## Backward Compatibility

Future enhancements must preserve:

- Historical integrity
- Ledger immutability
- Settlement history
- Audit history

Existing financial records must never require modification because of new functionality.

---

## Future Opportunities

The current architecture supports future capabilities such as:

- Online Payments
- Payment Gateway Integration
- QR Code Payments
- Automated Bank Reconciliation
- GST Support
- Vendor Payments
- Accounting Export
- Multi-Property Management
- Owner Accounting
- AI-Assisted Financial Analysis

These features should integrate using the existing Finance Architecture rather than introducing parallel financial systems.

---

## Why This Design?

A stable architecture allows the application to grow by extension rather than continual redesign.

This minimizes technical debt while preserving consistency across the system.

# 16. Architectural Decision Summary

The Finance Architecture of RPGMS 2.0 is founded on the following architectural decisions.

---

## Core Business Decisions

• Finance belongs to a Stay.

• A Resident may have multiple independent financial histories through multiple Stays.

• Operational and Financial lifecycles are independent.

• Checkout and Financial Closure are separate business events.

---

## Financial Principles

• Bills create financial obligations.

• Payments record money received.

• Settlements apply financial value.

• Ledger records permanent financial history.

• Reports derive information from Finance.

---

## Historical Integrity

• Financial history is immutable.

• Ledger is append-only.

• Corrections are performed through reversal transactions.

• Historical records are never edited.

---

## Financial Accounts

The Finance domain consists of independent Financial Accounts including:

- Receivable Account
- Deposit Account
- Advance Account
- Settlement Hold Account
- Adjustment Account

Each account maintains its own historical integrity.

---

## Settlement Philosophy

The Settlement Engine determines how financial value is applied.

Money is never changed.

Money only moves.

The operator remains responsible for approving financial intent.

---

## Financial Lifecycle

Every Stay progresses through the following Financial Lifecycle:

Open

↓

Settlement Pending

↓

Financially Closed

Financial Closure represents the completion of the financial relationship associated with a Stay.

---

## Architecture Principles

The Finance Architecture is guided by the following principles:

- Business First
- Stay is the Financial Boundary
- History is Immutable
- Balances are Derived
- System Recommends, Operator Decides
- Business Events Drive the System
- Clear Domain Ownership
- Complete Auditability

---

## Final Statement

The Finance Architecture has been designed to model real-world PG business operations while preserving simplicity, auditability, extensibility, and long-term maintainability.

All future Finance functionality should conform to the principles defined in this document.

# Closing Statement

The Finance Architecture of RPGMS 2.0 is intentionally business-driven.

It has been designed around real operational workflows rather than software constraints.

The architecture emphasizes simplicity, immutability, clear domain ownership, and complete financial traceability.

Its purpose is not only to support today's requirements, but also to provide a stable foundation for future growth without requiring architectural redesign.

Every future Finance feature should integrate into this architecture by extending existing business concepts rather than introducing parallel models.

This document serves as the canonical reference for all Finance-related design and implementation within RPGMS 2.0.


