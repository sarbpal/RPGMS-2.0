# Finance Glossary

## Purpose

This glossary defines the business terminology used throughout the Finance domain of RPGMS 2.0.

The definitions in this document are the canonical meanings of financial terms used across architecture, implementation, reporting, and user documentation.

Unless explicitly stated otherwise, these definitions should be used consistently throughout the project.

---
## Reading Guide

Each glossary entry identifies the domain that owns the concept.

A concept should be defined only once within its owning domain and referenced consistently throughout RPGMS 2.0.

The glossary is the authoritative source for business terminology used across architecture, implementation, testing, and documentation.

## Adjustment

**Domain:** Finance

### Definition

An Adjustment is a financial transaction used to correct, compensate, or modify the financial position of a Stay without altering historical records.

Adjustments create new financial transactions rather than modifying existing ones.

### Example

A ₹200 goodwill discount granted to a Resident after a service issue.

### Related Terms

- Settlement
- Ledger Entry
- Reversal

---

## Advance

**Domain:** Finance

### Definition

An Advance is money received before it is applied to any financial obligation.

The value remains available until allocated through the Settlement Engine.

### Example

A Resident pays ₹5,000 before the monthly bill is generated.

### Related Terms

- Payment
- Settlement
- Receivable

---

## Append-only Ledger

**Domain:** Finance

### Definition

An append-only ledger permanently records financial history by allowing new entries to be added while preventing modification or deletion of existing entries.

Corrections are performed using additional transactions.

### Example

An incorrect payment is reversed by creating a reversal transaction rather than editing the original payment.

### Related Terms

- Ledger
- Historical Integrity
- Immutability
- Reversal

# 1. Core Business Concepts

## Resident

**Domain:** Resident

### Definition

A Resident is an individual who occupies accommodation managed by RPGMS.

The Resident domain maintains the person's identity, contact information, and other personal details. A Resident may have multiple independent Stays over time.

The Resident itself does not own financial history.

### Example

A student stays in the hostel during 2025, leaves for six months, and returns in 2026. The person remains the same Resident but has two separate Stays.

### Related Terms

- Stay
- Financial Lifecycle

---

## Stay

**Domain:** Stay

### Definition

A Stay represents one continuous period of occupancy by a Resident.

A Stay begins when a Resident is admitted. Operational occupancy ends at Checkout, while the Stay remains financially active until Financial Closure.

Each Stay owns an independent financial history.

A Resident may have multiple Stays throughout their relationship with the hostel.

### Example

A Resident lives in the hostel from January to June, checks out, and later returns in September. This creates two separate Stays, each with its own financial records.

### Related Terms

- Resident
- Financial Lifecycle
- Financial Closure

---

## Billing Period

**Domain:** Finance

### Definition

A Billing Period represents the time interval for which charges are calculated.

Billing periods are independent of calendar months and are determined according to the billing policies of the Stay.

Every Bill belongs to exactly one Billing Period.

### Example

A Resident admitted on the 15th of a month may have billing periods running from the 15th of one month to the 14th of the next.

### Related Terms

- Bill
- Stay
- Receivable

---

## Business Event

**Domain:** Cross-Domain

### Definition

A Business Event is a meaningful occurrence within the system that represents something that has happened in the business.

Domain Events communicate facts between domains but do not themselves perform financial processing.

Domain Events may trigger one or more Business Transactions.

### Example

Examples of Domain Events include:

- Resident Admitted
- Bill Generated
- Payment Received
- Checkout Completed
- Financial Closure Completed

### Related Terms

- Business Transaction
- Settlement
- Ledger Entry

---

## Business Transaction

**Domain:** Finance

### Definition

A Business Transaction represents the financial interpretation of a Business Event.

Business Transactions describe what financial activity should occur before it is processed by the Settlement Engine and recorded in the Ledger.

A single Business Event may generate multiple Business Transactions.

### Example

Business Event:

Resident Payment Received

Business Transactions:

- Rent Payment
- Deposit Payment
- Advance Payment

These transactions are then allocated through the Settlement Engine.

### Related Terms

- Business Event
- Settlement
- Ledger Entry
# 2. Financial Accounts

## Financial Account

**Domain:** Finance

### Definition

A Financial Account is a logical business construct that records and manages a specific category of financial value associated with a Stay.

Each Financial Account has its own purpose, lifecycle, and business rules.

Financial Accounts do not represent bank accounts. They are conceptual accounts used to organize financial obligations, assets, and adjustments within the Finance domain.

### Example

A Stay may simultaneously have:

- A Receivable Account for outstanding charges.
- A Deposit Account holding the security deposit.
- An Advance Account containing prepaid funds.

Each account is managed independently.

### Related Terms

- Receivable
- Deposit
- Advance
- Settlement Hold
- Adjustment Account

---

## Receivable Account

**Domain:** Finance

### Definition

The Receivable Account records all financial obligations owed by the Resident for a Stay.

Charges increase the Receivable balance, while Settlements reduce it.

The Receivable Account represents money owed to the hostel.

### Example

Monthly Rent

₹6,500

Laundry

₹300

Outstanding Receivable

₹6,800

### Related Terms

- Bill
- Settlement
- Outstanding Balance

---

## Deposit Account

**Domain:** Finance

### Definition

The Deposit Account records the security deposit collected for a Stay.

The Deposit remains independent from operational charges until it is refunded, utilized, or transferred during the checkout process.

The Deposit Account does not automatically settle outstanding dues.

### Example

Security Deposit Received

₹6,500

At Checkout:

Refund

₹6,000

Transferred to Settlement Hold

₹500

### Related Terms

- Settlement Hold
- Refund
- Financial Closure

---

## Advance Account

**Domain:** Finance

### Definition

The Advance Account records money received before it has been allocated to a financial obligation.

Advance balances remain available until applied through the Settlement Engine.

### Example

A Resident pays ₹5,000 before the monthly bill is generated.

The payment is recorded in the Advance Account until the bill is created and settled.

### Related Terms

- Payment
- Settlement
- Receivable Account

---

## Settlement Hold Account

**Domain:** Finance

### Definition

The Settlement Hold Account temporarily retains funds after Operational Checkout while pending financial obligations are being determined.

The account exists only during the Settlement Pending financial state.

Once all pending obligations have been resolved, any remaining balance is refunded and the account is closed.

### Example

Deposit Retained

₹500

Electricity Adjustment

₹350

Final Refund

₹150

Settlement Hold Balance

₹0

### Related Terms

- Deposit Account
- Financial Closure
- Settlement Pending

---

## Adjustment Account

**Domain:** Finance

### Definition

The Adjustment Account records administrative financial corrections that cannot be represented through normal billing or settlement activities.

Adjustments preserve historical integrity by creating new financial records instead of modifying existing ones.

### Example

An operator grants a ₹250 goodwill credit for a maintenance issue.

The Adjustment Account records the credit without changing the original bill.

### Related Terms

- Adjustment
- Ledger Entry
- Reversal

# 3. Financial Transactions

## Bill

**Domain:** Finance

### Definition

A Bill is a formal financial document that records one or more charges for a specific Billing Period.

A Bill creates financial obligations but does not receive or allocate payments.

Every Bill belongs to exactly one Stay and one Billing Period.

### Example

Monthly Bill

- Rent: ₹6,500
- Laundry: ₹300

Total Bill: ₹6,800

### Related Terms

- Bill Line
- Billing Period
- Receivable Account

---

## Bill Line

**Domain:** Finance

### Definition

A Bill Line represents an individual charge within a Bill.

Each Bill consists of one or more Bill Lines that together determine the total amount due.

### Example

Monthly Bill

- Rent — ₹6,500
- Laundry — ₹300
- Electricity — ₹450

Each of the above is a separate Bill Line.

### Related Terms

- Bill
- Receivable Account

---

## Payment

**Domain:** Finance

### Definition

A Payment records money received from a Resident.

A Payment does not determine how the money is used.

Allocation of the Payment is performed separately by the Settlement Engine.

### Example

A Resident pays ₹10,000.

The Payment records receipt of ₹10,000.

The Settlement Engine later decides how the amount is allocated.

### Related Terms

- Settlement
- Advance Account
- Receivable Account

---

## Settlement

**Domain:** Finance

### Definition

A Settlement applies financial value from one Financial Account to another.

Settlements allocate money but do not create or receive money.

Every Settlement is traceable and permanently recorded.

### Example

Payment Received

₹10,000

Settlement

- Rent: ₹6,500
- Deposit: ₹3,500

### Related Terms

- Payment
- Receivable Account
- Ledger Entry

---

## Refund

**Domain:** Finance

### Definition

A Refund records money returned by the hostel to a Resident.

Refunds reduce financial value held by the Finance domain and are permanently recorded in the Ledger.

### Example

Security Deposit Refund

₹6,000

### Related Terms

- Deposit Account
- Settlement Hold Account
- Financial Closure

---

## Recovery

**Domain:** Finance

### Definition

A Recovery records money retained or collected to satisfy a financial obligation.

Recoveries commonly occur during Settlement Hold after Operational Checkout.

### Example

Electricity Charge

₹350

Recovered from Settlement Hold before the remaining balance is refunded.

### Related Terms

- Settlement Hold Account
- Receivable Account

---

## Reversal

**Domain:** Finance

### Definition

A Reversal negates the financial effect of a previous transaction without modifying historical records.

Reversals preserve auditability while correcting financial mistakes.

### Example

An incorrect payment of ₹5,000 is reversed by creating a new Reversal transaction.

The original Payment remains unchanged.

### Related Terms

- Ledger Entry
- Historical Integrity
- Adjustment

---

## Adjustment

**Domain:** Finance

### Definition

An Adjustment records an administrative financial correction that cannot be represented by normal billing, payment, settlement, refund, or recovery processes.

Adjustments always create new financial records and never modify existing history.

### Example

A goodwill credit of ₹200 is granted after a service complaint.

The original Bill remains unchanged.

### Related Terms

- Reversal
- Settlement
- Ledger Entry

### Section Summary

This section defines the financial transactions that create, allocate, transfer, correct, and return financial value within the Finance domain.

Together, these transactions form the operational foundation of the Finance Architecture.

# 4. Financial Lifecycle

## Financial Lifecycle

**Domain:** Finance

### Definition

The Financial Lifecycle represents the progression of a Stay through its financial journey, from the creation of financial obligations until all financial activities have been completed.

The Financial Lifecycle is independent of the operational lifecycle of a Stay.

### Example

Open

↓

Settlement Pending

↓

Financially Closed

### Related Terms

- Financial State
- Financial Closure
- Stay

---

## Financial State

**Domain:** Finance

### Definition

A Financial State represents the current position of a Stay within its Financial Lifecycle.

A Stay can exist in only one Financial State at any given time.

### Example

Current Financial State:

Settlement Pending

### Related Terms

- Financial Lifecycle
- Financial Closure

---

## Operational Checkout

**Domain:** Stay

### Definition

Operational Checkout is the business event in which a Resident vacates accommodation and the Stay ends operationally.

Operational Checkout does not complete the financial relationship.

Financial processing may continue after Checkout.

### Example

Resident vacates the bed on 30 June.

Electricity adjustment is processed in July.

### Related Terms

- Financial Closure
- Settlement Hold
- Stay

---

## Financial Closure

**Domain:** Finance

### Definition

Financial Closure is the final financial event of a Stay.

A Stay reaches Financial Closure only after all financial obligations, refunds, recoveries, and settlements have been completed.

After Financial Closure, no further financial activity is expected for that Stay.

### Example

All Bills settled.

Settlement Hold cleared.

Final refund issued.

Financial State becomes Financially Closed.

### Related Terms

- Financial Lifecycle
- Settlement Hold
- Refund

---

### Section Summary

This section defines the financial progression of a Stay from its first financial obligation until the complete conclusion of its financial relationship.

# 5. Financial Records

## Ledger Entry

**Domain:** Finance

### Definition

A Ledger Entry is the permanent record of a financial transaction.

Ledger Entries are immutable and together form the complete financial history of a Stay.

### Example

Payment Received

₹5,000

Recorded as a Ledger Entry.

### Related Terms

- Ledger
- Settlement
- Audit Trail

---

## Financial Timeline

**Domain:** Finance

### Definition

The Financial Timeline presents all financial activities of a Stay in chronological order.

It provides a complete historical view of the financial relationship.

### Example

Deposit

↓

Monthly Bill

↓

Payment

↓

Settlement

↓

Refund

↓

Financial Closure

### Related Terms

- Ledger Entry
- Financial Lifecycle

---

## Audit Trail

**Domain:** Finance

### Definition

An Audit Trail is the complete historical record of financial activity that enables every transaction to be traced from origin to completion.

### Example

A payment can be traced from receipt through settlement to its corresponding ledger entries.

### Related Terms

- Ledger Entry
- Historical Integrity

---

### Section Summary

Financial Records preserve the complete, immutable history of every financial activity performed within the Finance domain.

# 6. Financial Concepts

## Outstanding Balance

**Domain:** Finance

### Definition

The Outstanding Balance represents the amount currently owed by a Resident for a Stay.

### Related Terms

- Receivable Account
- Settlement

---

## Credit Balance

**Domain:** Finance

### Definition

A Credit Balance represents money available to the Resident, such as deposits, advances, or refundable amounts.

### Related Terms

- Deposit Account
- Advance Account

---

## Debit Balance

**Domain:** Finance

### Definition

A Debit Balance represents money owed to the hostel.

### Related Terms

- Receivable Account

---

## Derived Balance

**Domain:** Finance

### Definition

A Derived Balance is calculated from historical financial transactions rather than stored independently.

### Related Terms

- Ledger Entry
- Source of Truth

---

## Source of Truth

**Domain:** Finance

### Definition

The Source of Truth is the authoritative financial record from which all balances, reports, and financial positions are derived.

Within RPGMS, the Ledger is the financial source of truth.

### Related Terms

- Ledger Entry
- Derived Balance

---

### Section Summary

These concepts describe how financial information is interpreted and presented within the Finance domain.

# 7. Design Principles

## Historical Integrity

**Domain:** Cross-Domain

### Definition

Historical Integrity ensures that completed business history remains accurate, complete, and permanently preserved.

### Related Terms

- Ledger
- Immutability

---

## Immutability

**Domain:** Cross-Domain

### Definition

Immutability means historical records are never modified after they have been created.

Corrections are made through additional transactions.

### Related Terms

- Reversal
- Ledger Entry

---

## Operator

**Domain:** Cross-Domain

### Definition

The Operator is the authorized user responsible for making business decisions within RPGMS.

The system assists the Operator but does not replace business judgment.

### Related Terms

- System Recommendation

---

## System Recommendation

**Domain:** Cross-Domain

### Definition

A System Recommendation is guidance generated by RPGMS to assist the Operator in making informed business decisions.

Recommendations do not automatically perform financial actions unless explicitly approved.

### Related Terms

- Operator

---

### Section Summary

These principles define the architectural philosophy that guides every Finance-related decision within RPGMS.

# 8. Naming Conventions

Use consistent terminology throughout RPGMS 2.0.

Preferred terms include:

- Resident
- Stay
- Bill
- Bill Line
- Payment
- Settlement
- Ledger Entry
- Financial Lifecycle
- Financial State
- Financial Closure
- Settlement Hold

# 9. Terms to Avoid

Avoid introducing alternative names for established business concepts.

| Avoid              | Use Instead                                                     | Reason                          |
| ------------------ | --------------------------------------------------------------- | ------------------------------- |
| Tenant             | Resident                                                        | Consistent business terminology |
| Customer           | Resident                                                        | RPGMS manages residents         |
| Room               | Flat / Area / Bed                                               | Matches accommodation hierarchy |
| Invoice            | Bill                                                            | Business terminology            |
| Deposit Adjustment | Settlement Hold                                                 | Distinct business concepts      |
| Checkout Complete  | Financially Closed                                              | Different Domain Events       |
| Transaction        | Be specific (Business Transaction, Settlement, Ledger Entry)    | Removes ambiguity               |
| Balance            | Specify the account (Receivable Balance, Deposit Balance, etc.) | Improves clarity                |


# 10. Related Documents

- FINANCE_ARCHITECTURE.md
- FINANCIAL_POLICIES.md
- FINANCIAL_TRANSACTION_TYPES.md
- FINANCE_SCENARIOS.md
- ARCHITECTURE.md
- ARCHITECTURAL_PRINCIPLES.md

